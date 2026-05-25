
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateMarketSnapshot, initSnapshotCache } from './screener.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DYNAMIC_BASKET_PATH = path.join(__dirname, '../dynamic_basket.json');

async function syncAllWealth() {
  console.log("🚀 Starting Priority Sync for WEALTH_BASKET...");
  
  if (!fs.existsSync(DYNAMIC_BASKET_PATH)) {
    console.error("❌ dynamic_basket.json not found!");
    return;
  }

  const wealthSymbols = JSON.parse(fs.readFileSync(DYNAMIC_BASKET_PATH, 'utf-8'));
  console.log(`📊 Found ${wealthSymbols.length} symbols in Wealth Basket.`);

  initSnapshotCache();
  
  // Update in batches to avoid rate limiting
  await updateMarketSnapshot(wealthSymbols);
  
  console.log("✅ Priority Sync Complete.");
}

syncAllWealth().catch(console.error);
