import { initDB, getDB } from './db.js';
import bcrypt from 'bcryptjs';

async function updatePassword() {
  await initDB();
  const db = getDB();
  const newPassword = 'admin12345';
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  console.log(`Hashed password: ${hashedPassword}`);
  
  const users = await db.all('SELECT id, name, email, role, tier FROM users');
  console.log('All Users in DB:', users);
}

updatePassword().catch(console.error);
