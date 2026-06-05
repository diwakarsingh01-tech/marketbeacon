import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

let db: any = null;

export async function initDB() {
  console.log('☁️ Connecting to Supabase (PostgreSQL)...');

  db = {
    get: async (sql: string, params: any[] = []) => {
      // Very basic SQL to Supabase mapper for common queries
      // In production, we'll refactor these to use the Supabase client directly
      if (sql.includes('SELECT') && sql.includes('FROM users WHERE id = ?')) {
        const { data } = await supabase.from('users').select('*').eq('id', params[0]).single();
        return data;
      }
      if (sql.includes('SELECT') && sql.includes('FROM users WHERE email = ?')) {
        const { data } = await supabase.from('users').select('*').eq('email', params[0]).single();
        return data;
      }
      return null;
    },
    all: async (sql: string, params: any[] = []) => {
      if (sql.includes('SELECT * FROM users')) {
        const { data } = await supabase.from('users').select('*');
        return data || [];
      }
      if (sql.includes('SELECT * FROM watchlists WHERE user_id = ?')) {
        const { data } = await supabase.from('watchlists').select('*').eq('user_id', params[0]);
        return data || [];
      }
      return [];
    },
    run: async (sql: string, params: any[] = []) => {
      if (sql.includes('INSERT INTO feedback')) {
        const { data, error } = await supabase.from('feedback').insert({
          user_id: params[0],
          rating: params[1],
          comment: params[2],
          url: params[3]
        }).select();
        return { lastID: data?.[0]?.id };
      }
      if (sql.includes('INSERT INTO users')) {
        const { data, error } = await supabase.from('users').insert({
          name: params[0],
          email: params[1],
          password: params[2],
          role: params[3],
          tier: params[4],
          is_active: params[5] === 1
        }).select();
        return { lastID: data?.[0]?.id };
      }
      if (sql.includes('UPDATE users SET role')) {
        await supabase.from('users').update({ 
          role: params[0], 
          tier: params[1] 
        }).eq('id', params[2]);
        return { changes: 1 };
      }
      return { lastID: null };
    }
  };

  console.log('✅ Supabase Integration Active!');
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

export { supabase };
