
import fs from 'fs';
import { calculateBollingerBand, calculateSRStrategy } from './strategies.js';

async function verifyAPIResponse() {
  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const sym = "HINDUNILVR"; // S3 candidate
  const snap = snapshot[sym];
  
  const s3 = calculateBollingerBand(snap.quotes);
  console.log(`--- S3 ${sym} ---`);
  console.log(`isBuyZone: ${s3.isBuyZone}`);
  console.log(`triggerDate: "${s3.triggerDate}"`);

  const s6_sym = "DBCORP"; // S6 candidate
  const s6_snap = snapshot[s6_sym];
  const s6 = calculateSRStrategy(s6_snap.quotes, s6_snap.screener);
  console.log(`\n--- S6 ${s6_sym} ---`);
  console.log(`isBuyZone: ${s6.isBuyZone}`);
  console.log(`triggerDate: "${s6.triggerDate}"`);
}

verifyAPIResponse();
