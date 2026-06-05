import { updateMarketSnapshot } from './screener.js';
import { BASKETS } from './index.js';

async function refresh() {
  console.log('📡 Starting Refresh for Elite Basket...');
  await updateMarketSnapshot(BASKETS['Elite Basket']);
  console.log('✅ Elite Basket Snapshot Refreshed with Fixed SM Scraper');
}

refresh();
