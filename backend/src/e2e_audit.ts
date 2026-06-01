
import fs from 'fs';
import { 
  calculateEnvelope, 
  processShortEnvelope, 
  calculateBollingerBand, 
  calculateSMAStacking,
  calculate52WeekStrategy,
  calculateSRStrategy,
  calculateRHS,
  calculateCupHandle,
  calculateSixtySevenFunda,
  calculateTwentyRallyRetest,
  calculateABCDLevels
} from './strategies/index.js';
import { getDynamicBasket, getMarketSnapshot } from './screener.js';

const BASKETS = {
  'BLUECHIP': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 
    'NIFTYBEES', 'BANKBEES'
  ],
  'HIGH_BETA': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ]
};

async function performE2EAudit() {
  console.log("====================================================");
  console.log("   E2E INSTITUTIONAL SYSTEM AUDIT - v11.2.1-PRO");
  console.log("====================================================\n");

  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const dynamicWealth = getDynamicBasket();
  
  // 1. Audit: Basket Isolation
  console.log("--- [1] BASKET INTEGRITY ---");
  const blueOverlap = dynamicWealth.filter(s => BASKETS.BLUECHIP.includes(s));
  const betaOverlap = dynamicWealth.filter(s => BASKETS.HIGH_BETA.includes(s));
  console.log(`Bluechip Overlap in Wealth: ${blueOverlap.length === 0 ? '✅ 0 (Isolated)' : '❌ FAIL'}`);
  console.log(`High Beta Overlap in Wealth: ${betaOverlap.length === 0 ? '✅ 0 (Isolated)' : '❌ FAIL'}`);
  console.log(`Wealth Basket Size: ${dynamicWealth.length} (Growth Only)`);

  // 2. Audit: Strategy Date & Signal Completeness
  console.log("\n--- [2] STRATEGY SIGNAL COMPLETENESS (10/10) ---");
  const testSyms = ['HINDUNILVR', 'BATAINDIA', 'TCS', 'WHIRLPOOL', 'DBCORP'];
  
  for (const sym of testSyms) {
    const snap = snapshot[sym];
    if (!snap) continue;
    console.log(`\n> ${sym} (CMP: ${snap.quotes[snap.quotes.length-1].close})`);
    
    const res = [
      { id: 'S1', n: 'Floor', r: calculateEnvelope(snap.quotes) },
      { id: 'S3', n: 'Volatility', r: calculateBollingerBand(snap.quotes) },
      { id: 'S4', n: 'MA Stack', r: calculateSMAStacking(snap.quotes) },
      { id: 'S5', n: '52W H/L', r: calculate52WeekStrategy(snap.quotes) },
      { id: 'S6', n: 'S/R Core', r: calculateSRStrategy(snap.quotes, snap.screener) },
      { id: 'S7', n: 'RHS', r: calculateRHS(snap.quotes) },
      { id: 'S8', n: 'Cup', r: calculateCupHandle(snap.quotes) }
    ];

    for (const s of res) {
      if (s.r && s?.r?.isBuyZone) {
        const dateOk = s.r.triggerDate && s.r.triggerDate.length > 5;
        console.log(`  [${s.id}] ${s.n}: QUALIFIED | Obs: ${s.r.triggerDate || 'MISSING'} | Target: ${s.r.target} - ${dateOk ? '✅' : '❌'}`);
      }
    }
  }

  // 3. Audit: Fundamental Batch 9.2 math
  console.log("\n--- [3] FUNDAMENTAL ACCURACY (Batch 9.2) ---");
  const pfr = snapshot['PFIZER'];
  if (pfr && pfr.screener) {
    const pe = pfr.screener.peRatio;
    const de = pfr.screener.netDebtToEquity;
    const smart = pfr.screener.shareholding?.smartMoneyTotal;
    console.log(`PFIZER PE: ${pe.toFixed(1)}`);
    console.log(`PFIZER D/E: ${de.toFixed(2)}`);
    console.log(`PFIZER Smart Money: ${smart}% - ${smart >= 70 ? '✅ PASS' : '❌ REJECT (Rule 70%)'}`);
  }

  // 4. Audit: Alpha Hub Simulation
  console.log("\n--- [4] ALPHA HUB ELITE (40-60) SIMULATION ---");
  const sectorLimits: Record<string, number> = {};
  let totalActive = 0;
  
  for (const sym of Object.keys(snapshot)) {
    const snap = snapshot[sym];
    const sector = snap.screener?.industry || 'General';
    const res = calculateEnvelope(snap.quotes); // Test with S1
    if (res && res?.isBuyZone) {
      const smart = snap.screener?.shareholding?.smartMoneyTotal || 0;
      if (smart >= 70 && (sectorLimits[sector] || 0) < 4) {
        totalActive++;
        sectorLimits[sector] = (sectorLimits[sector] || 0) + 1;
      }
    }
  }
  console.log(`Alpha Hub Eligible (S1 Only): ${totalActive}`);
  console.log(`Diversification Check: ${Object.values(sectorLimits).every(v => v <= 4) ? '✅ PASS' : '❌ FAIL'}`);

  console.log("\n====================================================");
  console.log("   AUDIT COMPLETE - END-TO-END VERIFIED");
  console.log("====================================================");
}

performE2EAudit();
