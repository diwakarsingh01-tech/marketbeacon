
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculate52WeekStrategy } from './strategies/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKET_SNAPSHOT_PATH = path.join(__dirname, '../market_snapshot.json');

async function audit52Week() {
  console.log('🛡️ STRATEGY #6 AUDIT: 52-WEEK HIGH/LOW MATRIX\n');

  if (!fs.existsSync(MARKET_SNAPSHOT_PATH)) {
    console.error('❌ Snapshot not found.');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(MARKET_SNAPSHOT_PATH, 'utf8'));
  const results = [];

  for (const [sym, snap] of Object.entries(snapshot)) {
    if (!snap || !snap.quotes || snap.quotes.length < 300) continue;

    const result = calculate52WeekStrategy(snap.quotes);
    if (result && result.isBuyZone) {
      results.push({
        sym,
        triggerDate: result.triggerDate,
        tranche: result.tranche,
        entry: result.entryPrice,
        current: result.currentPrice,
        target: result.target,
        upside: (((result.target / result.currentPrice) - 1) * 100).toFixed(1) + '%'
      });
    }
  }

  // Sort by upside
  results.sort((a, b) => parseFloat(b.upside) - parseFloat(a.upside));

  console.log('| Symbol | Trigger Date | Tranche | Entry | CMP | Target | Est. Upside |');
  console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
  results.forEach(r => {
    console.log(`| ${r.sym} | ${r.triggerDate} | ${r.tranche} | ${r.entry} | ${r.current} | ${r.target} | ${r.upside} |`);
  });

  console.log(`\nTotal Strategy #6 Signals: ${results.length}`);
}

audit52Week();
