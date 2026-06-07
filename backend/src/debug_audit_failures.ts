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

async function run() {
  await initDB();
  await initSnapshotCache();
  const snapshot = getMarketSnapshot();
  const dynamicWealth = await getDynamicBasket();
  const currentWealth = (Array.isArray(dynamicWealth) && dynamicWealth.length > 0) ? dynamicWealth : [];

  const auditFailures: any[] = [];
  const buyZoneFailures: any[] = [];
  const deviationFailures: any[] = [];
  const passedCandidates: any[] = [];

  const analyze = async (basketName: string, symbols: string[]) => {
    for (const sym of symbols) {
      try {
        const snap = snapshot[sym];
        if (!snap || !snap.quotes?.length) continue;
        
        const marketCap = snap.quote.marketCap || 1;
        const capCr = marketCap / 10000000;
        const capType = capCr >= 45000 ? 'LARGE' : (capCr >= 15000 ? 'MID' : 'SMALL');
        
        // 1. Audit check
        const audit = await validateBatch9(sym, snap, basketName);
        if (!audit || !audit?.isPass) {
          auditFailures.push({ symbol: sym, capType, basketName, score: audit?.score, reason: audit?.reason });
          continue;
        }

        // 2. Buy zone check
        let hasBuyZone = false;
        let last = snap.quotes[snap.quotes.length - 1];
        let hasPriceDeviationPass = false;
        let details = '';

        for (const stratId of Object.keys(STRATEGY_BASKET_MAP)) {
          if (!STRATEGY_BASKET_MAP[stratId]?.includes(basketName)) continue;
          const sd: any = runStrategyAnalysis(stratId, snap, marketCap, basketName);
          if (sd && sd?.isBuyZone) {
            hasBuyZone = true;
            const entry = sd?.entryPrice || last?.close;
            const isMovingUp = last?.close >= entry;
            const priceDeviation = Math.abs(((last?.close / entry) - 1) * 100);
            
            const limit = isMovingUp ? 20.0 : 30.0;
            if (priceDeviation <= limit) {
              hasPriceDeviationPass = true;
              break;
            } else {
              details = `${stratId}: Deviation ${priceDeviation.toFixed(1)}% (Limit ${limit}%)`;
            }
          }
        }

        if (!hasBuyZone) {
          buyZoneFailures.push({ symbol: sym, capType, basketName, score: audit.score });
        } else if (!hasPriceDeviationPass) {
          deviationFailures.push({ symbol: sym, capType, basketName, score: audit.score, details });
        } else {
          passedCandidates.push({ symbol: sym, capType, basketName, score: audit.score });
        }
      } catch (e) {}
    }
  };

  await analyze('Elite Basket', BASKETS['Elite Basket']);
  await analyze('Quality Basket', BASKETS['Quality Basket']);
  await analyze('Growth Basket', currentWealth);

  console.log('\n--- DIAGNOSTICS REPORT ---');
  console.log(`Passed Candidates:     ${passedCandidates.length}`);
  console.log(`Audit Failures:        ${auditFailures.length}`);
  console.log(`Buy Zone Failures:     ${buyZoneFailures.length}`);
  console.log(`Deviation Failures:    ${deviationFailures.length}`);

  console.log('\n--- AUDIT FAILURES FOR MID/SMALL CAPS ---');
  auditFailures.filter(x => x.capType !== 'LARGE').forEach(x => {
    console.log(`  ${x.symbol.padEnd(12)} | ${x.capType.padEnd(5)} | Basket: ${x.basketName.padEnd(15)} | Score: ${x.score} | Reason: ${x.reason}`);
  });

  console.log('\n--- DEVIATION FAILURES FOR MID/SMALL CAPS ---');
  deviationFailures.filter(x => x.capType !== 'LARGE').forEach(x => {
    console.log(`  ${x.symbol.padEnd(12)} | ${x.capType.padEnd(5)} | Basket: ${x.basketName.padEnd(15)} | Score: ${x.score} | Details: ${x.details}`);
  });
}

run();
