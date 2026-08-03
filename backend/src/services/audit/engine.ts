import { AuditReport, AuditCheck, AuditSummary, AuditChange } from './types.js';
import { runStructuralChecks } from './structural.js';
import { runDataQualityChecks } from './dataQuality.js';
import { runSnapshotDataQualityChecks } from './snapshotDataQuality.js';
import { runStrategyChecks } from './strategyAudit.js';
import { runBasketChecks, saveTodaySnapshot } from './basketAudit.js';
import { detectChanges, computeStrategyDeltas } from './changeDetector.js';
import { attemptAutoFix } from './fixEngine.js';
import { generateMarkdownReport, saveReport } from './reportGenerator.js';
import { sendTelegramMessage } from '../telegramNotifier.js';
import fs from 'fs';
import path from 'path';

const SNAPSHOTS_DIR = path.resolve(process.cwd(), 'audit_reports', 'snapshots');

export async function runAuditEngine(baskets?: Record<string, string[]>): Promise<AuditReport> {
  const startedAt = new Date().toISOString();
  const date = new Date().toISOString().split('T')[0];
  console.log(`\n🛡️ [AUDIT ENGINE] Starting nightly audit for ${date}...`);

  const BASKETS = baskets || {};

  const allChecks: AuditCheck[] = [];
  const allChanges: AuditChange[] = [];
  let autoFixedCount = 0;

  // Step 1: Structural checks
  console.log(`[AUDIT] Step 1/6: Structural checks...`);
  const structural = await runStructuralChecks();
  allChecks.push(...structural);

  // Step 2: Data quality checks
  console.log(`[AUDIT] Step 2/6: Data quality checks...`);
  const quality = await runDataQualityChecks();
  allChecks.push(...quality);
  const snapshotQuality = await runSnapshotDataQualityChecks(BASKETS);
  allChecks.push(...snapshotQuality);

  // Step 3: Strategy checks
  console.log(`[AUDIT] Step 3/6: Strategy logic checks...`);
  const strategy = await runStrategyChecks();
  allChecks.push(...strategy);

  // Step 4: Basket checks
  console.log(`[AUDIT] Step 4/6: Basket membership checks...`);
  const basket = await runBasketChecks(BASKETS);
  allChecks.push(...basket);

  // Step 5: Auto-fix failed checks
  console.log(`[AUDIT] Step 5/6: Attempting auto-fixes...`);
  for (const check of allChecks) {
    if (check.status !== 'fail' || !check.autoFixable) continue;
    const result = await attemptAutoFix(check);
    if (result.fixed) {
      check.status = 'fixed';
      check.autoFixed = true;
      check.fixDetails = 'Auto-fix applied successfully';
      autoFixedCount++;
    }
  }

  // Step 6: Take today's snapshot and detect changes
  console.log(`[AUDIT] Step 6/6: Snapshot & change detection...`);
  const todaySnapshot = await saveTodaySnapshot(BASKETS);

  // Load yesterday's snapshot for strategy deltas
  const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let yesterdaySnapshot = null;
  try {
    const yesterdayPath = path.join(SNAPSHOTS_DIR, `${yesterdayDate}.json`);
    if (fs.existsSync(yesterdayPath)) {
      yesterdaySnapshot = JSON.parse(fs.readFileSync(yesterdayPath, 'utf-8'));
    }
  } catch {}

  const changes = await detectChanges(todaySnapshot);
  allChanges.push(...changes);
  const strategyCounts = computeStrategyDeltas(todaySnapshot, yesterdaySnapshot);

  // Compile summary
  const entries = changes.filter(c => c.type === 'ENTRY');
  const exits = changes.filter(c => c.type === 'EXIT');
  const total = allChecks.length;
  const passed = allChecks.filter(c => c.status === 'pass' || c.status === 'fixed').length;
  const failed = allChecks.filter(c => c.status === 'fail').length;
  const manual = allChecks.filter(c => c.status === 'fail' && !c.autoFixable).length;

  const hasCritical = allChecks.some(c => c.severity === 'critical' && c.status === 'fail');
  const hasHigh = allChecks.some(c => c.severity === 'high' && c.status === 'fail');

  const summary: AuditSummary = {
    totalChecks: total,
    passedChecks: passed,
    failedChecks: failed,
    autoFixed: autoFixedCount,
    manualRequired: manual,
    entries,
    exits,
    strategyCounts,
    status: hasCritical ? 'CRITICAL' : hasHigh ? 'WARNING' : 'SAFE'
  };

  const completedAt = new Date().toISOString();

  const report: AuditReport = {
    date,
    startedAt,
    completedAt,
    status: summary.status,
    summary,
    checks: allChecks,
    changes: allChanges,
    snapshotsCompared: { today: date, yesterday: yesterdayDate },
    raw: {}
  };

  // Save report
  const reportPath = await saveReport(report);
  console.log(`[AUDIT] Report saved: ${reportPath}`);

  // Send Telegram notification
  const failedChecks = allChecks.filter(c => c.status === 'fail');
  const dqFails = failedChecks.filter(c => c.category === 'data_quality');
  let dqBlock = '';
  if (dqFails.length > 0) {
    const lines = dqFails.slice(0, 8).map(c => {
      const detail = c.details.length > 90 ? c.details.slice(0, 87) + '…' : c.details;
      return `• ${c.id} ${c.name}: ${detail}`;
    }).join('\n');
    dqBlock = `\n📦 *Data quality (${dqFails.length} fail):*\n${lines}`;
  }
  const shortSummary = [
    `🛡️ *Audit Complete* — ${date}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `${summary.status === 'SAFE' ? '✅' : summary.status === 'WARNING' ? '⚠️' : '❌'} *Status:* ${summary.status}`,
    `📊 *${total} checks:* ${passed} pass | ${failed} fail | ${autoFixedCount} auto-fixed`,
    ``,
    `🟢 *Entries (${entries.length}):* ${entries.map(e => e.symbol).join(', ') || 'none'}`,
    `🔴 *Exits (${exits.length}):* ${exits.map(e => e.symbol).join(', ') || 'none'}`,
    `⚠️ *Manual review:* ${manual}`,
    dqBlock,
    ``,
    `📎 Report: https://marketbeaconpro.com/admin/audit/${date}`
  ].filter(line => line !== '').join('\n');
  const tgOk = await sendTelegramMessage(shortSummary, 'dm').catch(() => false);
  if (!tgOk) {
    // Notification-pipeline failure is itself an audit finding: surface it in the
    // report (TG-1) so the admin sees the alert channel is broken instead of the
    // failure living only in the server logs.
    allChecks.push({
      id: 'TG-1', category: 'notification', name: 'Telegram admin alert delivered', severity: 'high',
      status: 'fail',
      details: 'Telegram send failed — check TELEGRAM_CHAT_ID / TELEGRAM_CHANNEL in .env',
      autoFixable: false, autoFixed: false
    });
    summary.totalChecks += 1;
    summary.failedChecks += 1;
    summary.manualRequired += 1;
    if (!hasHigh && !hasCritical) summary.status = 'WARNING';
    report.checks = allChecks;
    await saveReport(report);
    console.log('❌ [AUDIT] TG-1: Telegram alert delivery failed — flagged in report.');
  }

  console.log(`✅ [AUDIT ENGINE] Complete. Status: ${summary.status}`);
  return report;
}
