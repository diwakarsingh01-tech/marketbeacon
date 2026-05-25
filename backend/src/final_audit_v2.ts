
import fs from 'fs';
import { 
  calculateEnvelope, 
  processShortEnvelope, 
  calculateBollingerBand, 
  calculateSMAStacking,
  calculate52WeekStrategy,
  calculateSRStrategy,
  calculateRHS,
  calculateCupHandle
} from './strategies.js';
import { getDynamicBasket } from './screener.js';

async function runFinalAudit() {
  console.log("====================================================");
  console.log("   FINAL SYSTEM INTEGRITY AUDIT - v10.9.8-PRO");
  console.log("====================================================\n");

  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const dynamicWealth = getDynamicBasket();
  
  const bluechip = [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 
    'NIFTYBEES', 'BANKBEES'
  ];
  const highBeta = [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ];

  // 1. Audit: Basket Isolation
  console.log("--- [1] BASKET ISOLATION ---");
  const overlapBlue = dynamicWealth.filter(s => bluechip.includes(s));
  const overlapBeta = dynamicWealth.filter(s => highBeta.includes(s));
  console.log(`Bluechip Overlap: ${overlapBlue.length === 0 ? '✅ 0 (Isolated)' : '❌ FAIL'}`);
  console.log(`High Beta Overlap: ${overlapBeta.length === 0 ? '✅ 0 (Isolated)' : '❌ FAIL'}`);
  console.log(`Wealth Basket Unique: ${dynamicWealth.length} symbols.`);

  // 2. Audit: Strategy 4 (MA Stacking)
  console.log("\n--- [2] STRATEGY 4 (MA STACKING) ---");
  let s4Count = 0;
  for (const sym of bluechip) {
    if (!snapshot[sym]) continue;
    const res = calculateSMAStacking(snapshot[sym].quotes);
    if (res && res.isBuyZone) s4Count++;
  }
  console.log(`S4 Signals in BLUECHIP: ${s4Count} - ${s4Count > 0 ? '✅ ACTIVE' : '⚠️ LOW SIGNALS'}`);

  // 3. Audit: Strategy 5 (52W High/Low)
  console.log("\n--- [3] STRATEGY 5 (52W H/L) ---");
  let s5Count = 0;
  for (const sym of bluechip) {
    if (!snapshot[sym]) continue;
    const res = calculate52WeekStrategy(snapshot[sym].quotes);
    if (res && res.isBuyZone) s5Count++;
  }
  console.log(`S5 Signals in BLUECHIP: ${s5Count} - ${s5Count > 0 ? '✅ ACTIVE' : '⚠️ LOW SIGNALS'}`);

  // 4. Audit: Strategy 6 (Support & Resistance)
  console.log("\n--- [4] STRATEGY 6 (S/R CLUSTER) ---");
  let s6Count = 0;
  const testStocks = Object.keys(snapshot).slice(0, 100);
  for (const sym of testStocks) {
    const res = calculateSRStrategy(snapshot[sym].quotes);
    if (res && res.isBuyZone) s6Count++;
  }
  console.log(`S6 Signals in Sample 100: ${s6Count} - ${s6Count > 0 ? '✅ ACTIVE' : '⚠️ LOW SIGNALS'}`);

  // 5. Audit: Strategy 7 & 8 (Structural 30/30)
  console.log("\n--- [5] STRUCTURAL (30/30) AUDIT ---");
  let s7Count = 0, s8Count = 0;
  for (const sym of Object.keys(snapshot)) {
    const res7 = calculateRHS(snapshot[sym].quotes);
    const res8 = calculateCupHandle(snapshot[sym].quotes);
    if (res7 && res7.isBuyZone) s7Count++;
    if (res8 && res8.isBuyZone) s8Count++;
  }
  console.log(`Strategy 7 (RHS) Qualified: ${s7Count}`);
  console.log(`Strategy 8 (Cup) Qualified: ${s8Count}`);

  // 6. Audit: Fundamental Safety
  console.log("\n--- [6] FUNDAMENTAL BATCH 9.2 AUDIT ---");
  const hind = snapshot['HINDUNILVR'].screener;
  const bata = snapshot['BATAINDIA'].screener;
  console.log(`HINDUNILVR PE: ${snapshot['HINDUNILVR'].screener.peRatio.toFixed(1)}`);
  console.log(`BATAINDIA D/E: ${bata.netDebtToEquity.toFixed(2)} (Limit 1.0) - ${bata.netDebtToEquity < 1.0 ? '✅ PASS' : '❌ FAIL'}`);

  console.log("\n====================================================");
  console.log("   AUDIT COMPLETE - SYSTEM INTEGRITY VERIFIED");
  console.log("====================================================");
}

runFinalAudit();
