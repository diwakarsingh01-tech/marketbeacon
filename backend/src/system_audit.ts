
import fs from 'fs';
import { 
  calculateEnvelope, 
  calculateBollingerBand, 
  calculateSRStrategy, 
  calculateCupHandle,
  checkInstitutionalMandates 
} from './strategies/index.js';

async function performAudit() {
  const data = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  const symbols = Object.keys(data);
  
  console.log("==================================================");
  console.log("   INSTITUTIONAL MASTER AUDIT (HARDENED v12.0)");
  console.log("==================================================");

  let qualifiedCount = 0;

  for (const sym of symbols) {
    const snap = data[sym];
    const quotes = snap.quotes;
    const screener = snap.screener || {};
    
    // 1. Mandatory Institutional Mandate Check
    const mandate = checkInstitutionalMandates(screener);
    
    const sr = calculateSRStrategy(quotes, screener);
    const ch = calculateCupHandle(quotes);
    const env = calculateEnvelope(quotes);
    const bb = calculateBollingerBand(quotes);

    const activeStrategies = [sr, ch, env, bb].filter(s => s && s.isBuyZone);

    if (activeStrategies.length > 0) {
      console.log(`\n[SYMBOL] ${sym} | Price: ${snap.quote.regularMarketPrice}`);
      
      if (!mandate.passed) {
        console.log(`❌ REJECTED: Fails Institutional Mandates -> ${mandate.reasons.join(', ')}`);
        continue;
      }

      qualifiedCount++;
      activeStrategies.forEach(s => {
        const status = (s as any).status || "QUALIFIED";
        console.log(`✅ ${status}: Strategy Detected | Target: ${(s as any).target} | Upside: ${(s as any).upside || 'N/A'}`);
      });
    }
  }

  console.log("\n--------------------------------------------------");
  console.log(`AUDIT COMPLETE: ${qualifiedCount} Qualified Stocks Found.`);
  console.log("--------------------------------------------------");
}

performAudit();

