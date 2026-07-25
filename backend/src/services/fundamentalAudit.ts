
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
  const debtToEquity = safeParse(scr.netDebtToEquity) || (safeParse(quote.debtToEquity) / 100) || 0.1;
  let roe = safeParse(scr.returnOnEquity) || safeParse(quote.roe) || 15;
  if (Math.abs(roe) > 0 && Math.abs(roe) < 1) roe *= 100;
  let roce = safeParse(scr.roce) || 15;
  if (Math.abs(roce) > 0 && Math.abs(roce) < 1) roce *= 100;
  const pledged = safeParse(sh.pledged) || 0;
  const fii = safeParse(sh.fii) || 0;
  const dii = safeParse(sh.dii) || 0;
  const promoter = safeParse(sh.promoter) || 0;
  const smartMoneyTotal = promoter + fii + dii;
  
  const rawSector = MANUAL_SECTOR_MAP[symbol] || scr.industry || 'General';
  const sector = rawSector.trim();
  
  // Robust classification — includes exhaustive substrings to catch Yahoo Finance labels
  const isFinance = [
    'Banking', 'Finance', 'Banking ETF', 'NBFC', 'Financial Services', 
    'Asset Management', 'Exchange/Depository', 'Financial Infrastructure'
  ].includes(sector) || symbol === 'SHRIRAMFIN' || sector.toLowerCase().includes('finance') || sector.toLowerCase().includes('nbfc')
  || sector.toLowerCase().includes('banking') || sector.toLowerCase().includes('financial');
  
  const isETF = ['Index ETF', 'Banking ETF'].includes(sector) || symbol.endsWith('BEES');
  
  const isCapitalIntensive = [
    'EPC/Infra', 'Automobile', 'Infrastructure', 'Power', 'Steel', 'Telecom', 
    'Cement', 'Metal', 'Engineering', 'Industrial/Power', 'Utilities',
    'Oil & Gas', 'Energy/Conglomerate', 'Oil, Gas & Consumable Fuels', 'Petrochemicals',
    'Pharma', 'Pharmaceuticals', 'Chemicals', 'Mining', 'Logistics',
    'Textiles', 'Media', 'Entertainment', 'Electricals', 'Electronics Mfg',
    'Healthcare', 'Hospitality', 'Food Processing'
  ].includes(sector) || 
  ['LT', 'BHARTIARTL', 'M&M', 'TMCV', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'POWERGRID',
    'RELIANCE', 'ONGC', 'BPCL', 'IOC', 'GAIL', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB',
    'APOLLOHOSP', 'LALPATHLAB', 'HINDALCO', 'HINDZINC', 'NATIONALUM', 'NMDC',
    'JSWENERGY', 'TORNTPOWER', 'ADANIGREEN', 'SUZLON', 'SIEMENS', 'ABB'
  ].includes(symbol) ||
  sector.toLowerCase().includes('infra') || 
  sector.toLowerCase().includes('power') || 
  sector.toLowerCase().includes('steel') || 
  sector.toLowerCase().includes('telecom') || 
  sector.toLowerCase().includes('auto') ||
  sector.toLowerCase().includes('oil') ||
  sector.toLowerCase().includes('gas') ||
  sector.toLowerCase().includes('energy') ||
  sector.toLowerCase().includes('pharma') ||
  sector.toLowerCase().includes('chemical') ||
  sector.toLowerCase().includes('mining') ||
  sector.toLowerCase().includes('logistic') ||
  sector.toLowerCase().includes('textile') ||
  sector.toLowerCase().includes('media') ||
  sector.toLowerCase().includes('electrical') ||
  sector.toLowerCase().includes('healthcare');

  // --- INSTITUTIONAL HARDENING: TTM VS ATH ---
  const currentSales = safeParse(scr.currentSales);
  const currentNetProfit = safeParse(scr.currentNetProfit);
  const currentEPS = safeParse(scr.currentEPS);
  
  const athSales = safeParse(scr.athSales);
  const athNetProfit = safeParse(scr.athNetProfit);
  const athEPS = safeParse(scr.athEPS);

  // Intelligent Leeway
  const salesPass = athSales > 0 ? (currentSales >= (athSales * 0.95)) : true;
  const profitPass = athNetProfit > 0 ? (currentNetProfit >= (athNetProfit * 0.95)) : true;
  const epsPass = athEPS > 0 ? (currentEPS >= (athEPS * 0.95)) : true;

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

  // --- INSTITUTIONAL SCORING ARCHITECTURE ---
  // Sector-aware thresholds: Finance/Cap-Intensive (relaxed), General (stricter)
  const roeThreshold = (isFinance || isCapitalIntensive) ? 10 : 15;
  const roceThreshold = (isFinance || isCapitalIntensive) ? 8 : 15;
  let profScore = 0;
  const profitabilityQuality = {
    score: 0, max: 25,
    checks: [
      { label: 'ROE Quality', value: `${roe}%`, pass: roe >= roeThreshold },
      { label: 'ROCE Efficiency', value: `${roce}%`, pass: roce >= roceThreshold },
      { label: 'TTM vs ATH Net Income', value: profitPass ? 'PASSED' : 'RECOVERY', pass: profitPass }
    ]
  };
  if (roe >= roeThreshold) profScore += 10;
  if (roce >= roceThreshold) profScore += 10;
  if (profitPass) profScore += 5;
  profitabilityQuality.score = profScore;

  let safetyScore = 0;
  const debtLimit = isFinance ? 7.0 : (isCapitalIntensive ? 1.5 : 0.5);
  // D/E graduated scoring: full score at ideal, progressive decrease to max
  // Hard reject thresholds: General 0.5, Cap-Intensive 1.5, Finance 7.0
  const sectorHardRejectDE = isFinance ? 7.0 : (isCapitalIntensive ? 1.5 : 0.5);
  const scoringIdealDE = sectorHardRejectDE / 2.5; // 0.2 for gen, 0.4 cap-int, 1.6 finance
  let deScore = 0;
  if (debtToEquity <= scoringIdealDE) {
    deScore = 15; // full score at ideal D/E
  } else if (debtToEquity <= sectorHardRejectDE) {
    // Linear decrease from full score to 0
    deScore = Math.max(0, Math.round(15 * (1 - (debtToEquity - scoringIdealDE) / (sectorHardRejectDE - scoringIdealDE))));
  }
  // D/E > sectorHardRejectDE → deScore stays 0
  
  const balanceSheetSafety = {
    score: 0, max: 25,
    checks: [
      { label: 'Debt/Equity', value: debtToEquity.toFixed(2), pass: debtToEquity <= scoringIdealDE ? 'FULL' : debtToEquity <= sectorHardRejectDE ? `GRADED (${deScore}/15)` : 'FAIL' },
      { label: 'Promoter Pledge', value: `${pledged}%`, pass: pledged < 2 }
    ]
  };
  safetyScore += deScore;
  if (pledged < 2) safetyScore += 10;
  balanceSheetSafety.score = safetyScore;

  let growthScore = 0;
  const growthQuality = {
    score: 0, max: 25,
    checks: [
      { label: 'Sales Growth', value: salesPass ? 'ATH' : 'TTM-L', pass: salesPass },
      { label: 'EPS Accel', value: epsPass ? 'ATH' : 'STABLE', pass: epsPass }
    ]
  };
  if (salesPass) growthScore += 15;
  if (epsPass) growthScore += 10;
  growthQuality.score = growthScore;

  let instScore = 0;
  // ── PE vs Median PE Check (Undervaluation Rule) ──────────────────────────
  // User rule: current PE must be ≤ BOTH 3Y and 5Y median PE
  // If PE > either median → HARD REJECT (no tolerance, no scoring points)
  const peMedians = scr.peMedians || {};
  const pe3Y = safeParse(peMedians.pe3Y) || 0;
  const pe5Y = safeParse(peMedians.pe5Y) || 0;
  let peMedianScore = 0;
  let peHardReject = false;
  const peMedianChecks: { label: string; value: string; pass: boolean | string }[] = [];
  if (pe3Y > 0) {
    const under3Y = pe <= pe3Y; // ≤ median — NO tolerance
    peMedianChecks.push({ label: 'PE vs 3Y Median', value: `${pe.toFixed(1)} / ${pe3Y.toFixed(1)}`, pass: under3Y ? 'PASSED' : 'OVER' });
    if (under3Y) { peMedianScore += 8; } else { peHardReject = true; }
  }
  if (pe5Y > 0) {
    const under5Y = pe <= pe5Y; // ≤ median — NO tolerance
    peMedianChecks.push({ label: 'PE vs 5Y Median', value: `${pe.toFixed(1)} / ${pe5Y.toFixed(1)}`, pass: under5Y ? 'PASSED' : 'OVER' });
    if (under5Y) { peMedianScore += 7; } else { peHardReject = true; }
  }
  if (peMedianChecks.length === 0) {
    peMedianScore = 5; // neutral if no median data
    peMedianChecks.push({ label: 'PE Median Data', value: 'Unavailable', pass: 'NEUTRAL' });
  }

  const efficiencyGovernance = {
    score: 0, max: 40, // smart money(15) + trend(10) + PE median(15)
    checks: [
      { label: 'Smart Money %', value: `${smartMoneyTotal.toFixed(1)}%`, pass: smartMoneyTotal >= 70 },
      { label: 'Inst. Trend', value: `${fiiTrend}/${diiTrend}`, pass: fiiTrend === 'UP' || diiTrend === 'UP' },
      ...peMedianChecks
    ]
  };
  if (smartMoneyTotal >= 65) instScore += 5; 
  if (smartMoneyTotal >= 70) instScore += 5;
  if (fiiTrend === 'UP' || diiTrend === 'UP') instScore += 10;
  if (promTrend === 'DOWN') instScore -= 5;
  instScore += peMedianScore;
  efficiencyGovernance.score = instScore;

  const totalScore = Math.min(100, Math.max(0, profScore + safetyScore + growthScore + instScore));

  const isHardReject = !isETF && (
    (debtToEquity > sectorHardRejectDE) || 
    (pledged >= 5) || 
    (smartMoneyTotal < 30.0) ||
    peHardReject
  );

  const passThreshold = 60;
  const isPass = (totalScore >= passThreshold) && !isHardReject;

  return {
    isPass,
    score: totalScore,
    smartMoneyTotal,
    reason: isHardReject ? 'Failed Hard Reject Criteria' : (totalScore < passThreshold ? 'Low Institutional Score' : 'Institutional Pass'),
    profitabilityQuality,
    balanceSheetSafety,
    growthQuality,
    efficiencyGovernance,
    peMedians: scr.peMedians || {},
    metrics: { pe, debtToEquity, roe, roce, pledged, fii, dii, promoter, smartMoneyTotal, trends: { fiiTrend, diiTrend, promTrend } }
  };
}
