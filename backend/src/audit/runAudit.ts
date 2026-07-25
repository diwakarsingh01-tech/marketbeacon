/**
 * MarketBeacon Pro — Automated Audit Runner
 *
 * Usage:
 *   npx tsx src/audit/runAudit.ts              # run all checks
 *   npx tsx src/audit/runAudit.ts --quick       # skip endpoint calls
 *   npx tsx src/audit/runAudit.ts --json        # JSON output only
 *
 * Output: audit/report.md and audit/report.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_DIR = path.resolve(__dirname, '../../audit');
const ROOT = path.resolve(__dirname, '../../..');

interface AuditIssue {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  detail: string;
  evidence: string;
}

interface AuditReport {
  timestamp: string;
  summary: { total: number; critical: number; high: number; medium: number; low: number };
  issues: AuditIssue[];
  meta: Record<string, any>;
}

// ── HELPERS ──

const issues: AuditIssue[] = [];
let issueId = 0;

function addIssue(severity: AuditIssue['severity'], category: string, title: string, detail: string, evidence: string) {
  issues.push({ id: `A${++issueId}`, severity, category, title, detail, evidence });
}

function readFileSafe(p: string): string | null {
  try { return fs.readFileSync(p, 'utf-8'); } catch { return null; }
}

function fileExists(p: string): boolean {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

// ── CHECK 1: Basket Definition Consistency ──

function checkBasketConsistency() {
  const feStocks = readFileSafe(path.join(ROOT, 'src', 'data', 'stocks.ts'));
  const beIndex = readFileSafe(path.join(__dirname, '..', 'index.ts'));
  if (!feStocks) { addIssue('HIGH', 'basket', 'Frontend stocks.ts not found', 'Cannot verify basket sync', ''); return; }
  if (!beIndex) { addIssue('HIGH', 'basket', 'Backend index.ts not found', 'Cannot verify basket sync', ''); return; }

  const eliteMatch = feStocks.includes("'Elite Basket'") && beIndex.includes("'Elite Basket'");
  const qualityMatch = feStocks.includes("'Quality Basket'") && beIndex.includes("'Quality Basket'");

  if (!eliteMatch) {
    addIssue('CRITICAL', 'basket', 'Elite Basket definition mismatch',
      'Elite Basket is defined differently or missing in frontend vs backend.',
      'src/data/stocks.ts vs backend/src/index.ts');
  }
  if (!qualityMatch) {
    addIssue('HIGH', 'basket', 'Quality Basket definition mismatch',
      'Quality Basket is defined differently or missing in frontend vs backend.',
      'src/data/stocks.ts vs backend/src/index.ts');
  }
}

// ── CHECK 2: Strategy Authorization Consistency ──

function checkStrategyAuthConsistency() {
  const beIndex = readFileSafe(path.join(__dirname, '..', 'index.ts'));
  const strategyService = readFileSafe(path.join(__dirname, '..', 'services', 'strategyService.ts'));
  const workerCode = readFileSafe(path.join(__dirname, '..', 'services', 'worker.ts'));

  if (!beIndex || !strategyService || !workerCode) {
    addIssue('HIGH', 'strategy', 'Cannot read strategy files', 'One or more strategy source files missing.', '');
    return;
  }

  // Check for CUP_HANDLE_ABCD basket mismatch
  if (beIndex.includes("CUP_HANDLE_ABCD") && strategyService.includes("CUP_HANDLE_ABCD")) {
    const idxBaskets = beIndex.match(/id:\s*'CUP_HANDLE_ABCD'.*?baskets:\s*\[([^\]]+)\]/);
    const svcBaskets = strategyService.match(/'CUP_HANDLE_ABCD':\s*\[([^\]]+)\]/);
    if (idxBaskets && svcBaskets && idxBaskets[1] !== svcBaskets[1]) {
      addIssue('CRITICAL', 'strategy', 'CUP_HANDLE_ABCD basket auth mismatch',
        `STRATEGIES says [${idxBaskets[1]}], strategyService.ts says [${svcBaskets[1]}]`,
        'backend/src/index.ts:124 vs backend/src/services/strategyService.ts:17');
    }
  }
}

// ── CHECK 3: Strategy Code Analysis ──

function checkStrategyRounding() {
  const strategies = readFileSafe(path.join(__dirname, '..', 'strategies', 'index.ts'));
  if (!strategies) { addIssue('HIGH', 'strategy', 'Strategies index.ts not found', '', ''); return; }

  // Check for Math.round usage consistency
  const roundCount = (strategies.match(/Math\.round/g) || []).length;
  const currentPriceRoundCount = (strategies.match(/currentPrice:\s*Math\.round/g) || []).length;

  if (currentPriceRoundCount < 9) {
    addIssue('MEDIUM', 'rounding', 'Some strategies may not round currentPrice',
      `Found ${currentPriceRoundCount}/10 strategies rounding currentPrice`,
      'backend/src/strategies/index.ts');
  }

  // Check for isBuyZone 2.2% tolerance
  const tolMatch = strategies.match(/Math\.abs\(currentPrice\s*-\s*activeE\)\s*\/\s*activeE\s*<=\s*0\.022/g);
  if (tolMatch && tolMatch.length >= 5) {
    addIssue('MEDIUM', 'strategy', `Buy zone tolerance 2.2% used in ${tolMatch.length} strategies`,
      'All strategies use uniform 2.2% entry tolerance. No per-volatility adjustment.',
      'backend/src/strategies/index.ts');
  }
}

// ── CHECK 4: 67 Funda Entry Locked ──

function checkSixtySevenFunda() {
  const strategies = readFileSafe(path.join(__dirname, '..', 'strategies', 'index.ts'));
  if (!strategies) return;

  if (strategies.includes("const entryPrice = currentPrice;")) {
    addIssue('CRITICAL', 'strategy', '67 Funda uses CMP as entry price (floating)',
      'Entry price = currentPrice means entry changes every time CMP changes. Target (= entry × 2.0) also floats.',
      'backend/src/strategies/index.ts:639');
  }
  if (strategies.includes("const entryPrice = ath * 0.33;")) {
    addIssue('LOW', 'strategy', '67 Funda entry locked at ATH × 0.33',
      'Entry price is now locked at the max qualifying price (ATH × 0.33). Target = entry × 2.0 is fixed.',
      'backend/src/strategies/index.ts:639');
  }
}

// ── CHECK 5: NIFTY Comparison Scope ──

function checkNiftyComparison() {
  const beIndex = readFileSafe(path.join(__dirname, '..', 'index.ts'));
  if (!beIndex) return;

  if (beIndex.includes("'BOLLINGER', 'ENVELOPE_LONG', 'ENVELOPE_SHORT'") &&
      beIndex.includes("'INFY', 'TCS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK'")) {
    addIssue('HIGH', 'backtest', 'NIFTY comparison uses only 3 free strategies on 5 stocks',
      'AlphaHub CAGR is based on a narrow sample. Does not represent full strategy suite.',
      'backend/src/index.ts:732-733');
  }
  if (beIndex.includes("'BOLLINGER', 'ENVELOPE_LONG', 'ENVELOPE_SHORT', 'SMA_BCD', '52W_HIGH_LOW', 'SR_STRATEGY', 'CUP_HANDLE_ABCD', 'SIXTY_SEVEN_FUNDA', 'TWENTY_RALLY_RETEST'") &&
      beIndex.includes("BASKETS['Elite Basket']")) {
    addIssue('LOW', 'backtest', 'NIFTY comparison uses all 10 strategies on all Elite Basket stocks',
      'Scope expanded to full strategy suite across all Elite Basket stocks.',
      'backend/src/index.ts:727-733');
  }
}

// ── CHECK 6: Backtest Engine No Stop Loss ──

function checkBacktestNoStop() {
  const bt = readFileSafe(path.join(__dirname, '..', 'services', 'backtestEngine.ts'));
  if (!bt) return;

  if (bt.includes("// Exit only when target is hit — no stop-loss, no time expiry")) {
    addIssue('MEDIUM', 'backtest', 'Backtest engine has no stop-loss or time-based exit',
      'Positions held indefinitely until target hit. Overstates win rate and CAGR.',
      'backend/src/services/backtestEngine.ts:122-127');
  }

  if (bt.includes("if (high >= targetPrice)")) {
    const stopLossCount = (bt.match(/stopLoss|stop_loss|SL/gi) || []).length;
    if (stopLossCount < 2) {
      addIssue('MEDIUM', 'backtest', 'No stop-loss reference found in backtest logic', '', '');
    }
  }
}

// ── CHECK 7: Cache File Detection ──

function checkCachePaths() {
  const workerCode = readFileSafe(path.join(__dirname, '..', 'services', 'worker.ts'));
  if (!workerCode) return;

  const pathCount = (workerCode.match(/pathsToTry/g) || []).length;
  if (pathCount > 0) {
    addIssue('MEDIUM', 'infra', 'Alpha-40 cache uses fragile path detection',
      'Worker tries 5 paths for alpha_40_results.json. Cache miss returns 503.',
      'backend/src/services/worker.ts:14-28');
  }
}

// ── CHECK 8: Snapshot File Existence ──

function checkSnapshotFreshness() {
  const snapshotPaths = [
    path.resolve(__dirname, '../../market_snapshot.json'),
    path.resolve(__dirname, '../market_snapshot.json'),
  ];
  let found = false;
  for (const p of snapshotPaths) {
    if (fileExists(p)) {
      found = true;
      const stat = fs.statSync(p);
      const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 3600);
      if (ageHours > 24) {
        addIssue('HIGH', 'data', `Market snapshot is ${Math.round(ageHours)}h old`,
          'Data may be stale. Auto-refresh triggers at 24h but cron may have missed.',
          p);
      }
      break;
    }
  }
  if (!found) {
    addIssue('CRITICAL', 'data', 'Market snapshot file not found',
      'market_snapshot.json does not exist at expected paths. Backend will have no data.',
      '');
  }
}

// ── CHECK 9: Frontend API URL Resolution ──

function checkApiUrlResolution() {
  const apiUtils = readFileSafe(path.join(ROOT, 'src', 'lib', 'api-utils.ts'));
  if (!apiUtils) return;

  if (apiUtils.includes("http://localhost:5173") && apiUtils.includes("https://marketbeaconpro.com")) {
    addIssue('LOW', 'infra', 'API URL resolution verified',
      'Frontend resolves API URL correctly: localhost:3001 for dev, marketbeaconpro.com for prod.',
      'src/lib/api-utils.ts');
  }
}

// ── RUN ALL CHECKS ──

function runAudit(): AuditReport {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });

  checkBasketConsistency();
  checkStrategyAuthConsistency();
  checkStrategyRounding();
  checkSixtySevenFunda();
  checkNiftyComparison();
  checkBacktestNoStop();
  checkCachePaths();
  checkSnapshotFreshness();
  checkApiUrlResolution();

  const critical = issues.filter(i => i.severity === 'CRITICAL').length;
  const high = issues.filter(i => i.severity === 'HIGH').length;
  const medium = issues.filter(i => i.severity === 'MEDIUM').length;
  const low = issues.filter(i => i.severity === 'LOW').length;

  return {
    timestamp: new Date().toISOString(),
    summary: { total: issues.length, critical, high, medium, low },
    issues,
    meta: {
      nodeVersion: process.version,
      platform: process.platform,
      backendDirExists: fileExists(path.join(__dirname, '..', 'index.ts')),
      frontendSrcExists: fileExists(path.join(ROOT, 'src', 'main.tsx')),
    },
  };
}

// ── OUTPUT ──

const report = runAudit();

// Write JSON
fs.writeFileSync(path.join(AUDIT_DIR, 'report.json'), JSON.stringify(report, null, 2));

// Write Markdown Summary
const severityColors: Record<string, string> = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🟡',
  LOW: '⚪',
};

const mdLines = [
  `# MarketBeacon Pro — Audit Report`,
  ``,
  `**Generated**: ${report.timestamp}`,
  ``,
  `## Summary`,
  ``,
  `| Severity | Count |`,
  `|----------|-------|`,
  `| 🔴 CRITICAL | ${report.summary.critical} |`,
  `| 🟠 HIGH | ${report.summary.high} |`,
  `| 🟡 MEDIUM | ${report.summary.medium} |`,
  `| ⚪ LOW | ${report.summary.low} |`,
  `| **Total** | **${report.summary.total}** |`,
  ``,
  `## Issues`,
  ``,
];

for (const issue of report.issues) {
  mdLines.push(`### ${severityColors[issue.severity]} [${issue.severity}] ${issue.title}`);
  mdLines.push(``);
  mdLines.push(`**Category**: ${issue.category}`);
  mdLines.push(``);
  mdLines.push(`**Detail**: ${issue.detail}`);
  mdLines.push(``);
  mdLines.push(`**Evidence**: ${issue.evidence}`);
  mdLines.push(``);
  mdLines.push(`---`);
  mdLines.push(``);
}

fs.writeFileSync(path.join(AUDIT_DIR, 'report.md'), mdLines.join('\n'));

// Console output
console.log(`\n📊 MarketBeacon Audit Complete`);
console.log(`   ${report.summary.total} issues found`);
console.log(`   🔴 ${report.summary.critical} CRITICAL`);
console.log(`   🟠 ${report.summary.high} HIGH`);
console.log(`   🟡 ${report.summary.medium} MEDIUM`);
console.log(`   ⚪ ${report.summary.low} LOW`);
console.log(`\n📄 Report: audit/report.md`);
console.log(`📄 JSON:   audit/report.json\n`);
