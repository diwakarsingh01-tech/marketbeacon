
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
  calculateTwentyRallyRetest
} from './strategies.js';

async function auditDates() {
  console.log("--- FINAL INFORMATION COMPLETENESS AUDIT ---");
  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const symbols = Object.keys(snapshot);

  const testResults: any = {};

  for (const sym of symbols) {
    const snap = snapshot[sym];
    const quotes = snap.quotes;

    const strats = [
      { id: 'S1', name: 'Floor', res: calculateEnvelope(quotes) },
      { id: 'S2', name: 'Ceiling', res: processShortEnvelope(quotes, snap.quote.marketCap) },
      { id: 'S3', name: 'Volatility', res: calculateBollingerBand(quotes) },
      { id: 'S4', name: 'MA Stack', res: calculateSMAStacking(quotes) },
      { id: 'S5', name: '52W H/L', res: calculate52WeekStrategy(quotes) },
      { id: 'S6', name: 'S/R Core', res: calculateSRStrategy(quotes) },
      { id: 'S7', name: 'RHS', res: calculateRHS(quotes) },
      { id: 'S8', name: 'Cup', res: calculateCupHandle(quotes) },
      { id: 'S9', name: '67 Funda', res: calculateSixtySevenFunda(quotes, snap.screener) },
      { id: 'S10', name: 'Rally', res: calculateTwentyRallyRetest(quotes, sym) }
    ];

    for (const s of strats) {
      if (s.res && s.res.triggerDate) {
        if (!testResults[s.id]) {
          console.log(`✅ [${s.id}] ${s.name}: Date found for ${sym}: ${s.res.triggerDate}`);
          testResults[s.id] = true;
        }
      }
    }
    if (Object.keys(testResults).length === 10) break;
  }

  const missing = [1,2,3,4,5,6,7,8,9,10].filter(i => !testResults[`S${i}`]);
  if (missing.length === 0) console.log("\n🚀 ALL 10 STRATEGIES ARE RETURNING OBSERVATION DATES!");
  else console.log("\n❌ MISSING DATES FOR STRATEGIES:", missing.join(", "));
}

auditDates();
