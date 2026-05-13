import { Quote } from './src/strategies.js';
import fs from 'fs';

// Redefine pivot logic here for direct inspection
function findPivots(quotes: any[], window: number = 3) {
  const pivots: any[] = [];
  const prices = quotes.map((q: any) => q.adjclose || q.adjClose || q.close);
  const highs = quotes.map((q: any) => q.high);
  const lows = quotes.map((q: any) => q.low);

  for (let i = window; i < quotes.length - window; i++) {
    const leftH = highs.slice(i - window, i);
    const rightH = highs.slice(i + 1, i + window + 1);
    if (highs[i] >= Math.max(...leftH) && highs[i] >= Math.max(...rightH)) {
      pivots.push({ p: highs[i], b: i, t: 'high' });
    }
    const leftL = lows.slice(i - window, i);
    const rightL = lows.slice(i + 1, i + window + 1);
    if (lows[i] <= Math.min(...leftL) && lows[i] <= Math.min(...rightL)) {
      pivots.push({ p: lows[i], b: i, t: 'low' });
    }
  }
  return pivots;
}

const snapshot = JSON.parse(fs.readFileSync('./market_snapshot.json', 'utf-8'));
const baseSymbol = 'PAGEIND';
const data = snapshot[baseSymbol];

if (data) {
  const pivots = findPivots(data.quotes, 3);
  console.log('Total Pivots found:', pivots.length);
  
  // Try clustering logic
  const mergeTol = 0.0235;
  const bands: any[] = [];
  pivots.forEach(piv => {
    let found = false;
    for (let b of bands) {
      if (Math.abs(b.p - piv.p) <= (b.p * mergeTol)) {
        b.p = (b.p * b.c + piv.p) / (b.c + 1);
        b.c++;
        found = true;
        break;
      }
    }
    if (!found) bands.push({ p: piv.p, c: 1 });
  });
  console.log('Total Bands found:', bands.length);
  
  // Print high-count bands
  bands.filter(b => b.c >= 2).forEach(b => console.log('Band Price:', b.p, 'Touches:', b.c));
}
