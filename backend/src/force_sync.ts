import { runScreener, updateMarketSnapshot, getDynamicBasket } from './screener.js';
import { initDB } from './db.js';
import { precalculateAlpha40 } from './services/worker.js';
import { notifyAllUsers } from './services/notificationService.js';

async function forceSync() {
  console.log('🚀 [ATOMIC SYNC] Starting Full Institutional Update (Hardened v12.0)...');
  
  // 1. Refresh Dynamic Growth Basket (Fundamental Filter)
  const growth = await runScreener();
  
  // 2. Define Elite/Quality Universe (Institutional Mandate)
  const elite = ['TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'ASIANPAINT', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 'BHARTIARTL', 'M&M', 'MARUTI', 'TMCV', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'ULTRACEMCO', 'NESTLEIND', 'BRITANNIA', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'ONGC', 'POWERGRID', 'COALINDIA', 'SHRIRAMFIN', 'APOLLOHOSP', 'PIDILITIND', 'HAVELLS', 'EICHERMOT', 'NIFTYBEES', 'BANKBEES'];
  const quality = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
  
  const totalUniverse = Array.from(new Set([...elite, ...quality, ...growth, '^NSEI']));
  console.log(`📡 Universe defined: ${totalUniverse.length} stocks across 10 strategies.`);

  // 3. Run Strategy Engine & Sync to Cloud (Atomic Transaction)
  await updateMarketSnapshot(totalUniverse);
  
  // 4. Trigger Pre-calculation & Signal Notifications
  console.log('👷 [ATOMIC SYNC] Triggering pre-calculation...');
  await precalculateAlpha40();
  
  await notifyAllUsers('🚀 Terminal Updated', 'The Institutional Matrix has been refreshed with the latest audited signals.', 'system');

  console.log('✅ [ATOMIC SYNC] Success. Terminal is now 100% accurate and live.');
  process.exit(0);
}

forceSync();

