import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateABCDLevels, calculateRHS, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda, calculateTwentyRallyRetest } from './strategies.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DYNAMIC_BASKET_PATH = path.join(__dirname, '../dynamic_basket.json');
const MARKET_SNAPSHOT_PATH = path.join(__dirname, '../market_snapshot.json');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

let snapshotCache: Record<string, any> = {};

export function initSnapshotCache() {
  try {
    if (fs.existsSync(MARKET_SNAPSHOT_PATH)) {
      console.log('📦 Loading Market Snapshot into memory cache...');
      const data = fs.readFileSync(MARKET_SNAPSHOT_PATH, 'utf-8');
      snapshotCache = JSON.parse(data);
      console.log(`✅ Snapshot cache loaded (${(data.length / (1024 * 1024)).toFixed(1)} MB)`);
    } else {
      console.log('⚠️ No market_snapshot.json found on disk.');
    }
  } catch (e: any) {
    console.error('❌ Failed to load snapshot cache:', e.message);
    snapshotCache = {};
  }
}

export async function fetchScreenerData(symbol: string) {
  try {
    const cleanSymbol = symbol.split('.')[0]; 
    const url = `https://www.screener.in/company/${cleanSymbol}/consolidated/`;
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 10000
    });
    const $ = cheerio.load(data);
    
    const getRatio = (name: string) => {
      const el = $(`#top-ratios li`).filter(function() {
        const label = $(this).find('.name').text().toLowerCase();
        return label.includes(name.toLowerCase());
      });
      const valEl = el.find('.value');
      const numberEl = valEl.find('.number');
      const rawText = numberEl.length > 0 ? numberEl.text() : valEl.text();
      const val = rawText.trim().replace(/,/g, '').replace(/[₹%]/g, '');
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const getAnnualTableData = (tableName: string, rowName: string) => {
      let section = $(`section#${tableName}`);
      if (section.length === 0) {
        section = $('section').filter(function() {
          return $(this).find('h2, h3').text().toLowerCase().includes(tableName.replace('-', ' '));
        });
      }
      const row = section.find(`tr`).filter(function() {
        const firstCol = $(this).find('td:first-child, th:first-child').text().trim().toLowerCase();
        return firstCol.includes(rowName.toLowerCase());
      });
      if (row.length === 0) return [];
      const values = row.find('td').map((i, el) => $(el).text().trim().replace(/,/g, '').replace(/[₹%]/g, '')).get();
      const parsed = values.slice(1).map(v => parseFloat(v)).filter(v => !isNaN(v));
      return parsed;
    };

    const getShareholding = (label: string) => {
      let foundVal = 0;
      $('table').each((_, table) => {
        $(table).find('tr').each((_, row) => {
          const cells = $(row).find('td, th');
          const firstCellText = $(cells[0]).text().trim().toLowerCase();
          if (firstCellText.includes(label.toLowerCase())) {
            for (let k = cells.length - 1; k >= 1; k--) {
              const val = $(cells[k]).text().trim().replace(/%/g, '');
              if (val && !isNaN(parseFloat(val))) {
                foundVal = parseFloat(val);
                return false; 
              }
            }
            return false;
          }
        });
        if (foundVal > 0) return false;
      });
      return foundVal;
    };

    const currentPrice = getRatio('Current Price');
    const bookValue = getRatio('Book Value');
    const marketCap = (getRatio('Market Cap') || getRatio('MarketCap')) * 10000000;
    const peRatio = getRatio('Stock P/E') || getRatio('P/E');

    const pageText = $('body').text();
    const extractMedian = (years: number) => {
      const regex = new RegExp(`${years}yr median PE of (\\d+\\.?\\d*)`, 'i');
      const match = pageText.match(regex);
      if (match) return parseFloat(match[1]);
      const genericMatch = pageText.match(/median PE of (\d+\.?\d*)/i);
      if (genericMatch) {
        const base = parseFloat(genericMatch[1]);
        if (years === 3) return base;
        if (years === 5) return base * 0.95;
        return base * 0.9;
      }
      return 0;
    };

    const pe3Y = extractMedian(3) || (peRatio ? peRatio * 0.9 : 22.5);
    const pe5Y = extractMedian(5) || (peRatio ? peRatio * 0.85 : 21.0);
    const pe10Y = extractMedian(10) || (peRatio ? peRatio * 0.8 : 19.5);

    const shareholding = {
      promoter: getShareholding('Promoter'),
      fii: getShareholding('FII') || getShareholding('Foreign'),
      dii: getShareholding('DII') || getShareholding('Domestic'),
      public: getShareholding('Public'),
      pledged: getRatio('Pledged') || getRatio('Promoter holding pledged') || 0
    };

    const netProfits = getAnnualTableData('profit-loss', 'Net Profit');
    const sales = getAnnualTableData('profit-loss', 'Sales');
    const opm = getAnnualTableData('profit-loss', 'OPM %');
    const eps = getAnnualTableData('profit-loss', 'EPS');
    const quarterlyNetProfits = getAnnualTableData('quarters', 'Net Profit');
    const quarterlySales = getAnnualTableData('quarters', 'Sales');
    const borrowings = getAnnualTableData('balance-sheet', 'Borrowings');
    const shareCapital = getAnnualTableData('balance-sheet', 'Share Capital');
    const reserves = getAnnualTableData('balance-sheet', 'Reserves');
    const otherAssets = getAnnualTableData('balance-sheet', 'Other Assets');
    const otherLiabilities = getAnnualTableData('balance-sheet', 'Other Liabilities');
    const latestOtherAssets = otherAssets.slice(-1)[0] || 0;
    const latestOtherLiabilities = otherLiabilities.slice(-1)[0] || 0;
    const cashFlowOps = getAnnualTableData('cash-flow', 'Cash from Operating Activity');
    const fixedAssetsPurchased = getAnnualTableData('cash-flow', 'Fixed assets purchased');

    const roe = getRatio('ROE') || (getAnnualTableData('ratios', 'ROE').slice(-1)[0]) || 0;
    const roce = getRatio('ROCE') || (getAnnualTableData('ratios', 'ROCE').slice(-1)[0]) || 0;
    const interestCoverage = getRatio('Interest Coverage') || 0;
    const latestBorrowings = borrowings.slice(-1)[0] || 0;
    const latestEquity = (shareCapital.slice(-1)[0] || 0) + (reserves.slice(-1)[0] || 0);
    const debtToEquity = latestEquity > 0 ? (latestBorrowings / latestEquity) : 0;
    const latestSales = sales.slice(-1)[0] || 1;
    const latestCFO = cashFlowOps.slice(-1)[0] || 0;
    const latestCapex = Math.abs(fixedAssetsPurchased.slice(-1)[0] || 0);
const athSales = Math.max(...sales, 0);
const athNetProfit = Math.max(...netProfits, 0);
const currentSales = sales.slice(-1)[0] || 0;
const currentNetProfit = netProfits.slice(-1)[0] || 0;

return {
  marketCap,
  peRatio,
  peMedians: { pe3Y, pe5Y, pe10Y },
  dividendYield: getRatio('Dividend Yield'),
  roce,
  returnOnEquity: roe,
  faceValue: getRatio('Face Value'),
  netDebtToEquity: debtToEquity,
  totalDebt: latestBorrowings,
  shareholderEquity: latestEquity,
  interestCoverage,
  currentRatio: (latestOtherAssets / (latestOtherLiabilities || 1)) || 1.5,
  bookValue,
  priceToBook: bookValue > 0 ? (currentPrice / bookValue) : 0,
  currentPrice,
  industry: $('.company-ratios .breadcrumb').text().trim().split('\n').pop()?.trim() || 'General Research',
  historicalNetProfits: netProfits,
  historicalSales: sales,
  athSales,
  athNetProfit,
  currentSales,
  currentNetProfit,
  quarterlyNetProfits,
  quarterlySales,
      historicalOPM: opm,
      historicalEPS: eps,
      operatingMargin: opm.slice(-1)[0] || 0,
      netMargin: latestSales > 0 ? (netProfits.slice(-1)[0] / latestSales) * 100 : 0,
      yearsListed: sales.length,
      cashFlowFromOps: latestCFO,
      capex: latestCapex,
      shareholding
    };
  } catch (e: any) {
    console.error(`[SCRAPER ERROR] ${symbol}: ${e.message}`);
    return null;
  }
}

export async function runScreener() {
  console.log('🚀 [BATCH 9] Starting Institutional Fundamental Audit...');
  const results: string[] = [];
  const batchSize = 15;
  for (let i = 0; i < NIFTY_500.length; i += batchSize) {
    const batch = NIFTY_500.slice(i, i + batchSize);
    await Promise.all(batch.map(async (symbol) => {
      try {
        const summary: any = await yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] });
        const annualProfit = (summary.defaultKeyStatistics?.netIncomeToCommon / 10000000) || 0;
        const debtToEquity = ((summary.financialData?.debtToEquity || 0) as number) / 100;
        const marketCapCr = (summary.summaryDetail?.marketCap || 0) / 10000000;
        if (annualProfit > 50 && debtToEquity < 0.5 && marketCapCr > 500) results.push(symbol.replace('.NS', ''));
      } catch (e) { }
    }));
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  fs.writeFileSync(DYNAMIC_BASKET_PATH, JSON.stringify(results, null, 2));
  return results;
}

export async function updateMarketSnapshot(symbols: string[]) {
  console.log(`📡 [SNAPSHOT] Updating ${symbols.length} symbols...`);
  const snapshot: Record<string, any> = {};
  const batchSize = 3;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    await Promise.all(batch.map(async (baseSymbol) => {
      try {
        const symbol = baseSymbol.includes('.') ? baseSymbol : `${baseSymbol}.NS`;
        const period1 = new Date();
        period1.setFullYear(period1.getFullYear() - 5);
        const [history, quote, summary, screenerData] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'incomeStatementHistoryQuarterly'] }).catch(() => null),
          fetchScreenerData(baseSymbol)
        ]);
        const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
        const marketCap = quote.marketCap || 0;
        const strategies = {
          'ENVELOPE_LONG': calculateEnvelope(quotes),
          'ENVELOPE_SHORT': processShortEnvelope(quotes, marketCap),
          'BOLLINGER': calculateBollingerBand(quotes),
          '52W_HIGH_LOW': calculate52WeekStrategy(quotes),
          'CUP_HANDLE_ABCD': calculateCupHandle(quotes),
          'RHS_ABCD': calculateRHS(quotes),
          'SMA_ABCD': calculateSMAStacking(quotes),
          'SR_STRATEGY': calculateSRStrategy(quotes),
          'SIXTY_SEVEN_FUNDA': calculateSixtySevenFunda(quotes, screenerData),
          'TWENTY_RALLY_RETEST': calculateTwentyRallyRetest(quotes)
        };
        snapshot[baseSymbol] = {
          quotes: quotes.slice(-1300),
          quote: {
            marketCap,
            regularMarketPrice: quote.regularMarketPrice,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            pe: summary?.summaryDetail?.trailingPE || summary?.defaultKeyStatistics?.trailingPE || 0,
            roe: (summary?.defaultKeyStatistics?.returnOnEquity || 0) * 100,
            debtToEquity: summary?.financialData?.debtToEquity || 0,
            shareholding: screenerData?.shareholding || null
          },
          screener: screenerData,
          strategies,
          lastUpdated: new Date().toISOString()
        };
      } catch (e) { console.error(`Snapshot failed for ${baseSymbol}`); }
    }));
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  fs.writeFileSync(MARKET_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  snapshotCache = snapshot;
  console.log(`💎 [SNAPSHOT] Success! Market data cached.`);
}

export function initScreenerCron() {
  cron.schedule('30 2 * * *', () => runScreener());
  cron.schedule('0 11 * * *', async () => {
    const bluechip = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];
    const highBeta = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
    const profit = ['CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 'MTARTECH', 'MAHLOG', 'PRINCEPIPE', 'ANGELONE', 'MCX', 'KFINTECH', 'DATA PATTERNS', 'MAZAGONDOCK', 'COCHINSHIP', 'GRSE', 'RVNL', 'IRCON', 'RITES', 'RAILTEL', 'BEL', 'HAL', 'BEML', 'MAZDOCK', 'SOLARINDS', 'BDL', 'KPITTECH', 'COFORGE', 'PERSISTENT', 'TATAELXSI', 'ZENTEC', 'NEWGEN', 'MAPMYINDIA', 'CEINFO', 'TANLA', 'ROUTE', 'LATENTVIEW'];
    await updateMarketSnapshot([...bluechip, ...highBeta, ...profit, '^NSEI']);
  });
}

export function getMarketSnapshot(): Record<string, any> { return snapshotCache; }
export function getDynamicBasket(): string[] {
  if (fs.existsSync(DYNAMIC_BASKET_PATH)) return JSON.parse(fs.readFileSync(DYNAMIC_BASKET_PATH, 'utf-8'));
  return []; 
}
