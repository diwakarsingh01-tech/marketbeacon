import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function testFundamentals(symbol: string) {
  try {
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: ['financialData', 'defaultKeyStatistics']
      })
    ]);

    console.log(`--- Fundamentals for ${symbol} ---`);
    console.log('Market Cap (from quote):', quote.marketCap);
    console.log('Debt to Equity (Ratio):', summary.financialData?.debtToEquity);
    console.log('Return on Equity:', summary.financialData?.returnOnEquity);
    console.log('Net Income (Trailing):', summary.defaultKeyStatistics?.netIncomeToCommon);
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
  }
}

testFundamentals('TCS.NS');
