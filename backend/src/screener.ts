import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';
import { calculateEnvelope, processShortEnvelope, calculateEMAStacking, calculateBollingerBand, calculate52WeekStrategy, calculateCupHandle, calculateRHS, calculateSRStrategy } from './strategies.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DYNAMIC_BASKET_PATH = path.join(__dirname, '../dynamic_basket.json');
const MARKET_SNAPSHOT_PATH = path.join(__dirname, '../market_snapshot.json');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// --- Screener.in Data Connector ---
export async function fetchScreenerData(symbol: string) {
  try {
    const cleanSymbol = symbol.split('.')[0]; 
    const url = `https://www.screener.in/company/${cleanSymbol}/consolidated/`;
    console.log(`[SCRAPER] Fetching: ${url}`);
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 10000
    });
    const $ = cheerio.load(data);
    
    // Debug: Log all available ratio labels
    const availableLabels: string[] = [];
    $('#top-ratios li').each(function() {
      availableLabels.push($(this).find('.name').text().trim());
    });
    console.log(`[SCRAPER] Available Labels for ${symbol}: ${availableLabels.join(', ')}`);

    const getRatio = (name: string) => {
      const el = $(`#top-ratios li`).filter(function() {
        const label = $(this).find('.name').text().toLowerCase();
        return label.includes(name.toLowerCase());
      }).find('.number');
      
      const val = el.text().trim().replace(/,/g, '');
      return val ? parseFloat(val) : 0;
    };

    const getAnnualTableData = (tableName: string, rowName: string) => {
      const table = $(`section#${tableName} table`);
      const row = table.find(`tr:contains("${rowName}")`);
      const values = row.find('td').map((i, el) => $(el).text().trim().replace(/,/g, '')).get();
      return values.slice(1).map(v => parseFloat(v)); // Skip label, return numbers
    };

    const currentPrice = getRatio('Current Price');
    const bookValue = getRatio('Book Value');
    const marketCap = getRatio('Market Cap') * 10000000;
    const peRatio = getRatio('Stock P/E') || getRatio('P/E');

    // Fetch Table Data
    const netProfits = getAnnualTableData('profit-loss', 'Net Profit');
    const sales = getAnnualTableData('profit-loss', 'Sales');
    const opm = getAnnualTableData('profit-loss', 'OPM %');
    const eps = getAnnualTableData('profit-loss', 'EPS in Rs');
    const interest = getAnnualTableData('profit-loss', 'Interest');
    const pbt = getAnnualTableData('profit-loss', 'Profit before tax');
    
    const borrowings = getAnnualTableData('balance-sheet', 'Borrowings');
    const shareCapital = getAnnualTableData('balance-sheet', 'Share Capital');
    const reserves = getAnnualTableData('balance-sheet', 'Reserves');
    const otherAssets = getAnnualTableData('balance-sheet', 'Other Assets');
    const otherLiabilities = getAnnualTableData('balance-sheet', 'Other Liabilities');
    const cashFlowOps = getAnnualTableData('cash-flow', 'Cash from Operating Activity');
    const fixedAssetsPurchased = getAnnualTableData('cash-flow', 'Fixed assets purchased');

    // Derived Metrics
    const latestBorrowings = borrowings.slice(-1)[0] || 0;
    const latestEquity = (shareCapital.slice(-1)[0] || 0) + (reserves.slice(-1)[0] || 0);
    const debtToEquity = latestEquity > 0 ? (latestBorrowings / latestEquity) : 0;
    
    const latestInterest = interest.slice(-1)[0] || 0;
    const latestPBT = pbt.slice(-1)[0] || 0;
    const interestCoverage = latestInterest > 0 ? (latestPBT + latestInterest) / latestInterest : 100;
    
    const latestOtherAssets = otherAssets.slice(-1)[0] || 0;
    const latestOtherLiabilities = otherLiabilities.slice(-1)[0] || 0;
    const currentRatio = latestOtherLiabilities > 0 ? (latestOtherAssets / latestOtherLiabilities) : 1.5;

    const priceToBook = bookValue > 0 ? (currentPrice / bookValue) : 0;
    const latestSales = sales.slice(-1)[0] || 1;
    const marketCapToSales = (marketCap / 10000000) / latestSales; // Both in Cr

    const latestCFO = cashFlowOps.slice(-1)[0] || 0;
    const latestCapex = Math.abs(fixedAssetsPurchased.slice(-1)[0] || 0);
    const fcf = latestCFO - latestCapex;

    return {
      marketCap,
      peRatio,
      dividendYield: getRatio('Dividend Yield'),
      roce: getRatio('ROCE'),
      returnOnEquity: getRatio('ROE'),
      faceValue: getRatio('Face Value'),
      netDebtToEquity: debtToEquity,
      totalDebt: latestBorrowings,
      shareholderEquity: latestEquity,
      interestCoverage,
      currentRatio,
      cashAndEquivalents: 0, // Hard to get accurately from summary
      bookValue,
      priceToBook,
      evEbitda: 0, // Requires Enterprise Value (Market Cap + Debt - Cash)
      marketCapToSales,
      pe5yMedian: 28.5,
      currentPrice,
      industry: $('.company-ratios .breadcrumb').text().trim().split('\n').pop()?.trim() || 'N/A',
      salesGrowth3Y: 0, // Calculate manually if needed
      profitGrowth3Y: 0,
      historicalNetProfits: netProfits,
      historicalSales: sales,
      historicalOPM: opm,
      historicalEPS: eps,
      ebitda: (latestPBT + latestInterest) || 0,
      operatingMargin: opm.slice(-1)[0] || 0,
      netMargin: latestSales > 0 ? (netProfits.slice(-1)[0] / latestSales) * 100 : 0,
      yearsListed: sales.length,
      cashFlowFromOps: latestCFO,
      capex: latestCapex,
      dividendPayout: 0
    };
  } catch (e: any) {
    console.error(`[SCRAPER ERROR] ${symbol}: ${e.message}`);
    return null;
  }
}

/**
 * BATCH 9 CORE STANDARDS
 */
export async function runScreener() {
  console.log('🚀 [BATCH 9] Starting Institutional Fundamental Audit...');
  const results: string[] = [];
  
  const batchSize = 15;
  for (let i = 0; i < NIFTY_500.length; i += batchSize) {
    const batch = NIFTY_500.slice(i, i + batchSize);
    console.log(`Auditing fundamentals batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(NIFTY_500.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (symbol) => {
      try {
        const summary: any = await yahooFinance.quoteSummary(symbol, {
          modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail']
        });

        const annualProfit = (summary.defaultKeyStatistics?.netIncomeToCommon / 10000000) || 0;
        const pe = (summary.summaryDetail?.trailingPE || summary.defaultKeyStatistics?.trailingPE || 0) as number;
        const debtToEquity = ((summary.financialData?.debtToEquity || 0) as number) / 100;
        const marketCap = (summary.summaryDetail?.marketCap || 0) as number;
        const marketCapCr = marketCap / 10000000;

        const passProfit = annualProfit > 50;
        const passDebt = debtToEquity < 0.5;
        const passScale = marketCapCr > 500;

        if (passProfit && passDebt && passScale) {
          const cleanSymbol = symbol.replace('.NS', '');
          results.push(cleanSymbol);
        }
      } catch (e) { /* skip */ }
    }));
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`✅ Audit Finished. Found ${results.length} stocks meeting Batch 9 standards.`);
  fs.writeFileSync(DYNAMIC_BASKET_PATH, JSON.stringify(results, null, 2));
  return results;
}

/**
 * DAILY MARKET SNAPSHOT (The "Speed Boost" & "Quota Saver")
 * Fetches 3 years of OHLCV data for all relevant stocks once a day.
 * Now includes Envelope Indicator for Bluechip basket.
 */
export async function updateMarketSnapshot(symbols: string[]) {
  console.log(`📡 [SNAPSHOT] Downloading history for ${symbols.length} symbols...`);
  const snapshot: Record<string, any> = {};
  
  // Bluechip list to apply Envelope Strategy
  const bluechipList = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];

  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    console.log(`Snapshotting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (baseSymbol) => {
      try {
        const symbol = baseSymbol.includes('.') ? baseSymbol : `${baseSymbol}.NS`;
        const period1 = new Date();
        period1.setFullYear(period1.getFullYear() - 3);

        // High Accuracy: Fetching adjusted OHLCV
        const [history, quote, summary, screenerData]: [any, any, any, any] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] }).catch(() => null),
          fetchScreenerData(baseSymbol)
        ]);

        const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
        const marketCap = quote.marketCap || 0;
        
        // --- Pre-Calculate ALL Strategies (Batch 9 Optimization) ---
        const strategies: Record<string, any> = {
          'ENVELOPE_LONG': calculateEnvelope(quotes),
          'ENVELOPE_SHORT': processShortEnvelope(quotes, marketCap),
          'BOLLINGER': calculateBollingerBand(quotes),
          '52W_HIGH_LOW': calculate52WeekStrategy(quotes),
          'CUP_HANDLE_ABCD': calculateCupHandle(quotes),
          'RHS_ABCD': calculateRHS(quotes),
          'SR_STRATEGY': calculateSRStrategy(quotes)
        };
        
        snapshot[baseSymbol] = {
          quotes: quotes.slice(-500), // Keep 2 years for accurate trigger dates & SMA
          quote: {
            marketCap,
            regularMarketPrice: quote.regularMarketPrice,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            pe: summary?.summaryDetail?.trailingPE || summary?.defaultKeyStatistics?.trailingPE || 0,
            roe: (summary?.defaultKeyStatistics?.returnOnEquity || 0) * 100,
            debtToEquity: summary?.financialData?.debtToEquity || 0
          },
          screener: screenerData,
          strategies, // Store all pre-calculated results
          lastUpdated: new Date().toISOString()
        };
      } catch (e) {
        console.error(`Snapshot failed for ${baseSymbol}`);
      }
    }));
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  fs.writeFileSync(MARKET_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  console.log(`💎 [SNAPSHOT] Success! Market data cached in market_snapshot.json`);
}

export function initScreenerCron() {
  // 1. Fundamentals Audit: 8:00 AM IST (02:30 UTC)
  cron.schedule('30 2 * * *', () => {
    runScreener();
  });

  // 2. Market Snapshot: 4:30 PM IST (11:00 UTC) - After market close
  cron.schedule('0 11 * * *', async () => {
    console.log('⏰ [CRON] Starting Daily Market Snapshot...');
    const bluechip = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];
    const highBeta = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KANSAINER', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
    const profit = [
      'CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 'MTARTECH', 'MAHLOG', 'PRINCEPIPE',
      'ANGELONE', 'MCX', 'KFINTECH', 'DATA PATTERNS', 'MAZAGONDOCK', 'COCHINSHIP', 'GRSE', 'RVNL', 'IRCON', 'RITES',
      'RAILTEL', 'BEL', 'HAL', 'BEML', 'MAZDOCK', 'SOLARINDS', 'MTARTECH', 'BDL', 'KPITTECH', 'COFORGE', 'PERSISTENT',
      'TATAELXSI', 'ZENTEC', 'NEWGEN', 'MAPMYINDIA', 'CEINFO', 'TANLA', 'ROUTE', 'LATENTVIEW'
    ];
    // Include Nifty Index for accurate ROI comparison
    await updateMarketSnapshot([...bluechip, ...highBeta, ...profit, '^NSEI']);
  });
}

export function getMarketSnapshot(): Record<string, any> {
  if (fs.existsSync(MARKET_SNAPSHOT_PATH)) {
    return JSON.parse(fs.readFileSync(MARKET_SNAPSHOT_PATH, 'utf-8'));
  }
  return {};
}

export function getDynamicBasket(): string[] {
  if (fs.existsSync(DYNAMIC_BASKET_PATH)) {
    return JSON.parse(fs.readFileSync(DYNAMIC_BASKET_PATH, 'utf-8'));
  }
  return []; 
}
