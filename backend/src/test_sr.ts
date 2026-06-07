import { getMarketSnapshot, getDynamicBasket, initSnapshotCache } from './screener.js';
import { calculateSRStrategy } from './strategies/index.js';
import { initDB } from './db.js';

async function test() {
  await initDB();
  await initSnapshotCache();
  const snapshot = getMarketSnapshot();
  const growth = await getDynamicBasket();
  console.log(`Loaded ${growth.length} growth symbols`);
  
  let matchCount = 0;
  for (const sym of growth) {
    const snap = snapshot[sym];
    if (!snap || !snap.quotes) {
      continue;
    }
    const res = calculateSRStrategy(snap.quotes, snap.screener);
    if (res.isBuyZone) {
      matchCount++;
      console.log(`MATCH: ${sym} -> price: ${snap.quotes[snap.quotes.length - 1].close}, entry: ${res.entryPrice}, target: ${res.target}`);
    }
  }
  console.log(`Total Matches: ${matchCount} out of ${growth.length}`);
}

test();
