
import fs from 'fs';
import { calculateBollingerBand, calculateSRStrategy } from './strategies.js';

async function auditQualified() {
  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const symbols = Object.keys(snapshot);

  console.log("--- STRATEGY 3: VOLATILITY ---");
  let s3Count = 0;
  for (const sym of symbols) {
    const res = calculateBollingerBand(snapshot[sym].quotes);
    if (res && res.isBuyZone) {
      console.log(`✅ ${sym} | Date: ${res.triggerDate} | Entry: ${res.entryPrice}`);
      s3Count++;
    }
  }
  if (s3Count === 0) console.log("No Qualified stocks found for S3.");

  console.log("\n--- STRATEGY 6: S/R CORE ---");
  let s6Count = 0;
  for (const sym of symbols) {
    const res = calculateSRStrategy(snapshot[sym].quotes);
    if (res && res.isBuyZone) {
      console.log(`✅ ${sym} | Date: ${res.triggerDate} | Entry: ${res.entryPrice}`);
      s6Count++;
    }
  }
  if (s6Count === 0) console.log("No Qualified stocks found for S6.");
}

auditQualified();
