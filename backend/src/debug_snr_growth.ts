
import { STRATEGIES, BASKETS } from './index.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { getDB, initDB } from './db.js';
import { getDynamicBasket, getMarketSnapshot, initSnapshotCache } from './screener.js';

async function debugGrowthBasketSnR() {
  await initDB();
  await initSnapshotCache();
  
  const symbols = [
    "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS", "HINDUNILVR", "INFY", "SUNPHARMA", "MARUTI", "AXISBANK",
    "KOTAKBANK", "ITC", "ONGC", "ULTRACEMCO", "HCLTECH", "BEL", "COALINDIA", "HAL", "DMART", "NESTLEIND",
    "ASIANPAINT", "HINDZINC", "WIPRO", "EICHERMOT", "VBL", "DIVISLAB", "SOLARINDS", "IDEA", "CUMMINSIND", "BSE",
    "ABB", "PIDILITIND", "TRENT", "CGPOWER", "POLYCAB", "DLF", "BANKBARODA", "TMCV", "BHEL", "SIEMENS",
    "TECHM", "UNIONBANK", "HDFCLIFE", "BRITANNIA", "CANBK", "PNB", "JINDALSTEL", "BAJAJHLDNG", "INDIANB", "CIPLA",
    "GAIL", "BOSCHLTD", "HDFCAMC", "DRREDDY", "MARICO", "AMBUJACEM", "LUPIN", "GODREJCP", "MAZDOCK", "HEROMOTOCO",
    "INDHOTEL", "SHREECEM", "OFSS", "AUROPHARMA", "NMDC", "SRF", "PERSISTENT", "IDBI", "LAURUSLABS", "SUZLON",
    "DABUR", "FEDERALBNK", "YESBANK", "FORTIS", "NATIONALUM", "AUBANK", "HAVELLS", "MCX", "NAM-INDIA", "INDUSINDBK",
    "ICICIPRULI", "DIXON", "GICRE", "BIOCON", "BANKINDIA", "NAUKRI", "IOB", "SCHAEFFLER", "ALKEM", "PHOENIXLTD",
    "IDFCFIRSTB", "GLENMARK", "MAHABANK", "TIINDIA", "LINDEINDIA", "COFORGE", "OBEROIRLTY", "BERGEPAINT", "JSL", "MFSL",
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
  ];
  console.log(`🔍 Debugging ${symbols.length} symbols for SnR Strategy...`);
  
  const snapshot = await getMarketSnapshot(symbols);
  const results = [];
  
  for (const sym of symbols) {
    const snap = snapshot[sym];
    if (!snap) {
      console.log(`❌ No data for ${sym}`);
      continue;
    }
    
    if (!snap.quotes || snap.quotes.length < 252) {
      console.log(`⚠️ ${sym} has only ${snap.quotes?.length || 0} quotes.`);
      continue;
    }

    const sRes = runStrategyAnalysis('SR_STRATEGY', snap, snap.quote?.marketCap || 0, 'Growth Basket');
    if (sRes && sRes.isBuyZone) {
      results.push({ symbol: sym, ...sRes });
    }
  }
  
  console.log(`✅ Found ${results.length} stocks in buy zone for SnR Strategy in Growth Basket.`);
  if (results.length > 0) {
    console.log(JSON.stringify(results.slice(0, 5), null, 2));
  } else {
    // If none found, check why for the first few
    for (const sym of symbols.slice(0, 10)) {
      const snap = snapshot[sym];
      if (!snap) continue;
      
      const pivots: any[] = [];
      const quotes = snap.quotes;
      for (let i = 2; i < quotes.length - 2; i++) {
        if (quotes[i].low < quotes[i-1].low && quotes[i].low < quotes[i-2].low && quotes[i].low < quotes[i+1].low && quotes[i].low < quotes[i+2].low) pivots.push({ price: quotes[i].low, type: 'support' });
      }
      
      const clusterZones = (t: string) => {
        const zones: any[] = [];
        for (const p of pivots.filter(x => x.type === t)) {
          let f = false; for (const z of zones) { if (Math.abs(p.price - z.mid) / z.mid <= 0.05) { z.pivots.push(p); z.mid = z.pivots.reduce((a:any, b:any) => a + b.price, 0) / z.pivots.length; f = true; break; } }
          if (!f) zones.push({ mid: p.price, pivots: [p] });
        }
        return zones;
      };
      
      const supportZones = clusterZones('support');
      console.log(`📊 ${sym}: Pivots: ${pivots.length}, Support Zones: ${supportZones.length}`);
      supportZones.forEach((z, i) => {
        console.log(`   Zone ${i}: Mid: ${z.mid.toFixed(2)}, Pivots: ${z.pivots.length}`);
      });
    }
  }
}

debugGrowthBasketSnR().catch(console.error);
