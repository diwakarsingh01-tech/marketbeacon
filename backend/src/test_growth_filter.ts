/**
 * Sanity test for the growth filter — runs the live Screener scraper on a few
 * hand-picked stocks and prints the resulting GrowthMetrics for visual review.
 *
 * Usage:  npm run build && node dist/test_growth_filter.js
 */
import { fetchScreenerData } from './screener.js';
import { growthFilter } from './services/growthFilter.js';

const SAMPLES = ['KAYNES', 'POLYCAB', 'TCS', 'INFY', 'RELIANCE'];

function fmt(v: number | null, digits = 1): string {
  if (v == null) return 'n/a';
  return v.toFixed(digits);
}

async function main() {
  console.log('\n=== Growth Filter Sanity Test ===\n');
  for (const sym of SAMPLES) {
    console.log(`\n--- ${sym} ---`);
    try {
      const summary = await fetchScreenerData(sym);
      if (!summary) {
        console.log(`  scraper returned null`);
        continue;
      }
      const quarters = (summary as any).quarterly || [];
      console.log(`  Quarterly rows scraped: ${quarters.length}`);
      if (quarters.length > 0) {
        console.log(`  first:     ${JSON.stringify(quarters[0])}`);
        console.log(`  latest:    ${JSON.stringify(quarters[quarters.length - 1])}`);
      }
      const m = growthFilter(sym, summary as any);
      console.log(`  sector:            ${m.sector}`);
      console.log(`  bucket:            ${m.bucket}  (score ${m.passScore}/100)`);
      if (m.hardRejectReason) console.log(`  hardReject:        ${m.hardRejectReason}`);
      console.log(`  YoY revenue:       ${fmt(m.yoyRevenueGrowth)}%  | YoY PAT: ${fmt(m.yoyProfitGrowth)}%  | YoY EPS: ${fmt(m.yoyEpsGrowth)}%`);
      console.log(`  QoQ revenue:       ${fmt(m.qoqRevenueGrowth)}%  | QoQ PAT: ${fmt(m.qoqProfitGrowth)}%`);
      console.log(`  NPM now / 4Q ago:  ${fmt(m.npmNow)}% / ${fmt(m.npm4QAgo)}%   Δ ${fmt(m.npmDeltaBps, 0)}bps`);
      console.log(`  ROCE ${fmt(m.roce)}%  ROE ${fmt(m.roe)}%  PE ${fmt(m.peRatio, 2)}  PEG ${fmt(m.pegRatio, 2)}`);
      console.log(`  3Y PAT CAGR:       ${fmt(m.cagrProfit3Y)}%`);
      console.log(`  D/E ${fmt(m.netDebtToEquity, 2)}  pledge ${fmt(m.pledgePct)}%  smart money ${fmt(m.smartMoneyTotal)}%  mcap ₹${fmt(m.marketCapCr, 0)}Cr`);
      if (m.growthFlags.length)  console.log(`  growthFlags:       ${m.growthFlags.join(' | ')}`);
      if (m.qualityFlags.length) console.log(`  qualityFlags:      ${m.qualityFlags.join(' | ')}`);
    } catch (e: any) {
      console.log(`  ERROR: ${e.message}`);
    }
  }
  console.log('\n=== Done ===\n');
}

main().catch(e => { console.error('fatal:', e); process.exit(1); });