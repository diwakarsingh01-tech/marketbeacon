
/**
 * MarketBeacon Strategy Engine (Batch 9)
 * High-Accuracy Implementation for Institutional Auditing
 */

export interface Quote {
  date: Date | string;
  open: number;
  close: number;
  adjClose?: number;
  adjclose?: number;
  low: number;
  high: number;
}

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], length: number): number[] {
  if (prices.length < length) return new Array(prices.length).fill(0);
  const ema: number[] = new Array(prices.length).fill(0);
  const k = 2 / (length + 1);
  let initialSma = prices.slice(0, length).reduce((a, b) => a + b, 0) / length;
  ema[length - 1] = initialSma;
  for (let i = length; i < prices.length; i++) {
    ema[i] = prices[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], length: number): number[] {
  const sma: number[] = new Array(prices.length).fill(0);
  for (let i = 0; i < prices.length; i++) {
    if (i < length - 1) continue;
    const window = prices.slice(i - length + 1, i + 1);
    sma[i] = window.reduce((a, b) => a + b, 0) / length;
  }
  return sma;
}

/**
 * STRATEGY 1: Institutional Floor (Long Envelope)
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200) {
  if (!quotes || quotes.length < length) return null;
  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const latestIdx = quotes.length - 1;
  const currentSMA = smaValues[latestIdx];
  const lowerBand = Math.round(currentSMA * (1 - percentage / 100));
  const upperBand = Math.round(currentSMA * (1 + percentage / 100));
  const currentPrice = Math.round(prices[latestIdx]);

  const isBuyZone = quotes[latestIdx].low <= lowerBand;
  const isActuallyInBuyRange = isBuyZone && currentPrice <= lowerBand * 1.05;
  
  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: lowerBand,
    target: upperBand,
    currentPrice,
    triggerDate: isBuyZone ? (typeof quotes[latestIdx].date === 'string' ? quotes[latestIdx].date : quotes[latestIdx].date.toISOString()).split('T')[0] : undefined
  };
}

/**
 * STRATEGY 2: Momentum Ceiling (Short Envelope Step-Back)
 * FINAL INSTITUTIONAL MODEL
 */
export function processShortEnvelope(quotes: Quote[], marketCap: number) {
  if (!quotes || quotes.length < 250) return null;

  const prices = quotes.map(q => q.close); 
  const ema200 = calculateEMA(prices, 200);
  const latestIdx = quotes.length - 1;

  // Market Cap based ABCD Ladder Gaps
  const capCr = marketCap / 10000000;
  let gapPercent = 15; 
  if (capCr >= 20000) gapPercent = 10; 
  else if (capCr < 5000) gapPercent = 20; 

  let b1_open = false, b1_entry_price = 0, b1_date = '', b1_ema_locked = 0, b1_target = 0;
  let b2_open = false, b2_entry_price = 0, b2_target = 0;
  let c_open = false, c_entry_price = 0, c_target = 0;
  let d_open = false, d_entry_price = 0, d_target = 0;

  // State Machine Simulation
  for (let i = 201; i < quotes.length - 1; i++) {
    const q = quotes[i];
    const nextQ = quotes[i+1];
    const cEMA = ema200[i];
    const nextDateStr = (typeof nextQ.date === 'string' ? nextQ.date : nextQ.date.toISOString()).split('T')[0];

    // B1 Entry: Signal (Day I), Entry (Day I+1 Close)
    if (!b1_open && prices[i-1] >= ema200[i-1] && prices[i] < cEMA) {
      b1_open = true;
      b1_entry_price = Math.round(nextQ.close); 
      b1_date = nextDateStr;
      b1_ema_locked = cEMA;
      b1_target = Math.round(b1_entry_price * 1.14); 
    }

    if (b1_open) {
      const b2_line = b1_ema_locked * 0.86;
      if (!b2_open && q.low <= b2_line) {
        b2_open = true;
        b2_entry_price = Math.round(nextQ.close); 
        b2_target = b1_entry_price; 
      }

      const c_line = b2_line * (1 - gapPercent/100);
      if (b2_open && !c_open && q.low <= c_line) {
        c_open = true;
        c_entry_price = Math.round(nextQ.close);
        c_target = b2_entry_price; 
      }

      const d_line = c_line * (1 - gapPercent/100);
      if (c_open && !d_open && q.low <= d_line) {
        d_open = true;
        d_entry_price = Math.round(nextQ.close);
        d_target = c_entry_price; 
      }
    }

    if (d_open && nextQ.high >= d_target) d_open = false;
    if (c_open && nextQ.high >= c_target) c_open = false;
    if (b2_open && nextQ.high >= b2_target) b2_open = false;
    if (b1_open && nextQ.high >= b1_target) b1_open = false;
  }

  const isBuyZone = b1_open || b2_open || c_open || d_open;
  const currentPrice = prices[latestIdx];
  const a_point = b1_open ? b1_entry_price : Math.round(ema200[latestIdx]);
  const b_point = Math.round(a_point * 0.86);

  let finalTarget = Math.round(a_point * 1.14);
  let activeEntry = a_point;
  let activeTranche = 'B1';
  
  if (d_open) { activeEntry = d_entry_price; finalTarget = d_target; activeTranche = 'D'; }
  else if (c_open) { activeEntry = c_entry_price; finalTarget = c_target; activeTranche = 'C'; }
  else if (b2_open) { activeEntry = b2_entry_price; finalTarget = b2_target; activeTranche = 'B2'; }
  else if (b1_open) { activeEntry = b1_entry_price; finalTarget = b1_target; activeTranche = 'B1'; }
  else { activeTranche = 'WATCHLIST'; }

  // Institutional Change: Strict 5% Buying Window
  // A stock is only in "Buy Zone" if CMP is between Entry and Entry + 5%
  const buyRangeUpper = activeEntry * 1.05;
  const isActuallyInBuyRange = isBuyZone && currentPrice <= buyRangeUpper;

  return {
    isBuyZone: isActuallyInBuyRange,
    tranche: activeTranche,
    entryPrice: activeEntry, 
    target: finalTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: b1_open ? b1_date : undefined,
    abcd: {
      a: a_point,
      b: b_point,
      c: Math.round(b_point * (1 - gapPercent/100)),
      d: Math.round(b_point * (1 - 2 * gapPercent/100)),
      gap: gapPercent
    }
  };
}

/**
 * STRATEGY 3: Volatility Channel (Bollinger Bands)
 */
export function calculateBollingerBand(quotes: Quote[], length: number = 20, stdDev: number = 2.5) {
  if (!quotes || quotes.length < length) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const sma = calculateSMA(prices, length);
  const latestIdx = prices.length - 1;
  const currentPrice = prices[latestIdx];
  
  let variance = 0;
  for (let i = latestIdx - length + 1; i <= latestIdx; i++) {
    variance += Math.pow(prices[i] - sma[latestIdx], 2);
  }
  const sd = Math.sqrt(variance / length);
  const lowerBand = Math.round(sma[latestIdx] - stdDev * sd);
  const upperBand = Math.round(sma[latestIdx] + stdDev * sd);

  return {
    isBuyZone: currentPrice <= lowerBand,
    entryPrice: lowerBand,
    target: Math.round(sma[latestIdx]),
    currentPrice: Math.round(currentPrice)
  };
}

/**
 * STRATEGY 4: SMA ABCD (Bearish Stacking)
 */
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);
  const idx = prices.length - 1;

  const isStacked = prices[idx] < sma20[idx] && sma20[idx] < sma50[idx] && sma50[idx] < sma200[idx];
  return {
    isBuyZone: isStacked,
    entryPrice: Math.round(prices[idx]),
    target: Math.round(sma200[idx]),
    currentPrice: Math.round(prices[idx])
  };
}

/**
 * STRATEGY 5: 52-Week Support/Resistance
 */
export function calculate52WeekStrategy(quotes: Quote[]) {
  if (!quotes || quotes.length < 252) return { isBuyZone: false };
  const lastYear = quotes.slice(-252);
  const high52 = Math.max(...lastYear.map(q => q.high));
  const low52 = Math.min(...lastYear.map(q => q.low));
  const currentPrice = quotes[quotes.length - 1].close;

  const isAtSupport = currentPrice <= low52 * 1.05;
  return {
    isBuyZone: isAtSupport,
    entryPrice: Math.round(low52),
    target: Math.round(high52),
    currentPrice: Math.round(currentPrice)
  };
}

/**
 * STRATEGY 6: Supply-Demand Core
 */
export function calculateSRStrategy(quotes: Quote[]) {
  if (!quotes || quotes.length < 500) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const windowSize = 10;
  const lows: number[] = [];
  for (let i = windowSize; i < quotes.length - windowSize; i++) {
    const slice = prices.slice(i - windowSize, i + windowSize + 1);
    if (prices[i] === Math.min(...slice)) lows.push(prices[i]);
  }
  const tolerance = 0.03;
  let supportLevel = 0;
  for (const low of lows) {
    const touches = lows.filter(l => Math.abs(l - low) / low <= tolerance).length;
    if (touches >= 3 && Math.abs(currentPrice - low) / low <= tolerance) {
      supportLevel = low;
      break;
    }
  }
  return {
    isBuyZone: supportLevel > 0,
    entryPrice: Math.round(supportLevel),
    target: Math.round(supportLevel * 1.30),
    currentPrice: Math.round(currentPrice)
  };
}

/**
 * STRATEGY 7: RHS (Inverted H&S)
 */
export function calculateRHS(quotes: Quote[]) { 
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const window = 10;
  const localLows: { price: number, idx: number }[] = [];
  for (let i = quotes.length - 150; i < quotes.length - window; i++) {
    const slice = prices.slice(i - window, i + window + 1);
    if (prices[i] === Math.min(...slice)) localLows.push({ price: prices[i], idx: i });
  }
  if (localLows.length < 3) return { isBuyZone: false };
  const l3 = localLows[localLows.length - 1], l2 = localLows[localLows.length - 2], l1 = localLows[localLows.length - 3];
  if (l2.price < l1.price * 0.97 && l2.price < l3.price * 0.97 && Math.abs(l1.price - l3.price) / l1.price < 0.05) {
    const neckline = Math.max(...prices.slice(l1.idx, l3.idx));
    return { isBuyZone: currentPrice >= neckline * 0.95 && currentPrice <= neckline * 1.05, entryPrice: Math.round(neckline), target: Math.round(neckline + (neckline - l2.price)), currentPrice: Math.round(currentPrice) };
  }
  return { isBuyZone: false }; 
}

/**
 * STRATEGY 8: Structural Pivot (Cup & Handle)
 */
export function calculateCupHandle(quotes: Quote[]) { 
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const lookback = 200;
  const recentHigh = Math.max(...prices.slice(-lookback, -20));
  const recentLow = Math.min(...prices.slice(-lookback, -20));
  const cupDepth = (recentHigh - recentLow) / recentHigh;
  if (cupDepth > 0.15 && cupDepth < 0.50 && currentPrice >= recentHigh * 0.90 && currentPrice <= recentHigh * 1.05) {
    return { isBuyZone: true, entryPrice: Math.round(recentHigh), target: Math.round(recentHigh + (recentHigh - recentLow)), currentPrice: Math.round(currentPrice) };
  }
  return { isBuyZone: false }; 
}

/**
 * STRATEGY 9: 67 Ka Funda
 */
export function calculateSixtySevenFunda(quotes: Quote[], screenerData: any, basket?: any, providedATH?: number) {
  if (!quotes || (quotes.length < 250 && !providedATH)) return null;
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  
  // Use provided ATH (for tests) or calculate from history
  const ath = providedATH || Math.max(...quotes.map(q => q.high));
  const drawdown = ((ath - currentPrice) / ath) * 100;
  
  // Fundamental Filter: Improving Quarterly PAT
  const pat = screenerData?.quarterlyNetProfits || [];
  const isImproving = pat.length >= 3 && pat[pat.length - 1] > pat[pat.length - 2];
  
  const isBuyZone = drawdown >= 66.5; // Threshold for 67% reset
  const verdict = (isBuyZone && isImproving) ? 'QUALIFIED' : 'WATCHLIST';

  return { 
    isBuyZone, 
    verdict,
    entryPrice: Math.round(ath * 0.33), // Standard 67% reset target
    target: Math.round(ath * 0.67), 
    currentPrice: Math.round(currentPrice),
    drawdown: Math.round(drawdown)
  };
}

/**
 * STRATEGY 10: Velocity Retest
 */
export function calculateTwentyRallyRetest(quotes: Quote[], symbol?: string) {
  if (!quotes || quotes.length < 50) return null;
  const prices = quotes.map(q => q.close);
  const latestIdx = prices.length - 1;
  const currentPrice = prices[latestIdx];

  // Look for a 20% rally in any 10-bar window within the last year
  let rallyOrigin = 0;
  let rallyFound = false;
  let barsSinceRally = 0;

  // Scan back from current price to find the most recent rally origin
  for (let i = latestIdx - 10; i >= Math.max(0, latestIdx - 300); i--) {
    const startPrice = prices[i];
    const maxInWindow = Math.max(...prices.slice(i, i + 10));
    const rallyGain = (maxInWindow - startPrice) / startPrice;

    if (rallyGain >= 0.20) {
      rallyOrigin = startPrice;
      rallyFound = true;
      barsSinceRally = latestIdx - (i + 10); // Measured from end of rally window
      break; 
    }
  }

  if (!rallyFound || barsSinceRally > 252) return null; // Strict institutional 1-year limit

  // A stock is "Qualified" if it returns to the origin within 5% tolerance
  const isRetesting = currentPrice <= rallyOrigin * 1.05 && currentPrice >= rallyOrigin * 0.95;
  const verdict = isRetesting ? 'QUALIFIED' : 'WATCHLIST';

  return {
    isBuyZone: isRetesting,
    verdict,
    entryPrice: Math.round(rallyOrigin),
    target: Math.round(rallyOrigin * 1.20),
    currentPrice: Math.round(currentPrice),
    barsSinceRally
  };
}

/**
 * UTILITY: ABCD Level Calculation
 */
export function calculateABCDLevels(anchorPrice: number, marketCap: number) {
  const capCr = marketCap / 10000000;
  let gap = 0.15;
  if (capCr >= 20000) gap = 0.10;
  else if (capCr < 5000) gap = 0.20;
  return { a: anchorPrice, b: Math.round(anchorPrice * 0.86), c: Math.round(anchorPrice * 0.86 * (1 - gap)), d: Math.round(anchorPrice * 0.86 * (1 - 2 * gap)), gap: gap * 100 };
}
