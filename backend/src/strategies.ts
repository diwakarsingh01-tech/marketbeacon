
/**
 * MarketBeacon Strategy Engine (Batch 10)
 * High-Accuracy Institutional Implementation
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
 * Settings: Length 200, 14% Envelope
 * Logic: Signal Day I Entry (Close), Locked Target (MAX(UB, Entry*1.3))
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200) {
  if (!quotes || quotes.length < length) return null;
  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];

  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";
  let isPositionOpen = false;

  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const lowerBand = sma * (1 - percentage / 100);
    const upperBand = sma * (1 + percentage / 100);

    // Entry on Signal Day I (Institutional preference)
    if (!isPositionOpen && quotes[i].low <= lowerBand) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close);
      activeTarget = Math.round(Math.max(upperBand, activeEntry * 1.30)); 
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
    }

    // Exit on Target Hit
    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  // "Qualified" means it hit the floor and is still within 5% of entry
  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
  };
}

/**
 * STRATEGY 2: Momentum Ceiling (Short Envelope Step-Back)
 */
export function processShortEnvelope(quotes: Quote[], marketCap: number) {
  if (!quotes || quotes.length < 250) return null;

  const prices = quotes.map(q => q.close); 
  const ema200 = calculateEMA(prices, 200);
  const latestIdx = quotes.length - 1;

  const capCr = marketCap / 10000000;
  let gapPercent = 15; 
  if (capCr >= 20000) gapPercent = 10; 
  else if (capCr < 5000) gapPercent = 20; 

  let b1_open = false, b1_entry_price = 0, b1_date = '', b1_ema_locked = 0, b1_target = 0;
  let b2_open = false, b2_entry_price = 0, b2_target = 0;
  let c_open = false, c_entry_price = 0, c_target = 0;
  let d_open = false, d_entry_price = 0, d_target = 0;

  for (let i = 201; i < quotes.length - 1; i++) {
    const q = quotes[i];
    const nextQ = quotes[i+1];
    const cEMA = ema200[i];
    const nextDateStr = (typeof nextQ.date === 'string' ? nextQ.date : (nextQ.date as Date).toISOString()).split('T')[0];

    if (!b1_open && quotes[i-1].close >= ema200[i-1] && quotes[i].close < cEMA) {
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

  return {
    isBuyZone: isBuyZone && currentPrice <= activeEntry * 1.05,
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
 * STRATEGY 3: Volatility Channel (Institutional Bollinger Band)
 * Settings: Length 200, StdDev 2.5
 * Logic: Signal Day I Entry (Close), Locked Target (Upper Band at Signal Day)
 */
export function calculateBollingerBand(quotes: Quote[], length: number = 200, sd: number = 2.5) {
  if (!quotes || quotes.length < length) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];
  
  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";
  let isPositionOpen = false;

  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const window = prices.slice(i - length + 1, i + 1);
    const squareDiffs = window.map(v => Math.pow(v - sma, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / length);

    const lowerBand = sma - stdDev * sd;
    const upperBand = sma + stdDev * sd;

    if (!isPositionOpen && quotes[i].low <= lowerBand) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close); // Signal Day Entry
      activeTarget = Math.round(upperBand); // Locked Target from Signal Day
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
    }

    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
  };
}

/**
 * STRATEGY 4: SMA ABCD (Bearish Stacking)
 * Logic: Triggers when short term trend is below long term trend.
 */
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 250) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";

  for (let i = 200; i < quotes.length; i++) {
    const isStacked = prices[i] < sma20[i] && sma20[i] < sma50[i] && sma50[i] < sma200[i];

    if (!isPositionOpen && isStacked) {
      isPositionOpen = true;
      activeEntry = Math.round(prices[i]);
      activeTarget = Math.round(sma200[i]);
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
    }

    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
  };
}

/**
 * STRATEGY 5: 52-Week Support/Resistance
 * Logic: Triggers when stock hits a 52-week low. Target is the 52-week high.
 */
export function calculate52WeekStrategy(quotes: Quote[]) {
  if (!quotes || quotes.length < 300) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";

  for (let i = 252; i < quotes.length; i++) {
    const lastYear = quotes.slice(i - 252, i);
    const low52 = Math.min(...lastYear.map(q => q.low));
    const high52 = Math.max(...lastYear.map(q => q.high));

    if (!isPositionOpen && quotes[i].low <= low52) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close);
      activeTarget = Math.round(high52);
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
    }

    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
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
 * Logic: Identifies a Shoulder-Head-Shoulder pattern and triggers on Neckline Breakout.
 */
export function calculateRHS(quotes: Quote[]) { 
  if (!quotes || quotes.length < 300) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";

  const window = 10;
  for (let i = 200; i < quotes.length; i++) {
    const historicalSlice = prices.slice(i - 150, i - window);
    const localLows: { price: number, idx: number }[] = [];
    
    // Find peaks/troughs in the slice
    for (let k = 10; k < historicalSlice.length - 10; k++) {
      const sub = historicalSlice.slice(k - 10, k + 10);
      if (historicalSlice[k] === Math.min(...sub)) localLows.push({ price: historicalSlice[k], idx: k });
    }

    if (localLows.length >= 3) {
      const l3 = localLows[localLows.length - 1], l2 = localLows[localLows.length - 2], l1 = localLows[localLows.length - 3];
      // H&S Logic: l2 (Head) is lower than shoulders
      if (l2.price < l1.price * 0.98 && l2.price < l3.price * 0.98 && Math.abs(l1.price - l3.price) / l1.price < 0.05) {
        const neckline = Math.max(...historicalSlice.slice(l1.idx, l3.idx));
        
        if (!isPositionOpen && quotes[i].close > neckline) {
          isPositionOpen = true;
          activeEntry = Math.round(quotes[i].close);
          activeTarget = Math.round(activeEntry + (neckline - l2.price));
          const dateVal = quotes[i].date;
          activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
        }
      }
    }

    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return { 
    isBuyZone: isActuallyInBuyRange, 
    entryPrice: activeEntry, 
    target: activeTarget, 
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
  }; 
}

/**
 * STRATEGY 8: Structural Pivot (Cup & Handle - Pine Script v5 Aligned)
 * Logic:
 * 1. Pre-condition: Price must be >= 30% down from ATH.
 * 2. Shape: Uses Pivot Highs (L3, R1) to find rims. 
 * 3. U-Shape: Checks for depth (min 15%) and consolidation.
 */
export function calculateCupHandle(quotes: Quote[]) { 
  if (!quotes || quotes.length < 300) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const ath = Math.max(...quotes.map(q => q.high));
  
  // Rule 1: Minimum 30% down from ATH to even consider this stock
  const isDrawdownActive = currentPrice <= ath * 0.70;
  if (!isDrawdownActive) return { isBuyZone: false };

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";

  // Helper: Pivot High (Pine Script: left=3, right=1)
  const isPivotHigh = (idx: number) => {
    if (idx < 3 || idx >= quotes.length - 1) return false;
    const h = quotes[idx].high;
    return h > quotes[idx-1].high && h > quotes[idx-2].high && h > quotes[idx-3].high &&
           h > quotes[idx+1].high;
  };

  const pivots: { price: number, idx: number }[] = [];
  for (let i = 3; i < quotes.length - 1; i++) {
    if (isPivotHigh(i)) pivots.push({ price: quotes[i].high, idx: i });
  }

  // Simulation Loop
  for (let i = 200; i < quotes.length; i++) {
    // Look for valid cup between two pivots
    const validPivotsBefore = pivots.filter(p => p.idx < i && p.idx > i - 150);
    if (validPivotsBefore.length < 2) continue;

    const rim2 = validPivotsBefore[validPivotsBefore.length - 1]; // Right Rim
    const rim1 = validPivotsBefore[validPivotsBefore.length - 2]; // Left Rim

    const neckline = Math.max(rim1.price, rim2.price);
    const cupWidth = rim2.idx - rim1.idx;
    if (cupWidth < 20) continue; // Too narrow

    const cupSlice = prices.slice(rim1.idx, rim2.idx);
    const cupLow = Math.min(...cupSlice);
    const cupDepth = (neckline - cupLow) / neckline;

    // Rule: Rims should be relatively level (max 5% diff) 
    // RULE HARDENING: Minimum 30% depth to avoid 'small necks'
    const rimsLevel = Math.abs(rim1.price - rim2.price) / neckline <= 0.05;
    const hasProperDepth = cupDepth >= 0.30 && cupDepth <= 0.65;

    if (rimsLevel && hasProperDepth) {
      // Trigger on Breakout: Price crosses neckline after rim2
      if (!isPositionOpen && quotes[i].close > neckline && i > rim2.idx) {
        isPositionOpen = true;
        activeEntry = Math.round(quotes[i].close);
        
        // TARGET LOGIC: Min 30% of price OR Full Depth (whichever is higher)
        const verticalGain = neckline - cupLow;
        activeTarget = Math.round(Math.max(activeEntry * 1.30, activeEntry + verticalGain));
        
        const dateVal = quotes[i].date;
        activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
      }
    }

    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return { 
    isBuyZone: isActuallyInBuyRange, 
    entryPrice: activeEntry, 
    target: activeTarget, 
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
  }; 
}

/**
 * STRATEGY 9: 67 Ka Funda
 * Logic: Triggers when a stock has fallen 67% from its ATH and starts recovering.
 */
export function calculateSixtySevenFunda(quotes: Quote[], screenerData: any, basket?: any, providedATH?: number) {
  if (!quotes || quotes.length < 250) return null;
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";

  const ath = providedATH || Math.max(...quotes.map(q => q.high));
  
  for (let i = 100; i < quotes.length; i++) {
    const drawdown = ((ath - quotes[i].low) / ath) * 100;

    if (!isPositionOpen && drawdown >= 66.5) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close);
      activeTarget = Math.round(ath * 0.67);
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
    }

    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return { 
    isBuyZone: isActuallyInBuyRange, 
    entryPrice: activeEntry, 
    target: activeTarget, 
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
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

  let rallyOrigin = 0;
  let rallyFound = false;
  let barsSinceRally = 0;

  for (let i = latestIdx - 10; i >= Math.max(0, latestIdx - 300); i--) {
    const startPrice = prices[i];
    const maxInWindow = Math.max(...prices.slice(i, i + 10));
    const rallyGain = (maxInWindow - startPrice) / startPrice;

    if (rallyGain >= 0.20) {
      rallyOrigin = startPrice;
      rallyFound = true;
      barsSinceRally = latestIdx - (i + 10); 
      break; 
    }
  }

  if (!rallyFound || barsSinceRally > 252) return null; 

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
