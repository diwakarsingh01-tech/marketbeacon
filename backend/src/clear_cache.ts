
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKET_SNAPSHOT_PATH = path.join(__dirname, '../market_snapshot.json');

async function clearStaleStrategyCache() {
  console.log('🧹 Clearing stale strategy data from market_snapshot.json...');

  if (!fs.existsSync(MARKET_SNAPSHOT_PATH)) {
    console.error('❌ Snapshot not found.');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(MARKET_SNAPSHOT_PATH, 'utf8'));
  let clearedCount = 0;

  for (const sym of Object.keys(snapshot)) {
    if (snapshot[sym].strategies) {
      delete snapshot[sym].strategies; // Force recalculation
      clearedCount++;
    }
  }

  fs.writeFileSync(MARKET_SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  console.log(`✅ Cleared stale strategy cache for ${clearedCount} symbols.`);
}

clearStaleStrategyCache();
