import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve('/Users/diwakarsingh/supertracker-replica/backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['users', 'market_data', 'historical_quotes', 'active_signals', 'payments', 'watchlists', 'watchlist', 'trades', 'vouchers', 'voucher_redemptions', 'feedback'];
  console.log('Checking tables in Supabase...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table "${table}": error: ${error.message}`);
      } else {
        console.log(`✅ Table "${table}": exists! (columns: ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'unknown/empty'})`);
      }
    } catch (e) {
      console.log(`❌ Table "${table}": threw exception: ${e.message}`);
    }
  }
}

checkTables();
