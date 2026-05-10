// @ts-nocheck
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function deepDebug() {
  const symbol = 'HDFCBANK.NS';
  try {
    const result = await yahooFinance.quoteSummary(symbol, { 
      modules: [
        "summaryDetail", 
        "defaultKeyStatistics", 
        "financialData", 
        "majorHoldersBreakdown",
        "earningsHistory"
      ] 
    });
    console.log(`--- ${symbol} Deep Metrics ---`);
    console.log('Statistics:', JSON.stringify(result.defaultKeyStatistics, null, 2));
    console.log('Holders:', JSON.stringify(result.majorHoldersBreakdown, null, 2));
    console.log('Financials:', JSON.stringify(result.financialData, null, 2));
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

deepDebug();
