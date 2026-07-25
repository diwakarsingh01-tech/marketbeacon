/**
 * Growth Filtration Service
 * ------------------------
 * Filters a stock for true "growth compounder" characteristics using:
 *   - Quarterly Results table (recent quarters for YoY/QoQ growth, margin trend)
 *   - Summary card (ROCE, ROE, PE, D/E, smart money, pledge, market cap)
 *
 * Bucketing (strict — user-confirmed thresholds, v1):
 *   PASS  (green)  — ≥20% YoY rev & profit, ROCE ≥15%, margin stable/expanding,
 *                    PE ≤60, D/E <1, pledge <2%, smart money ≥60%
 *   WATCH (yellow) — Growth good but 1-2 quality flags off
 *   REJECT(red)    — No growth OR hard-fail on debt/pledge/smart money
 *
 * All percentage values are returned as plain numbers (e.g. 24.5 == 24.5%).
 * `null` is used where the source genuinely has no data (NOT 0), so callers
 * can distinguish "missing" from "zero".
 */

import { MANUAL_SECTOR_MAP } from '../index.js';

export type Bucket = 'PASS' | 'WATCH' | 'REJECT';

export interface QuarterPoint {
  q: string;       // "Jun 2025"
  sales: number;
  opm: number;     // %
  npm: number;     // %
  pat: number;
  eps: number;
}

export interface ScreenerSummary {
  marketCap?: number;
  peRatio?: number;
  roce?: number;
  returnOnEquity?: number;
  netDebtToEquity?: number;
  currentPrice?: number;
  industry?: string;
  smartMoneyTotal?: number;
  shareholding?: { promoter?: number; fii?: number; dii?: number; pledged?: number };
  quarterly?: QuarterPoint[];
  currentNetProfit?: number;     // used as latest annual PAT proxy for CFO/PAT
  dividendYield?: number;        // legacy field — also exposed via ratios.dividendYield
  currentSales?: number;          // legacy — latest annual sales proxy
  // Comprehensive (added Phase 5)
  annual?: {
    sales?: number[]; netProfit?: number[]; eps?: number[]; opm?: number[]; pbt?: number[]; otherIncome?: number[];
  };
  balanceSheet?: {
    latest?: {
      shareCapital?: number; reserves?: number; borrowings?: number; inventory?: number;
      debtors?: number; creditors?: number; cashAndBank?: number; fixedAssets?: number; equity?: number;
    };
  };
  cashFlow?: { latest?: { cfo?: number; capex?: number; fcf?: number } };
  ratios?: {
    priceToBook?: number; evEbitda?: number; operatingMargin?: number; pbt?: number;
    enterpriseValue?: number; dividendYield?: number;
  };
  workingCapital?: { dio?: number | null; dso?: number | null; dpo?: number | null };
}

export interface GrowthMetrics {
  symbol: string;
  sector: string;
  // Growth (primary screen)
  yoyRevenueGrowth: number | null;   // % — latestQ vs same Q prior year
  yoyProfitGrowth: number | null;    // % — PAT
  yoyEpsGrowth: number | null;       // %
  qoqRevenueGrowth: number | null;   // % — lastQ vs priorQ
  qoqProfitGrowth: number | null;
  // CAGRs (multiple windows)
  cagrSales1Y: number | null;
  cagrSales3Y: number | null;
  cagrSales5Y: number | null;
  cagrProfit1Y: number | null;
  cagrProfit3Y: number | null;
  cagrProfit5Y: number | null;
  cagrEps3Y: number | null;
  cagrEps5Y: number | null;
  // Margin trend
  npmNow: number | null;             // %
  npm4QAgo: number | null;
  npmDeltaBps: number | null;        // bps (now minus 4Q ago)
  opmNow: number | null;             // %
  opm4QAgo: number | null;
  opmDeltaBps: number | null;
  // Quality
  roce: number | null;              // %
  roe: number | null;               // %
  peRatio: number | null;
  pbRatio: number | null;           // Price/Book
  psRatio: number | null;           // Price/Sales (mCap/TTM sales)
  evEbitda: number | null;           // EV/EBITDA (from Screener if shown)
  pegRatio: number | null;           // PE / 3Y profit CAGR
  netDebtToEquity: number | null;
  pledgePct: number | null;          // %
  smartMoneyTotal: number | null;    // %
  marketCapCr: number | null;
  dividendYield: number | null;      // %
  enterpriseValueCr: number | null; // ₹ Cr — mcap + total debt
  // Cash flow & efficiency
  cfoToPat: number | null;           // recent CFO / recent PAT
  freeCashFlow: number | null;       // CFO − Capex (₹ Cr)
  capexToSales: number | null;       // %
  fcfYield: number | null;           // FCF / mcap %
  // Working capital days (rough annual proxy)
  dioDays: number | null;            // inventory days
  dsoDays: number | null;            // receivables days
  dpoDays: number | null;            // payables days
  // Verdict
  bucket: Bucket;
  passScore: number;                 // 0-100 weighted score
  hardRejectReason: string | null;
  qualityFlags: string[];
  growthFlags: string[];
  // Provenance
  quartersAnalyzed: number;
  latestQuarter: string | null;
  quarterlySeries: QuarterPoint[];   // raw quarter-by-quarter numbers (for expandable UI row)
}

const MARGIN_OF = 0.05; // 5% leeway for "margin stable"

/**
 * Convert a quarter label "Jun 2025" into a numeric index that increments
 * with calendar time — quarters per year are 4, so index = year*4 + quarterNo.
 * Used to find the same quarter one year prior.
 */
function quarterIndex(label: string): number | null {
  const m = label.match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!m) return null;
  const mon = m[1].slice(0, 3).toLowerCase();
  const year = parseInt(m[2], 10);
  const monMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    // long forms
    march: 3, june: 6, sept: 9,
  };
  const month = monMap[mon];
  if (!month) return null;
  // Jan-Mar => "Q4" of prior Indian FY, but for YoY align we just need same
  // month a year ago, so use straight calendar: index = year*12 + month.
  return year * 12 + month;
}

/**
 * Standard CAGR formula. Returns %/year (e.g. 22.4 == 22.4%/yr).
 * Returns null when inputs are unusable (no history, negative pivots).
 */
function cagr(startValue: number, endValue: number, periodsYears: number): number | null {
  if (periodsYears <= 0) return null;
  if (startValue <= 0 || endValue <= 0) return null;
  const ratio = endValue / startValue;
  if (ratio <= 0) return null;
  const r = Math.pow(ratio, 1 / periodsYears) - 1;
  return r * 100;
}

/**
 * YoY growth % (latestQ value vs same-quarter-prior-year value). Returns null
 * if we can't find a matching quarter (~12 months back) or inputs are non-pos.
 */
function yoyGrowth(quarters: QuarterPoint[], field: keyof QuarterPoint): number | null {
  const valid = quarters.filter(q => {
    const v = q[field];
    return typeof v === 'number' && isFinite(v);
  });
  if (valid.length < 5) return null;
  const latest = valid[valid.length - 1];
  const targetIdx = quarterIndex(latest.q);
  if (targetIdx == null) return null;
  // Look for a quarter whose index is within ±1 month of (targetIdx - 12)
  const want = targetIdx - 12;
  const prior = valid.find(q => {
    const qi = quarterIndex(q.q);
    if (qi == null) return false;
    return Math.abs(qi - want) <= 1 && qi !== targetIdx;
  });
  if (!prior) return null;
  const a = (prior[field] as number);
  const b = (latest[field] as number);
  if (!isFinite(a) || !isFinite(b) || a <= 0) return null;
  return ((b - a) / a) * 100;
}

/**
 * QoQ growth % (latest vs immediately prior). Nulls when insufficient data.
 */
function qoqGrowth(quarters: QuarterPoint[], field: keyof QuarterPoint): number | null {
  const valid = quarters.filter(q => typeof q[field] === 'number' && isFinite((q[field] as number)));
  if (valid.length < 2) return null;
  const a = valid[valid.length - 2][field] as number;
  const b = valid[valid.length - 1][field] as number;
  if (a <= 0) return null;
  return ((b - a) / a) * 100;
}

/**
 * CAGR over `periodsYears` of an annual series. Compares first vs last element
 * at the requested horizon. Returns null when the series is too short or when
 * the start/end values are non-positive or zero.
 *
 * (Note: Screener annual series ends at the most recent FULL FY, so a 1Y CAGR
 * here = first-vs-last when only 2 elements exist; if more, we use the right
 * offset: e.g. `periodsYears=3` uses last vs (lastIndex - 3).)
 */
function cagrAnnualSeries(series: number[] | null | undefined, periodsYears: number): number | null {
  if (!series || series.length < periodsYears + 1) return null;
  const start = series[series.length - 1 - periodsYears];
  const end   = series[series.length - 1];
  return cagr(start, end, periodsYears);
}

/** Safe division returning null when inputs are missing or denom is 0. */
const safeDiv = (n: number | null | undefined, d: number | null | undefined): number | null => {
  if (n == null || d == null || d === 0) return null;
  return n / d;
};

/**
 * The growth score (0-100) is the heart of the filter. Weights:
 *   - YoY Revenue growth   : 25 (≥20% = full, else linear)
 *   - YoY PAT growth        : 25
 *   - Margin expansion       : 15 (npmDeltaBps ≥0 = full; −100bps floors at 0)
 *   - ROCE                   : 15 (≥15% = full)
 *   - Smart money            : 10 (≥60% = full)
 *   - PEG value              : 10 (≤1.5 = full; >3 = 0)
 */
function computeGrowthScore(m: GrowthMetrics): number {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const linear = (val: number | null, threshold: number, weight: number) => {
    if (val == null) return 0;
    return clamp((val / threshold), 0, 1) * weight;
  };
  let s = 0;
  s += linear(m.yoyRevenueGrowth, 20, 25);
  s += linear(m.yoyProfitGrowth,  20, 25);
  // margin: +100bps → full; −100bps → zero
  if (m.npmDeltaBps != null) {
    s += clamp((m.npmDeltaBps + 100) / 200, 0, 1) * 15;
  }
  s += linear(m.roce, 15, 15);
  s += linear(m.smartMoneyTotal, 60, 10);
  // PEG: ≤1.5 → full (10); 3+ → 0; linear between
  if (m.pegRatio != null && m.pegRatio > 0) {
    s += clamp((3 - m.pegRatio) / 1.5, 0, 1) * 10;
  }
  return Math.round(s);
}

/**
 * Main entry point. `symbol` is the NSE ticker (e.g. "TCS"). `summary` is the
 * output of `fetchScreenerData(symbol)` (or any equivalent object). When
 * `summary.quarterly[]` is empty/malformed the bucket will be REJECT with a
 * clear reason — the filter needs quarterly data to make a growth call.
 */
export function growthFilter(symbol: string, summary: ScreenerSummary | null | undefined): GrowthMetrics {
  const safeSymbol = (symbol || '').toUpperCase().trim();
  const sector = MANUAL_SECTOR_MAP?.[safeSymbol] || summary?.industry || 'General';

  // Handle total absence of Screener data politely
  if (!summary) {
    return {
      symbol: safeSymbol, sector,
      yoyRevenueGrowth: null, yoyProfitGrowth: null, yoyEpsGrowth: null,
      qoqRevenueGrowth: null, qoqProfitGrowth: null,
      cagrSales1Y: null, cagrSales3Y: null, cagrSales5Y: null,
      cagrProfit1Y: null, cagrProfit3Y: null, cagrProfit5Y: null,
      cagrEps3Y: null, cagrEps5Y: null,
      npmNow: null, npm4QAgo: null, npmDeltaBps: null,
      opmNow: null, opm4QAgo: null, opmDeltaBps: null,
      roce: null, roe: null, peRatio: null, pbRatio: null, psRatio: null,
      evEbitda: null, pegRatio: null, netDebtToEquity: null, pledgePct: null,
      smartMoneyTotal: null, marketCapCr: null, dividendYield: null,
      enterpriseValueCr: null,
      cfoToPat: null, freeCashFlow: null, capexToSales: null, fcfYield: null,
      dioDays: null, dsoDays: null, dpoDays: null,
      bucket: 'REJECT', passScore: 0,
      hardRejectReason: 'No fundamentals data from Screener',
      qualityFlags: [], growthFlags: [],
      quartersAnalyzed: 0, latestQuarter: null, quarterlySeries: [],
    };
  }

  const quarters: QuarterPoint[] = Array.isArray(summary.quarterly) ? summary.quarterly : [];
  const latestQuarter = quarters.length > 0 ? quarters[quarters.length - 1].q : null;

  // ── Growth metrics (from quarters) ────────────────────────────────────────
  const yoyRevenueGrowth = yoyGrowth(quarters, 'sales');
  const yoyProfitGrowth  = yoyGrowth(quarters, 'pat');
  const yoyEpsGrowth     = yoyGrowth(quarters, 'eps');
  const qoqRevenueGrowth = qoqGrowth(quarters, 'sales');
  const qoqProfitGrowth  = qoqGrowth(quarters, 'pat');

  // Margin trend: NPM = PAT/Sales * 100. Screener's Quarterly Results section
  // does NOT render a "Net Profit Margin" row (only OPM, Sales, PAT, EPS), so
  // we derive NPM locally rather than trust the scraped `npm` field (often 0).
  const deriveNpm = (q: QuarterPoint): number | null => {
    if (!q || q.sales <= 0) return null;
    return (q.pat / q.sales) * 100;
  };
  let npmNow: number | null = deriveNpm(quarters[quarters.length - 1]) ?? null;
  let npm4QAgo: number | null = quarters.length >= 5 ? deriveNpm(quarters[quarters.length - 5]) : null;
  let npmDeltaBps: number | null = null;
  if (npmNow != null && npm4QAgo != null) {
    npmDeltaBps = Math.round((npmNow - npm4QAgo) * 100); // %→bps
  }

  // 3Y CAGR of net profit (needs ≥7 quarter-pairs = ~7 quarters; we use the
  // first valid quarter vs latest, assuming ≥3 years between).
  let cagrProfit3Y: number | null = null;
  if (quarters.length >= 7) {
    const first = quarters[0];
    const last = quarters[quarters.length - 1];
    const fi = quarterIndex(first.q);
    const li = quarterIndex(last.q);
    if (fi != null && li != null) {
      const yrs = (li - fi) / 12;
      if (yrs >= 2.5) {
        cagrProfit3Y = cagr(first.pat, last.pat, yrs);
      }
    }
  }

  // ── Quality metrics (from summary card) ──────────────────────────────────
  const roce = summary.roce ?? null;
  const roe  = summary.returnOnEquity ?? null;
  const peRatio = summary.peRatio ?? null;
  const netDebtToEquity = summary.netDebtToEquity ?? null;
  const smartMoneyTotal = summary.smartMoneyTotal ?? null;
  const marketCapCr = summary.marketCap ? summary.marketCap / 10000000 : null;
  const pledgePct = summary.shareholding?.pledged ?? null;

  // PEG = PE / 3Y profit CAGR (only meaningful when both positive)
  let pegRatio: number | null = null;
  if (peRatio != null && cagrProfit3Y != null && cagrProfit3Y > 0) {
    pegRatio = peRatio / cagrProfit3Y;
  }

  // ── OPM trend (from quarterly series — OPM row is captured per-quarter) ───
  let opmNow: number | null = null;
  let opm4QAgo: number | null = null;
  let opmDeltaBps: number | null = null;
  if (quarters.length >= 5) {
    opmNow = quarters[quarters.length - 1].opm;
    opm4QAgo = quarters[quarters.length - 5].opm;
    if (opmNow != null && opm4QAgo != null) {
      opmDeltaBps = Math.round((opmNow - opm4QAgo) * 100);
    }
  }

  // ── CAGRs (annual series from Screener) ─────────────────────────────────
  const annualSales    = summary.annual?.sales     ?? null;
  const annualNetProfit = summary.annual?.netProfit ?? null;
  const annualEps      = summary.annual?.eps       ?? null;
  const cagrSales1Y    = cagrAnnualSeries(annualSales, 1);
  const cagrSales3Y    = cagrAnnualSeries(annualSales, 3);
  const cagrSales5Y    = cagrAnnualSeries(annualSales, 5);
  const cagrProfit1Y    = cagrAnnualSeries(annualNetProfit, 1);
  // Prefer annual-derived 3Y CAGR over the quarterly-derived one (annual is more
  // standardized FY vs FY); fall back to quarterly when annual is missing.
  cagrProfit3Y = cagrAnnualSeries(annualNetProfit, 3) ?? cagrProfit3Y;
  const cagrProfit5Y    = cagrAnnualSeries(annualNetProfit, 5);
  const cagrEps3Y      = cagrAnnualSeries(annualEps, 3);
  const cagrEps5Y      = cagrAnnualSeries(annualEps, 5);

  // ── Valuation ratios ────────────────────────────────────────────────────
  const pbRatio = summary.ratios?.priceToBook && summary.ratios.priceToBook > 0
    ? summary.ratios.priceToBook : null;
  // P/S = mcap / TTM sales proxy. annual.sales ends at last full FY — close enough.
  const annualSalesLatest = annualSales && annualSales.length > 0 ? annualSales[annualSales.length - 1] : 0;
  const psRatio = marketCapCr != null && annualSalesLatest > 0
    ? marketCapCr / annualSalesLatest : null;
  const evEbitda = summary.ratios?.evEbitda && summary.ratios.evEbitda > 0
    ? summary.ratios.evEbitda : null;
  const dividendYield = summary.ratios?.dividendYield != null
    ? summary.ratios.dividendYield
    : (summary as any).dividendYield ?? null;
  const enterpriseValueCr = summary.ratios?.enterpriseValue
    ? summary.ratios.enterpriseValue / 10000000 : null;

  // ── Cash-flow efficiency ────────────────────────────────────────────────
  const cfoLatest = summary.cashFlow?.latest?.cfo ?? null;
  const capexLatest = summary.cashFlow?.latest?.capex ?? null;
  const patLatest = (summary.currentNetProfit ?? null) as number | null;
  const cfoToPat = safeDiv(cfoLatest, patLatest);
  // Prefer Screener's directly-reported "Free Cash Flow" row over our CFO−capex
  // approximation when available (consolidated cash-flow section exposes it).
  const screenerFcf = summary.cashFlow?.latest?.fcf;
  const freeCashFlow = (screenerFcf != null && screenerFcf > 0)
    ? screenerFcf
    : ((cfoLatest != null && capexLatest != null) ? cfoLatest - capexLatest : null);
  const capexToSales = (capexLatest != null && annualSalesLatest > 0)
    ? (capexLatest / annualSalesLatest) * 100 : null;
  const fcfYield = (freeCashFlow != null && marketCapCr != null && marketCapCr > 0)
    ? (freeCashFlow / marketCapCr) * 100 : null;

  // ── Working-capital days (annual proxy) ─────────────────────────────────
  const dioDays = summary.workingCapital?.dio ?? null;
  const dsoDays = summary.workingCapital?.dso ?? null;
  const dpoDays = summary.workingCapital?.dpo ?? null;

  // ── Flag collection ───────────────────────────────────────────────────────
  const qualityFlags: string[] = [];
  const growthFlags: string[] = [];

  if (yoyRevenueGrowth != null && yoyRevenueGrowth < 20) {
    growthFlags.push(`YoY revenue only ${yoyRevenueGrowth.toFixed(1)}% (<20%)`);
  }
  if (yoyProfitGrowth != null && yoyProfitGrowth < 20) {
    growthFlags.push(`YoY PAT only ${yoyProfitGrowth.toFixed(1)}% (<20%)`);
  }
  if (npmDeltaBps != null && npmDeltaBps < -50) {
    growthFlags.push(`NPM compressed ${(-npmDeltaBps).toFixed(0)}bps in 4Q`);
  }
  if (quarters.length < 5) {
    growthFlags.push(`Only ${quarters.length} quarters — insufficient for YoY`);
  }

  if (roce != null && roce < 15) qualityFlags.push(`ROCE ${roce.toFixed(1)}% (<15%)`);
  if (roe != null && roe < 15) qualityFlags.push(`ROE ${roe.toFixed(1)}% (<15%)`);
  if (peRatio != null && peRatio > 60) qualityFlags.push(`PE ${peRatio.toFixed(1)} (>60) — higher than ideal for growth screening; cross-check with median PE rule`);
  if (netDebtToEquity != null && netDebtToEquity >= 0.5) qualityFlags.push(`D/E ${netDebtToEquity.toFixed(2)} (≥0.5)`);
  if (pledgePct != null && pledgePct >= 2) qualityFlags.push(`Pledge ${pledgePct.toFixed(1)}% (≥2%)`);
  if (smartMoneyTotal != null && smartMoneyTotal < 60) qualityFlags.push(`Smart money ${smartMoneyTotal.toFixed(1)}% (<60%)`);

  // ── Hard reject (immediate disqualifier) ─────────────────────────────────
  let hardRejectReason: string | null = null;
  if (quarters.length < 5) {
    hardRejectReason = 'Insufficient quarterly history (need ≥5 quarters)';
  } else if (netDebtToEquity != null && netDebtToEquity >= 0.5) {
    hardRejectReason = `Debt/Equity ${netDebtToEquity.toFixed(2)} (≥0.5)`;
  } else if (pledgePct != null && pledgePct >= 5) {
    hardRejectReason = `Promoter pledge ${pledgePct.toFixed(1)}% (≥5%)`;
  } else if (smartMoneyTotal != null && smartMoneyTotal < 30) {
    hardRejectReason = `Smart money ${smartMoneyTotal.toFixed(1)}% (<30%)`;
  } else if (marketCapCr != null && marketCapCr < 500) {
    hardRejectReason = `Market cap ₹${marketCapCr.toFixed(0)}Cr (< ₹500Cr)`;
  } else if (summary.currentNetProfit != null && (summary.currentNetProfit as number) < 50) {
    hardRejectReason = `Net profit ₹${summary.currentNetProfit}Cr (< ₹50Cr)`;
  } else if (yoyRevenueGrowth != null && yoyProfitGrowth != null
             && yoyRevenueGrowth < 0 && yoyProfitGrowth < 0) {
    hardRejectReason = `Revenue & PAT both shrinking YoY (${yoyRevenueGrowth.toFixed(1)}% / ${yoyProfitGrowth.toFixed(1)}%)`;
  }

  // ── Bucket decision ───────────────────────────────────────────────────────
  // Build a fully-typed GrowthMetrics so computeGrowthScore compiles cleanly;
  // fields the score fn doesn't read are still required by the type.
  const scoreInput: GrowthMetrics = {
    symbol: safeSymbol, sector,
    yoyRevenueGrowth, yoyProfitGrowth, yoyEpsGrowth,
    qoqRevenueGrowth, qoqProfitGrowth,
    cagrSales1Y, cagrSales3Y, cagrSales5Y,
    cagrProfit1Y, cagrProfit3Y, cagrProfit5Y,
    cagrEps3Y, cagrEps5Y,
    npmNow, npm4QAgo, npmDeltaBps,
    opmNow, opm4QAgo, opmDeltaBps,
    roce, roe, peRatio, pbRatio, psRatio, evEbitda, pegRatio,
    netDebtToEquity, pledgePct, smartMoneyTotal, marketCapCr,
    dividendYield, enterpriseValueCr,
    cfoToPat, freeCashFlow, capexToSales, fcfYield,
    dioDays, dsoDays, dpoDays,
    bucket: 'REJECT', passScore: 0,
    hardRejectReason: null, qualityFlags, growthFlags,
    quartersAnalyzed: quarters.length, latestQuarter,
    quarterlySeries: quarters,
  };
  const passScore = computeGrowthScore(scoreInput);

  let bucket: Bucket = 'REJECT';
  if (!hardRejectReason) {
    // PASS requires every primary gate green
    const growthPass =
      yoyRevenueGrowth != null && yoyRevenueGrowth >= 20 &&
      yoyProfitGrowth  != null && yoyProfitGrowth  >= 20;
    const qualityPass =
      (roce == null || roce >= 15) &&
      (roe == null || roe >= 15) &&
      (netDebtToEquity == null || netDebtToEquity < 0.5) &&
      (pledgePct == null || pledgePct < 2) &&
      (smartMoneyTotal == null || smartMoneyTotal >= 60);
    const marginStable = (npmDeltaBps == null || npmDeltaBps >= -50);

    if (growthPass && qualityPass && marginStable && passScore >= 70) {
      bucket = 'PASS';
    } else if (passScore >= 45) {
      bucket = 'WATCH';
    } else {
      bucket = 'REJECT';
    }
  }

  return {
    symbol: safeSymbol, sector,
    yoyRevenueGrowth, yoyProfitGrowth, yoyEpsGrowth,
    qoqRevenueGrowth, qoqProfitGrowth,
    cagrSales1Y, cagrSales3Y, cagrSales5Y,
    cagrProfit1Y, cagrProfit3Y, cagrProfit5Y,
    cagrEps3Y, cagrEps5Y,
    npmNow, npm4QAgo, npmDeltaBps,
    opmNow, opm4QAgo, opmDeltaBps,
    roce, roe, peRatio, pbRatio, psRatio, evEbitda, pegRatio,
    netDebtToEquity, pledgePct, smartMoneyTotal, marketCapCr,
    dividendYield, enterpriseValueCr,
    cfoToPat, freeCashFlow, capexToSales, fcfYield,
    dioDays, dsoDays, dpoDays,
    bucket, passScore, hardRejectReason,
    qualityFlags, growthFlags,
    quartersAnalyzed: quarters.length, latestQuarter,
    quarterlySeries: quarters,
  };
}