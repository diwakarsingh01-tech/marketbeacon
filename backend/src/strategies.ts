
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

  // Start with SMA for the first value
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
 * STRATEGY 1: Institutional Floor (Long Envelope) - VIDEO SPEC
 * Indicator: Envelope | Length: 200 | Percentage: 14% | Exponential: OFF (SMA)
 * Entry: Price Low <= Lower Band
 * Target: MAX(Current Upper Band, Entry-Time Upper Band, Entry Price * 1.30)
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200) {
  if (!quotes || quotes.length < length) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const smaValues = calculateSMA(prices, length);
  const latestIdx = quotes.length - 1;
  const currentSMA = smaValues[latestIdx];
  const latestQuote = quotes[latestIdx];
  const currentPrice = prices[latestIdx];

  const lowerBand = currentSMA * (1 - percentage / 100);
  const currentUpperBand = currentSMA * (1 + percentage / 100);

  // Buy Zone: Price touched lower band (intra-day low or close)
  const isBuyZone = latestQuote.low <= lowerBand || currentPrice <= lowerBand;
  const distanceFromLower = ((currentPrice - lowerBand) / lowerBand) * 100;

  let triggerDate: string | undefined = undefined;
  let upperBandAtEntry = currentUpperBand;
  let lowerBandAtEntry = lowerBand;

  if (isBuyZone) {
    // Find the very first date of the continuous trigger to lock entry stats
    for (let i = latestIdx; i >= length; i--) {
      const q = quotes[i];
      const cSMA = smaValues[i];
      const cLower = cSMA * (1 - percentage / 100);
      const cPrice = q.adjclose || q.adjClose || q.close;
      
      if (q.low <= cLower || cPrice <= cLower) {
        triggerDate = (typeof q.date === 'string' ? q.date : q.date.toISOString()).split('T')[0];
        upperBandAtEntry = cSMA * (1 + percentage / 100);
        lowerBandAtEntry = cLower;
      } else break;
    }
  }

  // VIDEO SPEC REFINEMENT: Target must not drift lower than initial upper band or 30% gain
  const minimumTarget = lowerBandAtEntry * 1.30;
  const finalTarget = Math.max(currentUpperBand, upperBandAtEntry, minimumTarget);

  return {
    sma: currentSMA,
    lowerBand: currentUpperBand, // This is just for UI basis
    upperBand: currentUpperBand,
    isBuyZone,
    distanceFromLower,
    triggerDate,
    currentPrice,
    entryPrice: lowerBandAtEntry, // Locked to first trigger lower band
    target: finalTarget,
    upperBandAtEntry,
    lowerBandAtEntry,
    minimumTarget
  };
}

/**
 * STRATEGY 2: Momentum Ceiling (Short Envelope Tranches)
 * Buy 1: Orange/Middle (EMA 200)
 * Buy 2: Lower Blue (EMA 200 - 14%)
 */
export function processShortEnvelope(quotes: Quote[], marketCap: number) {
  if (!quotes || quotes.length < 250) return null;

  const prices = quotes.map(q => q.close); 
  const ema200 = calculateEMA(prices, 200);
  const latestIdx = quotes.length - 1;

  let b1_open = false;
  let b1_entry = 0;
  let b1_date = '';
  let b1_ema_at_entry = 0;
  let b1_target = 0;

  let b2_open = false;
  let b2_entry = 0;
  let b2_date = '';
  let b2_target = 0;

  // State Machine Simulation
  for (let i = 201; i < quotes.length; i++) {
    const q = quotes[i];
    const cEMA = ema200[i];
    const cLower = cEMA * 0.86;
    const dateStr = (typeof q.date === 'string' ? q.date : q.date.toISOString()).split('T')[0];

    // B1 Entry: Price crosses/touches EMA 200 from above
    // Logic: Previous Close > EMA and Current Close <= EMA
    const prevClose = prices[i-1];
    if (prevClose > ema200[i-1] && q.close <= cEMA && !b1_open) {
      b1_open = true;
      b1_entry = q.close; // ENTRY AT DAY CLOSE
      b1_date = dateStr;
      b1_ema_at_entry = cEMA;
      b1_target = Math.round(cEMA * 1.14); // Target B1: EMA * 1.14
    }

    // B2 Entry: Price hits Lower Blue line (14% down from EMA)
    if (b1_open && q.low <= cLower && !b2_open) {
      b2_open = true;
      b2_entry = q.close; // ENTRY AT DAY CLOSE
      b2_date = dateStr;
      b2_target = Math.round(cEMA); // Target B2: EMA at trigger
    }

    // Exit Logic (Independent)
    if (b2_open && q.high >= b2_target) b2_open = false;
    if (b1_open && q.high >= b1_target) b1_open = false;
  }

  const isBuyZone = b1_open || b2_open;
  const currentPrice = prices[latestIdx];
  
  // Market Cap based ABCD Ladder Gap
  const capCr = marketCap / 10000000;
  let gapPercent = 15; // Mid Cap
  if (capCr >= 65000) gapPercent = 10; // Large Cap
  else if (capCr < 20000) gapPercent = 20; // Small Cap

  // ALWAYS return B1 price as the "Base" for the table if active
  const finalEntryPrice = b1_open ? b1_entry : ema200[latestIdx];
  const finalTarget = b2_open ? b2_target : (b1_open ? b1_target : ema200[latestIdx] * 1.14);
  const finalTriggerDate = b1_open ? b1_date : undefined;
  const tranche = b2_open ? 'B2' : (b1_open ? 'B1' : 'WATCHLIST');

  return {
    isBuyZone,
    tranche,
    entryPrice: finalEntryPrice, 
    target: finalTarget,
    currentPrice,
    triggerDate: finalTriggerDate,
    abcd: {
      a: finalEntryPrice,
      b: b2_open ? b2_entry : (finalEntryPrice * 0.86),
      c: (b2_open ? b2_entry : (finalEntryPrice * 0.86)) * (1 - gapPercent/100),
      d: (b2_open ? b2_entry : (finalEntryPrice * 0.86)) * (1 - 2 * gapPercent/100),
      gap: gapPercent
    }
  };
}


/**
 * STRATEGY 8: Velocity Retest (20% Green Rally)
 * Logic: 20% gain in green candles below 200 EMA. Retest rally start.
 */
export function calculateTwentyRallyRetest(quotes: Quote[]) {
  if (!quotes || quotes.length < 250) return null;

  const closePrices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const ema200 = calculateEMA(closePrices, 200);
  
  const rallies = [];
  let currentRally: any = null;

  for (let i = 1; i < quotes.length; i++) {
    const q = quotes[i];
    const isGreen = q.close > q.open; 
    if (isGreen && q.low < ema200[i]) {
      if (!currentRally) {
        currentRally = { startIdx: i, startLow: q.low, high: q.high, startDate: q.date };
      } else {
        currentRally.high = Math.max(currentRally.high, q.high);
      }
    } else {
      if (currentRally) {
        const gain = ((currentRally.high - currentRally.startLow) / currentRally.startLow) * 100;
        if (gain >= 20) rallies.push({ ...currentRally, endIdx: i - 1, gain });
      }
      currentRally = null;
    }
  }

  if (rallies.length === 0) return null;
  const latestRally = rallies[rallies.length - 1];
  const base = latestRally.startLow;
  const currentPrice = closePrices[quotes.length - 1];

  // Entry: Price returns to Rally Start Low
  const isBuyZone = currentPrice <= base * 1.05 && currentPrice >= base * 0.95;
  
  return {
    isBuyZone,
    entryPrice: base,
    target: latestRally.high,
    triggerDate: (typeof latestRally.startDate === 'string' ? latestRally.startDate : latestRally.startDate.toISOString()).split('T')[0],
    currentPrice
  };
}

/**
 * ABCD Support Ladder (Institutional Standard)
 */
export function calculateABCDLevels(anchorPrice: number, marketCap: number, basket: string = 'BLUECHIP') {
  const capCr = marketCap / 10000000;
  let gap = 0.15; // 15% default for Mid/Small
  if (capCr >= 65000 && basket === 'BLUECHIP') gap = 0.10; // 10% for Large Cap

  return {
    a: anchorPrice,
    b: anchorPrice * (1 - gap),
    c: anchorPrice * (1 - 2 * gap),
    d: anchorPrice * (1 - 3 * gap),
    gap: gap * 100
  };
}

/**
 * STRATEGY 9: 67 Ka Funda (Deep Recovery Audit)
 */
export function calculateSixtySevenFunda(quotes: Quote[], screenerData: any) {
  if (!quotes || quotes.length < 250) return null;
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const currentPrice = prices[prices.length - 1];
  const ath = Math.max(...quotes.map(q => q.high));
  
  const drawdown = ((ath - currentPrice) / ath) * 100;
  const upside = ((ath - currentPrice) / currentPrice) * 100;

  const isBuyZone = drawdown >= 66 && upside >= 100;

  return {
    isBuyZone,
    entryPrice: currentPrice,
    target: ath,
    currentPrice,
    drawdown,
    upside,
    score: isBuyZone ? 85 : 0
  };
}

/**
 * STRATEGY 6: SMA ABCD (Bearish Stacking)
 * Buy: Price < SMA20 < SMA50 < SMA200
 */
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const s20 = calculateSMA(prices, 20);
  const s50 = calculateSMA(prices, 50);
  const s200 = calculateSMA(prices, 200);

  const idx = quotes.length - 1;
  const isBuyZone = prices[idx] < s20[idx] && s20[idx] < s50[idx] && s50[idx] < s200[idx];

  return {
    isBuyZone,
    entryPrice: prices[idx],
    target: s200[idx],
    currentPrice: prices[idx],
    triggerDate: (typeof quotes[idx].date === 'string' ? quotes[idx].date : quotes[idx].date.toISOString()).split('T')[0]
  };
}

// ... Additional Strategies (Bollinger, RHS, CupHandle) preserved with high accuracy ...
export function calculateBollingerBand(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const sma = calculateSMA(prices, 200);
  const latestIdx = quotes.length - 1;
  const periodPrices = prices.slice(-200);
  const avg = periodPrices.reduce((a,b) => a+b, 0) / 200;
  const stdDev = Math.sqrt(periodPrices.reduce((a,b) => a + Math.pow(b-avg, 2), 0) / 200);
  
  const lower = avg - 2.5 * stdDev;
  const upper = avg + 2.5 * stdDev;
  
  return {
    isBuyZone: quotes[latestIdx].low <= lower,
    entryPrice: lower,
    target: upper,
    currentPrice: prices[latestIdx]
  };
}

export function calculate52WeekStrategy(quotes: Quote[]) {
  if (!quotes || quotes.length < 252) return null;
  const lows = quotes.map(q => q.low).slice(-252);
  const highs = quotes.map(q => q.high).slice(-252);
  const rollingLow = Math.min(...lows);
  const rollingHigh = Math.max(...highs);
  const current = (quotes[quotes.length - 1].adjclose || quotes[quotes.length - 1].close);
  
  return {
    isBuyZone: current <= rollingLow * 1.05,
    entryPrice: rollingLow,
    target: rollingHigh,
    currentPrice: current
  };
}

export function calculateSRStrategy(quotes: Quote[]) {
  if (!quotes || quotes.length < 500) return { isBuyZone: false, entryPrice: 0, target: 0, currentPrice: 0 };
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const currentPrice = prices[prices.length - 1];
  
  // Find local lows/highs (Swing points)
  const windowSize = 10;
  const lows: number[] = [];
  const highs: number[] = [];
  
  for (let i = windowSize; i < quotes.length - windowSize; i++) {
    const slice = prices.slice(i - windowSize, i + windowSize + 1);
    const centerPrice = prices[i];
    if (centerPrice === Math.min(...slice)) lows.push(centerPrice);
    if (centerPrice === Math.max(...slice)) highs.push(centerPrice);
  }
  
  // Cluster lows within 3% tolerance for Support
  const tolerance = 0.03;
  let supportLevel = 0;
  let maxTouches = 0;

  for (const low of lows) {
    const touches = lows.filter(l => Math.abs(l - low) / low <= tolerance).length;
    if (touches >= 3 && touches > maxTouches) {
      if (Math.abs(currentPrice - low) / low <= tolerance) {
        supportLevel = low;
        maxTouches = touches;
      }
    }
  }

  if (supportLevel === 0) return { isBuyZone: false, entryPrice: 0, target: 0, currentPrice: 0 };
  
  // Find nearest major resistance (Top) with at least 2 touches
  let target = currentPrice * 1.30; // Default 30% upside
  const validResistances = highs.filter(h => h > currentPrice * 1.10).sort((a, b) => a - b);
  
  for (const res of validResistances) {
     const touches = highs.filter(h => Math.abs(h - res) / res <= tolerance).length;
     if (touches >= 2) {
       target = res;
       break;
     }
  }

  return {
    isBuyZone: true,
    entryPrice: supportLevel,
    target: target,
    currentPrice: currentPrice,
    score: 80,
    touches: maxTouches
  };
}

export function calculateRHS(quotes: Quote[]) { 
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const currentPrice = prices[prices.length - 1];
  
  // Simple heuristic for Inverted Head & Shoulders (RHS)
  // Look for 3 local lows in the last 150 days
  const window = 10;
  const localLows: { price: number, idx: number }[] = [];
  for (let i = quotes.length - 150; i < quotes.length - window; i++) {
    const slice = prices.slice(i - window, i + window + 1);
    if (prices[i] === Math.min(...slice)) localLows.push({ price: prices[i], idx: i });
  }

  if (localLows.length < 3) return { isBuyZone: false };
  
  // Take last 3 distinct lows
  const l3 = localLows[localLows.length - 1]; // Right Shoulder
  const l2 = localLows[localLows.length - 2]; // Head
  const l1 = localLows[localLows.length - 3]; // Left Shoulder

  const isHeadLower = l2.price < l1.price * 0.97 && l2.price < l3.price * 0.97;
  const isSymmetryOk = Math.abs(l1.price - l3.price) / l1.price < 0.05;
  
  if (isHeadLower && isSymmetryOk) {
    const neckline = Math.max(...prices.slice(l1.idx, l3.idx));
    const h = neckline - l2.price;
    const target = neckline + h;
    
    const isBuyZone = currentPrice >= neckline * 0.95 && currentPrice <= neckline * 1.05;
    return {
      isBuyZone,
      entryPrice: neckline,
      target,
      currentPrice,
      pattern: 'Inverted H&S',
      score: 85
    };
  }

  return { isBuyZone: false }; 
}

export function calculateCupHandle(quotes: Quote[]) { 
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const currentPrice = prices[prices.length - 1];

  // Look for a multi-month "U" shape
  const lookback = 200;
  const recentHigh = Math.max(...prices.slice(-lookback, -20));
  const recentLow = Math.min(...prices.slice(-lookback, -20));
  
  const cupDepth = (recentHigh - recentLow) / recentHigh;
  const isCupDeepEnough = cupDepth > 0.15 && cupDepth < 0.50;
  
  // Handle: Price near high, slightly consolidated
  const isNearHigh = currentPrice >= recentHigh * 0.90 && currentPrice <= recentHigh * 1.05;
  
  if (isCupDeepEnough && isNearHigh) {
    const target = recentHigh + (recentHigh - recentLow);
    return {
      isBuyZone: true,
      entryPrice: recentHigh,
      target,
      currentPrice,
      pattern: 'Cup & Handle',
      score: 80
    };
  }

  return { isBuyZone: false }; 
}
