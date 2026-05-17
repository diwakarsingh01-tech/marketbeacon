import { createClient, Client } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

let db: any = null;
let tursoClient: Client | null = null;

export async function initDB() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.replace(/\s/g, '');
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.replace(/\s/g, '');

  if (!tursoUrl || !tursoToken) {
    console.log('🏠 No Turso credentials found. Using local SQLite (marketbeacon.db)...');
    tursoClient = createClient({
      url: 'file:marketbeacon.db',
    });
  } else {
    console.log('☁️ Connecting to Turso Cloud Database...');
    tursoClient = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }
  
  // Create Tables (Compatible with both Turso and Local LibSQL)
  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      tier TEXT DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS upgrade_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      requested_tier TEXT NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly',
      transaction_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Ensure new columns exist for existing databases
  const alterColumns = [
    'ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"',
    'ALTER TABLE users ADD COLUMN tier TEXT DEFAULT "free"',
    'ALTER TABLE upgrade_requests ADD COLUMN billing_cycle TEXT DEFAULT "monthly"'
  ];

  for (const sql of alterColumns) {
    try {
      await tursoClient.execute(sql);
    } catch (e) {
      // Ignore errors if columns already exist
    }
  }

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      buy_price REAL DEFAULT 0.0,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, symbol),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      rating INTEGER,
      disposition TEXT,
      comment TEXT,
      timestamp TEXT,
      url TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS analyst_reviews (
      symbol TEXT PRIMARY KEY,
      reason_bucket TEXT DEFAULT 'unknown',
      reason_text TEXT,
      reason_still_active BOOLEAN DEFAULT 1,
      future_growth_prospect BOOLEAN DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tursoClient.execute(`
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
  
  db = {
    get: async (sql: string, params: any[] = []) => {
      const result = await tursoClient!.execute({ sql, args: params });
      return result.rows[0] ? Object.fromEntries(result.columns.map((col, i) => [col, result.rows[0][i]])) : null;
    },
    all: async (sql: string, params: any[] = []) => {
      const result = await tursoClient!.execute({ sql, args: params });
      return result.rows.map(row => Object.fromEntries(result.columns.map((col, i) => [col, row[i]])));
    },
    run: async (sql: string, params: any[] = []) => {
      const result = await tursoClient!.execute({ sql, args: params });
      return { lastID: Number(result.lastInsertRowid) };
    },
    exec: async (sql: string) => {
      return await tursoClient!.execute(sql);
    },
    batch: async (queries: any[]) => {
      return await tursoClient!.batch(queries);
    }
  };
  console.log('✅ Connected to Turso!');
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}
