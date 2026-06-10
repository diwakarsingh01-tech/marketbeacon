import { initDB, getDB } from './dist/db.js';

async function checkNotifications() {
  await initDB();
  const db = getDB();
  const notes = await db.all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10');
  console.log('--- LATEST NOTIFICATIONS ---');
  notes.forEach(n => {
    console.log(`[${n.type.toUpperCase()}] ${n.title}: ${n.message}`);
  });
  process.exit(0);
}

checkNotifications();
