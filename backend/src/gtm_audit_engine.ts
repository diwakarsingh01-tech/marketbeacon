
import fs from 'fs';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { 
  calculateEnvelope, 
  processShortEnvelope, 
  calculateBollingerBand, 
  calculateSMAStacking, 
  calculate52WeekStrategy, 
  calculateSRStrategy, 
  calculateRHS, 
  calculateCupHandle, 
  calculateSixtySevenFunda, 
  calculateTwentyRallyRetest 
} from './strategies/index.js';

// --- DATA PATHS ---
const SNAPSHOT_PATH = './market_snapshot.json';
const STOCKS_DATA_PATH = '../../src/data/stocks.ts';

async function runMasterAudit() {
  console.log('🚀 GTM MASTER AUDIT: Initializing Institutional Grade Verification...');
  
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error('❌ FATAL: market_snapshot.json missing.');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const symbols = Object.keys(snapshot);
  
  console.log(`📂 Scanning Universe: ${symbols.length} Symbols identified.`);
  console.log('------------------------------------------------------------');

  const report: any[] = [];
  let totalQualified = 0;
  let totalAnomalies = 0;

  for (const sym of symbols) {
    const snap = snapshot[sym];
    if (!snap || !snap.screener || !snap.quote) continue;

    try {
      // 1. FUNDAMENTAL AUDIT
      const audit = await validateBatch9(sym, snap, 'Elite Basket');
      
      // 2. TECHNICAL AUDIT (10 Strategies)
      const strategies = [
        { id: 'ENVELOPE_LONG', res: calculateEnvelope(snap.quotes) },
        { id: 'ENVELOPE_SHORT', res: processShortEnvelope(snap.quotes) },
        { id: 'BOLLINGER', res: calculateBollingerBand(snap.quotes) },
        { id: 'SMA_BCD', res: calculateSMAStacking(snap.quotes) },
        { id: '52W_HIGH_LOW', res: calculate52WeekStrategy(snap.quotes) },
        { id: 'SR_STRATEGY', res: calculateSRStrategy(snap.quotes, snap.screener) },
        { id: 'RHS_ABCD', res: calculateRHS(snap.quotes) },
        { id: 'CUP_HANDLE_ABCD', res: calculateCupHandle(snap.quotes) },
        { id: 'SIXTY_SEVEN_FUNDA', res: calculateSixtySevenFunda(snap.quotes, snap.screener) },
        { id: 'TWENTY_RALLY_RETEST', res: calculateTwentyRallyRetest(snap.quotes) }
      ];

      const activeStrats = strategies.filter(s => s.res?.isBuyZone).map(s => s.id);
      
      // 3. ANOMALY DETECTION
      const hasAnomaly = activeStrats.length > 0 && !audit.isPass;
      if (hasAnomaly) totalAnomalies++;
      if (audit.isPass) totalQualified++;

      report.push({
        symbol: sym,
        score: audit.score,
        isPass: audit.isPass,
        reason: audit.reason,
        smartMoney: audit.smartMoneyTotal,
        activeStrategies: activeStrats,
        hasAnomaly
      });

    } catch (e: any) {
      console.error(`❌ Audit failed for ${sym}:`, e.message);
    }
  }

  // --- REPORT GENERATION ---
  console.log(`\n✅ Audit Complete.`);
  console.log(`📊 Total Audited: ${symbols.length}`);
  console.log(`🟢 Institutional Grade: ${totalQualified}`);
  console.log(`⚠️ Fundamental Mismatches: ${totalAnomalies}`);
  
  // Sort report: Anomalies first, then by score descending
  report.sort((a, b) => {
    if (a.hasAnomaly !== b.hasAnomaly) return a.hasAnomaly ? -1 : 1;
    return b.score - a.score;
  });

  let md = `# 🛡️ GTM Master Audit Report\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n`;
  md += `**Total Symbols:** ${symbols.length}\n`;
  md += `**Institutional Pass:** ${totalQualified}\n`;
  md += `**Anomalies Detected:** ${totalAnomalies}\n\n`;
  
  md += `## ⚠️ Critical Fundamental Anomalies\n`;
  md += `*Pattern exists but fundamentals are disqualified (Debt/Pledge/SM).* \n\n`;
  md += `| Symbol | Score | Reason | Active Patterns |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  
  const anomalies = report.filter(r => r.hasAnomaly);
  anomalies.slice(0, 50).forEach(r => {
    md += `| ${r.symbol} | ${r.score} | ${r.reason} | ${r.activeStrategies.join(', ')} |\n`;
  });

  md += `\n## 🟢 Top Institutional Grade Nodes (High Score)\n\n`;
  md += `| Symbol | Score | Smart Money | Active Patterns |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  
  const topPass = report.filter(r => r.isPass).slice(0, 50);
  topPass.forEach(r => {
    md += `| ${r.symbol} | ${r.score} | ${r.smartMoney.toFixed(1)}% | ${r.activeStrategies.join(', ') || 'Watchlist'} |\n`;
  });

  fs.writeFileSync('../GTM_AUDIT_REPORT.md', md);
  console.log(`\n📁 Full Report saved to: supertracker-replica/GTM_AUDIT_REPORT.md`);
}

runMasterAudit();
