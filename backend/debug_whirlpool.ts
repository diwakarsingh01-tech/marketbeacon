
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function debugWhirlpool() {
  const symbol = 'WHIRLPOOL.NS';
  const history = await yahooFinance.chart(symbol, { period1: '2024-01-01', interval: '1d' });
  const quotes = history.quotes.filter(q => q.close && q.low && q.high);
  
  const length = 200;
  const smaValues = new Array(quotes.length).fill(0);
  for (let i = length - 1; i < quotes.length; i++) {
    let sum = 0;
    for (let j = 0; j < length; j++) {
      sum += quotes[i - j].close;
    }
    smaValues[i] = sum / length;
  }

  console.log('Scanning for latest trigger...');
  for (let i = quotes.length - 1; i >= length; i--) {
    const q = quotes[i];
    const lowerBand = smaValues[i] * 0.86;
    if (q.low <= lowerBand) {
      console.log(`FOUND HIT: ${q.date.toISOString().split('T')[0]} | Price: ${q.close} | Band: ${lowerBand.toFixed(2)}`);
      
      const target = Math.max(smaValues[i] * 1.14, q.close * 1.30);
      console.log(`Target set to: ${target.toFixed(2)}`);
      
      let hit = false;
      for (let k = i + 1; k < quotes.length; k++) {
        if (quotes[k].high >= target) {
          console.log(`   --> Target HIT on ${quotes[k].date.toISOString().split('T')[0]} @ ${quotes[k].high}`);
          hit = true;
          break;
        }
      }
      if (!hit) {
        console.log('   --> Still OPEN!');
        break; 
      }
    }
  }
}
debugWhirlpool();
