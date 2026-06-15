import { AuditCheck, AuditSnapshot } from './types.js';
import fs from 'fs';
import path from 'path';
import { getMarketSnapshot } from '../../screener.js';

const CACHE_FILE_PATH = path.resolve(process.cwd(), 'alpha_40_results.json');
const AUDIT_DIR = path.resolve(process.cwd(), 'audit_reports');
const SNAPSHOTS_DIR = path.resolve(AUDIT_DIR, 'snapshots');

export async function runBasketChecks(baskets: Record<string, string[]>): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];
  const eliteSymbols = baskets['Elite Basket'] || [];
  const qualitySymbols = baskets['Quality Basket'] || [];

  try {
    const snapshot = getMarketSnapshot();
    const snapshotKeys = Object.keys(snapshot || {});
    const snapKeySet = new Set(snapshotKeys.map(k => k.replace('.NS', '')));

    const missingElite = eliteSymbols.filter(s => !snapKeySet.has(s));
    const missingQuality = qualitySymbols.filter(s => !snapKeySet.has(s));

    checks.push({
      id: 'BM-1', category: 'basket', name: 'Elite Basket symbols in snapshot', severity: 'critical',
      status: missingElite.length === 0 ? 'pass' : 'fail',
      details: missingElite.length === 0
        ? 'All Elite symbols present'
        : `${missingElite.length} missing: ${missingElite.join(', ')}`,
      autoFixable: true, autoFixed: false
    });

    checks.push({
      id: 'BM-2', category: 'basket', name: 'Quality Basket symbols in snapshot', severity: 'critical',
      status: missingQuality.length === 0 ? 'pass' : 'fail',
      details: missingQuality.length === 0
        ? 'All Quality symbols present'
        : `${missingQuality.length} missing: ${missingQuality.join(', ')}`,
      autoFixable: true, autoFixed: false
    });

    const totalSnap = snapshotKeys.length;
    checks.push({
      id: 'BM-3', category: 'basket', name: 'Snapshot size sanity', severity: 'medium',
      status: totalSnap >= 200 ? 'pass' : 'fail',
      details: `${totalSnap} symbols in snapshot (expected ≥200)`,
      autoFixable: true, autoFixed: false
    });

    try {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      const activeCount = data?.active?.length || 0;
      checks.push({
        id: 'BM-4', category: 'basket', name: 'Active signals count', severity: 'high',
        status: activeCount >= 20 && activeCount <= 55 ? 'pass' : 'fail',
        details: `${activeCount} active signals`,
        autoFixable: false, autoFixed: false
      });
    } catch {}
  } catch (e: any) {
    checks.push({
      id: 'BM-ERR', category: 'basket', name: 'Snapshot load', severity: 'high',
      status: 'fail', details: `Error: ${e.message}`, autoFixable: true, autoFixed: false
    });
  }

  // BM-5: Previous day snapshot exists
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const snapPath = path.join(SNAPSHOTS_DIR, `${yesterday}.json`);
  checks.push({
    id: 'BM-5', category: 'basket', name: 'Previous day snapshot', severity: 'high',
    status: fs.existsSync(snapPath) ? 'pass' : 'fail',
    details: fs.existsSync(snapPath) ? `Found ${yesterday}.json` : `Missing ${yesterday}.json (first run?)`,
    autoFixable: false, autoFixed: false
  });

  return checks;
}

export async function saveTodaySnapshot(baskets: Record<string, string[]>): Promise<AuditSnapshot> {
  const today = new Date().toISOString().split('T')[0];
  let alpha40 = [];
  try {
    const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    alpha40 = data?.active || [];
  } catch {}

  const snapshot = getMarketSnapshot() || {};
  const snapKeys = new Set(Object.keys(snapshot).map(k => k.replace('.NS', '')));

  const basketSymbols: Record<string, string[]> = {};
  for (const [name, symbols] of Object.entries(baskets)) {
    basketSymbols[name] = symbols.filter(s => {
      const livePrice = snapshot[`${s}.NS`] || snapshot[s];
      return livePrice;
    });
  }

  const strategyCounts: Record<string, number> = {};
  for (const s of alpha40) {
    const strat = s.strategy || 'Unknown';
    strategyCounts[strat] = (strategyCounts[strat] || 0) + 1;
  }

  const snap: AuditSnapshot = {
    date: today,
    timestamp: new Date().toISOString(),
    alpha40,
    baskets: basketSymbols,
    growthBasket: basketSymbols['Growth Basket'] || [],
    strategyCounts,
    allQualified: alpha40.map((s: any) => ({
      symbol: s.symbol,
      strategy: s.strategy || 'Unknown',
      basket: s.basketSource || 'Unknown',
      entryPrice: s.entryPrice || 0,
      target: s.target || 0,
      grade: s.tranche || 'A'
    }))
  };

  try {
    if (!fs.existsSync(SNAPSHOTS_DIR)) fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    fs.writeFileSync(path.join(SNAPSHOTS_DIR, `${today}.json`), JSON.stringify(snap, null, 2));
  } catch (e: any) {
    console.error(`❌ [AUDIT] Failed to save snapshot: ${e.message}`);
  }

  return snap;
}
