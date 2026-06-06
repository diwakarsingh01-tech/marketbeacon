
import { updateMarketSnapshot, initSnapshotCache } from './screener.js';
import { initDB } from './db.js';

async function patch() {
  console.log('🔄 Patching institutional data for select stocks...');
  await initDB();
  await updateMarketSnapshot(['ASTRAZEN', 'TCS', 'RELAXO', 'SANOFI', 'WHIRLPOOL']);
  console.log('✅ Patch Complete.');
}

patch();
