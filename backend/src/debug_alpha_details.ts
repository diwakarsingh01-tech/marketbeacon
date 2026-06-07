import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pathsToTry = [
  path.resolve(process.cwd(), 'alpha_40_results.json'),
  path.resolve(process.cwd(), 'backend', 'alpha_40_results.json'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../alpha_40_results.json'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../alpha_40_results.json'),
];

let cachePath = '';
for (const p of pathsToTry) {
  if (fs.existsSync(p)) {
    cachePath = p;
    break;
  }
}

if (!cachePath) {
  console.error('❌ Could not find alpha_40_results.json');
  process.exit(1);
}

console.log(`Loading cache from: ${cachePath}`);
const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

console.log('\n--- PORTFOLIO SUMMARY ---');
console.log(`Updated At: ${data.updatedAt}`);
console.log(`Total Active Stocks: ${data.active.length}`);
console.log(`Cap Stats:`, data.capStats);
console.log(`Sector Stats:`, data.sectorStats);

console.log('\n--- ACTIVE STOCKS ---');
data.active.forEach((s: any, idx: number) => {
  console.log(`${(idx + 1).toString().padStart(2)}: ${s.symbol.padEnd(12)} | Cap: ${s.capType.padEnd(6)} | Sector: ${s.sector.padEnd(25)} | Score: ${s.score} | ROI: ${s.roi.toFixed(1)}% | Source: ${s.basketSource}`);
});
