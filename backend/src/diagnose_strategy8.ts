
import fs from 'fs';

interface Quote {
  date: string;
  high: number;
  low: number;
  close: number;
}

function diagnoseCupHandle() {
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const symbols = Object.keys(data);
  
  console.log(`Analyzing ${symbols.length} stocks for Strategy 8...`);

  for (const sym of symbols) {
    const snap = data[sym];
    const quotes: Quote[] = snap.quotes;
    if (!quotes || quotes.length < 300) continue;

    const prices = quotes.map(q => q.close);
    const currentPrice = prices[prices.length - 1];
    const ath = Math.max(...quotes.map(q => q.high));
    
    // Rule 1: ATH Drawdown
    const drawdown = ((ath - currentPrice) / ath) * 100;
    const passATH = currentPrice <= ath * 0.70;

    if (passATH) {
      console.log(`[DEBUG] ${sym}: Drawdown ${drawdown.toFixed(1)}% (PASS ATH)`);
      
      // Check for Pivots
      const isPivotHigh = (idx: number) => {
        if (idx < 3 || idx >= quotes.length - 1) return false;
        const h = quotes[idx].high;
        return h > quotes[idx-1].high && h > quotes[idx-2].high && h > quotes[idx-3].high &&
               h > quotes[idx+1].high;
      };

      const pivots: { price: number, idx: number }[] = [];
      for (let i = 3; i < quotes.length - 1; i++) {
        if (isPivotHigh(i)) pivots.push({ price: quotes[i].high, idx: i });
      }

      if (pivots.length < 2) {
        console.log(`  - Only ${pivots.length} pivots found.`);
        continue;
      }

      // Check pairs of pivots
      let foundPattern = false;
      for (let j = pivots.length - 1; j >= 1; j--) {
        const rim2 = pivots[j];
        const rim1 = pivots[j-1];
        
        const neckline = Math.max(rim1.price, rim2.price);
        const cupWidth = rim2.idx - rim1.idx;
        if (cupWidth < 20 || cupWidth > 200) continue;

        const cupSlice = prices.slice(rim1.idx, rim2.idx);
        const cupLow = Math.min(...cupSlice);
        const cupDepth = ((neckline - cupLow) / neckline) * 100;
        const rimsLevel = Math.abs(rim1.price - rim2.price) / neckline <= 0.05;

        if (cupDepth >= 30) {
           console.log(`  - Potential Cup between idx ${rim1.idx} and ${rim2.idx}. Depth: ${cupDepth.toFixed(1)}%. Rims Level: ${rimsLevel}. Width: ${cupWidth}`);
           
           // Check for breakout
           for (let k = rim2.idx + 1; k < quotes.length; k++) {
             if (quotes[k].close > neckline) {
               console.log(`  - [SIGNAL] Breakout on idx ${k} (${quotes[k].date}) at price ${quotes[k].close}`);
               foundPattern = true;
               break;
             }
           }
        }
      }
    }
  }
}

diagnoseCupHandle();
