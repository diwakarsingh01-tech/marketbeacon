
import { STRATEGIES, BASKETS } from './index.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { getDB, initDB } from './db.js';
import { getDynamicBasket, getMarketSnapshot, initSnapshotCache } from './screener.js';

async function debugSnR() {
  await initDB();
  await initSnapshotCache();
  
  const baskets = ['Elite Basket', 'Quality Basket'];
  
  for (const b of baskets) {
    const symbols = BASKETS[b];
    console.log(`🔍 Checking ${b} (${symbols.length} symbols) for SnR Strategy...`);
    const snapshot = await getMarketSnapshot(symbols);
    const results = [];
    
    for (const sym of symbols) {
      const snap = snapshot[sym];
      if (!snap || !snap.quotes || snap.quotes.length < 252) continue;
      
      const sRes = runStrategyAnalysis('SR_STRATEGY', snap, snap.quote?.marketCap || 0, b);
      if (sRes && sRes.isBuyZone) {
        results.push({ symbol: sym, ...sRes });
      }
    }
    console.log(`✅ Found ${results.length} stocks in ${b} for SnR Strategy.`);
    if (results.length > 0) {
       console.log(`   Sample: ${results.map(r => r.symbol).join(', ')}`);
    }
  }
}

debugSnR().catch(console.error);
