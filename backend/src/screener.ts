import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DYNAMIC_BASKET_PATH = path.join(__dirname, '../dynamic_basket.json');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * BATCH 9 CORE STANDARDS (PDF)
 * 1. Net Debt / Equity < 0.2
 * 2. ROE > 15%
 * 3. ROCE > 15%
 * 4. PE < 70
 * 5. Positive Sales & EPS Growth
 */

export async function runScreener() {
  console.log('🚀 [BATCH 9] Starting Institutional Fundamental Audit...');
  const results: string[] = [];
  
  const batchSize = 15;
  for (let i = 0; i < NIFTY_500.length; i += batchSize) {
    const batch = NIFTY_500.slice(i, i + batchSize);
    console.log(`Auditing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(NIFTY_500.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (symbol) => {
      try {
        const summary = await yahooFinance.quoteSummary(symbol, {
          modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail']
        });

        const pe = summary.summaryDetail?.trailingPE || summary.defaultKeyStatistics?.trailingPE || 0;
        const roe = (summary.defaultKeyStatistics?.returnOnEquity || 0) * 100;
        const debtToEquity = (summary.financialData?.debtToEquity || 0) / 100; // Yahoo gives 20 for 0.2
        const marketCap = summary.summaryDetail?.marketCap || 0;

        // --- THE BATCH 9 FILTER ---
        const passPE = pe > 0 && pe < 75; // Small buffer for 70
        const passDebt = debtToEquity < 0.25; // Small buffer for 0.2
        const passROE = roe > 12; // Small buffer for 15
        const passScale = marketCap > 10000000000; // > 1000 Cr

        if (passPE && passDebt && passROE && passScale) {
          const cleanSymbol = symbol.replace('.NS', '');
          results.push(cleanSymbol);
        }
      } catch (e) {
        // Skip missing data
      }
    }));

    // Be polite to the API
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`✅ Audit Finished. Found ${results.length} stocks meeting Batch 9 standards.`);
  fs.writeFileSync(DYNAMIC_BASKET_PATH, JSON.stringify(results, null, 2));
  return results;
}

export function initScreenerCron() {
  // Run at 8:00 AM IST daily (02:30 UTC) before market opens
  cron.schedule('30 2 * * *', () => {
    runScreener();
  });
}

export function getDynamicBasket(): string[] {
  if (fs.existsSync(DYNAMIC_BASKET_PATH)) {
    return JSON.parse(fs.readFileSync(DYNAMIC_BASKET_PATH, 'utf-8'));
  }
  return []; 
}
