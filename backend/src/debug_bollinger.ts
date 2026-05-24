
import fs from 'fs';

interface Quote {
  date: string;
  open: number;
  close: number;
  low: number;
  high: number;
}

function calculateSMA(prices: number[], length: number): number[] {
  const sma: number[] = new Array(prices.length).fill(0);
  for (let i = 0; i < prices.length; i++) {
    if (i < length - 1) continue;
    const window = prices.slice(i - length + 1, i + 1);
    sma[i] = window.reduce((a, b) => a + b, 0) / length;
  }
  return sma;
}

function debugBollinger() {
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const hind = data["HINDUNILVR"];
  const quotes: Quote[] = hind.quotes;
  const prices = quotes.map(q => q.close);
  const length = 200;
  const sd = 2.5;

  const smaValues = calculateSMA(prices, length);
  
  console.log(`Auditing HINDUNILVR (Total Quotes: ${quotes.length})`);

  // --- BOLLINGER SIBLING AUDIT ---
  const i = quotes.length - 1;
  const sma = smaValues[i];
  const window = prices.slice(i - length + 1, i + 1);
  const squareDiffs = window.map(v => Math.pow(v - sma, 2));
  const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / length);
  const lowerBand = sma - stdDev * 2.5;
  const upperBand = sma + stdDev * 2.5;
  
  console.log(`[LATEST] LB: ${lowerBand.toFixed(2)} | UB: ${upperBand.toFixed(2)} | SMA: ${sma.toFixed(2)} | CMP: ${prices[i]}`);

  // --- RE-SIMULATE WITH SIGNAL-DAY ENTRY ---
  let isPositionOpen = false;
  let activeEntry = 0;
  let activeTarget = 0;

  for (let j = length; j < quotes.length; j++) {
     const sj = smaValues[j];
     const wj = prices.slice(j - length + 1, j + 1);
     const sdj = Math.sqrt(wj.map(v => Math.pow(v - sj, 2)).reduce((a, b) => a + b, 0) / length);
     const lbj = sj - sdj * 2.5;
     const ubj = sj + sdj * 2.5;

     if (!isPositionOpen && quotes[j].low <= lbj) {
        isPositionOpen = true;
        activeEntry = quotes[j].close; // SIGNAL DAY ENTRY
        activeTarget = ubj;
        console.log(`[INSTITUTIONAL SIGNAL] Date: ${quotes[j].date} | Entry: ${activeEntry} | Target: ${activeTarget.toFixed(2)}`);
     }

     if (isPositionOpen && quotes[j].high >= activeTarget) {
        console.log(`[INSTITUTIONAL EXIT] Date: ${quotes[j].date} | Price: ${quotes[j].high} | Target: ${activeTarget.toFixed(2)}`);
        isPositionOpen = false;
     }
  }
  
  if (isPositionOpen) {
    console.log(`[CURRENT] Status: OPEN | Entry: ${activeEntry} | Target: ${activeTarget.toFixed(2)} | CMP: ${prices[prices.length-1]}`);
  } else {
    console.log(`[CURRENT] Status: CLOSED`);
  }
}

debugBollinger();
