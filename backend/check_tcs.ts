import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function checkTCS() {
  const symbol = 'TCS.NS';
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - 1);
  
  try {
    const history = await yahooFinance.chart(symbol, { 
      period1: period1.toISOString().split('T')[0], 
      interval: '1d' 
    });
    
    const quotes = (history.quotes || []).filter((q: any) => q.close);
    if (quotes.length < 200) {
      console.log('Not enough data');
      return;
    }
    
    const prices = quotes.map(q => q.adjclose || q.close);
    const last200 = prices.slice(-200);
    const sma200 = last200.reduce((a, b) => a + b, 0) / 200;
    const lowerBand = sma200 * (1 - 0.14);
    
    console.log('--- TCS Mathematical Audit ---');
    console.log(`Current Price: ${prices[prices.length - 1]}`);
    console.log(`200 SMA: ${sma200.toFixed(2)}`);
    console.log(`14% Lower Band (Institutional Floor): ${lowerBand.toFixed(2)}`);
  } catch (e) {
    console.error(e);
  }
}

checkTCS();
