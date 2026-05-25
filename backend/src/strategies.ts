
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
 * STRATEGY 4: MA 20/50/200 Stacking (Bulk Buying Model)
 * Logic:
 * 1. Entry (Deep Depressed Zone): Price < SMA 20 < SMA 50 < SMA 200
 * 2. Exit (Bullish Reversal): Price > SMA 20 > SMA 50 > SMA 200
 * 3. Exception: Only sell if current price >= avg_entry_price (Profit/Cost safe).
 * 4. Scope: Intended for 'Super 45' (Bluechip) low-vol stocks.
 */
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 300) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeSignalDate = "";

  for (let i = 200; i < quotes.length; i++) {
    const isBearishStacked = prices[i] < sma20[i] && sma20[i] < sma50[i] && sma50[i] < sma200[i];
    const isBullishReversed = prices[i] > sma20[i] && sma20[i] > sma50[i] && sma50[i] > sma200[i];

    // Bulk Buy in Deep Depressed Zone
    if (!isPositionOpen && isBearishStacked) {
      isPositionOpen = true;
      activeEntry = Math.round(prices[i]);
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
    }

    // Profit-Safe Exit on Full Reversal
    if (isPositionOpen && isBullishReversed) {
      if (prices[i] >= activeEntry) {
        isPositionOpen = false;
      }
    }
  }

  // Institutional Buy-Zone Rule: Within 5% of deep depressed entry
  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: Math.round(sma200[prices.length - 1]), // Minimum recovery objective (SMA 200)
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate,
    tranche: "BULK BUY"
  };
}

/**
 * STRATEGY 5: 52-Week High/Low (Institutional Rule)
 * Logic:
 * 1. Entry: Price hits rolling 52-week low (1% tolerance).
 * 2. Exit: Price hits rolling 52-week high (1% tolerance).
 * 3. Scope: Primarily for Super 45 / Bluechip names.
 */
export function calculate52WeekStrategy(quotes: Quote[]) {
  if (!quotes || quotes.length < 300) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeSignalDate = "";

  // Simulation Loop
  for (let i = 252; i < quotes.length; i++) {
    const lastYear = quotes.slice(i - 252, i);
    const low52 = Math.min(...lastYear.map(q => q.low));
    const high52 = Math.max(...lastYear.map(q => q.high));

    // Buy at 52-Week Low (1% Tolerance)
    if (!isPositionOpen && quotes[i].low <= low52 * 1.01) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close);
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
    }

    // Sell at 52-Week High (1% Tolerance)
    if (isPositionOpen && quotes[i].high >= high52 * 0.99) {
      isPositionOpen = false;
    }
  }

  // Current 52-Week High for Target display
  const currentYear = quotes.slice(-252);
  const currentHigh52 = Math.max(...currentYear.map(q => q.high));

  // Institutional Buy-Zone Rule: Within 5% of 52W low entry
  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.05;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: Math.round(currentHigh52),
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
  };
}

/**
 * STRATEGY 6: Supply-Demand Core (Institutional S/R)
 * Logic:
 * 1. Clustering: Groups pivot lows/highs into zones with 4% tolerance.
 * 2. Validation: Requires at least 2 historical rebounds from a support zone.
 * 3. Range: Minimum 30% upside from support to the nearest resistance.
 * 4. Fundamental: Current Net Profit must be >= Profit during previous support touch.
 */
export function calculateSRStrategy(quotes: Quote[], screenerData?: any) {
  if (!quotes || quotes.length < 500) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const window = 10;
  
  // 1. Detect Pivots
  const pivotLows: { price: number, idx: number, date: string }[] = [];
  const pivotHighs: { price: number, idx: number, date: string }[] = [];
  
  for (let i = window; i < quotes.length - window; i++) {
    const lowSlice = quotes.slice(i - window, i + window + 1).map(q => q.low);
    const highSlice = quotes.slice(i - window, i + window + 1).map(q => q.high);
    
    if (quotes[i].low === Math.min(...lowSlice)) {
      pivotLows.push({ price: quotes[i].low, idx: i, date: (typeof quotes[i].date === 'string' ? quotes[i].date : (quotes[i].date as Date).toISOString()).split('T')[0] });
    }
    if (quotes[i].high === Math.max(...highSlice)) {
      pivotHighs.push({ price: quotes[i].high, idx: i, date: (typeof quotes[i].date === 'string' ? quotes[i].date : (quotes[i].date as Date).toISOString()).split('T')[0] });
    }
  }

  // 2. Cluster Zones (4% Tolerance)
  const cluster = (pivots: typeof pivotLows, tolerance: number = 0.04) => {
    const zones: { mid: number, touches: number, lastIdx: number, lastDate: string }[] = [];
    for (const p of pivots) {
      let found = false;
      for (const z of zones) {
        if (Math.abs(p.price - z.mid) / z.mid <= tolerance) {
          z.mid = (z.mid * z.touches + p.price) / (z.touches + 1);
          z.touches++;
          z.lastIdx = p.idx;
          z.lastDate = p.date;
          found = true;
          break;
        }
      }
      if (!found) zones.push({ mid: p.price, touches: 1, lastIdx: p.idx, lastDate: p.date });
    }
    return zones;
  };

  const supportZones = cluster(pivotLows).filter(z => z.touches >= 2);
  const resistanceZones = cluster(pivotHighs);

  // 3. Find Active Support
  const activeSupport = supportZones.find(z => Math.abs(currentPrice - z.mid) / z.mid <= 0.05);
  if (!activeSupport) return { isBuyZone: false };

  // 4. Upside Check (Min 30%)
  const nearestResistance = resistanceZones
    .filter(z => z.mid > activeSupport.mid)
    .sort((a, b) => a.mid - b.mid)[0];
    
  if (!nearestResistance || (nearestResistance.mid / activeSupport.mid - 1) < 0.30) {
    return { isBuyZone: false };
  }

  // 5. Fundamental Check (Optional if screenerData provided)
  // Logic: Current Profit >= Profit at previous support touch
  if (screenerData?.historicalNetProfits && screenerData.historicalNetProfits.length > 0) {
    const currentProfit = screenerData.currentNetProfit || 0;
    // Rough estimation: find which year the last support touch happened
    // This is a simplified version of the rule
    const avgHistoricalProfit = screenerData.historicalNetProfits.reduce((a: number, b: number) => a + b, 0) / screenerData.historicalNetProfits.length;
    if (currentProfit < avgHistoricalProfit * 0.90) return { isBuyZone: false };
  }

  return {
    isBuyZone: true,
    entryPrice: Math.round(activeSupport.mid),
    target: Math.round(nearestResistance.mid),
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSupport.lastDate
  };
}

/**
 * STRATEGY 7: Dynamic Reversal (Parallel Symmetric RHS)
 * Logic:
 * 1. Pre-condition: Price must be >= 30% down from ATH.
 * 2. Shape: Strict 5-point sequence (S1 -> P1 -> Head -> P2 -> S2).
 * 3. Parallelism: S1/S2 and P1/P2 must be within 5% price alignment.
 */
export function calculateRHS(quotes: Quote[]) { 
  if (!quotes || quotes.length < 350) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const ath = Math.max(...quotes.map(q => q.high));
  
  // Rule 1: Minimum 30% down from ATH
  const isDrawdownActive = currentPrice <= ath * 0.70;
  if (!isDrawdownActive) return { isBuyZone: false };

  let isPositionOpen = false;
  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";

  const getPivots = () => {
    const lowPivots: { price: number, idx: number }[] = [];
    const highPivots: { price: number, idx: number }[] = [];
    for (let i = 3; i < quotes.length - 1; i++) {
      const h = quotes[i].high, l = quotes[i].low;
      // Softened Pivot: Use >= to allow for equal neighbors in consolidation
      if (l <= quotes[i-1].low && l <= quotes[i-2].low && l <= quotes[i-3].low && l < quotes[i+1].low) 
        lowPivots.push({ price: l, idx: i });
      if (h >= quotes[i-1].high && h >= quotes[i-2].high && h >= quotes[i-3].high && h > quotes[i+1].high) 
        highPivots.push({ price: h, idx: i });
    }
    return { lowPivots, highPivots };
  };

  const { lowPivots, highPivots } = getPivots();

  // Simulation Loop
  for (let i = 300; i < quotes.length; i++) {
    if (!isPositionOpen) {
      const lows = lowPivots.filter(p => p.idx < i && p.idx > i - 300);
      const highs = highPivots.filter(p => p.idx < i && p.idx > i - 300);

      if (lows.length < 3 || highs.length < 2) continue;

      // Exhaustive Triplet Search
      for (let j2 = lows.length - 1; j2 >= 2; j2--) {
        for (let j1 = j2 - 1; j1 >= 1; j1--) {
          for (let j0 = j1 - 1; j0 >= 0; j0--) {
            const s2 = lows[j2];
            const head = lows[j1];
            const s1 = lows[j0];

            if (s2.idx - s1.idx < 30) continue; 

            if (head.price < s1.price && head.price < s2.price) {
              const p2Arr = highs.filter(h => h.idx > head.idx && h.idx < s2.idx);
              const p1Arr = highs.filter(h => h.idx > s1.idx && h.idx < head.idx);
              
              if (p1Arr.length > 0 && p2Arr.length > 0) {
                const p1 = p1Arr[p1Arr.length - 1];
                const p2 = p2Arr[0];

                const shouldersLevel = Math.abs(s1.price - s2.price) / Math.max(s1.price, s2.price) <= 0.12;
                const neckLevel = Math.abs(p1.price - p2.price) / Math.max(p1.price, p2.price) <= 0.12;

                if (shouldersLevel && neckLevel) {
                  const neckline = Math.max(p1.price, p2.price);
                  if (quotes[i].close > neckline && i > s2.idx) {
                    isPositionOpen = true;
                    activeEntry = Math.round(quotes[i].close);
                    const patternHeight = neckline - head.price;
                    activeTarget = Math.round(Math.max(activeEntry * 1.30, activeEntry + patternHeight));
                    const dateVal = quotes[i].date;
                    activeSignalDate = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
                    break;
                  }
                }
              }
            }
          }
          if (isPositionOpen) break;
        }
        if (isPositionOpen) break;
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
    return h >= quotes[idx-1].high && h >= quotes[idx-2].high && h >= quotes[idx-3].high &&
           h > quotes[idx+1].high;
  };

  const pivots: { price: number, idx: number }[] = [];
  for (let i = 3; i < quotes.length - 1; i++) {
    if (isPivotHigh(i)) pivots.push({ price: quotes[i].high, idx: i });
  }

  // Simulation Loop
  for (let i = 300; i < quotes.length; i++) {
    if (!isPositionOpen) {
      const validPivotsBefore = pivots.filter(p => p.idx < i && p.idx > i - 300);
      
      // Exhaustive Pivot Pair Search
      for (let r2 = validPivotsBefore.length - 1; r2 >= 1; r2--) {
        for (let r1 = r2 - 1; r1 >= 0; r1--) {
          const rim2 = validPivotsBefore[r2];
          const rim1 = validPivotsBefore[r1];

          const neckline = Math.max(rim1.price, rim2.price);
          const cupWidth = rim2.idx - rim1.idx;
          if (cupWidth < 25 || cupWidth > 200) continue;

          const cupSlice = prices.slice(rim1.idx, rim2.idx);
          const cupLow = Math.min(...cupSlice);
          const cupDepth = (neckline - cupLow) / neckline;

          const rimsLevel = Math.abs(rim1.price - rim2.price) / neckline <= 0.15;
          const hasProperDepth = cupDepth >= 0.30 && cupDepth <= 0.65;

          if (rimsLevel && hasProperDepth) {
            if (quotes[i].close > neckline && i > rim2.idx) {
              isPositionOpen = true;
              activeEntry = Math.round(quotes[i].close);
              const verticalGain = neckline - cupLow;
              activeTarget = Math.round(Math.max(activeEntry * 1.30, activeEntry + verticalGain));
              const dateVal = quotes[i].date;
              activeSignalDate = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
              break; 
            }
          }
        }
        if (isPositionOpen) break;
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
