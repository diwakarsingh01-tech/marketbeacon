import { getMarketSnapshot, initSnapshotCache } from './screener.js';
import { calculateSRStrategy } from './strategies/index.js';

const symbolsToAudit = [
  "TECHM", "COFORGE", "SUNTV", "KFINTECH", "BAJAJHLDNG", "MAZDOCK", "ICICIPRULI", "DIXON", "GODFRYPHLP", "TATAINVEST",
  "CRISIL", "CAMS", "EMAMILTD", "NATCOPHARM", "SHARDACROP", "SONATSOFTW", "KSCL", "VSTIND", "HDFCBANK", "HINDUNILVR",
  "ONGC", "DMART", "IDEA", "SIEMENS", "PNB", "SUZLON", "HAVELLS", "GICRE", "COLPAL", "APLAPOLLO",
  "SUPREMEIND", "BALKRISIND", "PETRONET", "COCHINSHIP", "GLAXO", "CENTRALBK", "LALPATHLAB", "ACC", "RAMCOCEM", "ATUL",
  "FINCABLES", "BASF", "EIDPARRY", "BBTC", "RAILTEL", "JYOTHYLAB", "TTKPRESTIG", "JUSTDIAL", "ASHOKA", "TEAMLEASE",
  "NBCC", "SUNDRMFAST", "BEML", "ZENSARTECH", "MGL", "KRBL", "CERA", "ADVENZYMES", "MRF", "HINDCOPPER",
  "TATAELXSI", "KAJARIACER", "VINATIORGA", "CYIENT", "SANOFI", "HCLTECH", "IEX", "BLUESTARCO", "VGUARD", "ITC",
  "OFSS", "COROMANDEL", "LTTS", "SUNTECK", "DABUR", "PFIZER", "ESCORTS", "DCMSHRIRAM", "HAL", "AMBUJACEM",
  "IOB", "DEEPAKNTR", "BAYERCROP", "TIMETECHNO", "GPPL", "LATENTVIEW", "BERGEPAINT", "OBEROIRLTY", "NEWGEN", "IDBI",
  "ASTRAL", "UCOBANK", "IGL", "ECLERX", "HINDZINC", "GODREJCP", "TRENT", "CHAMBLFERT", "ITDC", "SOBHA",
  "HDFCLIFE", "ICRA", "NESCO", "CONCOR", "REDINGTON", "INDHOTEL", "MPHASIS", "INTELLECT", "ASIANPAINT", "FDC",
  "KPRMILL", "SFL", "TIINDIA", "IFBIND", "TRITURBINE", "GULFOILLUB", "GRINDWELL", "SPARC", "WIPRO"
];

async function runAudit() {
  console.log(`🚀 Starting Institutional Audit of ${symbolsToAudit.length} stocks...`);
  await initSnapshotCache();
  const snapshot = getMarketSnapshot();
  
  const results = [];
  let passedCount = 0;

  for (const sym of symbolsToAudit) {
    const snap = snapshot[sym];
    if (!snap || !snap.quotes?.length) {
      results.push({ symbol: sym, status: "FAIL", reason: "Missing Historical Data" });
      continue;
    }

    const res: any = calculateSRStrategy(snap.quotes, snap.screener);
    
    if (res && res.isBuyZone && res.status === "QUALIFIED") {
      results.push({ 
        symbol: sym, 
        status: "PASS", 
        reason: `Tranche ${res.tranche} | Upside: ${res.upside} | RRR: ${res.rrr}`,
        details: `Entry: ${res.entryPrice} Target: ${res.target}`
      });
      passedCount++;
    } else {
      let failReason = "Pattern Not Found / Gap < 30%";
      if (res && res.status === "OBSERVATION") failReason = "CMP > 2% Entry Buffer (Observation)";
      else if (res && res.status === "REJECT") failReason = "Strict B-T-B-T-B or 30% Gap Failed";
      
      results.push({ symbol: sym, status: "FAIL", reason: failReason });
    }
  }

  console.table(results);
  console.log(`\n✅ Audit Complete. Passed: ${passedCount} | Failed: ${symbolsToAudit.length - passedCount}`);
}

runAudit().catch(console.error);
