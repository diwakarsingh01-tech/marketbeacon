import { initDB } from './db.js';
import { initSnapshotCache, updateMarketSnapshot, getMarketSnapshot } from './screener.js';
import { precalculateAlpha40 } from './services/worker.js';
import fs from 'fs';
import path from 'path';

async function refresh() {
  console.log('🔄 Manually Refreshing Alpha Hub & Scraping Missing Symbols...');
  await initDB();
  await initSnapshotCache();
  
  const missingSymbols = [
    'LT', 'BHARTIARTL', 'M&M', 'TMCV', 'ADANIPORTS', 
    'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'POWERGRID', 
    'SHRIRAMFIN', 'APOLLOHOSP'
  ];
  
  console.log(`Scraping missing symbols: ${missingSymbols.join(', ')}...`);
  await updateMarketSnapshot(missingSymbols);
  
  const cache = getMarketSnapshot();
  console.log(`Saving updated cache with ${Object.keys(cache).length} symbols to disk...`);
  
  const fileContent = JSON.stringify(cache);
  
  // Write to all possible paths
  const pathsToTry = [
    path.resolve(process.cwd(), 'market_snapshot.json'),
    path.resolve(process.cwd(), 'backend', 'market_snapshot.json'),
    path.resolve(process.cwd(), 'backend/src/market_snapshot.json')
  ];
  
  for (const p of pathsToTry) {
    try {
      fs.writeFileSync(p, fileContent, 'utf8');
      console.log(`💾 Saved snapshot to: ${p}`);
    } catch (e: any) {
      console.error(`⚠️ Failed to write snapshot to ${p}: ${e.message}`);
    }
  }
  
  await precalculateAlpha40();
  console.log('✅ Refresh and Sync Complete.');
}

refresh();
