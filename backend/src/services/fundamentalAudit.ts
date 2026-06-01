
import { MANUAL_SECTOR_MAP } from '../index.js'; // Assuming this exists or needs to be exported from index.js
import { getMarketSnapshot } from '../screener.js'; // Assuming this exists

export async function validateBatch9(symbol: string, snap: any, basketName: string = 'Bluechip') {
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

  // Intelligent Leeway: If ATH data is missing (0), we assume current is the peak for scoring purposes
  const salesPass = athSales > 0 ? (currentSales >= (athSales * 0.95)) : true;
  const profitPass = athNetProfit > 0 ? (currentNetProfit >= (athNetProfit * 0.95)) : true;
  const epsPass = athEPS > 0 ? (currentEPS >= (athEPS * 0.95)) : true;

  // --- INSTITUTIONAL TRENDS (Last 3 Quarters) ---
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
  const promTrend = getTrend(sh.trends?.promoter);

  // --- SCORING MODEL 2.0 (REFINED) ---
  let profScore = 0;
  if (roe >= (isFinance ? 12 : 15)) profScore += 10;
  if (roce >= (isFinance ? 10 : 15)) profScore += 10;
  if (profitPass) profScore += 5; // TTM Profit vs ATH

  let safetyScore = 0;
  // Non-Finance: Tight 0.2 limit. Finance: Up to 8.0 (Business model leeway)
  if (debtToEquity <= (isFinance ? 8.0 : 0.2)) safetyScore += 15;
  if (pledged < 2) safetyScore += 10;

  let growthScore = 0;
  if (salesPass) growthScore += 15;
  if (epsPass) growthScore += 10;

  let instScore = 0;
  // Smart Money 70% Hardened Threshold (with 5% intelligence tolerance for quality)
  if (smartMoneyTotal >= 65) instScore += 10; 
  if (smartMoneyTotal >= 70) instScore += 5;
  if (fiiTrend === 'UP' || diiTrend === 'UP') instScore += 10;
  if (promTrend === 'DOWN') instScore -= 10;

  const totalScore = Math.min(100, Math.max(0, profScore + safetyScore + growthScore + instScore));

  // HARD REJECTS (Institutional Grade)
  const smThreshold = (basketName === 'Wealth Universe' ? 40 : 70);
  const isHardReject = !isETF && (
    (debtToEquity > (isFinance ? 8.0 : 0.2)) || // Hard Pillar 7 Rule: 0.2 (Non-Fin), 8.0 (Fin)
    (pledged >= 10) || 
    (smartMoneyTotal < (smThreshold * 0.95)) // 5% Tolerance for Elite Quality
  );

  return {
    isPass: (totalScore >= 70) && !isHardReject,
    score: totalScore,
    smartMoneyTotal,
    profitabilityQuality: { 
      score: profScore, max: 25, 
      checks: [
        { label: 'ROE', value: `${roe}%`, pass: roe >= (isFinance ? 12 : 15) },
        { label: 'ROCE', value: `${roce}%`, pass: roce >= (isFinance ? 10 : 15) }
      ]
    },
    balanceSheetSafety: {
      score: safetyScore, max: 25,
      checks: [
        { label: 'Net Debt/Equity', value: debtToEquity.toFixed(2), pass: debtToEquity <= (isFinance ? 8.0 : 0.2) },
        { label: 'Pledged Shares', value: `${pledged}%`, pass: pledged < 2 }
      ]
    },
    growthQuality: {
      score: growthScore, max: 25,
      checks: [
        { label: 'TTM Sales vs ATH', value: salesPass ? 'Record High' : 'Lagging', pass: salesPass },
        { label: 'TTM EPS vs ATH', value: epsPass ? 'Growing' : 'Stale', pass: epsPass }
      ]
    },
    efficiencyGovernance: {
      score: instScore, max: 25,
      checks: [
        { label: 'Smart Money Total', value: `${smartMoneyTotal.toFixed(1)}%`, pass: smartMoneyTotal >= 65 },
        { label: 'Inst. Trend', value: `${fiiTrend}/${diiTrend}`, pass: fiiTrend === 'UP' || diiTrend === 'UP' }
      ]
    },
    metrics: { pe, debtToEquity, roe, roce, pledged, fii, dii, promoter, smartMoneyTotal, trends: { fiiTrend, diiTrend, promTrend } }
  };
}
