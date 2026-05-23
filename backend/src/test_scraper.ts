import { fetchScreenerData } from './screener.js';

async function test() {
  const symbols = ['TCS', 'HDFCBANK', 'RELIANCE'];
  for (const symbol of symbols) {
    console.log(`--- Testing ${symbol} ---`);
    const data = await fetchScreenerData(symbol);
    if (data) {
      console.log(`PE Ratio: ${data.peRatio}`);
      console.log(`PE Medians:`, data.peMedians);
      console.log(`Shareholding:`, data.shareholding);
    } else {
      console.log(`Failed to fetch data for ${symbol}`);
    }
  }
}

test();
