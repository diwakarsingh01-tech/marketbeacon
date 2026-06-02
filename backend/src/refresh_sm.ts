import { updateMarketSnapshot } from './screener.js';
import { BASKETS } from './index.js';

async function refresh() {
  console.log('📡 Starting Refresh for H-Super45...');
  await updateMarketSnapshot(BASKETS['H-Super45']);
  console.log('✅ H-Super45 Snapshot Refreshed with Fixed SM Scraper');
}

refresh();
