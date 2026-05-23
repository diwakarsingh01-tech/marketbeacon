import { updateMarketSnapshot, initSnapshotCache } from './screener.js';

async function test() {
  initSnapshotCache();
  console.log('--- Updating TCS ---');
  await updateMarketSnapshot(['TCS']);
  console.log('--- Update Complete ---');
}

test();
