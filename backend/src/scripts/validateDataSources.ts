import { initSnapshotCache, getMarketSnapshot } from '../screener.js';
import YahooFinance from 'yahoo-finance2';
import { NIFTY_500 } from '../universe.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

function safe(v: any, fallback = 0) {
  const p = parseFloat(String(v));
  return isNaN(p) ? fallback : p;
}

async function main() {
  console.log('\n============================================');
  console.log('   DATA SOURCE VALIDATION REPORT');
  console.log('   Cached Snapshot vs Yahoo Finance');
  console.log(`   Scanning all ${NIFTY_500.length} NIFTY 500 stocks`);
  console.log('============================================\n');

  // Load cached snapshot from disk
  await initSnapshotCache();
  let snapshot = getMarketSnapshot();
  
  // Fallback: load directly from disk if still empty
  if (Object.keys(snapshot).length === 0) {
    const pathsToTry = [
      path.resolve(process.cwd(), 'market_snapshot.json'),
      path.resolve(process.cwd(), 'backend', 'market_snapshot.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../market_snapshot.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../market_snapshot.json'),
    ];
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        snapshot = JSON.parse(raw);
        console.log(`  Loaded snapshot from disk: ${p} (${Object.keys(snapshot).length} symbols)`);
        break;
      }
    }
  } else {
    console.log(`  Using cached snapshot with ${Object.keys(snapshot).length} symbols`);
  }
  const cachedSymbols = Object.keys(snapshot);
  console.log(`  Using cached snapshot with ${cachedSymbols.length} symbols\n`);

  if (Object.keys(snapshot).length === 0) { console.log('\n❌ No snapshot data available. Run the server first to populate market_snapshot.json.\n'); return; }

  let crossMatch = 0, missingScreener = 0, missingYahoo = 0;
  let discrepancies: any[] = [];
  let paramPass: Record<string, number> = {};
  let paramFail: Record<string, number> = {};
  let paramMissing: Record<string, number> = {};

  const BATCH = 5;
  for (let i = 0; i < NIFTY_500.length; i += BATCH) {
    const batch = NIFTY_500.slice(i, Math.min(i + BATCH, NIFTY_500.length));
    await Promise.all(batch.map(async (sym) => {
      const idx = i + batch.indexOf(sym) + 1;
      process.stdout.write(`\r  Progress: ${idx}/${NIFTY_500.length} (${Math.round(idx/NIFTY_500.length*100)}%)`);

      const cleanSym = sym.replace('.NS', '').replace('.BO', '');
      const snap = snapshot[cleanSym];
      if (!snap || !snap.screener) { missingScreener++; return; }
      const scr = snap.screener;

      let yahoo: any = null;
      try {
        const yahooSym = sym.includes('.') ? sym : `${sym}.NS`;
        const quote: any = await yahooFinance.quote(yahooSym);
        const summary: any = await yahooFinance.quoteSummary(yahooSym, {
          modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail']
        });
        const marketCapCr = safe(quote.marketCap) / 10000000;
        const pe = safe(summary?.summaryDetail?.trailingPE);
        const de = safe(summary?.financialData?.debtToEquity) / 100;
        const roe = safe(summary?.financialData?.returnOnEquity);
        yahoo = { marketCapCr, pe, de, roe };
      } catch { missingYahoo++; return; }

      crossMatch++;

      // Compare overlapping fields
      const scrMC = safe(scr.marketCap) / 10000000;
      const scrPE = safe(scr.peRatio);
      const scrDE = safe(scr.netDebtToEquity);
      const scrROE = safe(scr.returnOnEquity);

      const compare = (label: string, s: number, y: number) => {
        if (s > 0 && y > 0) {
          const diff = Math.abs(s - y) / ((s + y) / 2) * 100;
          if (diff > 10) discrepancies.push({ symbol: sym, label, s, y, diff: Math.round(diff * 100) / 100 });
        }
      };
      compare('MarketCap', scrMC, yahoo.marketCapCr);
      compare('PE', scrPE, yahoo.pe);
      compare('D/E', scrDE, yahoo.de);
      compare('ROE', scrROE, yahoo.roe > 0 && yahoo.roe < 1 ? yahoo.roe * 100 : yahoo.roe);

      // 6-parameter screening (Screener.in data)
      const currentNetProfit = safe(scr.currentNetProfit);
      const debtToEquity = safe(scr.netDebtToEquity);
      const roce = safe(scr.roce);
      const promoter = safe(scr.shareholding?.promoter);
      const fii = safe(scr.shareholding?.fii);
      const dii = safe(scr.shareholding?.dii);
      const publicHolding = promoter > 0 ? (100 - promoter - fii - dii) : -1;

      const checks: [string, boolean][] = [
        [`Net Profit > 200Cr (${Math.round(currentNetProfit)}Cr)`, currentNetProfit > 200],
        [`D/E < 0.2 (${debtToEquity.toFixed(2)})`, debtToEquity > 0 && debtToEquity < 0.2],
        [`ROCE > 20% (${roce.toFixed(1)}%)`, roce > 20],
        [`Public Holding < 30% (${publicHolding >= 0 ? publicHolding.toFixed(1) + '%' : 'N/A'})`, publicHolding >= 0 && publicHolding < 30],
      ];
      for (const [key, pass] of checks) {
        const k = key.split('(')[0].trim();
        if (pass) { paramPass[k] = (paramPass[k] || 0) + 1; }
        else { paramFail[k] = (paramFail[k] || 0) + 1; }
      }

      // Sales/Profit Growth - skip CAGR for now (needs yearly array)
    }));
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n\n=============== SUMMARY ===============');
  console.log(`  Total NIFTY 500 stocks: ${NIFTY_500.length}`);
  console.log(`  Screener.in data available: ${missingScreener > 0 ? NIFTY_500.length - missingScreener : NIFTY_500.length - missingScreener}/${NIFTY_500.length}`);
  console.log(`  Cross-verified: ${crossMatch}/${NIFTY_500.length}`);

  if (discrepancies.length === 0) {
    console.log('\n✅ No major discrepancies (>10%) between Screener.in and Yahoo Finance');
  } else {
    console.log(`\n⚠️  ${discrepancies.length} discrepancies found (>10% diff):`);
    for (const d of discrepancies.slice(0, 20)) {
      console.log(`  ${d.symbol}: ${d.label} — Screener=${d.s}, Yahoo=${d.y} (${d.diff}% diff)`);
    }
    if (discrepancies.length > 20) console.log(`  ... and ${discrepancies.length - 20} more`);
  }

  console.log('\n📊 6-PARAMETER SCREENING RESULTS:');
  console.log('  ─────────────────────────────');
  const keys = [...new Set([...Object.keys(paramPass), ...Object.keys(paramFail)])];
  for (const k of keys) {
    const p = paramPass[k] || 0;
    const f = paramFail[k] || 0;
    const t = p + f;
    console.log(`  ${k}: ${p}/${t} PASS (${Math.round(p/t*100)}%) | ${f}/${t} FAIL`);
  }
  console.log('\n✅ Validation complete.\n');
}

main().catch(console.error);
