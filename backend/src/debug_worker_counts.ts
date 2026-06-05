
import { getMarketSnapshot, getDynamicBasket, initSnapshotCache } from './screener.js';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { STRATEGIES, BASKETS } from './index.js';
import { supabase, initDB } from './db.js';

const STRATEGY_BASKET_MAP: Record<string, string[]> = {
  'ENVELOPE_LONG': ['Elite Basket'], 'ENVELOPE_SHORT': ['Elite Basket'], 'BOLLINGER': ['Elite Basket'],
  'CUP_HANDLE_ABCD': ['Elite Basket', 'Quality Basket'], 'RHS_ABCD': ['Elite Basket', 'Quality Basket'],
  'SMA_ABCD': ['Elite Basket', 'Quality Basket'], '52W_HIGH_LOW': ['Elite Basket'],
  'TWENTY_RALLY_RETEST': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'SIXTY_SEVEN_FUNDA': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'SR_STRATEGY': ['Elite Basket', 'Quality Basket', 'Growth Basket']
};

async function debugWorker() {
  console.log('👷 [DEBUG] Pre-calculating Alpha-40 Snapshots...');
  try {
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
            
            if (isMovingUp && priceDeviation > 10.0) continue; 
            else if (!isMovingUp && priceDeviation > 30.0) continue;

            active.push({ symbol: sym, capType, score: audit.score, roi: ((target / entry) - 1) * 100, sector: (snap.screener?.industry || 'General').trim() });
            break; 
          }
        } catch (e) { }
      }
      return active;
    };

    const bc = await processBasket('Elite Basket', BASKETS['Elite Basket']);
    const hb = await processBasket('Quality Basket', BASKETS['Quality Basket']);
    const wb = await processBasket('Growth Basket', currentWealth);

    const allActive = [...bc, ...hb, ...wb];
    console.log(`Total Candidates: ${allActive.length}`);
    console.log(`Large: ${allActive.filter(s => s.capType === 'LARGE').length}`);
    console.log(`Mid: ${allActive.filter(s => s.capType === 'MID').length}`);
    console.log(`Small: ${allActive.filter(s => s.capType === 'SMALL').length}`);

  } catch (e: any) {
    console.error('❌ [DEBUG] Failed:', e.message);
  }
}

debugWorker();
