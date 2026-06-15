import cron from 'node-cron';
import { runAuditEngine } from '../services/audit/engine.js';

export function scheduleAuditCron(baskets: Record<string, string[]> = {}) {
  // Run daily at 01:30 UTC (07:00 IST)
  cron.schedule('30 1 * * *', async () => {
    console.log('\n⏰ [AUDIT CRON] Starting scheduled nightly audit...');
    try {
      const report = await runAuditEngine(baskets);
      console.log(`✅ [AUDIT CRON] Complete. Status: ${report.status}`);
    } catch (e: any) {
      console.error(`❌ [AUDIT CRON] Failed: ${e.message}`);
    }
  });

  // Also run once 30 seconds after server boot for initial snapshot
  setTimeout(async () => {
    console.log('⏰ [AUDIT CRON] Warm-up: taking initial snapshot...');
    try {
      const { saveTodaySnapshot } = await import('../services/audit/basketAudit.js');
      await saveTodaySnapshot(baskets);
      console.log('✅ [AUDIT CRON] Initial snapshot saved.');
    } catch (e: any) {
      console.error(`❌ [AUDIT CRON] Warm-up failed: ${e.message}`);
    }
  }, 30000);

  console.log('⏰ [AUDIT CRON] Scheduled: 01:30 UTC daily.');
}
