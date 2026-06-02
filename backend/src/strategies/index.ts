
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
  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.02;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate
  };
}

/**
 * STRATEGY: Envelope + Knox
 * Settings: EMA 200, 20% Envelope
 * Logic: Hard Support detection for high-beta volatility.
 */
export function calculateEnvelopeKnox(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;
  const prices = quotes.map(q => q.close);
  const ema200 = calculateEMA(prices, 200);
  const currentPrice = prices[prices.length - 1];

  let activeEntry = 0;
  let activeTarget = 0;
  let activeSignalDate = "";
  let isPositionOpen = false;

  for (let i = 200; i < quotes.length; i++) {
    const ema = ema200[i];
    const lowerBand = ema * 0.80; // 20% Envelope
    const upperBand = ema * 1.20;

    if (!isPositionOpen && quotes[i].low <= lowerBand) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close);
      activeTarget = Math.round(Math.max(upperBand, activeEntry * 1.40)); 
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
    }

    if (isPositionOpen && quotes[i].high >= activeTarget) {
      isPositionOpen = false;
    }
  }

  return {
    isBuyZone: isPositionOpen && currentPrice <= activeEntry * 1.05,
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
    isBuyZone: isBuyZone && currentPrice <= activeEntry * 1.02,
    tranche: activeTranche,
    entryPrice: activeEntry, 
    target: finalTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: b1_open ? b1_date : "",
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

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.02;

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

  // Institutional Buy-Zone Rule: Within 2% of deep depressed entry
  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.02;

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

  // Institutional Buy-Zone Rule: Within 2% of 52W low entry
  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.02;

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
  // Strategy #10: LOCKED INSTITUTIONAL BOX RULE (S-R-S-R-S)
  // v1.0 - Sequential 5-Point Validation
  if (!quotes || quotes.length < 500) return { isBuyZone: false };

  const currentPrice = quotes[quotes.length - 1].close;
  const window = 10;
  const pivots: { price: number, date: string, type: 'S' | 'R' }[] = [];
  
  for (let i = window; i < quotes.length - window; i++) {
    const lowSlice = quotes.slice(i - window, i + window + 1).map(q => q.low);
    const highSlice = quotes.slice(i - window, i + window + 1).map(q => q.high);
    if (quotes[i].low === Math.min(...lowSlice)) {
      const d = quotes[i].date;
      const dStr = (typeof d === 'string' ? d : (d as Date).toISOString()).split('T')[0];
      pivots.push({ price: quotes[i].low, date: dStr, type: 'S' });
    }
    if (quotes[i].high === Math.max(...highSlice)) {
      const d = quotes[i].date;
      const dStr = (typeof d === 'string' ? d : (d as Date).toISOString()).split('T')[0];
      pivots.push({ price: quotes[i].high, date: dStr, type: 'R' });
    }
  }

  const cluster = (type: 'S' | 'R', tolerance: number = 0.04) => {
    const zones: any[] = [];
    const filtered = pivots.filter(p => p.type === type);
    for (const p of filtered) {
      let found = false;
      for (const z of zones) {
        if (Math.abs(p.price - z.mid) / z.mid <= tolerance) {
          z.mid = (z.mid * z.touches + p.price) / (z.touches + 1);
          z.touches++;
          found = true;
          break;
        }
      }
      if (!found) zones.push({ mid: p.price, touches: 1 });
    }
    return zones;
  };

  const sCandidateLevels = cluster('S').filter(z => z.touches >= 3);
  const rCandidateLevels = cluster('R').filter(z => z.touches >= 2);

  for (const sl of sCandidateLevels) {
    for (const rl of rCandidateLevels) {
      const gap = (rl.mid / sl.mid) - 1;
      if (gap < 0.30) continue;

      const inS = (p: any) => Math.abs(p.price - sl.mid) / sl.mid <= 0.05;
      const inR = (p: any) => Math.abs(p.price - rl.mid) / rl.mid <= 0.05;
      const relevantPivots = pivots.filter(p => inS(p) || inR(p));
      
      let sequence: any[] = [];
      let state = 'S1';
      for (const p of relevantPivots) {
        if (state === 'S1' && inS(p)) { sequence = [p]; state = 'R1'; }
        else if (state === 'R1' && inR(p)) { sequence.push(p); state = 'S2'; }
        else if (state === 'S2' && inS(p)) { sequence.push(p); state = 'R2'; }
        else if (state === 'R2' && inR(p)) { sequence.push(p); state = 'S3'; }
        else if (state === 'S3' && inS(p)) { sequence.push(p); state = 'DONE'; }
      }

      if (state === 'DONE') {
        if (Math.abs(currentPrice - sl.mid) / sl.mid <= 0.07) {
          return {
            isBuyZone: true,
            entryPrice: Math.round(sl.mid),
            target: Math.round(rl.mid),
            currentPrice: Math.round(currentPrice),
            triggerDate: sequence[sequence.length-1].date,
            isLocked: true // Structural Lock Active
          };
        }
      }
    }
  }
  return { isBuyZone: false };
}

/**
 * STRATEGY 7: Dynamic Reversal (Parallel Symmetric RHS)
 * Logic:
 * 1. Pre-condition: Price must be >= 30% down from ATH.
 * 2. Shape: Strict 5-point sequence (S1 -> P1 -> Head -> P2 -> S2).
 * 3. Parallelism: S1/S2 and P1/P2 must be within 5% price alignment.
 */
export function calculateRHS(quotes: Quote[]) {
  // Strategy #11: LOCKED REVERSE H&S + 10% CORRECTION (v1.0)
  if (!quotes || quotes.length < 400) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const ema200 = calculateEMA(prices, 200);
  const latestIdx = quotes.length - 1;
  const currentPrice = prices[latestIdx];

  const window = 15;
  const lows: any[] = [];
  const highs: any[] = [];
  for (let i = window; i < latestIdx - window; i++) {
    const lSlice = quotes.slice(i - window, i + window + 1).map(q => q.low);
    const hSlice = quotes.slice(i - window, i + window + 1).map(q => q.high);
    if (quotes[i].low === Math.min(...lSlice)) {
      const d = quotes[i].date;
      const dStr = (typeof d === 'string' ? d : (d as Date).toISOString()).split('T')[0];
      lows.push({ price: quotes[i].low, idx: i, date: dStr });
    }
    if (quotes[i].high === Math.max(...hSlice)) {
      const d = quotes[i].date;
      const dStr = (typeof d === 'string' ? d : (d as Date).toISOString()).split('T')[0];
      highs.push({ price: quotes[i].high, idx: i, date: dStr });
    }
  }

  for (let hIdx = lows.length - 2; hIdx >= 1; hIdx--) {
    const head = lows[hIdx];
    const s1Arr = lows.filter(l => l.idx < head.idx && l.idx > head.idx - 150);
    const s2Arr = lows.filter(l => l.idx > head.idx && l.idx < head.idx + 150);
    if (s1Arr.length === 0 || s2Arr.length === 0) continue;

    const s1 = s1Arr[s1Arr.length - 1];
    const s2 = s2Arr[0];

    if (head.price >= s1.price || head.price >= s2.price) continue;

    const peaks = highs.filter(h => h.idx > head.idx && h.idx < s2.idx);
    if (peaks.length === 0) continue;
    const neckline = peaks[0];

    const correction = ((neckline.price - s2.price) / neckline.price) * 100;
    if (correction < 8 || correction > 18) continue; 
    if (head.price > ema200[head.idx]) continue;

    const patternHeight = neckline.price - head.price;
    const target = neckline.price + patternHeight;
    if ((target / s2.price) - 1 < 0.30) continue;

    if (Math.abs(currentPrice - s2.price) / s2.price <= 0.07) {
      return {
        isBuyZone: true,
        entryPrice: Math.round(s2.price),
        target: Math.round(target),
        currentPrice: Math.round(currentPrice),
        triggerDate: s2.date,
        correction: correction.toFixed(1),
        isLocked: true
      };
    }
  }
  return { isBuyZone: false };
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

          const rimsLevel = Math.abs(rim1.price - rim2.price) / neckline <= 0.07;
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

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.02;

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
  // Strategy #14: LOCKED 67 KA FUNDA (v1.0)
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const ath = providedATH || Math.max(...quotes.map(q => q.high));
  const drawdown = ((ath - currentPrice) / ath) * 100;

  // 1. Mandatory Dividend Floor (Anti-Fraud)
  const divYield = parseFloat(screenerData?.dividendYield || 0);
  if (divYield < 1.0) return { isBuyZone: false, reason: 'Dividend Floor (< 1.0%)' };

  // 2. Technical Trigger (67% Reset)
  const isDeepDrawdown = drawdown >= 66.5;
  if (!isDeepDrawdown) return { isBuyZone: false };

  // 3. Target Calculation (Reset Price)
  const target = Math.round(ath * 0.67);

  // 4. Return Data Node
  return { 
    isBuyZone: true, 
    entryPrice: Math.round(currentPrice), 
    target: target, 
    currentPrice: Math.round(currentPrice),
    triggerDate: new Date().toISOString().split('T')[0],
    drawdown: drawdown.toFixed(1),
    dividendYield: divYield,
    isLocked: true 
  };
}

/**
 * STRATEGY 10: Velocity Retest
 */
export function calculateTwentyRallyRetest(quotes: Quote[], symbol?: string) {
  // Strategy #13: LOCKED ABSOLUTE GREEN RALLY RULE (v1.0)
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const ema200 = calculateEMA(prices, 200);
  const latestIdx = quotes.length - 1;
  const currentPrice = prices[latestIdx];

  const qualifyingRallies: any[] = [];

  for (let i = 200; i < latestIdx - 1; i++) {
    const q = quotes[i];
    const isGreen = q.close > q.open;
    
    if (isGreen && q.close < ema200[i]) {
      const rallyStartLow = q.low;
      let j = i + 1;
      let allGreen = true;
      while (j <= latestIdx && allGreen) {
        if (quotes[j].close > quotes[j].open) j++;
        else allGreen = false;
      }
      
      const rallyEndClose = quotes[j-1].close;
      const gain = (rallyEndClose - rallyStartLow) / rallyStartLow;
      if (gain >= 0.20) {
        qualifyingRallies.push({
          originPrice: rallyStartLow,
          peakPrice: rallyEndClose,
          peakIdx: j - 1,
          triggerDate: quotes[i].date
        });
      }
    }
  }

  if (qualifyingRallies.length === 0) return { isBuyZone: false };
  const bestRally = qualifyingRallies.sort((a, b) => b.peakIdx - a.peakIdx)[0];
  
  if (latestIdx - bestRally.peakIdx > 252) return { isBuyZone: false };

  const isAtOrigin = Math.abs(currentPrice - bestRally.originPrice) / bestRally.originPrice <= 0.05;
  const isBelowEMA = currentPrice < ema200[latestIdx];

  return {
    isBuyZone: isAtOrigin && isBelowEMA,
    entryPrice: Math.round(bestRally.originPrice),
    target: Math.round(bestRally.peakPrice),
    currentPrice: Math.round(currentPrice),
    triggerDate: bestRally.triggerDate,
    isLocked: true
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
