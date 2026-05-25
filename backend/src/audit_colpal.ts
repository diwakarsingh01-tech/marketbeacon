
import fs from 'fs';
import { calculateEnvelope, calculateBollingerBand, calculateSRStrategy } from './strategies.js';

async function auditColpal() {
  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const sym = "COLPAL";
  const snap = snapshot[sym];
  
  const s1 = calculateEnvelope(snap.quotes);
  console.log(`--- S1 (Floor) ---`);
  console.log(`isBuyZone: ${s1.isBuyZone}`);
  console.log(`triggerDate: "${s1.triggerDate}"`);

  const s3 = calculateBollingerBand(snap.quotes);
  console.log(`\n--- S3 (Vol) ---`);
  console.log(`isBuyZone: ${s3.isBuyZone}`);
  console.log(`triggerDate: "${s3.triggerDate}"`);

  const s6 = calculateSRStrategy(snap.quotes, snap.screener);
  console.log(`\n--- S6 (S/R) ---`);
  console.log(`isBuyZone: ${s6.isBuyZone}`);
  console.log(`triggerDate: "${s6.triggerDate}"`);
}

auditColpal();
