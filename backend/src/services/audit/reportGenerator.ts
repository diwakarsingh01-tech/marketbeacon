import { AuditReport, AuditCheck, AuditChange } from './types.js';
import fs from 'fs';
import path from 'path';

const AUDIT_DIR = path.resolve(process.cwd(), 'audit_reports');

export function generateMarkdownReport(report: AuditReport): string {
  const s = report.summary;
  const lines: string[] = [];

  lines.push(`# 🛡️ Nightly Audit Report — ${report.date}`);
  lines.push('');
  lines.push('## 📊 Executive Summary');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Status | ${report.status === 'SAFE' ? '✅ SAFE' : report.status === 'WARNING' ? '⚠️ WARNING' : '❌ CRITICAL'} |`);
  lines.push(`| Checks Run | ${s.totalChecks} |`);
  lines.push(`| Passed | ${s.passedChecks} |`);
  lines.push(`| Failed | ${s.failedChecks} |`);
  lines.push(`| Auto-Fixed | ${s.autoFixed} |`);
  lines.push(`| Manual Required | ${s.manualRequired} |`);
  lines.push(`| New Entries | ${s.entries.length} |`);
  lines.push(`| Exits | ${s.exits.length} |`);
  lines.push(`| Started | ${report.startedAt} |`);
  lines.push(`| Completed | ${report.completedAt} |`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Critical issues
  const critical = report.checks.filter(c => c.severity === 'critical' && c.status !== 'pass');
  if (critical.length > 0) {
    lines.push('## 🔴 Critical Issues');
    for (const c of critical) {
      lines.push(`- **${c.id}**: ${c.name} — ${c.details}`);
    }
    lines.push('');
  }

  // High issues
  const high = report.checks.filter(c => c.severity === 'high' && c.status !== 'pass');
  if (high.length > 0) {
    lines.push('## 🟠 High Issues');
    for (const c of high) {
      lines.push(`- **${c.id}**: ${c.name} — ${c.details}`);
    }
    lines.push('');
  }

  // Changes detected
  if (report.changes.length > 0) {
    lines.push('## 🔄 Changes Detected');
    lines.push('');

    const entries = report.changes.filter(c => c.type === 'ENTRY');
    if (entries.length > 0) {
      lines.push('### 🟢 New Entries');
      lines.push('| Symbol | Strategy | Basket | Entry | Target | Reason |');
      lines.push('|--------|----------|--------|-------|--------|--------|');
      for (const e of entries) {
        lines.push(`| ${e.symbol} | ${e.strategy} | ${e.basket} | ₹${e.newEntry || '—'} | ₹${e.newTarget || '—'} | ${e.reason} |`);
      }
      lines.push('');
    }

    const exits = report.changes.filter(c => c.type === 'EXIT');
    if (exits.length > 0) {
      lines.push('### 🔴 Exits');
      lines.push('| Symbol | Strategy | Basket | Prev Entry | Prev Target | Reason |');
      lines.push('|--------|----------|--------|------------|-------------|--------|');
      for (const e of exits) {
        lines.push(`| ${e.symbol} | ${e.strategy} | ${e.basket} | ₹${e.oldEntry || '—'} | ₹${e.oldTarget || '—'} | ${e.reason} |`);
      }
      lines.push('');
    }

    // Strategy counts
    if (s.strategyCounts.length > 0) {
      lines.push('### 📊 Strategy Active Counts');
      lines.push('| Strategy | Count | Δ |');
      lines.push('|----------|-------|----|');
      for (const sc of s.strategyCounts) {
        const deltaStr = sc.delta > 0 ? `↑ +${sc.delta}` : sc.delta < 0 ? `↓ ${sc.delta}` : '→';
        lines.push(`| ${sc.strategyName} | ${sc.count} | ${deltaStr} |`);
      }
      lines.push('');
    }
  }

  // Checks summary
  lines.push('## ✅ Check Results');
  lines.push('');
  const categories = ['structural', 'data_quality', 'strategy', 'basket'] as const;
  for (const cat of categories) {
    const catChecks = report.checks.filter(c => c.category === cat);
    if (catChecks.length === 0) continue;
    lines.push(`### ${cat.replace('_', ' ').toUpperCase()}`);
    lines.push('| ID | Check | Status | Details |');
    lines.push('|----|-------|--------|---------|');
    for (const c of catChecks) {
      const icon = c.status === 'pass' ? '✅' : c.status === 'fixed' ? '🔧' : c.status === 'skipped' ? '⏭️' : '❌';
      lines.push(`| ${c.id} | ${c.name} | ${icon} ${c.status} | ${c.details} |`);
    }
    lines.push('');
  }

  // Auto-fixes
  const fixed = report.checks.filter(c => c.autoFixed);
  if (fixed.length > 0) {
    lines.push('## ⚡ Auto-Fixes Applied');
    for (const c of fixed) {
      lines.push(`- **${c.id}**: ${c.name} — ${c.fixDetails || c.details}`);
    }
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push(`_Report generated: ${report.completedAt}_`);
  lines.push(`_Snapshots compared: ${report.snapshotsCompared.today} vs ${report.snapshotsCompared.yesterday}_`);
  lines.push('');

  return lines.join('\n');
}

export async function saveReport(report: AuditReport): Promise<string> {
  const date = report.date;

  // Save JSON
  const jsonPath = path.join(AUDIT_DIR, `${date}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // Save Markdown
  const md = generateMarkdownReport(report);
  const mdPath = path.join(AUDIT_DIR, `${date}.md`);
  fs.writeFileSync(mdPath, md);

  return mdPath;
}
