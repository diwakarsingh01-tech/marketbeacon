
import { getMarketSnapshot, initSnapshotCache } from './screener.js';
import { validateBatch9 } from './index.ts'; // This might not work directly due to exports, let's check index.ts

// Since validateBatch9 is not exported from index.ts, I'll replicate the logic or check snapshot
// Actually, let's just pull data from snapshot for these symbols and check their MCAP and Audit Score

async function auditList() {
  await initSnapshotCache();
  const snapshot = getMarketSnapshot();
  const symbols = [
    'SANOFI', 'BATAINDIA', 'WHIRLPOOL', 'TCS', 'HCLTECH', 
    'GLAXO', 'PGHH', 'GILLETTE', 'ITC', 'INFY', 
    'AMBUJACEM', 'BAJAJHLDNG', 'ICICIPRULI', 'HAVELLS', 'WIPRO',
    'BAJAJFINSV'
  ];

  console.log('Symbol | Market Cap (Cr) | Category | Audit Score');
  console.log('---|---|---|---');

  for (const sym of symbols) {
    const snap = snapshot[sym];
    if (!snap) {
      console.log(`${sym} | N/A | N/A | N/A`);
      continue;
    }
    const mcapCr = (snap.quote.marketCap || 0) / 10000000;
    let category = 'SMALL';
    if (mcapCr >= 20000) category = 'LARGE';
    else if (mcapCr >= 5000) category = 'MID';

    // We'll have to estimate audit score from snapshot strategies or screener data
    const pe = snap.screener?.peRatio || 0;
    const de = snap.screener?.netDebtToEquity || 0;
    const roe = snap.screener?.returnOnEquity || 0;
    
    console.log(`${sym} | ${mcapCr.toFixed(0)} | ${category} | TBD`);
  }
}

auditList();
