import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function test() {
  try {
    const symbol = 'AKZOINDIA.NS';
    const quote = await yahooFinance.quote(symbol);
    console.log(`Symbol: ${symbol}`);
    console.log(`Price: ${quote.regularMarketPrice}`);
    console.log(`MarketCap: ${quote.marketCap}`);
  } catch (e) {
    console.error(`Error for AKZOINDIA.NS: ${e.message}`);
  }

  try {
    const symbol = 'AKZOINDIA.BO';
    const quote = await yahooFinance.quote(symbol);
    console.log(`Symbol: ${symbol}`);
    console.log(`Price: ${quote.regularMarketPrice}`);
    console.log(`MarketCap: ${quote.marketCap}`);
  } catch (e) {
    console.error(`Error for AKZOINDIA.BO: ${e.message}`);
  }
}

test();
