
import { STRATEGIES, BASKETS } from './index.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { getDB, initDB } from './db.js';
import { getDynamicBasket, getMarketSnapshot, initSnapshotCache } from './screener.js';

async function debugGrowthAudit() {
  await initDB();
  await initSnapshotCache();
  
  const symbols = [
    "SONATSOFTW", "SANOFI", "NEWGEN", "QUESS", "ROUTE", "PFIZER", "RALLIS", "JAICORPLTD"
  ];

  const snapshot = await getMarketSnapshot(symbols);
  
  for (const sym of symbols) {
    const snap = snapshot[sym];
    if (!snap) { console.log(`❌ No data for ${sym}`); continue; }
    
    const audit = await validateBatch9(sym, snap, 'Growth Basket');
    console.log(`📊 ${sym}: isPass: ${audit.isPass}, Score: ${audit.score}, Reason: ${audit.reason}`);
    if (!audit.isPass) {
       console.log(`   Debt/Equity: ${audit.metrics.debtToEquity.toFixed(2)}, Pledge: ${audit.metrics.pledged}%, SmartMoney: ${audit.smartMoneyTotal.toFixed(1)}%`);
    }
  }
}

debugGrowthAudit().catch(console.error);
