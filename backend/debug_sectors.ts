import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

async function debugSectors() {
  const symbols = ['TCS.NS', 'HDFCBANK.NS', 'RELIANCE.NS', 'AKZOINDIA.BO', 'NIFTYBEES.NS'];
  for (const s of symbols) {
    try {
      // quote might not have sector, but summaryProfile or other modules might
      const result = await yahooFinance.quoteSummary(s, { modules: ["assetProfile", "quoteType"] });
      console.log(`--- ${s} ---`);
      console.log(`Sector: ${result?.assetProfile?.sector}`);
      console.log(`Industry: ${result?.assetProfile?.industry}`);
      console.log(`Quote Type: ${result?.quoteType?.quoteType}`);
    } catch (e) {
      console.error(`Error for ${s}: ${e.message}`);
    }
  }
}

debugSectors();
