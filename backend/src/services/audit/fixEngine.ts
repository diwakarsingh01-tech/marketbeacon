import { AuditCheck } from './types.js';
import { precalculateAlpha40 } from '../worker.js';
import { recomputeStoredStrategies } from './snapshotDataQuality.js';

interface FixResult {
  checkId: string;
  fixed: boolean;
  before: any;
  after?: any;
}

export async function attemptAutoFix(check: AuditCheck): Promise<FixResult> {
  const result: FixResult = { checkId: check.id, fixed: false, before: { ...check } };

  switch (check.id) {
    case 'ST-1':
    case 'ST-2':
    case 'ST-4':
      // Regenerate Alpha-40 cache
      console.log(`🔧 [AUDIT] Auto-fix: regenerating Alpha-40 cache...`);
      try {
        await precalculateAlpha40();
        result.fixed = true;
        result.after = { ...check, status: 'fixed' };
        console.log(`✅ [AUDIT] Alpha-40 cache regenerated.`);
      } catch (e: any) {
        console.error(`❌ [AUDIT] Failed to regenerate: ${e.message}`);
      }
      break;

    case 'ST-3':
      // Market snapshot — trigger a refresh
      console.log(`🔧 [AUDIT] Auto-fix: market snapshot needs manual refresh via cron. Flagging.`);
      result.fixed = false;
      break;

    case 'DQ-1':
    case 'DQ-2':
    case 'DQ-3':
    case 'DQ-4':
    case 'DQ-5':
      // Bad data — regenerate cache to refresh
      try {
        await precalculateAlpha40();
        result.fixed = true;
        console.log(`✅ [AUDIT] Regenerated cache to fix data quality issues.`);
      } catch (e: any) {
        console.error(`❌ [AUDIT] Auto-fix failed: ${e.message}`);
      }
      break;

    case 'DQ-8':
      // Duplicates — handled by the worker's dedup logic, regenerate
      try {
        await precalculateAlpha40();
        result.fixed = true;
      } catch {}
      break;

    case 'BM-1':
    case 'BM-2':
    case 'BM-3':
      // Missing snapshot data — refresh snapshot
      console.log(`🔧 [AUDIT] Auto-fix: triggering snapshot refresh for missing symbols.`);
      try {
        await precalculateAlpha40();
        result.fixed = true;
      } catch {}
      break;

    case 'SDQ-6':
      // Fail-open signals stored with missing fundamentals — recompute stored
      // strategies from the snapshot's own data (fail-closed gate + mandate wipe),
      // persist the file and update the live cache. No network needed.
      console.log(`🔧 [AUDIT] Auto-fix: recomputing stored strategies (SDQ-6 fail-open signals)...`);
      try {
        const res = await recomputeStoredStrategies();
        result.fixed = true;
        result.after = { ...check, status: 'fixed', fixedDetails: `${res.total} symbols recomputed, ${res.changed} changed` };
        console.log(`✅ [AUDIT] Stored strategies recomputed: ${res.total} symbols, ${res.changed} changed.`);
      } catch (e: any) {
        console.error(`❌ [AUDIT] SDQ-6 auto-fix failed: ${e.message}`);
      }
      break;

    default:
      // Not auto-fixable
      result.fixed = false;
      break;
  }

  return result;
}
