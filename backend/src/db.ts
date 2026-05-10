import { createClient, Client } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

let db: any = null;
let tursoClient: Client | null = null;

export async function initDB() {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!tursoUrl || !tursoToken) {
    throw new Error('❌ Missing Turso Cloud credentials. Deployment requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  }

  console.log('☁️ Connecting to Turso Cloud Database...');
  tursoClient = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });
  
  // Create Tables for Turso (LibSQL)
  await tursoClient.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await tursoClient.execute(`
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
    }
  };
  console.log('✅ Connected to Turso!');
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}
