import { getMarketSnapshot, getDynamicBasket } from '../screener.js';
import { validateBatch9 } from './fundamentalAudit.js';
import { runStrategyAnalysis } from './strategyService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALPHA_40_CACHE_PATH = path.join(__dirname, '../alpha_40_cache.json');

const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Institutional Floor' },
  { id: 'ENVELOPE_SHORT', name: 'Momentum Ceiling' },
  { id: 'BOLLINGER', name: 'Volatility Channel' },
  { id: 'CUP_HANDLE_ABCD', name: 'Structural Pivot' },
  { id: 'RHS_ABCD', name: 'Dynamic Reversal' },
  { id: 'SMA_ABCD', name: 'SMA-ABCD' },
  { id: '52W_HIGH_LOW', name: '52W High/Low' },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest' },
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Deep Recovery Audit' },
  { id: 'SR_STRATEGY', name: 'Supply-Demand Core' }
];

const BASKETS: Record<string, string[]> = {
  'SUPER_45': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK'
  ],
  'GOOD_45': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ]
};

const STRATEGY_BASKET_MAP: Record<string, string[]> = {
  'ENVELOPE_LONG': ['SUPER_45'], 'ENVELOPE_SHORT': ['SUPER_45'], 'BOLLINGER': ['SUPER_45'],
  'CUP_HANDLE_ABCD': ['SUPER_45', 'GOOD_45'], 'RHS_ABCD': ['SUPER_45', 'GOOD_45'],
  'SMA_ABCD': ['SUPER_45', 'GOOD_45'], '52W_HIGH_LOW': ['SUPER_45', 'GOOD_45'],
  'TWENTY_RALLY_RETEST': ['SUPER_45', 'GOOD_45', 'GOOD_200'],
  'SIXTY_SEVEN_FUNDA': ['SUPER_45', 'GOOD_45', 'GOOD_200'],
  'SR_STRATEGY': ['SUPER_45', 'GOOD_45', 'GOOD_200']
};

export async function precalculateAlpha40() {
  console.log('👷 [WORKER] Pre-calculating Alpha-40 Snapshots...');
  try {
    const snapshot = getMarketSnapshot();
    const dynamicWealth = getDynamicBasket();
    const currentWealth = (Array.isArray(dynamicWealth) && dynamicWealth.length > 0) ? dynamicWealth : [];

    const processBasket = async (basketName: string, symbols: string[]) => {
      const active: any[] = [];
      const closed: any[] = [];
      
      for (const sym of symbols) {
        try {
          const snap = snapshot[sym];
          if (!snap || !snap.quotes?.length) continue;
          
          const audit = await validateBatch9(sym, snap, basketName);
          if (!audit.isPass) continue;

          const marketCap = snap.quote.marketCap || 1;
          const capCr = marketCap / 10000000;
          const capType = capCr >= 45000 ? 'LARGE' : (capCr >= 15000 ? 'MID' : 'SMALL');
          const last = snap.quotes[snap.quotes.length - 1];

          // 1. Closed Trades Simulation (Historical Profit Booking)
          let peak = 0;
          let inDrawdown = false;
          let simEntry = 0;
          let simEntryDate = '';
          
          for (let i = 0; i < snap.quotes.length - 10; i++) {
            const q = snap.quotes[i];
            if (q.high > peak) peak = q.high;
            if (!inDrawdown && q.close <= peak * 0.75) {
              inDrawdown = true;
              simEntry = q.close;
              simEntryDate = new Date(q.date).toISOString();
            }
            if (inDrawdown && q.high >= simEntry * 1.30) {
              const exitDate = new Date(q.date);
              const days = Math.round((exitDate.getTime() - new Date(simEntryDate).getTime()) / (1000*3600*24));
              if (days > 10 && days < 500) {
                closed.push({
                  symbol: sym,
                  entryTime: simEntryDate,
                  exitDate: exitDate.toISOString(),
                  days,
                  roi: ((q.high / simEntry) - 1) * 100,
                  score: audit.score
                });
              }
              inDrawdown = false;
              peak = q.high;
            }
          }

          // 2. Active Signals Analysis
          for (const stratId of Object.keys(STRATEGY_BASKET_MAP)) {
            if (!STRATEGY_BASKET_MAP[stratId]?.includes(basketName)) continue;
            
            const sd = snap.strategies?.[stratId] || runStrategyAnalysis(stratId, snap, marketCap);
            if (!sd || !sd.isBuyZone) continue;

            const entry = sd.entryPrice || last.close;
            const target = sd.target || (entry * 1.3);
            const isMovingUp = last.close >= entry;
            const priceDeviation = Math.abs(((last.close / entry) - 1) * 100);
            
            if (isMovingUp && priceDeviation > 2.0) continue; 
            else if (!isMovingUp && priceDeviation > 30.0) continue;

            let entryTime = sd.triggerDate;
            if (!entryTime && snap.quotes.length > 0) {
              entryTime = new Date(snap.quotes[0].date).toISOString().split('T')[0];
            }

            active.push({ 
              symbol: sym, 
              stockName: sym, // Can be improved with a name map if available
              strategy: STRATEGIES.find(s=>s.id===stratId)?.name || stratId, 
              basketSource: basketName, 
              capType, 
              currentPrice: last.close, 
              entryPrice: entry, 
              entryTime,
              target, 
              roi: ((target / entry) - 1) * 100, 
              score: audit.score, 
              smartMoney: audit.smartMoneyTotal 
            });
            break; 
          }
        } catch (e) { }
      }
      return { active, closed };
    };

    const bc = await processBasket('SUPER_45', BASKETS['SUPER_45']);
    const hb = await processBasket('GOOD_45', BASKETS['GOOD_45']);
    const wb = await processBasket('GOOD_200', currentWealth);

    const allActive = [...(bc.active || []), ...(hb.active || []), ...(wb.active || [])];
    const allClosed = [...(bc.closed || []), ...(hb.closed || []), ...(wb.closed || [])];

    // Dynamic Allocation (50-30-20)
    const sorted = allActive.sort((a,b) => (b.score - a.score) || (b.roi - a.roi));
    const finalActive = sorted.slice(0, 50); 

    const capStats = { LARGE: 0, MID: 0, SMALL: 0 };
    finalActive.forEach(s => {
      if (s.capType === 'LARGE') capStats.LARGE++;
      else if (s.capType === 'MID') capStats.MID++;
      else if (s.capType === 'SMALL') capStats.SMALL++;
    });

    const results = {
      active: finalActive,
      closed: allClosed,
      capStats,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(ALPHA_40_CACHE_PATH, JSON.stringify(results, null, 2));
    console.log('✅ [WORKER] Alpha-40 Cache Updated.');
  } catch (e: any) {
    console.error('❌ [WORKER] Alpha-40 Pre-calculation Failed:', e.message);
  }
}

export function getAlpha40Cache() {
  try {
    if (fs.existsSync(ALPHA_40_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(ALPHA_40_CACHE_PATH, 'utf-8'));
    }
  } catch (e) { }
  return null;
}
