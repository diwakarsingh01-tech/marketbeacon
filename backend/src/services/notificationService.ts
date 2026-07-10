import { getDB } from '../db.js';
import { sendTelegramMessage } from './telegramNotifier.js';

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

export async function notifyAdmins(title: string, message: string, type: 'audit' | 'system' | 'trade' = 'system') {
  try {
    const db = getDB();
    const admins = await db.all('SELECT id FROM users WHERE role = ? AND is_active = 1', ['admin']);
    for (const admin of admins) {
      await db.run(
        'INSERT INTO notifications (user_id, title, message, type, unread) VALUES (?, ?, ?, ?, 1)',
        [admin.id, title, message, type]
      );
    }
    console.log(`🔔 [NOTIFICATION] Admin notification sent to ${admins.length} admins: ${title}`);
    // Also send to Telegram
    await sendTelegramMessage(`🔔 *Admin Alert*\n\n${title}\n${message}`, 'dm');
  } catch (e: any) {
    console.error(`❌ [NOTIFICATION ERROR] Admin notify failed: ${e.message}`);
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
    // Also send to Telegram
    if (type !== 'audit') {
      await sendTelegramMessage(`📢 *${title}*\n\n${message}`, 'both');
    }
  } catch (e: any) {
    console.error(`❌ [NOTIFICATION ERROR] Global notify failed: ${e.message}`);
  }
}
