
import fs from 'fs';
import { calculateCupHandle, calculateRHS } from './strategies.js';

function debugStock(sym: string) {
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const snap = data[sym];
  if (!snap) return console.log("No data");

  console.log(`\n--- DEBUGGING ${sym} ---`);
  const res8 = calculateCupHandle(snap.quotes);
  console.log(`Strategy 8 (Cup): BuyZone=${res8.isBuyZone}, Entry=${res8.entryPrice}, Target=${res8.target}, Date=${res8.triggerDate}`);
  
  const res7 = calculateRHS(snap.quotes);
  console.log(`Strategy 7 (RHS): BuyZone=${res7.isBuyZone}, Entry=${res7.entryPrice}, Target=${res7.target}, Date=${res7.triggerDate}`);
}

debugStock("BATAINDIA");
debugStock("RELAXO");
debugStock("WHIRLPOOL");
