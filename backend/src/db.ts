import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createLibsqlClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Environment Hardening ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// Try loading local .env, but don't fail if missing (expected in production/Docker)
dotenv.config();
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Safely initialize Supabase only if credentials exist
export const supabase = (supabaseUrl && supabaseKey) 
  ? createSupabaseClient(supabaseUrl, supabaseKey)
  : null as any;

let db: any = null;
let tursoClient: any = null;

export async function initDB() {
  const tursoUrl = (process.env.TURSO_DATABASE_URL || '').replace(/\s/g, '');
  const tursoToken = (process.env.TURSO_AUTH_TOKEN || '').replace(/\s/g, '');

  if (!tursoUrl || !tursoToken) {
    console.log('🏠 No Turso credentials found. Using local SQLite (marketbeacon.db)...');
    tursoClient = createLibsqlClient({
      url: 'file:marketbeacon.db',
    });
  } else {
    console.log('☁️ Connecting to Turso Cloud Database...');
    tursoClient = createLibsqlClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }

  // Create Tables (Compatible with both Turso and Local LibSQL)
  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      mobile TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      tier TEXT DEFAULT 'free',
      subscription_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS upgrade_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      requested_tier TEXT NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly',
      transaction_id TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS stock_snapshots (
      symbol TEXT PRIMARY KEY,
      data JSON NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ensure new columns exist for existing databases
  const alterColumns = [
    'ALTER TABLE users ADD COLUMN role TEXT DEFAULT "user"',
    'ALTER TABLE users ADD COLUMN tier TEXT DEFAULT "free"',
    'ALTER TABLE users ADD COLUMN mobile TEXT UNIQUE',
    'ALTER TABLE users ADD COLUMN subscription_expiry DATETIME',
    'ALTER TABLE users ADD COLUMN subscription_start DATETIME',
    'ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1',
    'ALTER TABLE upgrade_requests ADD COLUMN billing_cycle TEXT DEFAULT "monthly"',
    'ALTER TABLE trades ADD COLUMN target_price REAL',
    'ALTER TABLE trades ADD COLUMN stop_loss REAL',
    `CREATE TABLE IF NOT EXISTS vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      tier TEXT DEFAULT "alpha",
      duration_days INTEGER DEFAULT 7,
      max_uses INTEGER DEFAULT 100,
      current_uses INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS voucher_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER,
      user_id INTEGER,
      redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voucher_id) REFERENCES vouchers (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(voucher_id, user_id)
    )`
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

  console.log('✅ SQLite/Turso Integration Active!');
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

