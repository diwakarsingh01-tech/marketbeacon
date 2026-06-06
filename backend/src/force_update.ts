
import { updateMarketSnapshot, initSnapshotCache } from './screener.js';
import { BASKETS } from './index.js';
import { initDB } from './db.js';

async function forceUpdate() {
  console.log('🚀 Forcing fresh market data update with improved scraper...');
  await initDB();
  await initSnapshotCache();
  
  const elite = BASKETS['Elite Basket'] || [];
  const quality = BASKETS['Quality Basket'] || [];
  const symbols = Array.from(new Set([...elite, ...quality])).slice(0, 30); // Update first 30 for verification
  
  console.log(`Refreshing ${symbols.length} symbols...`);
  await updateMarketSnapshot(symbols);
  console.log('✅ Done!');
}

forceUpdate();
