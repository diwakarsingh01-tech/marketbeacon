import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data, error } = await supabase.from('market_data').select('*').limit(1);
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Row data:', data);
    }
  } catch (err: any) {
    console.error('Catch error:', err);
  }
}

test();
