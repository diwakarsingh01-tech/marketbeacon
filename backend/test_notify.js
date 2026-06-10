import { notifyAllUsers } from './dist/services/notificationService.js';
import { initDB } from './dist/db.js';

async function testNotify() {
  await initDB();
  const title = "🚨 Test Signal: TCS";
  const message = "TCS has QUALIFIED for Envelope Long (Tranche A). Target: 4200. (Institutional Verification Active)";
  await notifyAllUsers(title, message, 'audit');
  console.log("✅ Test notification sent to all users.");
  process.exit(0);
}

testNotify();
