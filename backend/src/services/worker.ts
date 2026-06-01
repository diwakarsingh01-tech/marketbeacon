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
  'Bluechip': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK'
  ],
  'High Beta': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ]
};

const STRATEGY_BASKET_MAP: Record<string, string[]> = {
  'ENVELOPE_LONG': ['Bluechip'], 'ENVELOPE_SHORT': ['Bluechip'], 'BOLLINGER': ['Bluechip'],
  'CUP_HANDLE_ABCD': ['Bluechip', 'High Beta'], 'RHS_ABCD': ['Bluechip', 'High Beta'],
  'SMA_ABCD': ['Bluechip', 'High Beta'], '52W_HIGH_LOW': ['Bluechip', 'High Beta'],
  'TWENTY_RALLY_RETEST': ['Bluechip', 'High Beta', 'Wealth Universe'],
  'SIXTY_SEVEN_FUNDA': ['Bluechip', 'High Beta', 'Wealth Universe'],
  'SR_STRATEGY': ['Bluechip', 'High Beta', 'Wealth Universe']
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
          
          // ... rest of logic
        } catch (e) {}
      }
      return { active, closed };
    }

    const bc = await processBasket('Bluechip', BASKETS['Bluechip']);
    const hb = await processBasket('High Beta', BASKETS['High Beta']);
    const wb = await processBasket('Wealth Universe', currentWealth);

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
