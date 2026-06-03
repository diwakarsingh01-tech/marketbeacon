import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const snapshotPath = path.join(__dirname, '../market_snapshot.json');
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

// Import the audit service logic
import { validateBatch9 } from './services/fundamentalAudit.js';

const stockList = [
  "PAISALO", "PNBHOUSING", "GRINDWELL", "FINCABLES", "CERA", "ASIANPAINT", "COLPAL", "KANSAINER", 
  "WHIRLPOOL", "BAJAJHIND", "VAIBHAVGBL", "SYNGENE", "BALKRISIND", "HAVELLS", "WIPRO", "HDFCBANK", 
  "PGHH", "DABUR", "AAVAS", "HCLTECH", "SUNTV", "INFY", "ARE&M", "TCS", "CLEAN", "IEX", "SANOFI", 
  "LUXIND", "JYOTHYLAB", "DOLATALGO", "KPITTECH", "SYMPHONY", "BATAINDIA", "ROUTE", "TTKPRESTIG", 
  "ACC", "POLYMED", "SONATSOFTW", "MANYAVAR", "HAPPSTMNDS", "AWL", "DVL", "TANLA", "PRINCEPIPE", 
  "DEN", "PIDILITIND", "RELAXO", "SFL", "INDIGOPNTS", "TCIEXP", "SULA", "RAJESHEXPO"
];

async function runMasterAudit() {
  console.log('🛡️ MASTER INSTITUTIONAL BATCH AUDIT (52 ASSETS)\n');
  const results = [];

  for (const sym of stockList) {
    const snap = snapshot[sym] || snapshot[`${sym}.NS`];
    if (!snap) {
      results.push({ sym, score: 'N/A', status: 'NOT IN CACHE', reason: 'Data pending refresh' });
      continue;
    }

    try {
      const audit = await validateBatch9(sym, snap, 'ALL');
      results.push({
        sym,
        score: audit.score,
        status: audit.isPass ? '🟢 QUALIFIED' : '🔴 REJECTED',
        sm: audit.smartMoneyTotal,
        reason: audit.reason || '-'
      });
    } catch (e) {
      results.push({ sym, score: 'ERR', status: 'ERROR', reason: 'Audit engine fail' });
    }
  }

  // Sort by Score
  const sorted = results.sort((a, b) => (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0));

  console.log('| Symbol | Score | Status | Smart Money | Key Reason |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');
  sorted.forEach(r => {
    console.log(`| ${r.sym} | ${r.score} | ${r.status} | ${typeof r.sm === 'number' ? r.sm.toFixed(1) + '%' : '-'} | ${r.reason} |`);
  });
}

runMasterAudit();
