import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DYNAMIC_BASKET_PATH = path.join(__dirname, '../dynamic_basket.json');
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function runScreener() {
  console.log('🚀 Starting Daily Fundamental Screener...');
  const results: string[] = [];
  
  // Scan in batches to avoid overwhelming the API or rate limits
  const batchSize = 10;
  for (let i = 0; i < NIFTY_500.length; i += batchSize) {
    const batch = NIFTY_500.slice(i, i + batchSize);
    console.log(`Scanning batch ${i / batchSize + 1}/${Math.ceil(NIFTY_500.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (symbol) => {
      try {
        const [quote, summary] = await Promise.all([
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, {
            modules: ['financialData', 'defaultKeyStatistics']
          })
        ]);

        const marketCap = quote.marketCap || 0;
        const netProfit = summary.defaultKeyStatistics?.netIncomeToCommon || 0;
        const debtToEquity = summary.financialData?.debtToEquity || 0;

        // Criteria:
        // 1. Net Profit > 50 Cr (500,000,000)
        // 2. Market Cap > 500 Cr (5,000,000,000)
        // 3. Debt to Equity < 0.5 (In Yahoo Finance, 50 means 0.5 ratio)
        
        if (netProfit > 500000000 && marketCap > 5000000000 && debtToEquity < 50) {
          const cleanSymbol = symbol.replace('.NS', '');
          results.push(cleanSymbol);
        }
      } catch (e) {
        // Silently skip if data is missing or error occurs for a specific stock
      }
    }));

    // Small delay between batches to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`✅ Screener Finished. Found ${results.length} stocks matching criteria.`);
  fs.writeFileSync(DYNAMIC_BASKET_PATH, JSON.stringify(results, null, 2));
  return results;
}

// Schedule for 4:00 PM (16:00) IST daily
// Server time might be UTC, so we need to adjust. 
// IST is UTC+5:30. So 16:00 IST is 10:30 UTC.
export function initScreenerCron() {
  cron.schedule('30 10 * * *', () => {
    runScreener();
  });
}

// Helper to load current dynamic basket
export function getDynamicBasket(): string[] {
  if (fs.existsSync(DYNAMIC_BASKET_PATH)) {
    return JSON.parse(fs.readFileSync(DYNAMIC_BASKET_PATH, 'utf-8'));
  }
  return []; // Return empty if screener hasn't run yet
}
