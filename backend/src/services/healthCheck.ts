import { getMarketSnapshot } from '../screener.js';
import { validateBatch9 } from './fundamentalAudit.js';
import { runStrategyAnalysis } from './strategyService.js';
import { getAlpha40Cache } from './worker.js';
import { supabase } from '../db.js';
import { getDB } from '../db.js';
import { notifyAdmins } from './notificationService.js';

interface HealthResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  detail: string;
  durationMs: number;
}

type CheckResult = { status: 'pass' | 'fail' | 'warn'; detail: string };

async function measure(results: HealthResult[], name: string, fn: () => Promise<CheckResult>): Promise<void> {
  const start = Date.now();
  try {
    const r = await fn();
    results.push({ name, ...r, durationMs: Date.now() - start });
  } catch (e: any) {
    results.push({ name, status: 'fail', detail: e.message, durationMs: Date.now() - start });
  }
}

export async function runHealthCheck(): Promise<{ results: HealthResult[]; passed: boolean; timestamp: string }> {
  const results: HealthResult[] = [];

  // ── Phase 1: Infrastructure checks (parallel) ─────────────────────────
  await Promise.all([
    measure(results, 'SQLite/Turso Database', async () => {
      const db = getDB();
      const row: any = await db.get('SELECT 1 as ok');
      if (row?.ok === 1) return { status: 'pass', detail: 'Connected' };
      return { status: 'fail', detail: 'SELECT 1 returned unexpected' };
    }),
    measure(results, 'Supabase', async () => {
      if (supabase) {
        const { error } = await supabase.from('system_cache').select('key').limit(1);
        if (error) return { status: 'warn', detail: `Connected but query error: ${error.message}` };
        return { status: 'pass', detail: 'Connected' };
      }
      return { status: 'warn', detail: 'Not configured (SUPABASE_URL/KEY missing)' };
    }),
    measure(results, 'Market Snapshot', async () => {
      const snap = getMarketSnapshot();
      const symbols = Object.keys(snap);
      if (symbols.length === 0) return { status: 'fail', detail: 'Snapshot is empty — no symbols loaded' };
      const sample = symbols[0];
      const hasQuotes = snap[sample]?.quotes?.length > 0;
      if (!hasQuotes) return { status: 'fail', detail: `${symbols.length} symbols loaded but sample ${sample} has no quotes` };
      return { status: 'pass', detail: `${symbols.length} symbols loaded, sample ${sample} has ${snap[sample].quotes.length} bars` };
    }),
  ]);

  // ── Phase 2: Strategy checks (all in parallel) ────────────────────────
  {
    const snap = getMarketSnapshot();
    const symbols = Object.keys(snap);
    const strategyIds = ['ENVELOPE_LONG', 'ENVELOPE_SHORT', 'BOLLINGER', '52W_HIGH_LOW', 'SMA_BCD', 'CUP_HANDLE_ABCD', 'SR_STRATEGY', 'TWENTY_RALLY_RETEST', 'SIXTY_SEVEN_FUNDA'];
    await Promise.all(strategyIds.map(stratId =>
      measure(results, `Strategy: ${stratId}`, async () => {
        const sampleSymbol = symbols.find(s => snap[s]?.quotes?.length > 400) || symbols[0];
        const result = await runStrategyAnalysis(stratId, snap[sampleSymbol], snap[sampleSymbol]?.quote?.marketCap || 1, 'Elite Basket');
        if (result === null || result === undefined) return { status: 'warn', detail: `Returned null/undefined for ${sampleSymbol}` };
        if (typeof result.isBuyZone !== 'boolean') return { status: 'warn', detail: `Missing isBuyZone field for ${sampleSymbol}` };
        return { status: 'pass', detail: `isBuyZone=${result.isBuyZone} for ${sampleSymbol}` };
      })
    ));
  }

  // ── Phase 3: Audit checks (all in parallel) ───────────────────────────
  {
    const snap = getMarketSnapshot();
    const allSymbols = Object.keys(snap).filter(s => snap[s]?.quotes?.length > 200);
    await Promise.all(['Large Cap', 'Mid Cap', 'Small Cap'].map(label =>
      measure(results, `Audit: ${label}`, async () => {
        const sample = allSymbols.slice(0, 50)[Math.floor(Math.random() * 50)] || allSymbols[0];
        if (!sample) return { status: 'warn', detail: 'No symbols available' };
        const audit = await validateBatch9(sample, snap[sample], 'Growth Basket');
        if (!audit || typeof audit.isPass !== 'boolean') return { status: 'fail', detail: `validateBatch9 returned invalid for ${sample}` };
        return { status: 'pass', detail: `${sample} isPass=${audit.isPass} score=${audit.score || '?'}` };
      })
    ));
  }

  // ── Phase 4: Data quality checks (parallel) ───────────────────────────
  await Promise.all([
    measure(results, 'Alpha-40 Cache', async () => {
      const cache = await getAlpha40Cache();
      if (!cache) return { status: 'warn', detail: 'Cache is null/empty — may need recalculation' };
      const activeCount = cache.active?.length || 0;
      const capStats = cache.capStats || {};
      return { status: 'pass', detail: `${activeCount} active signals (L:${capStats.LARGE || 0} M:${capStats.MID || 0} S:${capStats.SMALL || 0})` };
    }),
    measure(results, 'Key Symbol Coverage', async () => {
      const snap = getMarketSnapshot();
      const keySymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'LT', 'WIPRO'];
      const present = keySymbols.filter(s => snap[s]?.quotes?.length > 0);
      const pct = Math.round((present.length / keySymbols.length) * 100);
      if (pct < 80) return { status: 'warn', detail: `${present.length}/${keySymbols.length} key symbols have data (${pct}%)` };
      return { status: 'pass', detail: `${present.length}/${keySymbols.length} key symbols have data` };
    }),
    measure(results, 'Data Freshness', async () => {
      const snap = getMarketSnapshot();
      const timestamps = Object.values(snap)
        .map((s: any) => {
          const val = s?.quote?.regularMarketTime;
          if (!val) return null;
          const date = new Date(typeof val === 'number' && val < 10000000000 ? val * 1000 : val);
          return isNaN(date.getTime()) ? null : date.getTime();
        })
        .filter((t): t is number => t !== null);

      if (timestamps.length === 0) return { status: 'warn', detail: 'No valid timestamps found in snapshot' };
      const latest = Math.max(...timestamps) / 1000;
      const ageHours = (Date.now() / 1000 - latest) / 3600;
      if (ageHours > 24) return { status: 'warn', detail: `Oldest data ${Math.round(ageHours)}h old` };
      return { status: 'pass', detail: `Latest data ${Math.round(ageHours * 10) / 10}h old` };
    }),
  ]);

  const passed = results.every(r => r.status !== 'fail');
  return { results, passed, timestamp: new Date().toISOString() };
}

let lastNotificationHash = '';

function notificationHash(title: string, message: string): string {
  let hash = 0;
  const str = title + message;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return String(hash);
}

function shouldNotify(title: string, message: string): boolean {
  const hash = notificationHash(title, message);
  if (hash === lastNotificationHash) return false;
  lastNotificationHash = hash;
  return true;
}

export async function runAndNotifyHealthCheck() {
  try {
    const report = await runHealthCheck();
    const fails = report.results.filter(r => r.status === 'fail');
    const warns = report.results.filter(r => r.status === 'warn');

    if (fails.length > 0) {
      const title = `System Health: ${fails.length} Failure(s)`;
      let message = `Health check failed at ${report.timestamp}\n`;
      for (const f of fails) {
        message += `FAIL: ${f.name} — ${f.detail}\n`;
      }
      if (warns.length > 0) {
        message += `\nWarnings (${warns.length}):\n`;
        for (const w of warns) {
          message += `WARN: ${w.name} — ${w.detail}\n`;
        }
      }
      if (shouldNotify(title, message)) await notifyAdmins(title, message, 'system');
    } else if (warns.length > 0) {
      const title = `System Health: Passed with ${warns.length} warning(s)`;
      let message = `Health check completed with warnings at ${report.timestamp}\n`;
      for (const w of warns) {
        message += `WARN: ${w.name} — ${w.detail}\n`;
      }
      if (shouldNotify(title, message)) await notifyAdmins(title, message, 'system');
    } else {
      const title = `System Health: All systems operational`;
      const message = `Health check passed at ${report.timestamp}\n${report.results.length} checks — all pass`;
      if (shouldNotify(title, message)) await notifyAdmins(title, message, 'system');
    }
  } catch (e: any) {
    const title = `System Health: Check crashed`;
    const message = `Health check threw an exception at ${new Date().toISOString()}: ${e.message}`;
    if (shouldNotify(title, message)) await notifyAdmins(title, message, 'system');
  }
}
