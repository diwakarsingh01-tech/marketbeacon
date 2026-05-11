import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';
import { calculateEnvelope } from './strategies.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DYNAMIC_BASKET_PATH = path.join(__dirname, '../dynamic_basket.json');
const MARKET_SNAPSHOT_PATH = path.join(__dirname, '../market_snapshot.json');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

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

        const pe = (summary.summaryDetail?.trailingPE || summary.defaultKeyStatistics?.trailingPE || 0) as number;
        const roe = ((summary.defaultKeyStatistics?.returnOnEquity || 0) as number) * 100;
        const debtToEquity = ((summary.financialData?.debtToEquity || 0) as number) / 100;
        const marketCap = (summary.summaryDetail?.marketCap || 0) as number;

        const passPE = pe > 0 && pe < 75;
        const passDebt = debtToEquity < 0.25;
        const passROE = roe > 12;
        const passScale = marketCap > 10000000000;

        if (passPE && passDebt && passROE && passScale) {
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
        const [history, quote, summary]: [any, any, any] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] }).catch(() => null)
        ]);

        const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
        
        // Calculate Strategy Indicators for Bluechip basket
        let strategy = null;
        if (bluechipList.includes(baseSymbol)) {
          strategy = calculateEnvelope(quotes);
        }
        
        snapshot[baseSymbol] = {
          quotes: quotes.slice(-500), // Keep 2 years for accurate trigger dates & SMA
          quote: {
            marketCap: quote.marketCap,
            regularMarketPrice: quote.regularMarketPrice,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            pe: summary?.summaryDetail?.trailingPE || summary?.defaultKeyStatistics?.trailingPE || 0,
            roe: (summary?.defaultKeyStatistics?.returnOnEquity || 0) * 100,
            debtToEquity: summary?.financialData?.debtToEquity || 0
          },
          strategy,
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
    // Include Nifty Index for accurate ROI comparison
    await updateMarketSnapshot([...bluechip, ...highBeta, '^NSEI']);
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
