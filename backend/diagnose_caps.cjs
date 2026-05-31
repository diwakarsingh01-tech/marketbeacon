const fs = require('fs');
const path = require('path');

const snapPath = path.join(__dirname, 'market_snapshot.json');
if (!fs.existsSync(snapPath)) {
  console.log('No snapshot found.');
  process.exit();
}

const snapshot = JSON.parse(fs.readFileSync(snapPath, 'utf-8'));
let large = 0, mid = 0, small = 0;

for (const sym of Object.keys(snapshot)) {
  const snap = snapshot[sym];
  const marketCap = snap.quote?.marketCap || 1;
  const capCr = marketCap / 10000000;
  // Adjusted thresholds based on standard Indian market caps
  const capType = capCr >= 45000 ? 'LARGE' : (capCr >= 15000 ? 'MID' : 'SMALL');
  
  if (capType === 'LARGE') large++;
  else if (capType === 'MID') mid++;
  else small++;
}

console.log(`Total Snapshot Symbols: ${Object.keys(snapshot).length}`);
console.log(`NEW Classification - Large (>=45,000Cr): ${large}, Mid (>=15,000Cr): ${mid}, Small (<15,000Cr): ${small}`);
