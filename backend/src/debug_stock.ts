
import { supabase } from './supabase.js';

async function checkStock(symbol: string) {
  console.log(`🔍 Checking Supabase Data for ${symbol}...`);
  const { data, error } = await supabase.from('market_data').select('*').eq('symbol', symbol).single();
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('Symbol:', data.symbol);
  console.log('Data Keys:', Object.keys(data.data || {}));
  if (data.data?.quote) console.log('Quote:', JSON.stringify(data.data.quote, null, 2));
  if (data.data?.screener) console.log('Screener:', JSON.stringify(data.data.screener, null, 2));
}

const symbol = process.argv[2] || 'ASTRAZEN';
checkStock(symbol);
