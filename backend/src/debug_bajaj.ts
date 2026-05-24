
import YahooFinance from 'yahoo-finance2';
import { processShortEnvelope } from './strategies.js';

const yahooFinance = new YahooFinance();

async function debugBajaj() {
  const symbol = 'BAJAJFINSV.NS';
  try {
    const history = await yahooFinance.chart(symbol, { period1: '2023-01-01', interval: '1d' });
    const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
    const quote = await YahooFinance.quote(symbol);
    const marketCap = quote.marketCap || 0;
    
    const result = processShortEnvelope(quotes as any, marketCap);
    console.log('--- BAJAJFINSV DEBUG ---');
    console.log(JSON.stringify(result, null, 2));
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

debugBajaj();
