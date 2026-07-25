
import fs from 'fs';
import { calculateCupHandle } from './strategies/index.js';

function debugStock(sym: string) {
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const snap = data[sym];
  if (!snap) return console.log("No data");

  console.log(`\n--- DEBUGGING ${sym} ---`);
  const res8 = calculateCupHandle(snap.quotes);
  console.log(`Strategy 8 (Cup): BuyZone=${res8.isBuyZone}, Entry=${res8.entryPrice}, Target=${res8.target}, Date=${res8.triggerDate}`);
}

debugStock("BATAINDIA");
debugStock("RELAXO");
debugStock("WHIRLPOOL");
