
import { initDB } from './db.js';
import { initSnapshotCache } from './screener.js';
import { precalculateAlpha40 } from './services/worker.js';

async function refresh() {
  console.log('🔄 Manually Refreshing Alpha Hub...');
  await initDB();
  await initSnapshotCache();
  await precalculateAlpha40();
  console.log('✅ Refresh Complete.');
}

refresh();
