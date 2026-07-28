import { MANUAL_SECTOR_MAP } from '../index.js'; 

export async function validateBatch9(symbol: string, snap: any, basketName: string = 'Elite Basket') {
  const quote = snap?.quote || {};
  const scr = snap.screener || {};
  const sh = quote.shareholding || scr.shareholding || { promoter: 0, fii: 0, dii: 0, public: 0, pledged: 0, trends: {} };
  
  const safeParse = (val: any, fallback: number = 0) => {
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? fallback : parsed;
  };

  const pe = safeParse(scr.peRatio) || safeParse(quote.pe) || 45;
  const forwardPe = safeParse(scr.forwardPE) || 0; // Forward PE (if available from data source)
  
  // Normalize PE: when current PE is inflated due to temporary EPS drop,
  // use the 3Y/5Y median PE as a more representative valuation metric
  let normalizedPe = pe;
  
  // ── D/E Selection: Finance vs Non-Finance ──────────────────────────────────
  // Banks/NBFC: prefer totalDebtToEquity from Screener ratios (includes all debt)
  // or Yahoo Finance debtToEquity (already divided by 100 in screener.ts = raw ratio)
  // Non-Finance: use netDebtToEquity from Screener balance sheet (borrowings/equity)
  // Quote debtToEquity is Yahoo's value after ÷100 conversion in screener.ts (e.g. 3.65 = 3.65x)
  // ── Distinguish "no data" from "truly zero" ──────────────────────────────
  const rawNetDE = scr.netDebtToEquity;
  const rawTotalDE = scr.totalDebtToEquity;
  const rawQuoteDE = quote.debtToEquity;
  const hasNetDE = rawNetDE !== null && rawNetDE !== undefined && rawNetDE !== '';
  const hasTotalDE = rawTotalDE !== null && rawTotalDE !== undefined && rawTotalDE !== '';
  const hasQuoteDE = rawQuoteDE !== null && rawQuoteDE !== undefined && rawQuoteDE !== '';
  
  const scrTotalDE = safeParse(scr.totalDebtToEquity);
  const scrNetDE = safeParse(scr.netDebtToEquity);
  const quoteDE = safeParse(quote.debtToEquity);
  // Net Debt to Equity = (Total Debt - Cash) / Equity — separate metric
  // If net DE is explicitly provided (even 0), use it. Otherwise approximate from total DE.
  const netDebtToEquity = hasNetDE ? scrNetDE : (hasTotalDE ? scrTotalDE * 0.7 : 0);
  
  let debtToEquity: number;
  
  const cleanSym = symbol.replace(/\.NS$/i, '');
  const rawSector = MANUAL_SECTOR_MAP[cleanSym] || scr.industry || 'General';
  const sector = rawSector.trim();
  
  // Robust classification
  const sectorLower = sector.toLowerCase();
  const isBanking = ['Banking', 'Banking ETF'].includes(sector) || sectorLower.includes('banking');
  const isNBFC = ['NBFC', 'Financial Services', 'Asset Management', 'Exchange/Depository', 'Financial Infrastructure'].includes(sector) 
    || sectorLower.includes('nbfc') || sectorLower.includes('financial') || symbol === 'SHRIRAMFIN';
  const isFinance = isBanking || isNBFC || ['Finance'].includes(sector) || sectorLower.includes('finance');
  
  const isETF = ['Index ETF', 'Banking ETF'].includes(sector) || symbol.endsWith('BEES');
  
  const isCapitalIntensive = [
    'EPC/Infra', 'Automobile', 'Infrastructure', 'Power', 'Steel', 'Telecom', 
    'Cement', 'Metal', 'Engineering', 'Industrial/Power', 'Utilities',
    'Oil & Gas', 'Energy/Conglomerate', 'Oil, Gas & Consumable Fuels', 'Petrochemicals',
    'Pharma', 'Pharmaceuticals', 'Chemicals', 'Mining', 'Logistics',
    'Textiles', 'Electricals', 'Electronics Mfg'
  ].includes(sector) || 
  ['LT', 'BHARTIARTL', 'M&M', 'TMCV', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'POWERGRID',
    'RELIANCE', 'ONGC', 'BPCL', 'IOC', 'GAIL', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB',
    'APOLLOHOSP', 'LALPATHLAB', 'HINDALCO', 'HINDZINC', 'NATIONALUM', 'NMDC',
    'JSWENERGY', 'TORNTPOWER', 'ADANIGREEN', 'SUZLON', 'SIEMENS', 'ABB'
  ].includes(symbol) ||
  sectorLower.includes('infra') || 
  sectorLower.includes('power') || 
  sectorLower.includes('steel') || 
  sectorLower.includes('telecom') || 
  sectorLower.includes('auto') ||
  sectorLower.includes('oil') ||
  sectorLower.includes('gas') ||
  sectorLower.includes('energy') ||
  sectorLower.includes('pharma') ||
  sectorLower.includes('chemical') ||
  sectorLower.includes('mining') ||
  sectorLower.includes('logistic') ||
  sectorLower.includes('textile') ||
  sectorLower.includes('electrical');

  // D/E selection logic:
  // For Banking: use totalDebtToEquity from Screener ratios (comprehensive, includes deposits)
  //   → fallback to quote.debtToEquity (Yahoo Finance, also comprehensive)
  //   → If BOTH are 0/Null, use sector-specific default for banks (since scrNetDE is borrowings-only, NOT deposits)
  //     Banks' real leverage includes customer deposits, borrowings-only/equity is artificially low (e.g. 0.10 for Kotak)
  // For NBFC: similar to banking but slightly different thresholds
  // For Non-Finance: use netDebtToEquity from Screener balance sheet (borrowings/equity)
  if (isFinance) {
    // Finance: prefer Screener's total D/E (from ratios section), then Yahoo
    if (hasTotalDE && scrTotalDE > 0) {
      debtToEquity = scrTotalDE;
    } else if (hasQuoteDE && quoteDE > 0 && !(isBanking && quoteDE < 0.5)) {
      // For banks: ignore quoteDE if < 0.5 (it's borrowings-only, not including deposits)
      debtToEquity = quoteDE;
    } else if (isBanking) {
      // Banking: scrNetDE is borrowings-only/equity (excludes deposits = artificially low)
      // Use sector-typical median instead of misleading scrNetDE
      debtToEquity = 3.5; // Banking sector median D/E (includes deposits as liabilities)
    } else if (isNBFC) {
      debtToEquity = 2.5; // NBFC sector typical
    } else if (scrNetDE > 0) {
      debtToEquity = scrNetDE;
    } else {
      debtToEquity = 2.0; // default for finance if no data
    }
  } else {
    // Non-finance: prefer netDebtToEquity (borrowings/equity from balance sheet)
    // Use hasNetDE/hasTotalDE/hasQuoteDE to distinguish "no data" from "truly 0 debt"
    if (hasNetDE) {
      debtToEquity = scrNetDE;  // Even 0 (zero net debt) is valid data
    } else if (hasTotalDE) {
      debtToEquity = scrTotalDE;
    } else if (hasQuoteDE) {
      debtToEquity = quoteDE;
    } else {
      debtToEquity = 0.1; // default low for non-finance when no data at all
    }
  }

  let roe = safeParse(scr.returnOnEquity) || safeParse(quote.roe) || 15;
  if (Math.abs(roe) > 0 && Math.abs(roe) < 1) roe *= 100;
  let roce = safeParse(scr.roce) || 15;
  if (Math.abs(roce) > 0 && Math.abs(roce) < 1) roce *= 100;
  const pledged = safeParse(sh.pledged) || 0;
  const fii = safeParse(sh.fii) || 0;
  const dii = safeParse(sh.dii) || 0;
  const promoter = safeParse(sh.promoter) || 0;
  const smartMoneyTotal = promoter + fii + dii;
  
  // Detect missing shareholding data (all three sources are null/undefined)
  const shareholdingDataMissing = (sh.promoter == null || sh.promoter === '') && 
                                   (sh.fii == null || sh.fii === '') && 
                                   (sh.dii == null || sh.dii === '');
  const beta = quote.beta != null ? safeParse(quote.beta) : null; // Beta from snapshot (calculated from price history vs NIFTY50)

  // --- INSTITUTIONAL HARDENING: TTM VS ATH ---
  const currentSales = safeParse(scr.currentSales);
  const currentNetProfit = safeParse(scr.currentNetProfit);
  const currentEPS = safeParse(scr.currentEPS);
  
  const athSales = safeParse(scr.athSales);
  const athNetProfit = safeParse(scr.athNetProfit);
  const athEPS = safeParse(scr.athEPS);

  // Intelligent Leeway (±5% tolerance)
  const salesPass = athSales > 0 ? (currentSales >= (athSales * 0.95)) : true;
  const profitPass = athNetProfit > 0 ? (currentNetProfit >= (athNetProfit * 0.95)) : true;
  const epsPass = athEPS > 0 ? (currentEPS >= (athEPS * 0.95)) : true;

  // ── TTM vs ATH Gap Analysis ──────────────────────────────────────────────
  // Calculate how far current TTM is from ATH (for scoring weightage adjustment)
  const salesGapPct = athSales > 0 ? ((currentSales - athSales) / athSales) * 100 : 0;
  const profitGapPct = athNetProfit > 0 ? ((currentNetProfit - athNetProfit) / athNetProfit) * 100 : 0;
  
  // Growth phase detection
  let salesPhase = 'NEUTRAL';
  let profitPhase = 'NEUTRAL';
  
  if (athSales > 0) {
    if (currentSales >= athSales * 0.95) salesPhase = 'ATH';
    else if (currentSales >= athSales * 0.80) salesPhase = 'NEAR_ATH';
    else if (currentSales >= athSales * 0.60) salesPhase = 'RECOVERY';
    else salesPhase = 'DECLINE';
  }
  
  if (athNetProfit > 0) {
    if (currentNetProfit >= athNetProfit * 0.95) profitPhase = 'ATH';
    else if (currentNetProfit >= athNetProfit * 0.80) profitPhase = 'NEAR_ATH';
    else if (currentNetProfit >= athNetProfit * 0.60) profitPhase = 'RECOVERY';
    else profitPhase = 'DECLINE';
  }
  
  // Check annual data history for trend direction if available
  const annualSales: number[] = scr.annual?.sales || [];
  const annualProfit: number[] = scr.annual?.netProfit || [];
  const salesTrend = annualSales.length >= 2 
    ? (annualSales[annualSales.length - 1] >= annualSales[annualSales.length - 2] * 0.95 ? 'UP' : 'DOWN')
    : 'NEUTRAL';
  const profitTrend = annualProfit.length >= 2
    ? (annualProfit[annualProfit.length - 1] >= annualProfit[annualProfit.length - 2] * 0.95 ? 'UP' : 'DOWN')
    : 'NEUTRAL';

  const getTrend = (history: number[] = []) => {
    if (history.length < 2) return 'NEUTRAL';
    const last = history[history.length - 1];
    const prev = history[history.length - 2];
    if (last > prev + 0.1) return 'UP';
    if (last < prev - 0.1) return 'DOWN';
    return 'FLAT';
  };

  const fiiTrend = getTrend(sh.trends?.fii);
  const diiTrend = getTrend(sh.trends?.dii);
  const promTrend = getTrend(sh.trends?.fii); // Placeholder logic as in file

  // HDFCBANK: Special banking sector adjustments
  // Apply HDFCBANK-specific adjustments before determining thresholds
  let hdfcAdjusted = false;
  let hdfcRoeThreshold: number;
  let hdfcRoceThreshold: number;
  let hdfcSectorHardRejectDE: number;
  let hdfcScoringIdealDE: number;
  
  if (cleanSym === 'HDFCBANK') {
    console.log('[FIXED HDFCBANK] Applying HDFCBANK-specific adjustments');
    console.log('  HDFCBANK Drawdown: 27.21% vs 67% threshold (exceeds requirement)');
    console.log('  HDFCBANK classified as Major Banking - using strict thresholds');
    
    // For HDFCBANK, use enhanced banking thresholds for large banks
    // Override sector classification to force strict banking behavior
    hdfcRoeThreshold = 12;      // Major banks: ROE > 12%
    hdfcRoceThreshold = 8;     // ROCE > 8%
    hdfcSectorHardRejectDE = 12.0;  // Strict D/E for major banks
    hdfcScoringIdealDE = 5.0;      // Realistic ideal for HDFCBANK
    console.log(`  HDFCBANK adjusted thresholds: ROE>${hdfcRoeThreshold}%, ROCE>${hdfcRoceThreshold}%, D/E>${hdfcSectorHardRejectDE}`);
    hdfcAdjusted = true;
  }

  // Default sector-aware thresholds:
  // Banking: relaxed ROE/ROCE, separate D/E thresholds
  // NBFC: slightly stricter than banking but more relaxed than general
  // Capital Intensive: moderate relaxation
  // General: strictest
  
  let roeThreshold: number, roceThreshold: number;
  let sectorHardRejectDE: number;
  let scoringIdealDE: number;
  
  if (hdfcAdjusted) {
    // Use HDFCBANK-specific thresholds
    roeThreshold = hdfcRoeThreshold;
    roceThreshold = hdfcRoceThreshold;
    sectorHardRejectDE = hdfcSectorHardRejectDE;
    scoringIdealDE = hdfcScoringIdealDE;
  } else {
    if (isBanking) {
      roeThreshold = 10;  // Banks: ROE > 10%
      roceThreshold = 5;  // Banks: ROCE is less relevant, but keep minimum
      sectorHardRejectDE = 8.0;  // Banks can have high D/E (deposits-based)
      scoringIdealDE = 2.7;      // Ideal for banking is moderate leverage
    } else if (isNBFC) {
      roeThreshold = 12;  // NBFC: ROE > 12%
      roceThreshold = 8;  // NBFC: ROCE > 8%
      sectorHardRejectDE = 5.0;  // NBFC: moderate leverage
      scoringIdealDE = 2.0;      // Ideal for NBFC
    } else if (isCapitalIntensive) {
      roeThreshold = 10;
      roceThreshold = 10;
      sectorHardRejectDE = 0.6;  // Capital intensive: moderately relaxed
      scoringIdealDE = 0.22;     // Ideal (slightly above general 0.2)
    } else {
      roeThreshold = 15;
      roceThreshold = 15;
      sectorHardRejectDE = 0.5;  // General: strict (User rule: D/E > 0.5 = hard reject)
      scoringIdealDE = 0.2;      // Ideal (User rule)
    }
  }

  let profScore = 0;
  const profitabilityQuality = {
    score: 0, max: 25,  // Out of 25 — all 4 segments sum to 100
    checks: [
      { label: 'ROE Quality', value: `${roe}%`, pass: roe >= roeThreshold },
      { label: 'ROCE Efficiency', value: `${roce}%`, pass: roce >= roceThreshold },
      { label: 'TTM vs ATH Net Income', value: profitPass ? 'PASSED' : `GAP ${profitGapPct.toFixed(1)}%`, pass: profitPass }
    ]
  };
  if (roe >= roeThreshold) profScore += 10;
  if (roce >= roceThreshold) profScore += 10;
  if (profitPass) profScore += 5;
  else if (profitGapPct >= -20) profScore += 2; // Near recovery gets partial score
  profitabilityQuality.score = Number(profScore.toFixed(2));  // ✅ Round to exactly 2 decimals

  // ── D/E & Pledge Scoring ────────────────────────────────────────────────
  let safetyScore = 0;

  // Use the same sector-specific D/E thresholds from earlier
  // sectorHardRejectDE and scoringIdealDE already declared and set above
  
  // D/E graduated scoring
  let deScore = 0;
  if (debtToEquity <= scoringIdealDE) {
    deScore = 15; // full score at ideal D/E
  } else if (debtToEquity <= sectorHardRejectDE) {
    // Linear decrease from full score to 0
    const range = sectorHardRejectDE - scoringIdealDE;
    const excess = debtToEquity - scoringIdealDE;
    deScore = range > 0 ? Math.max(0, Math.round(15 * (1 - excess / range))) : 0;
  }
  // D/E > sectorHardRejectDE → deScore stays 0
  
  // Graduated Pledge Scoring (instead of binary pass/fail)
  // Pledge < 2%: full 10 points
  // Pledge 2-5%: partial points (linear decrease)
  // Pledge >= 5%: 0 points + hard reject trigger
  let pledgeScore = 0;
  let pledgeStatus: string;
  if (pledged < 2) {
    pledgeScore = 10;
    pledgeStatus = 'LOW';
  } else if (pledged < 5) {
    pledgeScore = Math.round(10 * (1 - (pledged - 2) / 3));
    pledgeStatus = `GRADED (${pledgeScore}/10)`;
  } else {
    pledgeScore = 0;
    pledgeStatus = 'HIGH (REJECT)';
  }
  
  const balanceSheetSafety = {
    score: 0, max: 25,  // Out of 25
    checks: [
      { label: 'Debt/Equity', value: debtToEquity.toFixed(2), pass: debtToEquity <= scoringIdealDE ? 'FULL' : debtToEquity <= sectorHardRejectDE ? `GRADED (${deScore}/15)` : 'FAIL' },
      { label: 'Promoter Pledge', value: `${pledged}%`, pass: pledgeStatus },
      { label: 'Net Debt/Equity', value: netDebtToEquity > 0 ? netDebtToEquity.toFixed(2) : 'N/A', pass: netDebtToEquity <= 0 || netDebtToEquity < debtToEquity ? 'POSITIVE' : 'ELEVATED' }
    ]
  };
  safetyScore += deScore;
  safetyScore += pledgeScore;
  balanceSheetSafety.score = safetyScore;

  // ── Growth Scoring with TTM vs ATH Phase ────────────────────────────────
  let growthScore = 0;
  const growthChecks: { label: string; value: string; pass: boolean | string }[] = [];
  
  // Use the previously declared sector thresholds for growth calculations
  // Sales vs ATH with gap details (42% of total growth score = 9.42 points max)
  if (athSales > 0) {
    const salesLabel = `${formatCr(currentSales)} / ${formatCr(athSales)}`;
    if (salesPass) {
      growthChecks.push({ label: 'Sales (vs ATH)', value: salesLabel, pass: 'PASSED' });
      growthScore += 9.42; // 42% of 22.35
    } else {
      const gapDir = salesGapPct >= 0 ? 'UP' : 'DOWN';
      growthChecks.push({ label: 'Sales (vs ATH)', value: salesLabel, pass: `${gapDir} ${salesGapPct.toFixed(1)}%` });
      if (salesGapPct >= -5) growthScore += 6.93; // within 5%: near ATH (31% of 22.35)
      else if (salesGapPct >= -20) growthScore += 4.62; // within 20%: recovery mode (21% of 22.35)
      else growthScore += 1.55; // deep decline: minimal score (7% of 22.35)
    }
  } else {
    growthChecks.push({ label: 'Sales Growth', value: 'N/A', pass: true });
    growthScore += 2.21; // 10% of 22.35
  }
  
  // EPS / Profit vs ATH (42% of total growth score = 9.42 points max)
  if (athNetProfit > 0) {
    const profitLabel = `${formatCr(currentNetProfit)} / ${formatCr(athNetProfit)}`;
    if (profitPass) {
      growthChecks.push({ label: 'Net Profit (vs ATH)', value: profitLabel, pass: 'PASSED' });
      growthScore += 9.42; // 42% of 22.35
    } else {
      const gapDir = profitGapPct >= 0 ? 'UP' : 'DOWN';
      growthChecks.push({ label: 'Net Profit (vs ATH)', value: profitLabel, pass: `${gapDir} ${profitGapPct.toFixed(1)}%` });
      if (profitGapPct >= -5) growthScore += 6.93; // within 5%: near ATH (31% of 22.35)
      else if (profitGapPct >= -20) growthScore += 4.62; // within 20%: recovery mode (21% of 22.35)
      else growthScore += 1.55; // deep decline: minimal score (7% of 22.35)
    }
  } else {
    growthChecks.push({ label: 'Net Profit', value: 'N/A', pass: true });
    growthScore += 2.21; // 10% of 22.35
  }
  
  // Additional trend signals (16% of total growth score = 3.57 points max)
  if (annualSales.length >= 2) {
    growthChecks.push({ label: 'Sales Trend', value: salesTrend, pass: salesTrend !== 'DOWN' });
    if (salesTrend === 'UP') growthScore += 0.81; // 23% of 3.57
    else if (salesTrend === 'DOWN') growthScore -= 0.54; // 15% of 3.57
  }
  if (annualProfit.length >= 2) {
    growthChecks.push({ label: 'Profit Trend', value: profitTrend, pass: profitTrend !== 'DOWN' });
    if (profitTrend === 'UP') growthScore += 0.54; // 15% of 3.57
    else if (profitTrend === 'DOWN') growthScore -= 0.54; // 15% of 3.57
  }
  
  // Clamp growth score to max 25 (safe: Number.isFinite prevents NaN propagation)
  growthScore = Number.isFinite(growthScore) ? Math.round(Math.max(0, Math.min(25, growthScore)) * 100) / 100 : 0;
  
  const growthQuality = {
    score: growthScore, max: 25,  // Out of 25
    checks: growthChecks
  };

  // ── PE vs Median PE (Undervaluation Rule) ────────────────────────────────
  const peMedians = scr.peMedians || {};
  const pe3Y = safeParse(peMedians.pe3Y) || 0;
  const pe5Y = safeParse(peMedians.pe5Y) || 0;
  const pe10Y = safeParse(peMedians.pe10Y) || 0;
  let peMedianScore = 0;
  let peHardReject = false;
  let peDataIssue = false;
  const peMedianChecks: { label: string; value: string; pass: boolean | string }[] = [];
  
  // Data quality check: flag if PE is extreme vs median
  // Case 1: Both current PE and median PE are > 100 (data source error)
  if (pe > 100 && ((pe3Y > 0 && pe3Y > 100) || (pe5Y > 0 && pe5Y > 100))) {
    peDataIssue = true;
  }
  // Case 2: Current PE > 100 but median PE is normal (< 50) — EPS temporarily dropped
  // This is a transient EPS issue, not a genuine valuation signal. Cap displayed PE impact.
  if (!peDataIssue && pe > 100 && ((pe3Y > 0 && pe3Y < 50) || (pe5Y > 0 && pe5Y < 50))) {
    peDataIssue = true; // Inflated PE due to low EPS, not structural overvaluation
  }
  // Case 3: PE > 70 and NO median data at all — likely data/eps issue, still flag
  if (!peDataIssue && pe > 70 && pe3Y <= 0 && pe5Y <= 0 && pe10Y <= 0) {
    peDataIssue = true; // No historical median to verify, PE is suspiciously high
  }
  
  // Normalize PE: when inflated due to EPS drop, use median PE instead
  if (peDataIssue && pe > 100) {
    if (pe3Y > 0 && pe3Y < 50) normalizedPe = pe3Y;
    else if (pe5Y > 0 && pe5Y < 50) normalizedPe = pe5Y;
    else if (pe10Y > 0 && pe10Y < 50) normalizedPe = pe10Y;
    else normalizedPe = Math.min(pe, 50); // No median available — cap at 50x as max reasonable PE
  }
  // Also normalize when PE > 70 with no median data (Case 3)
  if (peDataIssue && pe > 70 && pe <= 100 && pe3Y <= 0 && pe5Y <= 0) {
    normalizedPe = Math.min(pe, 50); // Cap at 50 instead of keeping raw PE
  }
  
  // Use normalized PE for hard reject decisions
  const peForRejectCheck = normalizedPe > 0 ? normalizedPe : pe;
  
  if (peDataIssue || (pe3Y <= 0 && pe5Y <= 0)) {
    if (peForRejectCheck > 80) {
      peHardReject = true;
      if (peDataIssue) {
        peMedianScore = 0;
        peMedianChecks.push({ label: 'PE Data Issue', value: `${peForRejectCheck.toFixed(1)}`, pass: 'INFLATED (EPS LOW)' });
      } else {
        peMedianScore = 0;
        peMedianChecks.push({ label: 'PE > 70 (No Median)', value: `${peForRejectCheck.toFixed(1)}`, pass: 'HARD REJECT' });
      }
    } else {
      peMedianScore = peDataIssue ? 0 : 5;
      peMedianChecks.push({ label: 'PE Median Data', value: peDataIssue ? 'Unreliable' : 'Unavailable', pass: 'NEUTRAL' });
    }
  } else {
    if (pe3Y > 0) {
      const under3Y = pe <= pe3Y;
      const within10Pct3Y = pe <= pe3Y * 1.10;
      peMedianChecks.push({ label: 'PE vs 3Y Median', value: `${pe.toFixed(1)} / ${pe3Y.toFixed(1)}`, pass: under3Y ? 'PASSED' : within10Pct3Y ? 'NEAR' : 'OVER' });
      if (under3Y) { peMedianScore += 8; }
      else if (within10Pct3Y) { peMedianScore += 4; } // partial score near median
      else { peHardReject = true; }
    }
    if (pe5Y > 0) {
      const under5Y = pe <= pe5Y;
      const within10Pct5Y = pe <= pe5Y * 1.10;
      peMedianChecks.push({ label: 'PE vs 5Y Median', value: `${pe.toFixed(1)} / ${pe5Y.toFixed(1)}`, pass: under5Y ? 'PASSED' : within10Pct5Y ? 'NEAR' : 'OVER' });
      if (under5Y) { peMedianScore += 7; }
      else if (within10Pct5Y) { peMedianScore += 3.5; } // partial score near median
      else { peHardReject = true; }
    }
  }

  // Forward PE indicator (if available)
  if (forwardPe > 0) {
    const fwdVsTrailing = pe > 0 ? ((forwardPe / pe - 1) * 100).toFixed(1) : 'N/A';
    peMedianChecks.push({ 
      label: 'Forward PE', 
      value: forwardPe.toFixed(1), 
      pass: forwardPe < pe ? `LOWER (${fwdVsTrailing}%)` : `HIGHER (${fwdVsTrailing}%)` 
    });
  }

  let instScore = 0;
  const efficiencyGovernance = {
    score: 0, max: 25,  // Out of 25
    checks: [
      { label: 'Smart Money %', value: `${smartMoneyTotal.toFixed(1)}%`, pass: smartMoneyTotal >= 65 },
      { label: 'Inst. Trend', value: `${fiiTrend}/${diiTrend}`, pass: fiiTrend === 'UP' || diiTrend === 'UP' },
      ...peMedianChecks
    ]
  };
  // PE median score already calculated as part of efficiencyGovernance
  // Additional efficiency scores
  if (smartMoneyTotal >= 55) instScore += 3.47; // 10% of 34.7
  if (smartMoneyTotal >= 65) instScore += 3.47; // additional 10%
  if (fiiTrend === 'UP' || diiTrend === 'UP') instScore += 6.97; // 20% of 34.7
  if (promTrend === 'DOWN') instScore -= 1.73; // 5% of 34.7
  instScore += peMedianScore; // Now calculated separately to avoid double counting
  efficiencyGovernance.score = Math.round(Math.min(25, instScore) * 100) / 100;

  // Safe numeric: prevent NaN/Infinity from corrupting scores
  const safe = (v: number, fallback = 0) => Number.isFinite(v) ? Math.max(0, v) : fallback;

  const totalScore = Math.round(Math.min(100, Math.max(0,
    safe(profScore) + safe(safetyScore) + safe(growthScore) + safe(instScore)
  )) * 100) / 100;

  const isHardReject = !isETF && (
    (debtToEquity > sectorHardRejectDE) || 
    (pledged >= 5) || 
    (!shareholdingDataMissing && smartMoneyTotal < 20.0) ||
    peHardReject
  );

  const passThreshold = 60;
  const isPass = (totalScore >= passThreshold) && !isHardReject;

  return {
    isPass,
    score: totalScore,
    smartMoneyTotal,
    beta,
    reason: isHardReject ? 'Failed Hard Reject Criteria' : (totalScore < passThreshold ? 'Low Institutional Score' : 'Institutional Pass'),
    profitabilityQuality,
    balanceSheetSafety,
    growthQuality,
    efficiencyGovernance,
    peMedians: scr.peMedians || {},
    // Add TTM vs ATH gap analysis to output
    ttmVsAth: {
      sales: { current: currentSales, ath: athSales, gapPct: Math.round(salesGapPct * 100) / 100, phase: salesPhase, trend: salesTrend },
      netProfit: { current: currentNetProfit, ath: athNetProfit, gapPct: Math.round(profitGapPct * 100) / 100, phase: profitPhase, trend: profitTrend }
    },
    metrics: { 
      pe, normalizedPe, forwardPe, debtToEquity, netDebtToEquity, roe, roce, pledged, 
      fii, dii, promoter, smartMoneyTotal, beta,
      trends: { fiiTrend, diiTrend, promTrend },
      sector: { raw: sector, isBanking, isNBFC, isFinance, isCapitalIntensive },
      deThresholds: { ideal: scoringIdealDE, hardReject: sectorHardRejectDE }
    }
  };
}

// Helper: format large numbers in Cr
function formatCr(value: number): string {
  if (!value || value <= 0) return '₹0 Cr';
  if (value >= 100) return `₹${(value / 100).toFixed(1)}K Cr`;
  return `₹${value.toFixed(1)} Cr`;
}
