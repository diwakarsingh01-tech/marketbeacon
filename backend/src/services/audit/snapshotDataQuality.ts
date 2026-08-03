import { AuditCheck } from './types.js';
import fs from 'fs';
import path from 'path';
import {
  calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking,
  calculate52WeekStrategy, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda,
  calculateTwentyRallyRetest, calculateReverseHeadShoulders, checkInstitutionalMandates
} from '../../strategies/index.js';
import { getMarketSnapshot } from '../../screener.js';

/**
 * Snapshot Data-Quality Checks (2026-08-02)
 * ---------------------------------------------------------------
 * Scans market_snapshot.json for stale / incomplete / missing data and
 * FAIL-CLOSED violations, so the nightly audit (engine.ts) surfaces them
 * and the admin Telegram alert can list them for manual fixing.
 *
 * Checks:
 *   SDQ-1  No stale snapshots            (lastUpdated > 7 days)
 *   SDQ-2  No missing fundamentals       (non-ETF: athSales / athNetProfit <= 0)
 *   SDQ-3  No partial screener scrapes   (quarterly empty while screener present)
 *   SDQ-4  No insufficient price history (quotes < 200 — blocks pattern detection)
 *   SDQ-5  No basket members missing from snapshot (e.g. JCHAC)
 *   SDQ-6  No SIXTY_SEVEN_FUNDA fail-open signals (buyZone stored while fundamentals missing)
 */

const SNAPSHOT_PATH = path.resolve(process.cwd(), 'market_snapshot.json');

// Min daily bars needed for the easiest strategy (ENVELOPE_SHORT needs 200)
const MIN_QUOTES_THRESHOLD = 200;

function parseDate(x: string): number | null {
  const ts = Date.parse(String(x));
  return Number.isNaN(ts) ? null : ts;
}

function truncateList(list: string[], max = 12): string {
  if (list.length === 0) return 'none';
  const shown = list.slice(0, max).join(', ');
  return list.length > max ? `${shown} …(+${list.length - max} more)` : shown;
}

export async function runSnapshotDataQualityChecks(baskets?: Record<string, string[]>): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];

  let data: Record<string, any> = {};
  try {
    data = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
  } catch (e: any) {
    checks.push({
      id: 'SDQ-0', category: 'data_quality', name: 'Snapshot file readable', severity: 'critical',
      status: 'fail', details: `Cannot read ${SNAPSHOT_PATH}: ${e.message}`, autoFixable: false, autoFixed: false
    });
    return checks;
  }

  const symbols = Object.keys(data);
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 3600 * 1000;

  // ── SDQ-1: Stale snapshots ──────────────────────────────────────────────
  const stale = symbols.filter(s => {
    const ts = parseDate(data[s]?.lastUpdated || '');
    return ts !== null && (now - ts) > SEVEN_DAYS;
  }).sort();
  checks.push({
    id: 'SDQ-1', category: 'data_quality', name: 'No stale snapshots (>7 days)', severity: 'high',
    status: stale.length === 0 ? 'pass' : 'fail',
    details: stale.length === 0
      ? `${symbols.length} snapshots fresh (≤7d)`
      : `${stale.length} stale: ${truncateList(stale)}`,
    autoFixable: false, autoFixed: false
  });

  // ── SDQ-2: Missing fundamentals (fail-closed gate coverage) ─────────────
  const missingFund = symbols.filter(s => {
    const scr = data[s]?.screener;
    if (!scr) return false; // index symbol (^NSEI) etc.
    const isETF = s.endsWith('BEES') || String(scr.industry || '').toLowerCase().includes('etf');
    if (isETF) return false; // ETFs legitimately have no sales/profit
    const athSales = parseFloat(scr.athSales) || 0;
    const athNetProfit = parseFloat(scr.athNetProfit) || 0;
    return athSales <= 0 || athNetProfit <= 0;
  }).sort();
  checks.push({
    id: 'SDQ-2', category: 'data_quality', name: 'No missing fundamental data', severity: 'critical',
    status: missingFund.length === 0 ? 'pass' : 'fail',
    details: missingFund.length === 0
      ? 'All non-ETF stocks have athSales/athNetProfit'
      : `${missingFund.length} stocks missing sales/profit (fail-open risk): ${truncateList(missingFund)}`,
    autoFixable: false, autoFixed: false
  });

  // ── SDQ-3: Partial scrapes (quarterly empty while screener exists) ──────
  const partial = symbols.filter(s => {
    const scr = data[s]?.screener;
    if (!scr) return false;
    const isETF = s.endsWith('BEES') || String(scr.industry || '').toLowerCase().includes('etf');
    if (isETF) return false;
    const quarterly = Array.isArray(scr.quarterly) ? scr.quarterly : [];
    const epsHistory = Array.isArray(scr.epsHistory) ? scr.epsHistory : [];
    return quarterly.length === 0 || epsHistory.length === 0;
  }).sort();
  checks.push({
    id: 'SDQ-3', category: 'data_quality', name: 'No partial screener scrapes', severity: 'high',
    status: partial.length === 0 ? 'pass' : 'fail',
    details: partial.length === 0
      ? 'All non-ETF stocks have quarterly + epsHistory'
      : `${partial.length} partial scrapes (quarterly/epsHistory empty): ${truncateList(partial)}`,
    autoFixable: false, autoFixed: false
  });

  // ── SDQ-4: Insufficient price history ───────────────────────────────────
  const thin = symbols.filter(s => {
    const quotes = data[s]?.quotes;
    return Array.isArray(quotes) && quotes.length > 0 && quotes.length < MIN_QUOTES_THRESHOLD;
  }).sort();
  checks.push({
    id: 'SDQ-4', category: 'data_quality', name: 'No insufficient price history', severity: 'high',
    status: thin.length === 0 ? 'pass' : 'fail',
    details: thin.length === 0
      ? `All symbols have ≥${MIN_QUOTES_THRESHOLD} bars`
      : `${thin.length} symbols < ${MIN_QUOTES_THRESHOLD} bars (patterns blocked): ${truncateList(thin)}`,
    autoFixable: false, autoFixed: false
  });

  // ── SDQ-5: Basket members missing from snapshot ─────────────────────────
  if (baskets && Object.keys(baskets).length > 0) {
    const allBasket = Array.from(new Set(Object.values(baskets).flat())).filter(s => s && s !== '^NSEI');
    const snapshotSet = new Set(symbols.map(s => s.replace(/\.NS$/i, '').toUpperCase()));
    const missing = allBasket.filter(s => !snapshotSet.has(s.toUpperCase())).sort();
    checks.push({
      id: 'SDQ-5', category: 'data_quality', name: 'All basket members present in snapshot', severity: 'critical',
      status: missing.length === 0 ? 'pass' : 'fail',
      details: missing.length === 0
        ? `${allBasket.length} basket members all present`
        : `${missing.length} basket symbols missing from snapshot: ${truncateList(missing)}`,
      autoFixable: false, autoFixed: false
    });
  } else {
    checks.push({
      id: 'SDQ-5', category: 'data_quality', name: 'All basket members present in snapshot', severity: 'critical',
      status: 'skipped', details: 'Baskets not provided — run via /api/admin/audit/run', autoFixable: false, autoFixed: false
    });
  }

  // ── SDQ-6: Fail-open signals stored in snapshot ─────────────────────────
  // Scoped to SIXTY_SEVEN_FUNDA — the only strategy whose buyZone REQUIRES
  // fundamentals. (Price-action strategies like BOLLINGER/ENVELOPE/SR don't need
  // sales/profit data and are gated by the institutional-mandate audit; missing
  // fundamentals for those is separately tracked by SDQ-2/SDQ-3.)
  const failOpen = symbols.filter(s => {
    const snap = data[s];
    const sf67 = snap?.strategies?.SIXTY_SEVEN_FUNDA;
    if (!sf67) return false;
    const scr = snap.screener;
    if (!scr) return false; // index symbols (^NSEI) have no screener — not stocks
    const isETF = s.endsWith('BEES') || String(scr.industry || '').toLowerCase().includes('etf');
    if (isETF) return false;
    const athSales = parseFloat(scr.athSales) || 0;
    const athNetProfit = parseFloat(scr.athNetProfit) || 0;
    if (athSales > 0 && athNetProfit > 0) return false;
    return sf67.isBuyZone === true;
  }).sort();
  checks.push({
    id: 'SDQ-6', category: 'data_quality', name: 'No SIXTY_SEVEN signals without fundamentals', severity: 'critical',
    status: failOpen.length === 0 ? 'pass' : 'fail',
    details: failOpen.length === 0
      ? 'No SIXTY_SEVEN_FUNDA buyZone signals stored without fundamental data'
      : `${failOpen.length} SIXTY_SEVEN signals with missing fundamentals: ${truncateList(failOpen)}`,
    autoFixable: true, autoFixed: false
  });

  return checks;
}

/**
 * Recompute the stored strategy signals for a snapshot entry, replicating exactly
 * what updateMarketSnapshot() does (screener.ts): run the 10 calculators, then wipe
 * any isBuyZone signal when the GLOBAL institutional-mandate audit fails. With the
 * 2026-08-02 fail-closed gate inside calculateSixtySevenFunda, stocks whose screener
 * scrape is incomplete (athSales/athNetProfit = 0) now resolve to isBuyZone:false
 * instead of silently passing.
 */
export function recomputeStrategiesForSymbol(symbol: string, snap: any): Record<string, any> {
  const quotes = Array.isArray(snap?.quotes) ? snap.quotes : [];
  const screenerData = snap?.screener || {};
  const audit = checkInstitutionalMandates(screenerData, symbol);

  const rawStrategies = {
    'ENVELOPE_LONG': calculateEnvelope(quotes),
    'ENVELOPE_SHORT': processShortEnvelope(quotes),
    'BOLLINGER': calculateBollingerBand(quotes),
    '52W_HIGH_LOW': calculate52WeekStrategy(quotes),
    'CUP_HANDLE_ABCD': calculateCupHandle(quotes),
    'SMA_BCD': calculateSMAStacking(quotes),
    'SR_STRATEGY': calculateSRStrategy(quotes),
    'SIXTY_SEVEN_FUNDA': calculateSixtySevenFunda(quotes, screenerData),
    'TWENTY_RALLY_RETEST': calculateTwentyRallyRetest(quotes),
    'REVERSE_HEAD_SHOULDERS': calculateReverseHeadShoulders(quotes)
  };

  const strategies: Record<string, any> = {};
  for (const [key, res] of Object.entries(rawStrategies)) {
    if (!audit.passed && (res as any)?.isBuyZone) {
      strategies[key] = { isBuyZone: false, status: "REJECTED", reason: audit.reasons.join(', ') };
    } else {
      strategies[key] = res;
    }
  }
  return strategies;
}

/**
 * Self-healing for SDQ-6 (and any stale stored signals): recompute stored strategies
 * from the snapshot's own quotes + screener data (no network), persist the file, and
 * apply the same recomputation to the live in-process cache so the running server
 * serves the cleaned data immediately. Returns a summary for the audit trail.
 */
export async function recomputeStoredStrategies(symbols?: string[]): Promise<{ total: number; changed: number; buyZone: number; path: string }> {
  let data: Record<string, any> = {};
  try {
    data = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
  } catch (e: any) {
    throw new Error(`Cannot read ${SNAPSHOT_PATH}: ${e.message}`);
  }

  const targets = symbols && symbols.length > 0
    ? symbols.filter(s => data[s])
    : Object.keys(data);

  let changed = 0, buyZone = 0;
  for (const sym of targets) {
    const snap = data[sym];
    if (!snap || !Array.isArray(snap.quotes) || snap.quotes.length === 0) continue;
    const before = JSON.stringify(snap.strategies || {});
    snap.strategies = recomputeStrategiesForSymbol(sym, snap);
    if (JSON.stringify(snap.strategies) !== before) changed++;
    for (const v of Object.values(snap.strategies)) {
      if ((v as any)?.isBuyZone) buyZone++;
    }
  }

  // Apply to the live in-process cache so the running server serves clean data now.
  try {
    const live = getMarketSnapshot();
    for (const sym of targets) {
      const snap = live[sym];
      if (snap) snap.strategies = recomputeStrategiesForSymbol(sym, snap);
    }
  } catch (e: any) {
    console.warn(`⚠️ [SDQ-6] Could not update live cache: ${e.message}`);
  }

  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data));
  console.log(`✅ [SDQ-6] Recomputed strategies: ${targets.length} symbols, ${changed} changed, ${buyZone} buyZone signals stored.`);
  return { total: targets.length, changed, buyZone, path: SNAPSHOT_PATH };
}
