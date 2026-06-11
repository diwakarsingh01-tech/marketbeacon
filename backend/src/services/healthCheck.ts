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

async function time<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}

export async function runHealthCheck(): Promise<{ results: HealthResult[]; passed: boolean; timestamp: string }> {
  const results: HealthResult[] = [];

  // 1. Database connectivity
  {
    const { durationMs } = await time(async () => {
      try {
        const db = getDB();
        const row: any = await db.get('SELECT 1 as ok');
        if (row?.ok === 1) {
          results.push({ name: 'SQLite/Turso Database', status: 'pass', detail: 'Connected', durationMs });
        } else {
          results.push({ name: 'SQLite/Turso Database', status: 'fail', detail: 'SELECT 1 returned unexpected', durationMs });
        }
      } catch (e: any) {
        results.push({ name: 'SQLite/Turso Database', status: 'fail', detail: e.message, durationMs });
      }
    });
  }

  // 2. Supabase connectivity
  {
    const { durationMs } = await time(async () => {
      try {
        if (supabase) {
          const { error } = await supabase.from('system_cache').select('key').limit(1);
          if (error) {
            results.push({ name: 'Supabase', status: 'warn', detail: `Connected but query error: ${error.message}`, durationMs });
          } else {
            results.push({ name: 'Supabase', status: 'pass', detail: 'Connected', durationMs });
          }
        } else {
          results.push({ name: 'Supabase', status: 'warn', detail: 'Not configured (SUPABASE_URL/KEY missing)', durationMs });
        }
      } catch (e: any) {
        results.push({ name: 'Supabase', status: 'fail', detail: e.message, durationMs });
      }
    });
  }

  // 3. Snapshot data loaded
  {
    const { durationMs } = await time(async () => {
      try {
        const snap = getMarketSnapshot();
        const symbols = Object.keys(snap);
        if (symbols.length === 0) {
          results.push({ name: 'Market Snapshot', status: 'fail', detail: 'Snapshot is empty — no symbols loaded', durationMs });
          return;
        }
        const sample = symbols[0];
        const hasQuotes = snap[sample]?.quotes?.length > 0;
        if (!hasQuotes) {
          results.push({ name: 'Market Snapshot', status: 'fail', detail: `${symbols.length} symbols loaded but sample ${sample} has no quotes`, durationMs });
          return;
        }
        results.push({ name: 'Market Snapshot', status: 'pass', detail: `${symbols.length} symbols loaded, sample ${sample} has ${snap[sample].quotes.length} bars`, durationMs });
      } catch (e: any) {
        results.push({ name: 'Market Snapshot', status: 'fail', detail: e.message, durationMs });
      }
    });
  }

  // 4. All 10 strategy calculations
  {
    const snap = getMarketSnapshot();
    const symbols = Object.keys(snap);
    const strategyIds = ['ENVELOPE_LONG', 'ENVELOPE_SHORT', 'BOLLINGER', '52W_HIGH_LOW', 'SMA_BCD', 'RHS_ABCD', 'CUP_HANDLE_ABCD', 'SR_STRATEGY', 'TWENTY_RALLY_RETEST', 'SIXTY_SEVEN_FUNDA'];

    for (const stratId of strategyIds) {
      const { durationMs } = await time(async () => {
        try {
          const sampleSymbol = symbols.find(s => snap[s]?.quotes?.length > 400) || symbols[0];
          const result = runStrategyAnalysis(stratId, snap[sampleSymbol], snap[sampleSymbol]?.quote?.marketCap || 1, 'Elite Basket');
          if (result === null || result === undefined) {
            results.push({ name: `Strategy: ${stratId}`, status: 'warn', detail: `Returned null/undefined for ${sampleSymbol}`, durationMs });
          } else if (typeof result.isBuyZone !== 'boolean') {
            results.push({ name: `Strategy: ${stratId}`, status: 'warn', detail: `Missing isBuyZone field for ${sampleSymbol}`, durationMs });
          } else {
            results.push({ name: `Strategy: ${stratId}`, status: 'pass', detail: `isBuyZone=${result.isBuyZone} for ${sampleSymbol}`, durationMs });
          }
        } catch (e: any) {
          results.push({ name: `Strategy: ${stratId}`, status: 'fail', detail: e.message, durationMs });
        }
      });
    }
  }

  // 5. Fundamental audit on random sample from snapshot
  {
    const snap = getMarketSnapshot();
    const allSymbols = Object.keys(snap).filter(s => snap[s]?.quotes?.length > 200);
    for (const label of ['Large Cap', 'Mid Cap', 'Small Cap']) {
      const { durationMs } = await time(async () => {
        try {
          const sample = allSymbols.slice(0, 50)[Math.floor(Math.random() * 50)] || allSymbols[0];
          if (!sample) { results.push({ name: `Audit: ${label}`, status: 'warn', detail: 'No symbols available', durationMs }); return; }
          const audit = await validateBatch9(sample, snap[sample], 'Growth Basket');
          if (!audit || typeof audit.isPass !== 'boolean') {
            results.push({ name: `Audit: ${label}`, status: 'fail', detail: `validateBatch9 returned invalid for ${sample}`, durationMs });
          } else {
            results.push({ name: `Audit: ${label}`, status: 'pass', detail: `${sample} isPass=${audit.isPass} score=${audit.score||'?'}`, durationMs });
          }
        } catch (e: any) { results.push({ name: `Audit: ${label}`, status: 'fail', detail: e.message, durationMs }); }
      });
    }
  }

  // 6. Alpha-40 cache
  {
    const { durationMs } = await time(async () => {
      try {
        const cache = await getAlpha40Cache();
        if (!cache) {
          results.push({ name: 'Alpha-40 Cache', status: 'warn', detail: 'Cache is null/empty — may need recalculation', durationMs });
          return;
        }
        const activeCount = cache.active?.length || 0;
        const capStats = cache.capStats || {};
        results.push({ name: 'Alpha-40 Cache', status: 'pass', detail: `${activeCount} active signals (L:${capStats.LARGE||0} M:${capStats.MID||0} S:${capStats.SMALL||0})`, durationMs });
      } catch (e: any) {
        results.push({ name: 'Alpha-40 Cache', status: 'fail', detail: e.message, durationMs });
      }
    });
  }

  // 7. Key symbols data availability check (industry coverage)
  {
    const { durationMs } = await time(async () => {
      try {
        const snap = getMarketSnapshot();
        const keySymbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'ITC', 'LT', 'WIPRO'];
        const present = keySymbols.filter(s => snap[s]?.quotes?.length > 0);
        const pct = Math.round((present.length / keySymbols.length) * 100);
        if (pct < 80) {
          results.push({ name: 'Key Symbol Coverage', status: 'warn', detail: `${present.length}/${keySymbols.length} key symbols have data (${pct}%)`, durationMs });
        } else {
          results.push({ name: 'Key Symbol Coverage', status: 'pass', detail: `${present.length}/${keySymbols.length} key symbols have data`, durationMs });
        }
      } catch (e: any) { results.push({ name: 'Key Symbol Coverage', status: 'fail', detail: e.message, durationMs }); }
    });
  }

  // 8. Snapshot age check (data freshness)
  {
    const { durationMs } = await time(async () => {
      try {
        const snap = getMarketSnapshot();
        const timestamps = Object.values(snap).map((s: any) => s?.quote?.regularMarketTime).filter(Boolean);
        if (timestamps.length === 0) {
          results.push({ name: 'Data Freshness', status: 'warn', detail: 'No timestamps found in snapshot', durationMs });
          return;
        }
        const latest = Math.max(...timestamps);
        const ageHours = (Date.now() / 1000 - latest) / 3600;
        if (ageHours > 24) {
          results.push({ name: 'Data Freshness', status: 'warn', detail: `Oldest data ${Math.round(ageHours)}h old`, durationMs });
        } else {
          results.push({ name: 'Data Freshness', status: 'pass', detail: `Latest data ${Math.round(ageHours * 10) / 10}h old`, durationMs });
        }
      } catch (e: any) { results.push({ name: 'Data Freshness', status: 'fail', detail: e.message, durationMs }); }
    });
  }

  const passed = results.every(r => r.status !== 'fail');
  return { results, passed, timestamp: new Date().toISOString() };
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
      await notifyAdmins(title, message, 'system');
    } else if (warns.length > 0) {
      const title = `System Health: Passed with ${warns.length} warning(s)`;
      let message = `Health check completed with warnings at ${report.timestamp}\n`;
      for (const w of warns) {
        message += `WARN: ${w.name} — ${w.detail}\n`;
      }
      await notifyAdmins(title, message, 'system');
    } else {
      await notifyAdmins(
        `System Health: All systems operational`,
        `Health check passed at ${report.timestamp}\n${report.results.length} checks — all pass`,
        'system'
      );
    }
  } catch (e: any) {
    await notifyAdmins(
      `System Health: Check crashed`,
      `Health check threw an exception at ${new Date().toISOString()}: ${e.message}`,
      'system'
    );
  }
}
