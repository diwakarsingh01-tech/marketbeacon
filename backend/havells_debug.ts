// @ts-nocheck
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function havellsDebug() {
  const symbol = 'HAVELLS.NS';
  try {
    const result = await yahooFinance.quoteSummary(symbol, { 
      modules: [
        "summaryDetail", 
        "defaultKeyStatistics", 
        "financialData", 
        "majorHoldersBreakdown",
        "incomeStatementHistory",
        "balanceSheetHistory",
        "cashflowStatementHistory"
      ] 
    });
    console.log(`--- ${symbol} Raw Data ---`);
    console.log('Summary:', JSON.stringify(result.summaryDetail, null, 2));
    console.log('Stats:', JSON.stringify(result.defaultKeyStatistics, null, 2));
    console.log('Financials:', JSON.stringify(result.financialData, null, 2));
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

havellsDebug();
