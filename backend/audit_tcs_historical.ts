import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function auditTCSHistorical() {
  const symbol = 'TCS.NS';
  const targetDate = '2026-04-22';
  
  // Fetch enough data to have 200 days before targetDate
  const period1 = '2025-01-01';
  const period2 = '2026-05-01';
  
  try {
    const history = await yahooFinance.chart(symbol, { 
      period1, 
      period2,
      interval: '1d' 
    });
    
    const quotes = (history.quotes || []).filter((q: any) => q.close);
    
    // Find index of the target date
    const targetIdx = quotes.findIndex((q: any) => {
       const d = new Date(q.date).toISOString().split('T')[0];
       return d === targetDate;
    });

    if (targetIdx < 200) {
      console.log(`Not enough historical data before ${targetDate}. Found ${targetIdx} days.`);
      return;
    }
    
    const prices = quotes.map(q => q.adjclose || q.close);
    
    // Calculate 200 SMA on the target date
    const window = prices.slice(targetIdx - 199, targetIdx + 1);
    const sma200 = window.reduce((a, b) => a + b, 0) / 200;
    const lowerBand14 = sma200 * (1 - 0.14);
    const lowerBand11_5 = sma200 * (1 - 0.115);
    
    console.log(`--- TCS Audit for ${targetDate} ---`);
    console.log(`Price on ${targetDate}: ₹${prices[targetIdx].toFixed(2)}`);
    console.log(`200 SMA: ₹${sma200.toFixed(2)}`);
    console.log(`14% Institutional Floor: ₹${lowerBand14.toFixed(2)}`);
    console.log(`11.5% Reference Level: ₹${lowerBand11_5.toFixed(2)}`);
    
  } catch (e) {
    console.error(e);
  }
}

auditTCSHistorical();
