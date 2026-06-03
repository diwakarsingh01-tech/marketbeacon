import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchScreenerData, updateMarketSnapshot } from './screener.js';
import { validateBatch9 } from './services/fundamentalAudit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawList = [
  "PAISALO", "PNBHOUSING", "GRINDWELL", "FINCABLES", "CERA", "ASIANPAINT", "COLPAL", "KANSAINER", 
  "WHIRLPOOL", "BAJAJHIND", "VAIBHAVGBL", "SYNGENE", "BALKRISIND", "HAVELLS", "WIPRO", "HDFCBANK", 
  "PGHH", "DABUR", "AAVAS", "HCLTECH", "SUNTV", "INFY", "ARE&M", "TCS", "ABB", "CLEAN", "IEX", "SANOFI", 
  "LUXIND", "JYOTHYLAB", "DOLATALGO", "KPITTECH", "SYMPHONY", "BATAINDIA", "ROUTE", "TTKPRESTIG", 
  "ACC", "POLYMED", "SONATSOFTW", "MANYAVAR", "HAPPSTMNDS", "AWL", "DVL", "TANLA", "PRINCEPIPE", 
  "DEN", "PIDILITIND", "RELAXO", "SFL", "INDIGOPNTS", "TCIEXP", "SULA", "RAJESHEXPO"
];

async function runFinalAudit() {
  console.log('🛡️ FINAL INSTITUTIONAL AUDIT: 53 ASSET MATRIX\n');
  const results = [];

  for (const sym of rawList) {
    let data = await fetchScreenerData(sym);
    if (!data) {
        // Fallback for names that might be tricky
        const altMap = { "MANYAVAR": "VEDANTFASH", "ARE&M": "AMARAJABAT", "AWL": "AWL" };
        if (altMap[sym]) data = await fetchScreenerData(altMap[sym]);
    }

    if (!data) {
      results.push({ sym, score: 'ERR', status: 'SCRAPE_FAIL', sm: 0 });
      continue;
    }

    const audit = await validateBatch9(sym, { screener: data }, 'ALL');
    results.push({
      sym,
      score: audit.score,
      status: audit.isPass ? '🟢 QUALIFIED' : '🔴 REJECTED',
      sm: audit.smartMoneyTotal,
      reason: audit.reason || '-'
    });
  }

  const sorted = results.sort((a, b) => (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0));

  console.log('| Symbol | Score | Status | 🏗️ Smart Money | Key Audit Result |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');
  sorted.forEach(r => {
    console.log(`| ${r.sym} | ${r.score} | ${r.status} | ${typeof r.sm === 'number' ? r.sm.toFixed(1) + '%' : '-'} | ${r.reason} |`);
  });
}

runFinalAudit();
