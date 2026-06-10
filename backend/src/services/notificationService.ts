import { getDB } from '../db.js';

export async function createNotification(userId: number, title: string, message: string, type: 'audit' | 'system' | 'trade' = 'system') {
  try {
    const db = getDB();
    await db.run(
      'INSERT INTO notifications (user_id, title, message, type, unread) VALUES (?, ?, ?, ?, 1)',
      [userId, title, message, type]
    );
    console.log(`🔔 [NOTIFICATION] Created for user ${userId}: ${title}`);
  } catch (e: any) {
    console.error(`❌ [NOTIFICATION ERROR] Failed to create: ${e.message}`);
  }
}

export async function notifyAllUsers(title: string, message: string, type: 'audit' | 'system' | 'trade' = 'system') {
  try {
    const db = getDB();
    const users = await db.all('SELECT id FROM users WHERE is_active = 1');
    
    // Batch notifications to avoid database locking in high-user environments
    const batchSize = 50;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      await Promise.all(batch.map(user => 
        db.run(
          'INSERT INTO notifications (user_id, title, message, type, unread) VALUES (?, ?, ?, ?, 1)',
          [user.id, title, message, type]
        )
      ));
    }
    
    console.log(`🔔 [NOTIFICATION] Global notification sent to ${users.length} users: ${title}`);
  } catch (e: any) {
    console.error(`❌ [NOTIFICATION ERROR] Global notify failed: ${e.message}`);
  }
}
