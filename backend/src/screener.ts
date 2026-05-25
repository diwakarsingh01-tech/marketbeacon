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
        const label = $(this).find('.name').text().trim().toLowerCase();
        return label === name.toLowerCase() || label.includes(name.toLowerCase());
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
          const headerText = $(this).find('h2, h3').text().toLowerCase();
          return headerText.includes(tableName.replace('-', ' ')) || headerText.includes(tableName);
        });
      }
      const row = section.find(`tr`).filter(function() {
        const firstCol = $(this).find('td:first-child, th:first-child').text().trim().toLowerCase();
        return firstCol === rowName.toLowerCase() || firstCol.includes(rowName.toLowerCase());
      });
      if (row.length === 0) return [];
      const values = row.find('td').map((i, el) => $(el).text().trim().replace(/,/g, '').replace(/[₹%]/g, '')).get();
      // Remove the last value if it is 'TTM' or similar non-numeric text
      const parsed = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      return parsed;
    };

    const getShareholding = (label: string) => {
      let foundVal = 0;
      const shSection = $('#shareholding');
      const tables = shSection.length > 0 ? shSection.find('table') : $('table');
      
      tables.each((_, table) => {
        $(table).find('tr').each((_, row) => {
          const cells = $(row).find('td, th');
          const firstCellText = $(cells[0]).text().trim().toLowerCase();
          if (firstCellText === label.toLowerCase() || firstCellText.includes(label.toLowerCase())) {
            // Get the last numeric value (most recent quarter/year)
            for (let k = cells.length - 1; k >= 1; k--) {
              const val = $(cells[k]).text().trim().replace(/%/g, '');
              const parsed = parseFloat(val);
              if (!isNaN(parsed)) {
                foundVal = parsed;
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
    const aboutText = $('.company-profile, .about, #about').text() || pageText;

    const extractMedian = (years: number) => {
      const patterns = [
        new RegExp(`${years}\\s*yr median PE of\\s*(\\d+\\.?\\d*)`, 'i'),
        new RegExp(`${years}\\s*year median PE is\\s*(\\d+\\.?\\d*)`, 'i'),
        new RegExp(`median PE of\\s*(\\d+\\.?\\d*)\\s*over the last\\s*${years}`, 'i'),
        new RegExp(`${years}\\s*Yr Median P/E:\\s*(\\d+\\.?\\d*)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = aboutText.match(pattern);
        if (match) return parseFloat(match[1]);
      }
      
      const analysisText = $('.commentary, .analysis, #analysis').text();
      for (const pattern of patterns) {
        const match = analysisText.match(pattern);
        if (match) return parseFloat(match[1]);
      }

      return 0;
    };

    const pe3YScraped = extractMedian(3);
    const pe5YScraped = extractMedian(5);
    const pe10YScraped = extractMedian(10);

    // Hardened Sector Fallbacks (Absolute, not relative to current PE)
    const industry = $('.company-ratios .breadcrumb').text().trim().split('\n').pop()?.trim() || 'General Research';
    const isBanking = industry.includes('Bank') || symbol.includes('BANK');
    const isIT = industry.includes('IT') || industry.includes('Software');
    const isFMCG = industry.includes('FMCG') || industry.includes('Consumer');
    const isPharma = industry.includes('Pharma') || industry.includes('Healthcare');

    let baseMed = 25.0;
    if (isBanking) baseMed = 18.0;
    else if (isIT) baseMed = 30.0;
    else if (isFMCG) baseMed = 45.0;
    else if (isPharma) baseMed = 35.0;

    const pe3Y = pe3YScraped || (baseMed * 1.1);
    const pe5Y = pe5YScraped || baseMed;
    const pe10Y = pe10YScraped || (baseMed * 0.9);

    const shareholding = {
      promoter: getShareholding('Promoter') || getShareholding('Promoters'),
      fii: getShareholding('FII') || getShareholding('Foreign'),
      dii: getShareholding('DII') || getShareholding('Domestic'),
      public: getShareholding('Public') || getShareholding('Others') || getShareholding('Public & Others'),
      pledged: getRatio('Pledged') || getRatio('Promoter holding pledged') || 0
    };
    
    // Aggressive Smart Money Calculation
    const smartMoneyTotal = (shareholding.promoter || 0) + (shareholding.fii || 0) + (shareholding.dii || 0);
    (shareholding as any).smartMoneyTotal = smartMoneyTotal;

    const netProfits = getAnnualTableData('profit-loss', 'Net Profit');
    const sales = getAnnualTableData('profit-loss', 'Sales');
    const opm = getAnnualTableData('profit-loss', 'OPM %');
    const eps = getAnnualTableData('profit-loss', 'EPS');
    
    // TTM/Latest Data logic
    const currentSales = sales.slice(-1)[0] || 1;
    const currentNetProfit = netProfits.slice(-1)[0] || 0;
    const currentEPS = eps.slice(-1)[0] || (currentNetProfit / 10); // Rough fallback

    // PE Calculation Fix: Price / Latest EPS
    const calculatedPE = currentEPS > 0 ? (currentPrice / currentEPS) : (getRatio('Stock P/E') || 45);

    // ATH Logic: Search for historical peak (excluding current if possible, or just the max of all)
    const athSales = Math.max(...sales, 0);
    const athNetProfit = Math.max(...netProfits, 0);

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
    const latestCFO = cashFlowOps.slice(-1)[0] || 0;
    const latestCapex = Math.abs(fixedAssetsPurchased.slice(-1)[0] || 0);

return {
  marketCap,
  peRatio: calculatedPE,
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
  industry,
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
      netMargin: currentSales > 0 ? (currentNetProfit / currentSales) * 100 : 0,
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
  console.log('🚀 [WEALTH-BASKET] Starting Dynamic Growth Audit...');
  const results: string[] = [];
  const batchSize = 15;
  for (let i = 0; i < NIFTY_500.length; i += batchSize) {
    const batch = NIFTY_500.slice(i, i + batchSize);
    await Promise.all(batch.map(async (symbol) => {
      try {
        const summary: any = await yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] });
        
        // Rule 1: Annual Net Profit > ₹50 Crore
        const annualProfit = (summary.defaultKeyStatistics?.netIncomeToCommon / 10000000) || 0;
        
        // Rule 2: Debt-to-Equity < 0.5
        const debtToEquity = ((summary.financialData?.debtToEquity || 0) as number) / 100;
        
        // Rule 3: Market Cap > ₹500 Crore
        const marketCapCr = (summary.summaryDetail?.marketCap || 0) / 10000000;
        
        if (annualProfit > 50 && debtToEquity < 0.5 && marketCapCr > 500) {
          results.push(symbol.replace('.NS', ''));
        }
      } catch (e) { }
    }));
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  fs.writeFileSync(DYNAMIC_BASKET_PATH, JSON.stringify(results, null, 2));
  return results;
}

export async function updateMarketSnapshot(symbols: string[]) {
  console.log(`📡 [SNAPSHOT] Updating ${symbols.length} symbols...`);
  
  // MERGE LOGIC: Load existing snapshot first to avoid wipe-out
  let snapshot: Record<string, any> = {};
  try {
    if (fs.existsSync(MARKET_SNAPSHOT_PATH)) {
      snapshot = JSON.parse(fs.readFileSync(MARKET_SNAPSHOT_PATH, 'utf-8'));
    }
  } catch (e) { console.error('Failed to load existing snapshot for merge'); }

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

        if (!history || !history.quotes) throw new Error('No price history');

        const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
        const marketCap = quote.marketCap || screenerData?.marketCap || 0;
        
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

        // Aggressive Data Hardening for individual stock refresh
        snapshot[baseSymbol] = {
          quotes: quotes.slice(-1300),
          quote: {
            marketCap,
            regularMarketPrice: quote.regularMarketPrice || (quotes.length > 0 ? quotes[quotes.length - 1].close : 0),
            regularMarketChangePercent: quote.regularMarketChangePercent || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || Math.max(...quotes.slice(-252).map(q => q.high)),
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || Math.min(...quotes.slice(-252).map(q => q.low)),
            pe: summary?.summaryDetail?.trailingPE || summary?.defaultKeyStatistics?.trailingPE || screenerData?.peRatio || 0,
            roe: (summary?.defaultKeyStatistics?.returnOnEquity || 0) * 100 || screenerData?.returnOnEquity || 0,
            debtToEquity: summary?.financialData?.debtToEquity || screenerData?.netDebtToEquity || 0,
            shareholding: screenerData?.shareholding || null
          },
          screener: screenerData,
          strategies,
          lastUpdated: new Date().toISOString()
        };
      } catch (e: any) { console.error(`Snapshot failed for ${baseSymbol}: ${e.message}`); }
    }));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  fs.writeFileSync(MARKET_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  snapshotCache = snapshot;
  console.log(`💎 [SNAPSHOT] Success! Market data merged and cached.`);
}

export function initScreenerCron() {
  cron.schedule('30 2 * * *', () => runScreener());
  cron.schedule('0 11 * * *', async () => {
    const bluechip = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];
    const highBeta = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
    const wealthBasket = ['CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 'MTARTECH', 'MAHLOG', 'PRINCEPIPE', 'ANGELONE', 'MCX', 'KFINTECH', 'DATA PATTERNS', 'MAZAGONDOCK', 'COCHINSHIP', 'GRSE', 'RVNL', 'IRCON', 'RITES', 'RAILTEL', 'BEL', 'HAL', 'BEML', 'MAZDOCK', 'SOLARINDS', 'BDL', 'KPITTECH', 'COFORGE', 'PERSISTENT', 'TATAELXSI', 'ZENTEC', 'NEWGEN', 'MAPMYINDIA', 'CEINFO', 'TANLA', 'ROUTE', 'LATENTVIEW'];
    await updateMarketSnapshot([...new Set([...bluechip, ...highBeta, ...wealthBasket, '^NSEI'])]);
  });
}

export function getMarketSnapshot(): Record<string, any> { return snapshotCache; }
export function getDynamicBasket(): string[] {
  if (fs.existsSync(DYNAMIC_BASKET_PATH)) return JSON.parse(fs.readFileSync(DYNAMIC_BASKET_PATH, 'utf-8'));
  return []; 
}
