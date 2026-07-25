
import fs from 'fs';
import { 
  calculateEnvelope, 
  processShortEnvelope, 
  calculateBollingerBand, 
  calculateSMAStacking,
  calculate52WeekStrategy,
  calculateSRStrategy,
  calculateCupHandle,
  calculateSixtySevenFunda,
  calculateTwentyRallyRetest
} from './strategies/index.js';

async function deepAudit() {
  console.log("--- DEEP DATA COMPLETENESS AUDIT ---");
  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const symbols = Object.keys(snapshot);

  let totalIssues = 0;

  for (const sym of symbols) {
    const snap = snapshot[sym];
    const quotes = snap.quotes;
    if (!quotes || quotes.length === 0) continue;

    const testStrats = [
      { id: 'S1', fn: calculateEnvelope },
      { id: 'S3', fn: calculateBollingerBand },
      { id: 'S4', fn: calculateSMAStacking },
      { id: 'S5', fn: calculate52WeekStrategy },
      { id: 'S6', fn: (q: any) => calculateSRStrategy(q, snap.screener) },
      { id: 'S8', fn: calculateCupHandle },
      { id: 'S9', fn: (q: any) => calculateSixtySevenFunda(q, snap.screener) }
    ];

    for (const s of testStrats) {
      const res = s.fn(quotes);
      if (res && res?.isBuyZone) {
        if (!res.triggerDate) {
          console.log(`❌ [ISSUE] ${sym} in ${s.id} is Qualified but MISSING triggerDate!`);
          totalIssues++;
        }
      }
    }
  }

  if (totalIssues === 0) console.log("\n✅ NO LOGIC ISSUES FOUND IN STRATEGIES. All Qualified stocks have dates.");
  else console.log(`\n❌ FOUND ${totalIssues} ISSUES.`);
}

deepAudit();
