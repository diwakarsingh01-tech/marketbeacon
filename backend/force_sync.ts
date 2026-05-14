import { runScreener } from './src/screener.js';
import { initDB } from './src/db.js';

async function forceSync() {
  console.log('Force Syncing Profit Basket...');
  await runScreener();
  console.log('Sync Complete.');
  process.exit(0);
}

forceSync();
