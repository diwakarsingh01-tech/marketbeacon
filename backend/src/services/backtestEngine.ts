import {
  calculateEnvelope, processShortEnvelope, calculateBollingerBand,
  calculateSMAStacking, calculate52WeekStrategy, calculateSRStrategy,
  calculateRHS, calculateCupHandle, calculateSixtySevenFunda,
  calculateTwentyRallyRetest, checkInstitutionalMandates, Quote
} from '../strategies/index.js';

export interface BacktestTrade {
  strategyId: string;
  strategyName: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  targetPrice: number;
  targetHit: boolean;
  roi: number;
  daysHeld: number;
}

export interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgRoi: number;
  avgDays: number;
  bestTrade: number;
  worstTrade: number;
  trades: BacktestTrade[];
}

const STRATEGY_NAMES: Record<string, string> = {
  ENVELOPE_LONG: 'Long Envelope',
  ENVELOPE_SHORT: 'Short Envelope',
  BOLLINGER: 'Bollinger Band',
  SMA_BCD: 'MA Stacking',
  '52W_HIGH_LOW': '52-Week High/Low',
  SR_STRATEGY: 'Supply-Demand',
  RHS_ABCD: 'RHS (Reverse H&S)',
  CUP_HANDLE_ABCD: 'Cup & Handle',
  SIXTY_SEVEN_FUNDA: '67% Funda',
  TWENTY_RALLY_RETEST: 'Velocity Retest',
};

const MIN_LOOKBACK: Record<string, number> = {
  ENVELOPE_LONG: 250,
  ENVELOPE_SHORT: 250,
  BOLLINGER: 250,
  SMA_BCD: 320,
  '52W_HIGH_LOW': 280,
  SR_STRATEGY: 200,
  RHS_ABCD: 420,
  CUP_HANDLE_ABCD: 420,
  SIXTY_SEVEN_FUNDA: 280,
  TWENTY_RALLY_RETEST: 280,
};

function runStrategyById(stratId: string, quotes: Quote[], screenerData?: any) {
  switch (stratId) {
    case 'ENVELOPE_LONG': return calculateEnvelope(quotes);
    case 'ENVELOPE_SHORT': return processShortEnvelope(quotes);
    case 'BOLLINGER': return calculateBollingerBand(quotes);
    case 'SMA_BCD': return calculateSMAStacking(quotes);
    case '52W_HIGH_LOW': return calculate52WeekStrategy(quotes);
    case 'SR_STRATEGY': return calculateSRStrategy(quotes, screenerData);
    case 'RHS_ABCD': return calculateRHS(quotes);
    case 'CUP_HANDLE_ABCD': return calculateCupHandle(quotes);
    case 'SIXTY_SEVEN_FUNDA': return calculateSixtySevenFunda(quotes, screenerData || {});
    case 'TWENTY_RALLY_RETEST': return calculateTwentyRallyRetest(quotes);
    default: return null;
  }
}

export function backtestStrategy(
  stratId: string,
  fullQuotes: Quote[],
  screenerData?: any,
  summaryOnly?: boolean
): BacktestResult {
  const minBars = MIN_LOOKBACK[stratId] || 250;
  if (!fullQuotes || fullQuotes.length < minBars + 50) {
    return { totalTrades: 0, wins: 0, losses: 0, winRate: 0, avgRoi: 0, avgDays: 0, bestTrade: 0, worstTrade: 0, trades: [] };
  }

  const trades: BacktestTrade[] = [];
  let runningRoiSum = 0, runningDaysSum = 0, runningWins = 0, runningTotal = 0;
  const maxLookback = fullQuotes.length;
  let inTrade = false;
  let entryPrice = 0;
  let entryDate = '';
  let targetPrice = 0;
  let entryIdx = 0;
  let waitBars = 0;
  for (let i = minBars; i < maxLookback; i++) {
    if (waitBars > 0) { waitBars--; continue; }

    if (!inTrade) {
      const windowQuotes = fullQuotes.slice(0, i + 1);
      const result = runStrategyById(stratId, windowQuotes, screenerData);
      if (result && result.isBuyZone && result.entryPrice > 0 && result.target > 0) {
        inTrade = true;
        entryPrice = result.entryPrice;
        targetPrice = result.target;
        entryIdx = i;
        const d = fullQuotes[i].date;
        entryDate = typeof d === 'string' ? d : (d as Date).toISOString().split('T')[0];
      }
    }

    if (inTrade) {
      const quote = fullQuotes[i];
      const high = quote.high;
      const low = quote.low;
      const close = quote.close;
      const daysHeld = i - entryIdx;

      let exitTriggered = false;
      let exitPrice = 0;
      let targetHit = false;

      // Exit only when target is hit — no stop-loss, no time expiry
      if (high >= targetPrice) {
        exitTriggered = true;
        exitPrice = targetPrice;
        targetHit = true;
      }

      if (exitTriggered) {
        const roi = ((exitPrice - entryPrice) / entryPrice) * 100;
        runningTotal++;
        runningRoiSum += roi;
        runningDaysSum += daysHeld;
        if (roi > 0) runningWins++;
        if (!summaryOnly) {
          const d = fullQuotes[i].date;
          const exitDate = typeof d === 'string' ? d : (d as Date).toISOString().split('T')[0];
          trades.push({
            strategyId: stratId,
            strategyName: STRATEGY_NAMES[stratId] || stratId,
            entryDate,
            entryPrice: Math.round(entryPrice),
            exitDate,
            exitPrice: Math.round(exitPrice),
            targetPrice: Math.round(targetPrice),
            targetHit,
            roi: Math.round(roi * 100) / 100,
            daysHeld,
          });
        }
        inTrade = false;
        waitBars = 5; // prevent immediate re-entry
      }
    }
  }

  // Close any open trade at the end
  if (inTrade) {
    const last = fullQuotes[fullQuotes.length - 1];
    const close = last.close;
    const daysHeld = fullQuotes.length - 1 - entryIdx;
    const roi = ((close - entryPrice) / entryPrice) * 100;
    runningTotal++;
    runningRoiSum += roi;
    runningDaysSum += daysHeld;
    if (roi > 0) runningWins++;
    if (!summaryOnly) {
      const d = last.date;
      const exitDate = typeof d === 'string' ? d : (d as Date).toISOString().split('T')[0];
      trades.push({
        strategyId: stratId,
        strategyName: STRATEGY_NAMES[stratId] || stratId,
        entryDate,
        entryPrice: Math.round(entryPrice),
        exitDate,
        exitPrice: Math.round(close),
        targetPrice: Math.round(targetPrice),
        targetHit: false,
        roi: Math.round(roi * 100) / 100,
        daysHeld,
      });
    }
  }

  const total = summaryOnly ? runningTotal : trades.length;
  const wins = summaryOnly ? runningWins : trades.filter(t => t.roi > 0).length;
  const avgRoi = total > 0 ? (summaryOnly ? runningRoiSum / total : trades.reduce((s, t) => s + t.roi, 0) / total) : 0;
  const avgDays = total > 0 ? (summaryOnly ? Math.round(runningDaysSum / total) : Math.round(trades.reduce((s, t) => s + t.daysHeld, 0) / total)) : 0;
  const rois = trades.map(t => t.roi);

  return {
    totalTrades: total,
    wins,
    losses: total - wins,
    winRate: total > 0 ? Math.round((wins / total) * 10000) / 100 : 0,
    avgRoi: Math.round(avgRoi * 100) / 100,
    avgDays,
    bestTrade: rois.length > 0 ? Math.round(Math.max(...rois) * 100) / 100 : 0,
    worstTrade: rois.length > 0 ? Math.round(Math.min(...rois) * 100) / 100 : 0,
    trades: trades.slice(-20).reverse(),
  };
}

export function backtestAllStrategies(fullQuotes: Quote[], screenerData?: any, summaryOnly?: boolean): Record<string, BacktestResult> {
  const results: Record<string, BacktestResult> = {};
  for (const stratId of Object.keys(STRATEGY_NAMES)) {
    results[stratId] = backtestStrategy(stratId, fullQuotes, screenerData, summaryOnly);
  }
  return results;
}
