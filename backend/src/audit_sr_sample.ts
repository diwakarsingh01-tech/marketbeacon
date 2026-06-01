import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mocking Strategy logic locally for the sample audit to avoid module resolution issues
function calculateSRStrategy(quotes: any[]) {
  if (!quotes || quotes.length < 500) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const window = 10;
  const pivotLows: any[] = [];
  const pivotHighs: any[] = [];
  
  for (let i = window; i < quotes.length - window; i++) {
    const lowSlice = quotes.slice(i - window, i + window + 1).map((q: any) => q.low);
    const highSlice = quotes.slice(i - window, i + window + 1).map((q: any) => q.high);
    if (quotes[i].low === Math.min(...lowSlice)) pivotLows.push({ price: quotes[i].low, date: quotes[i].date });
    if (quotes[i].high === Math.max(...highSlice)) pivotHighs.push({ price: quotes[i].high, date: quotes[i].date });
  }

  const cluster = (pivots: any[], tolerance: number = 0.04) => {
    const zones: any[] = [];
    for (const p of pivots) {
      let found = false;
      for (const z of zones) {
        if (Math.abs(p.price - z.mid) / z.mid <= tolerance) {
          z.mid = (z.mid * z.touches + p.price) / (z.touches + 1);
          z.touches++;
          z.dates.push(p.date.split('T')[0]);
          z.prices.push(p.price.toFixed(2));
          found = true;
          break;
        }
      }
      if (!found) zones.push({ mid: p.price, touches: 1, dates: [p.date.split('T')[0]], prices: [p.price.toFixed(2)] });
    }
    return zones;
  };

  const supportZones = cluster(pivotLows).filter(z => z.touches >= 2);
  const resistanceZones = cluster(pivotHighs);
  const activeSupport = supportZones.find(z => Math.abs(currentPrice - z.mid) / z.mid <= 0.05);
  if (!activeSupport) return { isBuyZone: false, supportZones, resistanceZones };

  const nearestResistance = resistanceZones
    .filter(z => z.mid > activeSupport.mid)
    .sort((a, b) => a.mid - b.mid)[0];
    
  if (!nearestResistance || (nearestResistance.mid / activeSupport.mid - 1) < 0.30) {
    return { isBuyZone: false, activeSupport, nearestResistance, supportZones, resistanceZones };
  }

  return {
    isBuyZone: true,
    entryPrice: Math.round(activeSupport.mid),
    target: Math.round(nearestResistance.mid),
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSupport.lastDate,
    activeSupport,
    nearestResistance,
    supportZones,
    resistanceZones
  };
}

async function runAudit() {
  console.log('🛡️ [STRATEGY #10 AUDIT] Extracting Empirical Data...');
  
  const snapshotPath = path.join(__dirname, '../market_snapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    console.error('❌ Snapshot not found at:', snapshotPath);
    return;
  }
  
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  
  const sampleSymbols = [
    'KOTAKBANK', 'TCS', 'RELAXO', 'HDFCBANK', 'INFY', 
    'ITC', 'ASIANPAINT', 'COLPAL', 'DABUR', 'WIPRO'
  ];

  for (const sym of sampleSymbols) {
    const data = snapshot[`${sym}.NS`] || snapshot[sym];
    if (!data || !data.quotes) {
      console.log(`❌ ${sym}: No data found`);
      continue;
    }

    const quotes = data.quotes;
    const srResult: any = calculateSRStrategy(quotes);

    console.log(`\n--- ${sym} ---`);
    console.log(`CMP: ₹${quotes[quotes.length-1].close.toFixed(2)}`);
    
    // Sort support zones by touches to show the strongest one
    const topSupport = (srResult.supportZones || []).sort((a: any, b: any) => b.touches - a.touches)[0];
    console.log(`  🟢 Strongest Support Cluster: ₹${topSupport?.mid.toFixed(2) || 'N/A'}`);
    if (topSupport) {
      console.log(`     Touches: ${topSupport.touches}`);
      console.log(`     History: ${topSupport.dates.join(', ')}`);
      console.log(`     Values:  ₹${topSupport.prices.join(', ₹')}`);
    }

    const topResistance = (srResult.resistanceZones || []).sort((a: any, b: any) => b.touches - a.touches)[0];
    console.log(`  🔴 Strongest Resistance Cluster: ₹${topResistance?.mid.toFixed(2) || 'N/A'}`);
    if (topResistance) {
      console.log(`     Touches: ${topResistance.touches}`);
      console.log(`     History: ${topResistance.dates.join(', ')}`);
      console.log(`     Values:  ₹${topResistance.prices.join(', ₹')}`);
    }
    
    console.log(`  📊 Audit Result: ${srResult.isBuyZone ? '✅ QUALIFIED' : '🔍 MONITORING'}`);
    if (srResult.isBuyZone) {
      console.log(`     Entry: ₹${srResult.entryPrice} | Target: ₹${srResult.target} | Upside: ${(((srResult.target/srResult.entryPrice)-1)*100).toFixed(1)}%`);
    } else if (srResult.activeSupport) {
      console.log(`     Near Support: ₹${srResult.activeSupport.mid.toFixed(2)} | Nearest Resistance: ₹${srResult.nearestResistance?.mid.toFixed(2) || 'N/A'}`);
    }
  }
}

runAudit();
