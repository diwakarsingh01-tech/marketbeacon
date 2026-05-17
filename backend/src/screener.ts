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

// --- In-Memory Cache for Market Snapshot ---
let snapshotCache: Record<string, any> = {};
let isSnapshotLoading = false;

/**
 * Initializes the snapshot cache from disk
 */
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

// --- Screener.in Data Connector ---
export async function fetchScreenerData(symbol: string) {
  try {
    const cleanSymbol = symbol.split('.')[0]; 
    const url = `https://www.screener.in/company/${cleanSymbol}/consolidated/`;
    
    // Throttle: Sequential processing with random delay to avoid 429
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
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
      }).find('.value');
      
      const rawText = el.text().trim();
      const val = rawText.replace(/,/g, '').replace(/[₹%]/g, '');
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };

    const getAnnualTableData = (tableName: string, rowName: string) => {
      const section = $(`section#${tableName}`);
      const row = section.find(`table.data-table tr`).filter(function() {
        const firstCol = $(this).find('td:first-child').text().trim().toLowerCase();
        return firstCol === rowName.toLowerCase();
      });
      
      if (row.length === 0) {
        return [];
      }

      const values = row.find('td').map((i, el) => $(el).text().trim().replace(/,/g, '').replace(/[₹%]/g, '')).get();
      const parsed = values.slice(1).map(v => parseFloat(v)).filter(v => !isNaN(v));
      return parsed;
    };

    const currentPrice = getRatio('Current Price');
    const bookValue = getRatio('Book Value');
    const marketCap = getRatio('Market Cap') * 10000000;
    const peRatio = getRatio('Stock P/E') || getRatio('P/E');

    // Shareholding Extraction from Table
    const getShareholding = (label: string) => {
      const row = $(`section#shareholding tr`).filter(function() {
        return $(this).text().includes(label);
      }).first();
      const val = row.find('td').last().text().trim().replace(/%/g, '');
      return val ? parseFloat(val) : 0;
    };

    const shareholding = {
      promoter: getRatio('Promoter holding') || getShareholding('Promoters'),
      fii: getRatio('FII holding') || getShareholding('FIIs'),
      dii: getRatio('DII holding') || getShareholding('DIIs'),
      public: getRatio('Public holding') || getShareholding('Public'),
      pledged: getRatio('Pledged percentage')
    };

    // Fetch Table Data
    const netProfits = getAnnualTableData('profit-loss', 'Net Profit');
    const sales = getAnnualTableData('profit-loss', 'Sales');
    const opm = getAnnualTableData('profit-loss', 'OPM %');
    const eps = getAnnualTableData('profit-loss', 'EPS in Rs');
    
    // Fetch Quarterly Data for more responsive strategy checks
    const quarterlyNetProfits = getAnnualTableData('quarters', 'Net Profit');
    const quarterlySales = getAnnualTableData('quarters', 'Sales');

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
      quarterlyNetProfits,
      quarterlySales,
      historicalOPM: opm,
      historicalEPS: eps,
      ebitda: (latestPBT + latestInterest) || 0,
      operatingMargin: opm.slice(-1)[0] || 0,
      netMargin: latestSales > 0 ? (netProfits.slice(-1)[0] / latestSales) * 100 : 0,
      yearsListed: sales.length,
      cashFlowFromOps: latestCFO,
      capex: latestCapex,
      dividendPayout: 0,
      shareholding
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
  
  const batchSize = 3; // Reduced from 10 to avoid rate-limiting
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    console.log(`Snapshotting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(symbols.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (baseSymbol) => {
      try {
        const symbol = baseSymbol.includes('.') ? baseSymbol : `${baseSymbol}.NS`;
        const period1 = new Date();
        period1.setFullYear(period1.getFullYear() - 5);

        // High Accuracy: Fetching adjusted OHLCV
        const [history, quote, summary, screenerData]: [any, any, any, any] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'incomeStatementHistoryQuarterly'] }).catch(() => null),
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
          'SR_STRATEGY': calculateSRStrategy(quotes),
          'SIXTY_SEVEN_FUNDA': calculateSixtySevenFunda(quotes, screenerData, {}, quote.fiftyTwoWeekHigh),
          'TWENTY_RALLY_RETEST': calculateTwentyRallyRetest(quotes)
        };
        
        snapshot[baseSymbol] = {
          quotes: quotes.slice(-1300), // Keep 5 years for accurate trigger dates & ATH
          quote: {
            marketCap,
            regularMarketPrice: quote.regularMarketPrice,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            pe: summary?.summaryDetail?.trailingPE || summary?.defaultKeyStatistics?.trailingPE || 0,
            roe: (summary?.defaultKeyStatistics?.returnOnEquity || 0) * 100,
            debtToEquity: summary?.financialData?.debtToEquity || 0,
            quarterlyNetIncome: summary?.incomeStatementHistoryQuarterly?.incomeStatementHistory?.map((i: any) => i.netIncome).reverse() || [],
            shareholding: screenerData?.shareholding || null
          },
          screener: screenerData,
          strategies, // Store all pre-calculated results
          lastUpdated: new Date().toISOString()
        };
      } catch (e) {
        console.error(`Snapshot failed for ${baseSymbol}`);
      }
    }));
    // Increased delay between batches to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // --- Finalize Snapshot with Indices Fallback ---
  try {
    const indexSymbols = ['^NSEI', '^NSEBANK', '^BSESN'];
    const indexResults = await Promise.all(indexSymbols.map(s => yahooFinance.quote(s).catch(() => null)));
    snapshot['METADATA'] = {
      lastUpdated: new Date().toISOString(),
      indices: indexResults.map((q, i) => ({
        name: indexSymbols[i] === '^NSEI' ? 'NIFTY 50' : (indexSymbols[i] === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'),
        price: q?.regularMarketPrice || 0,
        change: q?.regularMarketChangePercent || 0,
        ath: q?.fiftyTwoWeekHigh || 0
      }))
    };
  } catch (e) {
    console.error('[SNAPSHOT] Failed to save indices metadata');
  }

  fs.writeFileSync(MARKET_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  snapshotCache = snapshot; // Update in-memory cache
  console.log(`💎 [SNAPSHOT] Success! Market data cached and updated in memory.`);
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
  return snapshotCache;
}

export function getDynamicBasket(): string[] {
  if (fs.existsSync(DYNAMIC_BASKET_PATH)) {
    return JSON.parse(fs.readFileSync(DYNAMIC_BASKET_PATH, 'utf-8'));
  }
  return []; 
}
