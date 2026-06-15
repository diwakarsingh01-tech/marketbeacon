import { AuditChange, AuditSnapshot } from './types.js';
import fs from 'fs';
import path from 'path';

const SNAPSHOTS_DIR = path.resolve(process.cwd(), 'audit_reports', 'snapshots');

export async function detectChanges(todaySnapshot: AuditSnapshot): Promise<AuditChange[]> {
  const changes: AuditChange[] = [];
  const today = todaySnapshot.date;

  // Find yesterday's snapshot
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const yesterdayPath = path.join(SNAPSHOTS_DIR, `${yesterday}.json`);

  if (!fs.existsSync(yesterdayPath)) {
    console.log(`[AUDIT] No snapshot for ${yesterday} — skipping change detection`);
    return changes;
  }

  let yesterdayData: AuditSnapshot;
  try {
    yesterdayData = JSON.parse(fs.readFileSync(yesterdayPath, 'utf-8'));
  } catch {
    console.error(`[AUDIT] Failed to parse yesterday's snapshot`);
    return changes;
  }

  const todayMap = new Map(todaySnapshot.allQualified.map(s => [`${s.symbol}:${s.strategy}`, s]));
  const yesterdayMap = new Map(yesterdayData.allQualified.map(s => [`${s.symbol}:${s.strategy}`, s]));

  // Entries: in today but not in yesterday
  for (const [key, t] of todayMap) {
    const y = yesterdayMap.get(key);
    if (!y) {
      changes.push({
        type: 'ENTRY',
        symbol: t.symbol,
        strategy: t.strategy,
        basket: t.basket,
        newEntry: t.entryPrice,
        newTarget: t.target,
        newGrade: t.grade,
        reason: 'New qualifying signal detected'
      });
    } else if (y.basket !== t.basket || y.target !== t.target || y.grade !== t.grade) {
      changes.push({
        type: 'ENTRY',
        symbol: t.symbol,
        strategy: t.strategy,
        basket: t.basket,
        oldEntry: y.entryPrice, newEntry: t.entryPrice,
        oldTarget: y.target, newTarget: t.target,
        oldGrade: y.grade, newGrade: t.grade,
        reason: `Updated: basket ${y.basket}→${t.basket}, target ${y.target}→${t.target}`
      });
    }
  }

  // Exits: in yesterday but not in today
  for (const [key, y] of yesterdayMap) {
    if (!todayMap.has(key)) {
      changes.push({
        type: 'EXIT',
        symbol: y.symbol,
        strategy: y.strategy,
        basket: y.basket,
        oldEntry: y.entryPrice,
        oldTarget: y.target,
        oldGrade: y.grade,
        reason: 'No longer qualifies'
      });
    }
  }

  return changes;
}

export function computeStrategyDeltas(
  todaySnapshot: AuditSnapshot,
  yesterdaySnapshot: AuditSnapshot | null
): { strategyId: string; strategyName: string; count: number; delta: number }[] {
  const todayCounts: Record<string, number> = {};
  for (const s of todaySnapshot.alpha40) {
    const name = s.strategy || 'Unknown';
    todayCounts[name] = (todayCounts[name] || 0) + 1;
  }

  const yesterdayCounts: Record<string, number> = {};
  if (yesterdaySnapshot) {
    for (const s of yesterdaySnapshot.alpha40) {
      const name = s.strategy || 'Unknown';
      yesterdayCounts[name] = (yesterdayCounts[name] || 0) + 1;
    }
  }

  const allStrategies = new Set([...Object.keys(todayCounts), ...Object.keys(yesterdayCounts)]);
  return Array.from(allStrategies).sort().map(name => ({
    strategyId: name,
    strategyName: name,
    count: todayCounts[name] || 0,
    delta: (todayCounts[name] || 0) - (yesterdayCounts[name] || 0)
  }));
}
