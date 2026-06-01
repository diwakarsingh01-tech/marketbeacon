
import fs from 'fs';
import { calculateSMAStacking } from './strategies/index.js';

async function auditSMA() {
  console.log("--- Auditing Strategy 4: SMA ABCD ---");
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  let found = 0;

  for (const sym of Object.keys(data)) {
    const snap = data[sym];
    const res = calculateSMAStacking(snap.quotes);
    
    if (res && res?.isBuyZone) {
      console.log(`✅ [SMA ABCD] ${sym} | Tranche: ${res.tranche} | Entry: ${res.entryPrice} | Target: ${res.target} | Date: ${res.triggerDate}`);
      found++;
    }
  }
  console.log(`\nTotal SMA ABCD Qualified: ${found}`);
}

auditSMA();
