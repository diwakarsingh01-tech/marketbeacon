import fs from 'fs';
import { validateBatch9 } from './services/fundamentalAudit.js';
import {
  calculateEnvelope,
  processShortEnvelope,
  calculateBollingerBand,
  calculateSMAStacking,
  calculate52WeekStrategy,
  calculateSRStrategy,
  calculateCupHandle,
  calculateSixtySevenFunda,
  calculateTwentyRallyRetest
} from './strategies/index.js';

const SNAPSHOT_PATH = './market_snapshot.json';

const BASKETS: Record<string, string[]> = {
  'Elite Basket': ['TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'ASIANPAINT', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 'BHARTIARTL', 'M&M', 'MARUTI', 'TMCV', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'ULTRACEMCO', 'NESTLEIND', 'BRITANNIA', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'ONGC', 'POWERGRID', 'COALINDIA', 'SHRIRAMFIN', 'APOLLOHOSP', 'PIDILITIND', 'HAVELLS', 'EICHERMOT', 'NIFTYBEES', 'BANKBEES'],
  'Quality Basket': ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'],
  'Growth Basket': [
    "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS", "HINDUNILVR", "INFY", "SUNPHARMA", "MARUTI", "AXISBANK",
    "KOTAKBANK", "ITC", "ONGC", "ULTRACEMCO", "HCLTECH", "BEL", "COALINDIA", "HAL", "DMART", "NESTLEIND",
    "ASIANPAINT", "HINDZINC", "WIPRO", "EICHERMOT", "VBL", "DIVISLAB", "SOLARINDS", "IDEA", "CUMMINSIND", "BSE",
    "ABB", "PIDILITIND", "TRENT", "CGPOWER", "POLYCAB", "DLF", "BANKBARODA", "TMCV", "BHEL", "SIEMENS",
    "TECHM", "UNIONBANK", "HDFCLIFE", "BRITANNIA", "CANBK", "PNB", "JINDALSTEL", "BAJAJHLDNG", "INDIANB", "CIPLA",
    "GAIL", "BOSCHLTD", "HDFCAMC", "DRREDDY", "MARICO", "AMBUJACEM", "LUPIN", "GODREJCP", "MAZDOCK", "HEROMOTOCO",
    "INDHOTEL", "SHREECEM", "OFSS", "AUROPHARMA", "NMDC", "SRF", "PERSISTENT", "IDBI", "LAURUSLABS", "SUZLON",
    "DABUR", "FEDERALBNK", "YESBANK", "FORTIS", "NATIONALUM", "AUBANK", "HAVELLS", "MCX", "NAM-INDIA", "INDUSINDBK",
    "ICICIPRULI", "DIXON", "GICRE", "BIOCON", "BANKINDIA", "NAUKRI", "IOB", "SCHAEFFLER", "ALKEM", "PHOENIXLTD",
    "IDFCFIRSTB", "GLENMARK", "MAHABANK", "TIINDIA", "LINDEINDIA", "COFORGE", "OBEROIRLTY", "BERGEPAINT", "JSL", "MFSL", "TATAMOTORS",
    "THERMAX", "COLPAL", "COROMANDEL", "MRF", "KEI", "HINDCOPPER", "APLAPOLLO", "RADICO", "SUPREMEIND", "MPHASIS",
    "AIAENG", "VOLTAS", "IPCALAB", "BALKRISIND", "PIIND", "ASTRAL", "PETRONET", "COCHINSHIP", "KPRMILL", "AJANTPHARM",
    "GLAXO", "WELCORP", "NAVINFLUOR", "3MINDIA", "ENDURANCE", "GODFRYPHLP", "UBL", "JBCHEPHARM", "HSCL", "CONCOR",
    "LTTS", "EXIDEIND", "TATAINVEST", "BLUESTARCO", "UCOBANK", "WOCKPHARMA", "ESCORTS", "NBCC", "HFCL", "CRISIL",
    "CENTRALBK", "TIMKEN", "TATAELXSI", "LALPATHLAB", "CDSL", "APOLLOTYRE", "ACC", "NIACL", "MTARTECH", "IGL",
    "DEEPAKNTR", "KAYNES", "TRITURBINE", "RBLBANK", "GRINDWELL", "GMDCLTD", "GESHIP", "RAMCOCEM", "KPITTECH", "PFIZER",
    "SUNTV", "CARBORUNIV", "ATUL", "BAYERCROP", "ELGIEQUIP", "GRANULES", "CAMS", "CHAMBLFERT", "REDINGTON", "VTL",
    "EIHOTEL", "SUNDRMFAST", "CHENNPETRO", "SYNGENE", "KAJARIACER", "KANSAINER", "EMAMILTD", "J&KBANK", "FINCABLES", "NATCOPHARM",
    "JINDALSAW", "DCMSHRIRAM", "GSPL", "CAPLIPOINT", "AVANTIFEED", "INOXWIND", "BASF", "FINEORG", "BEML", "APLLTD",
    "SOBHA", "ZENTEC", "GRAPHITE", "KFINTECH", "VGUARD", "VINATIORGA", "ENGINERSIN", "EIDPARRY", "ECLERX", "TRIDENT",
    "SOUTHBANK", "ZENSARTECH", "IEX", "ZEEL", "MGL", "FINPIPE", "BBTC", "SHILPAMED", "HEG", "INTELLECT",
    "RAILTEL", "MMTC", "WHIRLPOOL", "RITES", "WABAG", "KTKBANK", "CYIENT", "NCC", "PCJEWELLER", "TIMETECHNO",
    "STARCEMENT", "MAHSEAMLES", "THYROCARE", "KRBL", "SHARDACROP", "SKFINDIA", "NESCO", "GPPL", "BIRLACORPN", "GNFC",
    "JYOTHYLAB", "SONATSOFTW", "SANOFI", "TTKPRESTIG", "BAJAJCON", "CERA", "SFL", "SPARC", "TANLA", "LATENTVIEW",
    "JKPAPER", "GSFC", "GALAXYSURF", "FDC", "NEWGEN", "MOIL", "ITDC", "PTC", "IFBIND", "ICRA",
    "JAMNAAUTO", "CARERATING", "MAPMYINDIA", "BLISSGVS", "GULFOILLUB", "JUSTDIAL", "THOMASCOOK", "RALLIS", "KSCL", "VSTIND",
    "SUNTECK", "ADVENZYMES", "GHCL", "LUXIND", "KNRCON", "DBCORP", "QUESS", "ASHOKA", "RELINFRA", "ROUTE",
    "BALMLAWRIE", "DCAL", "HERITGFOOD", "RAJESHEXPO", "TEAMLEASE", "JAICORPLTD", "HATHWAY", "NILKAMAL", "DELTACORP", "JAGRAN",
    "RUPA"
  ],
  'Fallen Value Basket': [
    "BANDHANBNK", "VENKEYS", "ZEEL", "DELTACORP", "IEX", "NEWGEN", "MAPMYINDIA", "JUSTDIAL", "SKFINDIA"
  ]
};

// ⚠️ MUST MATCH strategyService.ts exactly — this is the live production auth map
// Keep in sync when adding/removing strategies or changing basket authorization
const STRATEGY_AUTH: Record<string, string[]> = {
  'ENVELOPE_LONG': ['Elite Basket', 'Quality Basket'],
  'ENVELOPE_SHORT': ['Elite Basket', 'Quality Basket'],
  'BOLLINGER': ['Elite Basket', 'Quality Basket'],
  '52W_HIGH_LOW': ['Elite Basket', 'Quality Basket'],
  'SMA_BCD': ['Elite Basket', 'Quality Basket'],
  'CUP_HANDLE_ABCD': ['Quality Basket', 'Elite Basket'],
  'SR_STRATEGY': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'TWENTY_RALLY_RETEST': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'SIXTY_SEVEN_FUNDA': ['Elite Basket', 'Quality Basket', 'Growth Basket', 'Fallen Value Basket']
};

const STRATEGY_FN_MAP: Record<string, (quotes: any, screener?: any) => any> = {
  'ENVELOPE_LONG': (q) => calculateEnvelope(q),
  'ENVELOPE_SHORT': (q) => processShortEnvelope(q),
  'BOLLINGER': (q) => calculateBollingerBand(q),
  'SMA_BCD': (q) => calculateSMAStacking(q),
  '52W_HIGH_LOW': (q) => calculate52WeekStrategy(q),
  'SR_STRATEGY': (q, s) => calculateSRStrategy(q, s),
  'CUP_HANDLE_ABCD': (q) => calculateCupHandle(q),
  'SIXTY_SEVEN_FUNDA': (q, s) => calculateSixtySevenFunda(q, s),
  'TWENTY_RALLY_RETEST': (q) => calculateTwentyRallyRetest(q)
};

async function runComprehensiveAudit() {
  console.log('='.repeat(80));
  console.log('  MARKETBEACON PRO — CLEAN INDEPENDENT AUDIT');
  console.log('  (Fundamental & Technical evaluated separately, no double-gating)');
  console.log('='.repeat(80));

  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error('FATAL: market_snapshot.json not found');
    return;
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));

  const overallResults: Record<string, { qualified: number; observation: number; rejected: number; anomalies: number; total: number; missing: number; details: any[] }> = {};
  let grandQualified = 0, grandObservation = 0, grandRejected = 0, grandAnomalies = 0, grandTotal = 0, grandMissing = 0;

  for (const [basketName, symbols] of Object.entries(BASKETS)) {
    let qualified = 0, observation = 0, rejected = 0, anomalies = 0, missing = 0;
    const details: any[] = [];

    console.log(`\n--- ${basketName} (${symbols.length} symbols) ---`);

    for (const sym of symbols) {
      const snap = snapshot[sym];
      if (!snap || !snap.quotes?.length) {
        missing++;
        details.push({ symbol: sym, status: 'MISSING' });
        continue;
      }

      try {
        const audit = await validateBatch9(sym, snap, basketName);
        const fundaPass = audit.isPass;
        const score = audit.score;

        const activeStrats: string[] = [];
        for (const [stratId, authBaskets] of Object.entries(STRATEGY_AUTH)) {
          if (!authBaskets.includes(basketName)) continue;
          const fn = STRATEGY_FN_MAP[stratId];
          if (!fn) continue;
          try {
            const res = fn(snap.quotes, snap.screener);
            if (res && res.isBuyZone) activeStrats.push(stratId);
          } catch { }
        }

        const techSignal = activeStrats.length > 0;

        if (fundaPass && techSignal) {
          qualified++;
          details.push({ symbol: sym, status: 'QUALIFIED', score, strategies: activeStrats });
        } else if (fundaPass && !techSignal) {
          observation++;
          details.push({ symbol: sym, status: 'OBSERVATION', score, strategies: [] });
        } else if (!fundaPass && techSignal) {
          anomalies++;
          details.push({ symbol: sym, status: 'ANOMALY', score, reason: audit.reason, strategies: activeStrats });
        } else {
          rejected++;
          details.push({ symbol: sym, status: 'REJECTED', score, reason: audit.reason, strategies: [] });
        }
      } catch (e: any) {
        rejected++;
        details.push({ symbol: sym, status: 'ERROR', reason: e.message });
      }
    }

    overallResults[basketName] = { qualified, observation, rejected, anomalies, total: symbols.length, missing, details };
    grandQualified += qualified; grandObservation += observation; grandRejected += rejected;
    grandAnomalies += anomalies; grandTotal += symbols.length; grandMissing += missing;

    const a = symbols.length - missing;
    console.log(`  Qualified: ${qualified} (${a > 0 ? ((qualified/a)*100).toFixed(1) : 0}%)`);
    console.log(`  Observation: ${observation} (${a > 0 ? ((observation/a)*100).toFixed(1) : 0}%)`);
    console.log(`  Rejected: ${rejected} (${a > 0 ? ((rejected/a)*100).toFixed(1) : 0}%)`);
    console.log(`  ANOMALIES: ${anomalies} (tech signal but funda fail)`);
  }

  const totalAudited = grandTotal - grandMissing;
  console.log('\n' + '='.repeat(80));
  console.log('  FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Total: ${grandTotal} | Missing: ${grandMissing} | Audited: ${totalAudited}`);
  console.log(`  QUALIFIED:   ${grandQualified} (${totalAudited > 0 ? ((grandQualified/totalAudited)*100).toFixed(1) : 0}%)`);
  console.log(`  OBSERVATION: ${grandObservation} (${totalAudited > 0 ? ((grandObservation/totalAudited)*100).toFixed(1) : 0}%)`);
  console.log(`  REJECTED:    ${grandRejected} (${totalAudited > 0 ? ((grandRejected/totalAudited)*100).toFixed(1) : 0}%)`);
  console.log(`  ANOMALIES:   ${grandAnomalies} (${totalAudited > 0 ? ((grandAnomalies/totalAudited)*100).toFixed(1) : 0}%)`);

  console.log('\n' + '='.repeat(80));
  console.log('  ANOMALIES — Strategy active but fundamentals fail');
  console.log('='.repeat(80));
  for (const [basket, r] of Object.entries(overallResults)) {
    const items = r.details.filter((d: any) => d.status === 'ANOMALY');
    if (items.length === 0) continue;
    console.log(`\n  ${basket} (${items.length}):`);
    for (const s of items) {
      console.log(`    ${s.symbol.padEnd(15)} Score: ${s.score}  ${s.reason}  Signals: [${s.strategies.join(', ')}]`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('  QUALIFIED');
  console.log('='.repeat(80));
  for (const [basket, r] of Object.entries(overallResults)) {
    const items = r.details.filter((d: any) => d.status === 'QUALIFIED');
    if (items.length === 0) continue;
    console.log(`\n  ${basket} (${items.length}):`);
    for (const s of items) {
      console.log(`    ${s.symbol.padEnd(15)} Score: ${s.score}  Signals: [${s.strategies.join(', ')}]`);
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: grandTotal, missing: grandMissing, audited: totalAudited,
      qualified: grandQualified, observation: grandObservation,
      rejected: grandRejected, anomalies: grandAnomalies
    },
    baskets: overallResults
  };
  fs.writeFileSync('./audit/comprehensive_report.json', JSON.stringify(report, null, 2));
  console.log('\nReport: audit/comprehensive_report.json');
}

runComprehensiveAudit().catch(console.error);
