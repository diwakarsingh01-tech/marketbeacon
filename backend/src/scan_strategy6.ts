import { getMarketSnapshot, initSnapshotCache } from './screener.js';
import { calculateSRStrategy } from './strategies/index.js';

async function scanUniverse() {
  console.log('🚀 Starting Strategy 6 (WM Swing) Universal Scan...');
  await initSnapshotCache();
  const snapshot = getMarketSnapshot();
  const symbols = Object.keys(snapshot);
  
  let count = 0;
  const results = [];

  for (const sym of symbols) {
    const snap = snapshot[sym];
    if (!snap || !snap.quotes?.length) continue;

    const res: any = calculateSRStrategy(snap.quotes, snap.screener);
    if (res && res.isBuyZone) {
      results.push({
        symbol: sym,
        entry: res.entryPrice,
        target: res.target,
        upside: res.upside,
        rrr: res.rrr,
        date: res.triggerDate
      });
      count++;
    }
  }

  if (results.length > 0) {
    console.table(results);
  } else {
    console.log('❌ No Strategy 6 triggers found in the current universe.');
  }
  console.log(`\nTotal Institutional Triggers: ${count}`);
}

scanUniverse().catch(err => {
    console.error('Scan failed:', err);
    process.exit(1);
});
