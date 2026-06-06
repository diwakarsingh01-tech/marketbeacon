
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
  const roe = safeParse(scr.returnOnEquity) || safeParse(quote.roe) || 15;
  const roce = safeParse(scr.roce) || 15;
  const pledged = safeParse(sh.pledged) || 0;
  const fii = safeParse(sh.fii) || 0;
  const dii = safeParse(sh.dii) || 0;
  const promoter = safeParse(sh.promoter) || 0;
  const smartMoneyTotal = promoter + fii + dii;
  
  const sector = MANUAL_SECTOR_MAP[symbol] || scr.industry || 'General';
  const isFinance = ['Banking', 'Finance', 'Banking ETF'].includes(sector);
  const isETF = ['Index ETF', 'Banking ETF'].includes(sector);

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
  let profScore = 0;
  const profitabilityQuality = {
    score: 0, max: 25,
    checks: [
      { label: 'ROE Quality', value: `${roe}%`, pass: roe >= (isFinance ? 12 : 15) },
      { label: 'ROCE Efficiency', value: `${roce}%`, pass: roce >= (isFinance ? 10 : 15) },
      { label: 'TTM vs ATH Profit', value: profitPass ? 'PASSED' : 'RECOVERY', pass: profitPass }
    ]
  };
  if (roe >= (isFinance ? 12 : 15)) profScore += 10;
  if (roce >= (isFinance ? 10 : 15)) profScore += 10;
  if (profitPass) profScore += 5;
  profitabilityQuality.score = profScore;

  let safetyScore = 0;
  const balanceSheetSafety = {
    score: 0, max: 25,
    checks: [
      { label: 'Debt/Equity', value: debtToEquity.toFixed(2), pass: debtToEquity <= (isFinance ? 8.0 : 0.2) },
      { label: 'Promoter Pledge', value: `${pledged}%`, pass: pledged < 2 }
    ]
  };
  if (debtToEquity <= (isFinance ? 8.0 : 0.2)) safetyScore += 15;
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
  const efficiencyGovernance = {
    score: 0, max: 25,
    checks: [
      { label: 'Smart Money %', value: `${smartMoneyTotal.toFixed(1)}%`, pass: smartMoneyTotal >= 70 },
      { label: 'Inst. Trend', value: `${fiiTrend}/${diiTrend}`, pass: fiiTrend === 'UP' || diiTrend === 'UP' }
    ]
  };
  if (smartMoneyTotal >= 65) instScore += 5; 
  if (smartMoneyTotal >= 70) instScore += 5;
  if (fiiTrend === 'UP' || diiTrend === 'UP') instScore += 10;
  if (promTrend === 'DOWN') instScore -= 5;
  efficiencyGovernance.score = instScore;

  const totalScore = Math.min(100, Math.max(0, profScore + safetyScore + growthScore + instScore));

  const smThreshold = (basketName === 'Growth Basket' ? 40 : 70);
  const isHardReject = !isETF && (
    (debtToEquity > (isFinance ? 8.0 : 0.2)) || 
    (pledged >= 5) || 
    (smartMoneyTotal < (smThreshold * 0.95))
  );

  return {
    isPass: (totalScore >= 70) && !isHardReject,
    score: totalScore,
    smartMoneyTotal,
    reason: isHardReject ? 'Failed Hard Reject Criteria' : (totalScore < 70 ? 'Low Institutional Score' : 'Institutional Pass'),
    profitabilityQuality,
    balanceSheetSafety,
    growthQuality,
    efficiencyGovernance,
    peMedians: scr.peMedians || {},
    metrics: { pe, debtToEquity, roe, roce, pledged, fii, dii, promoter, smartMoneyTotal, trends: { fiiTrend, diiTrend, promTrend } }
  };
}
