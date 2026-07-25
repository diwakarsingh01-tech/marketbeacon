/**
 * Daily Audit Runner — cron-compatible
 *
 * Runs all automated checks and writes report.
 * Designed to be called from cron or node-cron.
 *
 * Usage:
 *   npx tsx src/audit/dailyAudit.ts
 *   # or from cron:
 *   0 6 * * * cd /path/to/backend && npx tsx src/audit/dailyAudit.ts >> audit/daily.log 2>&1
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_DIR = path.resolve(__dirname, '../../audit');
const ROOT = path.resolve(__dirname, '../../..');

function run() {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(AUDIT_DIR, `daily-${timestamp}.log`);

  const start = Date.now();
  const result = { timestamp, startTime: start, status: 'running' };

  try {
    // Run the main audit
    const { execSync } = require('child_process');
    const output = execSync('npx tsx src/audit/runAudit.ts', {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf-8',
      timeout: 60000,
    });

    const elapsed = Date.now() - start;
    const report = JSON.parse(fs.readFileSync(path.join(AUDIT_DIR, 'report.json'), 'utf-8'));

    const log = [
      `=== Daily Audit ${new Date().toISOString()} ===`,
      `Duration: ${elapsed}ms`,
      `Issues: ${report.summary.total} (C:${report.summary.critical} H:${report.summary.high} M:${report.summary.medium} L:${report.summary.low})`,
      `---`,
      output,
      `=== End ===`,
    ].join('\n');

    fs.writeFileSync(logFile, log);
    console.log(`Daily audit complete. Log: ${logFile}`);
  } catch (err) {
    const errorLog = `=== Daily Audit FAILED ${new Date().toISOString()} ===\n${err}\n`;
    fs.writeFileSync(logFile, errorLog);
    console.error('Daily audit failed:', err);
  }
}

run();
