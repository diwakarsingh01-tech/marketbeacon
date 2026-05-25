
import fs from 'fs';

interface Quote {
  date: string;
  high: number;
  low: number;
  close: number;
}

function diagnoseRHS() {
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const symbols = Object.keys(data);
  
  console.log(`Analyzing ${symbols.length} stocks for Strategy 7 (RHS)...`);

  for (const sym of symbols) {
    const snap = data[sym];
    const quotes: Quote[] = snap.quotes;
    if (!quotes || quotes.length < 350) continue;

    const prices = quotes.map(q => q.close);
    const currentPrice = prices[prices.length - 1];
    const ath = Math.max(...quotes.map(q => q.high));
    
    // Rule 1: ATH Drawdown
    const passATH = currentPrice <= ath * 0.70;

    if (passATH) {
      // Find Pivots
      const lowPivots: { price: number, idx: number }[] = [];
      const highPivots: { price: number, idx: number }[] = [];
      for (let i = 3; i < quotes.length - 1; i++) {
        const h = quotes[i].high, l = quotes[i].low;
        if (l < quotes[i-1].low && l < quotes[i-2].low && l < quotes[i-3].low && l < quotes[i+1].low) 
          lowPivots.push({ price: l, idx: i });
        if (h > quotes[i-1].high && h > quotes[i-2].high && h > quotes[i-3].high && h > quotes[i+1].high) 
          highPivots.push({ price: h, idx: i });
      }

      if (lowPivots.length < 3 || highPivots.length < 2) continue;

      console.log(`[DEBUG] ${sym}: Drawdown PASS. Low Pivots: ${lowPivots.length}, High Pivots: ${highPivots.length}`);

      for (let j = lowPivots.length - 1; j >= 2; j--) {
        const s2 = lowPivots[j];
        const head = lowPivots[j-1];
        const s1 = lowPivots[j-2];

        const patternWidth = s2.idx - s1.idx;
        const widthPass = patternWidth >= 60;
        
        const headDepthCheck = head.price < s1.price && head.price < s2.price;
        
        const highsInPattern = highPivots.filter(h => h.idx > s1.idx && h.idx < s2.idx);
        const p2 = highsInPattern.filter(h => h.idx > head.idx)[0];
        const p1Arr = highsInPattern.filter(h => h.idx < head.idx);
        const p1 = p1Arr[p1Arr.length - 1];

        if (p1 && p2) {
          const neckline = Math.max(p1.price, p2.price);
          const headDepth = (neckline - head.price) / neckline;
          const depthPass = headDepth >= 0.30;
          
          const shouldersLevel = Math.abs(s1.price - s2.price) / Math.max(s1.price, s2.price) <= 0.05;
          const neckLevel = Math.abs(p1.price - p2.price) / Math.max(p1.price, p2.price) <= 0.05;

          console.log(`  - Pattern at idx ${s1.idx}-${s2.idx}: Width=${patternWidth} (${widthPass}), Depth=${(headDepth*100).toFixed(1)}% (${depthPass}), ParallelS=${shouldersLevel}, ParallelN=${neckLevel}`);
          
          if (widthPass && depthPass && shouldersLevel && neckLevel) {
            console.log(`  - [FOUND CANDIDATE] Checking for breakout...`);
            for (let k = s2.idx + 1; k < quotes.length; k++) {
               if (quotes[k].close > neckline) {
                 console.log(`  - [SIGNAL] Breakout on ${quotes[k].date} at ${quotes[k].close}`);
                 break;
               }
            }
          }
        }
      }
    }
  }
}

diagnoseRHS();
