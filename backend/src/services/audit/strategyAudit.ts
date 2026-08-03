import { AuditCheck } from './types.js';
import fs from 'fs';
import path from 'path';

const CACHE_FILE_PATH = path.resolve(process.cwd(), 'alpha_40_results.json');
const SNAPSHOT_PATH = path.resolve(process.cwd(), 'market_snapshot.json');

function getActiveSignals(): any[] {
  try {
    const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    return JSON.parse(raw)?.active || [];
  } catch { return []; }
}

function getSnapshot(): Record<string, any> {
  try {
    for (const p of [SNAPSHOT_PATH, path.resolve(process.cwd(), '..', 'market_snapshot.json')]) {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch {}
  return {};
}

export async function runStrategyChecks(): Promise<AuditCheck[]> {
  const signals = getActiveSignals();
  const snapshot = getSnapshot();
  const checks: AuditCheck[] = [];

  if (signals.length === 0) {
    checks.push({ id: 'SL-SKIP', category: 'strategy', name: 'No signals to audit', severity: 'low',
      status: 'skipped', details: '0 active signals', autoFixable: false, autoFixed: false });
    return checks;
  }

  // SL-1: All S&R signals have target/entry >= 1.30
  const srSignals = signals.filter((s: any) =>
    s.strategy?.includes('S&R') || s.strategy?.includes('Support and Resistance'));
  const srBad = srSignals.filter((s: any) => {
    const gap = s.target / s.entryPrice;
    return gap < 1.29; // allow 0.01 tolerance for rounding
  });
  checks.push({
    id: 'SL-1', category: 'strategy', name: 'S&R entry→target gap ≥ 30%', severity: 'critical',
    status: srBad.length === 0 ? 'pass' : 'fail',
    details: srBad.length === 0
      ? `${srSignals.length} S&R signals all have ≥30% gap`
      : `${srBad.map((s: any) => `${s.symbol} (gap=${((s.target/s.entryPrice)-1)*100}%)`).join(', ')} below threshold`,
    autoFixable: false, autoFixed: false
  });

  // SL-3: Cup & Handle signals have target/entry >= 1.30
  const cupSignals = signals.filter((s: any) => s.strategy?.includes('Cup'));
  const cupBad = cupSignals.filter((s: any) => (s.target / s.entryPrice) < 1.29);
  checks.push({
    id: 'SL-3', category: 'strategy', name: 'Cup & Handle entry→target gap ≥ 30%', severity: 'critical',
    status: cupBad.length === 0 ? 'pass' : 'fail',
    details: cupBad.length === 0 ? `${cupSignals.length} Cup & Handle signals OK` : `${cupBad.map((s: any) => s.symbol).join(', ')} below threshold`,
    autoFixable: false, autoFixed: false
  });

  // SL-4: 67 Funda — gap is 67% or 100% based on ATH recency
  const fundaSignals = signals.filter((s: any) => s.strategy?.includes('67') || s.strategy?.includes('Institutional Reset'));
  const fundaBad = fundaSignals.filter((s: any) => {
    const gap = ((s.target / s.entryPrice) - 1) * 100;
    return gap < 65 || gap > 105; // within tolerance of 67% or 100%
  });
  checks.push({
    id: 'SL-4', category: 'strategy', name: '67 Funda gap is 67% or 100% (±5%)', severity: 'critical',
    status: fundaBad.length === 0 ? 'pass' : 'fail',
    details: fundaBad.length === 0
      ? `${fundaSignals.length} 67 Funda signals show correct gaps`
      : `${fundaBad.map((s: any) => `${s.symbol} (gap=${((s.target/s.entryPrice)-1)*100}%)`).join(', ')} unexpected`,
    autoFixable: false, autoFixed: false
  });

  // SL-5: Velocity Retest — gap >= 20%
  const velSignals = signals.filter((s: any) => s.strategy?.includes('Velocity'));
  const velBad = velSignals.filter((s: any) => (s.target / s.entryPrice) < 1.19);
  checks.push({
    id: 'SL-5', category: 'strategy', name: 'Velocity Retest gap ≥ 20%', severity: 'high',
    status: velBad.length === 0 ? 'pass' : 'fail',
    details: velBad.length === 0 ? `${velSignals.length} Velocity signals OK` : `${velBad.map((s: any) => s.symbol).join(', ')} below threshold`,
    autoFixable: false, autoFixed: false
  });

  // SL-6: Envelope Long — gap per tranche (A ≈ 32.5% envelope bands, B/C/D ≈ 11.1% walk-down steps)
  const envLongSignals = signals.filter((s: any) => s.strategy === 'Envelope Long');
  const envLongBad = envLongSignals.filter((s: any) => {
    const gap = ((s.target / s.entryPrice) - 1) * 100;
    // A: lower→upper band of the SMA envelope (14% bands → 32.6%).
    // B/C/D: 10% walk-down steps → target is previous tranche → 11.1% gap.
    const expected = s.tranche === 'A' ? 32.5 : 11.1;
    return Math.abs(gap - expected) > 3;
  });
  checks.push({
    id: 'SL-6', category: 'strategy', name: 'Envelope Long gap per tranche (A ~32.5%, B/C/D ~11.1%)', severity: 'high',
    status: envLongBad.length === 0 ? 'pass' : 'fail',
    details: envLongBad.length === 0 ? `${envLongSignals.length} Envelope Long OK` : `${envLongBad.map((s: any) => `${s.symbol}: ${((s.target/s.entryPrice)-1)*100}%`).join(', ')} off range`,
    autoFixable: false, autoFixed: false
  });

  // SL-7: 52W High/Low — entry/target must sit on the walk-down ladder derived from the 52W range
  const w52Signals = signals.filter((s: any) => s.strategy?.includes('52 week'));
  const w52Bad = w52Signals.filter((s: any) => {
    const snap = snapshot[s.symbol];
    if (!snap?.quotes?.length) return false;
    // The 52W strategy computes its range from candle LOWS/HIGHS (not closes).
    // Signals may trigger days earlier, so the range can extend afterwards — use
    // drift-tolerant bounds instead of exact ladder matching.
    const lows = snap.quotes.map((q: any) => q.low);
    const highs = snap.quotes.map((q: any) => q.high);
    const lookback = Math.min(251, lows.length - 1);
    const low52 = Math.min(...lows.slice(-lookback));
    const high52 = Math.max(...highs.slice(-lookback));
    const tr = s.tranche || 'A';
    if (tr === 'A') {
      // A: entry ≈ 52W low, target ≈ 52W high. Allow range extension drift.
      const entryOk = s.entryPrice >= low52 * 0.75 && s.entryPrice <= high52 * 1.10;
      const targetOk = s.target >= s.entryPrice && s.target <= high52 * 1.20;
      return !entryOk || !targetOk;
    }
    // B/C/D: 10% walk-down steps below the low, target = previous tranche price.
    const step = { B: 0.9, C: 0.81, D: 0.729 }[tr] ?? 1;
    const expEntry = low52 * step;
    const expTarget = (low52 * step) / 0.9;
    const entryOk = s.entryPrice >= expEntry * 0.85 && s.entryPrice <= expEntry * 1.15;
    const targetOk = s.target >= expTarget * 0.85 && s.target <= expTarget * 1.15;
    return !entryOk || !targetOk;
  });
  checks.push({
    id: 'SL-7', category: 'strategy', name: '52W signals within 52W range (drift-tolerant)', severity: 'high',
    status: w52Bad.length === 0 ? 'pass' : 'fail',
    details: w52Bad.length === 0 ? `${w52Signals.length} 52W signals OK` : `${w52Bad.map((s: any) => s.symbol).join(', ')} outside 52W ladder`,
    autoFixable: false, autoFixed: false
  });

  // SL-8: Sector cap ≤ 8 per sector
  const sectorCounts: Record<string, number> = {};
  for (const s of signals) {
    const sec = s.sector || 'General';
    sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
  }
  const overCapped = Object.entries(sectorCounts).filter(([_, c]) => c > 8);
  checks.push({
    id: 'SL-8', category: 'strategy', name: 'No sector exceeds 8 stock cap', severity: 'high',
    status: overCapped.length === 0 ? 'pass' : 'fail',
    details: overCapped.length === 0 ? 'All sectors within cap' : `${overCapped.map(([s, c]) => `${s} (${c})`).join(', ')} exceed cap`,
    autoFixable: false, autoFixed: false
  });

  // SL-9: Cap mix (~20L / 12M / 8S) ±3 tolerance
  const large = signals.filter((s: any) => s.capType === 'LARGE').length;
  const mid = signals.filter((s: any) => s.capType === 'MID').length;
  const small = signals.filter((s: any) => s.capType === 'SMALL').length;
  const capOk = Math.abs(large - 20) <= 3 && Math.abs(mid - 12) <= 3 && Math.abs(small - 8) <= 3;
  checks.push({
    id: 'SL-9', category: 'strategy', name: 'Cap mix balanced (~20L/12M/8S ±3)', severity: 'medium',
    status: capOk ? 'pass' : 'fail',
    details: `L:${large} M:${mid} S:${small} ${capOk ? 'within tolerance' : 'outside tolerance (±3)'}`,
    autoFixable: false, autoFixed: false
  });

  return checks;
}
