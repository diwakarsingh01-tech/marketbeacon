
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { runStrategyAnalysis } from './services/strategyService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKET_SNAPSHOT_PATH = path.join(__dirname, '../market_snapshot.json');

const BASKETS: Record<string, string[]> = {
  'H-Super45': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 
    'NIFTYBEES', 'BANKBEES'
  ],
  'H-GOOD45': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ],
  'H-Good200': [
    "SPARC", "IEX", "TATAELXSI", "CAMS", "CHENNPETRO", "THYROCARE", "ECLERX", "SONATSOFTW", "EMAMILTD", "TRITURBINE", 
    "GODFRYPHLP", "AJANTPHARM", "BAJAJCON", "CDSL", "CRISIL", "SHARDACROP", "NBCC", "ENGINERSIN", "KFINTECH", "JAMNAAUTO", 
    "ELGIEQUIP", "LTTS", "TANLA", "GPPL", "KPITTECH", "CHAMBLFERT", "NAVINFLUOR", "NEWGEN", "WELCORP", "JBCHEPHARM", 
    "BBTC", "JYOTHYLAB", "GESHIP", "PETRONET", "MPHASIS", "ZENSARTECH", "HSCL", "GRINDWELL", "BLUESTARCO", "AIAENG", 
    "NATCOPHARM", "REDINGTON", "IFBIND", "ICRA", "KPRMILL", "IPCALAB", "WABAG", "RITES", "ENDURANCE", "J&KBANK", 
    "SUNDRMFAST", "SKFINDIA", "NESCO", "EIHOTEL", "ASTRAL", "TIMKEN", "IGL", "GRANULES", "MGL", "APLLTD", 
    "TIMETECHNO", "APOLLOTYRE", "STARCEMENT", "FDC", "MTARTECH", "COCHINSHIP", "INTELLECT", "LATENTVIEW", "RAILTEL", "ESCORTS", 
    "CENTRALBK", "DCMSHRIRAM", "KRBL", "BALKRISIND", "PIIND", "ATUL", "BASF", "ACC", "GALAXYSURF", "ZENTEC", 
    "CROMPTON", "MAHSEAMLES", "PTC", "DEEPAKNTR", "PCJEWELLER", "GSPL", "CONCOR", "FINPIPE", "KAYNES", "SHILPAMED", 
    "NCC", "GNFC", "CYIENT", "UCOBANK", "UBL", "GMDCLTD", "MOIL", "EIDPARRY", "JINDALSAW", "TRIDENT", 
    "SYNGENE", "BIRLACORPN", "HEG", "VTL", "INOXWIND", "HFCL", "CARBORUNIV", "EXIDEIND", "WOCKPHARMA", "VOLTAS", 
    "GSFC", "RBLBANK", "MMTC", "JKPAPER", "BEML", "NIACL", "SOBHA", "RAMCOCEM", "GRAPHITE", "ZEEL", 
    "PRAJIND", "TATAINVEST", "GRSE", "BDL", "BANDHANBNK", "CASTROLIND", "CUB", "DCBBANK", "KARURVYSYA", "MAHSCOOTER"
  ]
};

const STRATEGY_IDS = [
  'ENVELOPE_LONG', 'ENVELOPE_SHORT', 'ENVELOPE_KNOX', 'SMA', 'BOLLINGER', 
  '52W_HIGH_LOW', 'CUP_HANDLE_ABCD', 'RHS_ABCD', 'SR_STRATEGY', 
  'TWENTY_RALLY_RETEST', 'SIXTY_SEVEN_FUNDA'
];

async function runStrategyAudit() {
  console.log('🛡️ COMPREHENSIVE INSTITUTIONAL STRATEGY AUDIT\n');

  if (!fs.existsSync(MARKET_SNAPSHOT_PATH)) {
    console.error('❌ Market snapshot not found. Please run a snapshot update first.');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(MARKET_SNAPSHOT_PATH, 'utf8'));
  const qualifiedSignals: any[] = [];

  for (const [basketName, symbols] of Object.entries(BASKETS)) {
    console.log(`\n🔍 Auditing Basket: ${basketName} (${symbols.length} symbols)`);
    
    for (const sym of symbols) {
      const snap = snapshot[sym] || snapshot[`${sym}.NS`];
      if (!snap || !snap.quotes || snap.quotes.length === 0) continue;

      // 1. Fundamental Audit
      const fundAudit = await validateBatch9(sym, snap, basketName);
      if (!fundAudit.isPass) continue;

      // 2. Technical Strategy Audit
      const activeStrats: string[] = [];
      const mktCap = snap.screener?.marketCap || snap.quote?.marketCap || 0;

      for (const stratId of STRATEGY_IDS) {
        try {
          const result = runStrategyAnalysis(stratId, snap, mktCap);
          if (result && result.isBuyZone) {
            activeStrats.push(stratId);
          }
        } catch (e) {
          // console.error(`Err in ${stratId} for ${sym}`);
        }
      }

      if (activeStrats.length > 0) {
        qualifiedSignals.push({
          sym,
          basket: basketName,
          score: fundAudit.score,
          sm: fundAudit.smartMoneyTotal,
          strategies: activeStrats.join(', ')
        });
      }
    }
  }

  console.log('\n✅ QUALIFIED INSTITUTIONAL SIGNALS (Passes 70/70 Hardening + Strategy Trigger)\n');
  console.log('| Symbol | Basket | Score | Smart Money | Triggered Strategies |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');

  const sorted = qualifiedSignals.sort((a, b) => b.score - a.score);
  sorted.forEach(s => {
    console.log(`| ${s.sym} | ${s.basket} | ${s.score} | ${s.sm.toFixed(1)}% | ${s.strategies} |`);
  });

  console.log(`\nTotal Qualified Assets: ${qualifiedSignals.length}`);
}

runStrategyAudit();
