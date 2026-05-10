import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../marketbeacon.db');

async function migrate() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error('❌ Missing Turso credentials in .env');
    return;
  }

  console.log('🚀 Starting Migration to Turso...');

  // 1. Connect to Local DB
  const localDb = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // 2. Connect to Turso
  const turso = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  // 3. Setup Tables on Turso first
  console.log('🛠️ Setting up tables on Turso...');
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      buy_price REAL DEFAULT 0.0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol),
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      status TEXT DEFAULT 'OPEN',
      entry_date TEXT NOT NULL,
      entry_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      target_price REAL,
      stop_loss REAL,
      level TEXT DEFAULT 'A',
      exit_date TEXT,
      exit_price REAL,
      strategy TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 4. Migrate Users
  console.log('👥 Migrating Users...');
  const users = await localDb.all('SELECT * FROM users');
  for (const user of users) {
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO users (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [user.id, user.name, user.email, user.password, user.created_at]
    });
  }

  // 5. Migrate Watchlists
  console.log('📋 Migrating Watchlists...');
  const watchlists = await localDb.all('SELECT * FROM watchlists');
  for (const item of watchlists) {
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO watchlists (id, user_id, symbol, quantity, buy_price, added_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [item.id, item.user_id, item.symbol, item.quantity, item.buy_price, item.added_at]
    });
  }

  // 6. Migrate Trades
  console.log('📈 Migrating Trades...');
  const trades = await localDb.all('SELECT * FROM trades');
  for (const trade of trades) {
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO trades (id, user_id, symbol, status, entry_date, entry_price, quantity, target_price, stop_loss, level, exit_date, exit_price, strategy, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        trade.id, trade.user_id, trade.symbol, trade.status, trade.entry_date, 
        trade.entry_price, trade.quantity, trade.target_price, trade.stop_loss, 
        trade.level, trade.exit_date, trade.exit_price, trade.strategy, trade.notes, trade.created_at
      ]
    });
  }

  console.log('✅ Migration Successful!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration Failed:', err);
  process.exit(1);
});
