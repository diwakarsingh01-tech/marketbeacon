
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

function calculateEMA(prices: number[], length: number): number[] {
  if (prices.length < length) return new Array(prices.length).fill(0);
  const ema: number[] = new Array(prices.length).fill(0);
  const k = 2 / (length + 1);
  let initialSma = prices.slice(0, length).reduce((a, b) => a + b, 0) / length;
  ema[length - 1] = initialSma;
  for (let i = length; i < prices.length; i++) {
    ema[i] = prices[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

async function performAudit() {
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const symbols = ["HINDUNILVR", "BATAINDIA", "TCS", "ASIANPAINT"];
  
  console.log("==========================================");
  console.log("   INSTITUTIONAL SYSTEM AUDIT (v10.7.8)");
  console.log("==========================================");

  for (const sym of symbols) {
    const snap = data[sym];
    if (!snap) {
      console.log(`[ERROR] No data for ${sym}`);
      continue;
    }

    const quotes: Quote[] = snap.quotes;
    const prices = quotes.map(q => q.close);
    const latestIdx = quotes.length - 1;
    const cmp = prices[latestIdx];

    console.log(`\n--- ${sym} (CMP: ${cmp.toFixed(2)}) ---`);

    // 1. Audit Strategy 1: Floor
    const sma200 = calculateSMA(prices, 200)[latestIdx];
    const floorEntry = Math.round(sma200 * 0.86);
    const floorTarget = Math.round(Math.max(sma200 * 1.14, floorEntry * 1.30));
    const floorSignal = quotes[latestIdx].low <= floorEntry;
    console.log(`[STRAT 1] Floor: ${floorEntry} | Target: ${floorTarget} | Status: ${floorSignal ? "QUALIFIED ✅" : "NEUTRAL"}`);

    // 2. Audit Strategy 3: Volatility
    const window = prices.slice(latestIdx - 199, latestIdx + 1);
    const mean = sma200;
    const squareDiffs = window.map(v => Math.pow(v - mean, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / 200);
    const volEntry = Math.round(mean - stdDev * 2.5);
    const volTarget = Math.round(mean + stdDev * 2.5);
    const volSignal = quotes[latestIdx].low <= volEntry;
    console.log(`[STRAT 3] Vol Floor: ${volEntry} | Target: ${volTarget} | Status: ${volSignal ? "QUALIFIED ✅" : "NEUTRAL"}`);

    // 3. Audit Fundamentals
    const scr = snap.screener || {};
    const roe = scr.returnOnEquity || 0;
    const de = scr.netDebtToEquity || 0;
    const salesATH = scr.currentSales >= (scr.athSales * 0.98);
    const profitATH = scr.currentNetProfit >= (scr.athNetProfit * 0.98);
    
    console.log(`[FUNDA] ROE: ${roe}% | D/E: ${de} | Sales@ATH: ${salesATH} | Profit@ATH: ${profitATH}`);
  }
}

performAudit();
