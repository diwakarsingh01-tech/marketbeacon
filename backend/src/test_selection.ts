import { getMarketSnapshot, getDynamicBasket, initSnapshotCache } from './screener.js';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { STRATEGIES, BASKETS, MANUAL_SECTOR_MAP } from './index.js';
import { initDB } from './db.js';

const STRATEGY_BASKET_MAP: Record<string, string[]> = {
  'ENVELOPE_LONG': ['Elite Basket'], 'ENVELOPE_SHORT': ['Elite Basket'], 'BOLLINGER': ['Elite Basket'],
  'CUP_HANDLE_ABCD': ['Elite Basket', 'Quality Basket'], 'RHS_ABCD': ['Elite Basket', 'Quality Basket'],
  'SMA_ABCD': ['Elite Basket', 'Quality Basket'], '52W_HIGH_LOW': ['Elite Basket'],
  'TWENTY_RALLY_RETEST': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'SIXTY_SEVEN_FUNDA': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'SR_STRATEGY': ['Elite Basket', 'Quality Basket', 'Growth Basket']
};

async function testSelection() {
  await initDB();
  await initSnapshotCache();
  const snapshot = getMarketSnapshot();
  const dynamicWealth = await getDynamicBasket();
  const currentWealth = (Array.isArray(dynamicWealth) && dynamicWealth.length > 0) ? dynamicWealth : [];

  const processBasket = async (basketName: string, symbols: string[]) => {
    const active: any[] = [];
    for (const sym of symbols) {
      try {
        const snap = snapshot[sym];
        if (!snap || !snap.quotes?.length) continue;
        
        const audit = await validateBatch9(sym, snap, basketName);
        if (!audit || !audit?.isPass) continue;

        const marketCap = snap.quote.marketCap || 1;
        const capCr = marketCap / 10000000;
        const capType = capCr >= 45000 ? 'LARGE' : (capCr >= 15000 ? 'MID' : 'SMALL');
        const last = snap.quotes[snap.quotes.length - 1];

        for (const stratId of Object.keys(STRATEGY_BASKET_MAP)) {
          if (!STRATEGY_BASKET_MAP[stratId]?.includes(basketName)) continue;
          const sd: any = runStrategyAnalysis(stratId, snap, marketCap, basketName);
          if (!sd || !sd?.isBuyZone) continue;

          const entry = sd?.entryPrice || last?.close;
          const target = sd?.target || (entry * 1.3);
          const isMovingUp = last?.close >= entry;
          const priceDeviation = Math.abs(((last?.close / entry) - 1) * 100);
          
          if (isMovingUp && priceDeviation > 20.0) continue; 
          else if (!isMovingUp && priceDeviation > 30.0) continue;

          active.push({
            symbol: sym,
            basketSource: basketName,
            capType,
            sector: (MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General').trim(),
            score: audit.score,
            roi: ((target / entry) - 1) * 100
          });
          break; 
        }
      } catch (e) { }
    }
    return active;
  };

  const bc = await processBasket('Elite Basket', BASKETS['Elite Basket']);
  const hb = await processBasket('Quality Basket', BASKETS['Quality Basket']);
  const wb = await processBasket('Growth Basket', currentWealth);

  // Deduplicate
  const dedupeMap = new Map<string, any>();
  [...bc, ...hb, ...wb].forEach(s => {
    if (!dedupeMap.has(s.symbol) || s.score > dedupeMap.get(s.symbol).score) {
      dedupeMap.set(s.symbol, s);
    }
  });
  const allActive = Array.from(dedupeMap.values());

  const selectWithRules = (candidates: any[], targetCount: number, existingSectors: Record<string, number>) => {
    const selected: any[] = [];
    const sorted = candidates.sort((a, b) => (b.score - a.score) || (b.roi - a.roi));
    for (const s of sorted) {
      if (selected.length >= targetCount) break;
      const sector = s.sector || 'General';
      const sectorCount = existingSectors[sector] || 0;
      if (sectorCount < 10) {
        selected.push(s);
        existingSectors[sector] = sectorCount + 1;
      }
    }
    return selected;
  };

  const sectorUsage: Record<string, number> = {};
  const finalLarge = selectWithRules(allActive.filter(s => s.capType === 'LARGE'), 25, sectorUsage);
  const finalMid = selectWithRules(allActive.filter(s => s.capType === 'MID'), 15, sectorUsage);
  const finalSmall = selectWithRules(allActive.filter(s => s.capType === 'SMALL'), 10, sectorUsage);
  const finalActive = [...finalLarge, ...finalMid, ...finalSmall];

  console.log('\n--- TEST SELECTION RESULTS ---');
  console.log(`Total Active Selected: ${finalActive.length}`);
  console.log(`Large: ${finalLarge.length}, Mid: ${finalMid.length}, Small: ${finalSmall.length}`);
  console.log(`Sector Usage:`, sectorUsage);
  
  finalActive.forEach((s, idx) => {
    console.log(`${(idx + 1).toString().padStart(2)}: ${s.symbol.padEnd(12)} | Cap: ${s.capType.padEnd(6)} | Sector: ${s.sector.padEnd(25)} | Score: ${s.score}`);
  });
}

testSelection();
