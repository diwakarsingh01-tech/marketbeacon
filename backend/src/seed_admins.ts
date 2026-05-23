
import { initDB, getDB } from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  await initDB();
  const db = getDB();
  
  const admins = [
    { name: 'Ajay Thomas John', email: 'ajaythomasjohn@gmail.com' },
    { name: 'Admin MarketBeacon', email: 'admin@marketbeacon.com' },
    { name: 'Diwakar Singh', email: 'diwakarsingh01.tech@gmail.com' }
  ];

  for (const admin of admins) {
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [admin.email]);
    if (!existing) {
      console.log(`Seeding Admin: ${admin.name}`);
      await db.run(
        'INSERT INTO users (name, email, password, role, tier, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [admin.name, admin.email, 'GOOGLE', 'admin', 'alpha', 1]
      );
    }
  }

  // Check total count
  const total = await db.all('SELECT id FROM users');
  console.log(`Total users in DB: ${total.length}`);
}

seed().catch(console.error);
