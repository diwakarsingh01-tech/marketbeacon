import { AuditCheck } from './types.js';
import fs from 'fs';
import path from 'path';

const CACHE_FILE_PATH = path.resolve(process.cwd(), 'alpha_40_results.json');

function getActiveSignals(): any[] {
  try {
    const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    return JSON.parse(raw)?.active || [];
  } catch { return []; }
}

export async function runDataQualityChecks(): Promise<AuditCheck[]> {
  const signals = getActiveSignals();
  const checks: AuditCheck[] = [];

  if (signals.length === 0) {
    checks.push({
      id: 'DQ-SKIP', category: 'data_quality', name: 'No active signals to check', severity: 'low',
      status: 'skipped', details: 'Alpha-40 cache has 0 active signals', autoFixable: false, autoFixed: false
    });
    return checks;
  }

  // DQ-1: Symbol non-null
  const nullSymbols = signals.filter(s => !s.symbol);
  checks.push({
    id: 'DQ-1', category: 'data_quality', name: 'All symbols are non-null', severity: 'critical',
    status: nullSymbols.length === 0 ? 'pass' : 'fail',
    details: nullSymbols.length === 0 ? `${signals.length} symbols present` : `${nullSymbols.length} null symbols found`,
    autoFixable: true, autoFixed: false
  });

  // DQ-2: Entry price positive
  const badEntry = signals.filter(s => !s.entryPrice || s.entryPrice <= 0);
  checks.push({
    id: 'DQ-2', category: 'data_quality', name: 'Entry prices are positive', severity: 'critical',
    status: badEntry.length === 0 ? 'pass' : 'fail',
    details: badEntry.length === 0 ? 'All positive' : `${badEntry.map((s: any) => s.symbol).join(', ')} have entry ≤ 0`,
    autoFixable: true, autoFixed: false
  });

  // DQ-3: Target price positive
  const badTarget = signals.filter(s => !s.target || s.target <= 0);
  checks.push({
    id: 'DQ-3', category: 'data_quality', name: 'Target prices are positive', severity: 'critical',
    status: badTarget.length === 0 ? 'pass' : 'fail',
    details: badTarget.length === 0 ? 'All positive' : `${badTarget.map((s: any) => s.symbol).join(', ')} have target ≤ 0`,
    autoFixable: true, autoFixed: false
  });

  // DQ-4: Entry ≤ Target
  const badGap = signals.filter((s: any) => s.entryPrice > s.target);
  checks.push({
    id: 'DQ-4', category: 'data_quality', name: 'Entry price ≤ Target price', severity: 'high',
    status: badGap.length === 0 ? 'pass' : 'fail',
    details: badGap.length === 0 ? 'All valid' : `${badGap.map((s: any) => s.symbol).join(', ')} have entry > target`,
    autoFixable: true, autoFixed: false
  });

  // DQ-5: Current price present
  const noCmp = signals.filter(s => !s.currentPrice || s.currentPrice <= 0);
  checks.push({
    id: 'DQ-5', category: 'data_quality', name: 'Current prices are present', severity: 'high',
    status: noCmp.length === 0 ? 'pass' : 'fail',
    details: noCmp.length === 0 ? 'All present' : `${noCmp.map((s: any) => s.symbol).join(', ')} missing current price`,
    autoFixable: true, autoFixed: false
  });

  // DQ-6: Tranche/Grade validity
  const validGrades = ['A', 'B', 'C', 'D', 'NONE', ''];
  const badGrade = signals.filter((s: any) => s.tranche && !validGrades.includes(s.tranche));
  checks.push({
    id: 'DQ-6', category: 'data_quality', name: 'Valid tranche/grade values', severity: 'high',
    status: badGrade.length === 0 ? 'pass' : 'fail',
    details: badGrade.length === 0 ? 'All valid' : `${badGrade.map((s: any) => `${s.symbol}:${s.tranche}`).join(', ')} have invalid grade`,
    autoFixable: false, autoFixed: false
  });

  // DQ-7: ROI in sane range
  const badRoi = signals.filter((s: any) => {
    const roi = s.roi ?? ((s.target / s.entryPrice) - 1) * 100;
    return roi < -100 || roi > 10000;
  });
  checks.push({
    id: 'DQ-7', category: 'data_quality', name: 'ROI in sane range (-100% to 10000%)', severity: 'medium',
    status: badRoi.length === 0 ? 'pass' : 'fail',
    details: badRoi.length === 0 ? 'All in range' : `${badRoi.map((s: any) => s.symbol).join(', ')} have unusual ROI`,
    autoFixable: false, autoFixed: false
  });

  // DQ-8: No duplicate symbols
  const symbols = signals.map((s: any) => s.symbol);
  const dupes = symbols.filter((s: string, i: number) => symbols.indexOf(s) !== i);
  checks.push({
    id: 'DQ-8', category: 'data_quality', name: 'No duplicate symbols in active list', severity: 'critical',
    status: dupes.length === 0 ? 'pass' : 'fail',
    details: dupes.length === 0 ? 'All unique' : `Duplicates: ${[...new Set(dupes)].join(', ')}`,
    autoFixable: true, autoFixed: false
  });

  // DQ-9: Strategy name present
  const noStrategy = signals.filter(s => !s.strategy);
  checks.push({
    id: 'DQ-9', category: 'data_quality', name: 'Strategy name present on all signals', severity: 'medium',
    status: noStrategy.length === 0 ? 'pass' : 'fail',
    details: noStrategy.length === 0 ? 'All have strategy' : `${noStrategy.length} missing strategy`,
    autoFixable: false, autoFixed: false
  });

  // DQ-10: Basket source present
  const noBasket = signals.filter(s => !s.basketSource);
  checks.push({
    id: 'DQ-10', category: 'data_quality', name: 'Basket source present on all signals', severity: 'medium',
    status: noBasket.length === 0 ? 'pass' : 'fail',
    details: noBasket.length === 0 ? 'All have basket source' : `${noBasket.length} missing basket source`,
    autoFixable: false, autoFixed: false
  });

  // DQ-11: Score present
  const noScore = signals.filter(s => s.score === undefined || s.score === null);
  checks.push({
    id: 'DQ-11', category: 'data_quality', name: 'Audit score present', severity: 'medium',
    status: noScore.length === 0 ? 'pass' : 'fail',
    details: noScore.length === 0 ? 'All have scores' : `${noScore.length} missing score`,
    autoFixable: false, autoFixed: false
  });

  // DQ-12: CapType present
  const noCap = signals.filter(s => !s.capType);
  checks.push({
    id: 'DQ-12', category: 'data_quality', name: 'Cap type present', severity: 'medium',
    status: noCap.length === 0 ? 'pass' : 'fail',
    details: noCap.length === 0 ? 'All have cap type' : `${noCap.length} missing cap type`,
    autoFixable: false, autoFixed: false
  });

  return checks;
}
