import { updateMarketSnapshot, initSnapshotCache } from './screener.js';

async function test() {
  initSnapshotCache();
  const symbols = ['TCS', 'HAVELLS', 'WHIRLPOOL', 'GLAXO', 'ITC'];
  console.log(`--- Updating ${symbols.join(', ')} ---`);
  await updateMarketSnapshot(symbols);
  console.log('--- Update Complete ---');
}

test();
