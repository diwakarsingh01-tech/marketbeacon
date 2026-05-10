import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, Client } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../marketbeacon.db');

let db: any = null;
let tursoClient: any = null;

export async function initDB() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    console.log('☁️ Connecting to Turso Cloud Database...');
    tursoClient = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    
    // Create Tables for Turso
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
  } else {
    console.log('📂 Using Local SQLite Database...');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS watchlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        buy_price REAL DEFAULT 0.0,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, symbol),
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

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
      );
    `);
    console.log('✅ SQLite Database Initialized at', dbPath);
  }
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}
