import yahooFinance from 'yahoo-finance2';

const SUPER_45 = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'TITAN']; 

async function testBacktest() {
  for (const baseSymbol of SUPER_45) {
    console.log(`\nTesting ${baseSymbol}...`);
    try {
      const symbol = `${baseSymbol}.NS`;
      const period1 = new Date();
      period1.setFullYear(period1.getFullYear() - 2);

      const history = await yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' });
      const quotes = history.quotes;
      
      if (!quotes || quotes.length < 200) {
        console.log(`  - Not enough data`);
        continue;
      }

      // Calculate 200 EMA
      const emaLength = 200;
      const k = 2 / (emaLength + 1);
      let ema = quotes[0].close || 0;
      const emaValues = quotes.map(q => {
        const close = q.close || ema;
        ema = (close * k) + (ema * (1 - k));
        return ema;
      });

      let activePosition: any = null;
      let closedCount = 0;

      for (let i = 200; i < quotes.length; i++) {
        const q = quotes[i];
        const currEma = emaValues[i];
        const entryA = currEma * 0.86;
        const targetA = currEma * 1.14; 

        if (!activePosition) {
          if (q.low && q.low <= entryA) {
            activePosition = { entryA, targetA, currentLevel: 'A' };
          }
        } else {
          if (q.high && q.high >= activePosition.targetA) {
            closedCount++;
            activePosition = null;
          }
        }
      }
      console.log(`  - Closed Trades: ${closedCount}`);
      console.log(`  - Currently Active: ${activePosition ? 'YES' : 'NO'}`);
    } catch (e) {
      console.error(`  - Error: ${e.message}`);
    }
  }
}

testBacktest();
