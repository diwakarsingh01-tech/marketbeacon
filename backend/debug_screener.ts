
import { fetchScreenerData } from './src/screener.js';

async function test() {
  const symbol = 'HAVELLS';
  console.log(`Testing fetchScreenerData for ${symbol}...`);
  const data = await fetchScreenerData(symbol);
  console.log('Result:', JSON.stringify(data, null, 2));
}

test();
