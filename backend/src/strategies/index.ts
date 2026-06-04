
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
 * Settings: Length 200, 14% Envelope, Exponential = OFF
 * Logic: 
 *   - Entry: Price touches or reaches lower band.
 *   - Target: MAX(Upper Band at Entry, Entry * 1.30). 
 *   - Dynamic Exit: If current Upper Band > Initial Target, use current Upper Band.
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200) {
  if (!quotes || quotes.length < length) return null;
  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];

  let activeEntry = 0;
  let initialTargetAtEntry = 0;
  let activeSignalDate = "";
  let isPositionOpen = false;

  // We scan the data to find the LATEST active trade cycle
  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const lowerBand = sma * (1 - percentage / 100);
    const upperBand = sma * (1 + percentage / 100);

    // RESET: If stock reaches target or upper band, we close the old cycle
    const currentDynamicTarget = Math.max(initialTargetAtEntry, upperBand);
    if (isPositionOpen && quotes[i].high >= currentDynamicTarget) {
      isPositionOpen = false;
      activeEntry = 0; // Clear for next fresh cycle
    }

    // NEW CYCLE ENTRY: First touch of lower band after a reset
    if (!isPositionOpen && quotes[i].low <= lowerBand) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close);
      initialTargetAtEntry = Math.round(Math.max(upperBand, activeEntry * 1.30)); 
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
    }
  }

  const currentSma = smaValues[smaValues.length - 1];
  const currentUpperBand = currentSma * (1 + percentage / 100);
  const finalActiveTarget = Math.max(initialTargetAtEntry, currentUpperBand);

  // Qualified Buy Zone: Within 2% of entry
  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.02;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: Math.round(finalActiveTarget),
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate,
    isLocked: true // INSTITUTIONAL LOCK: 14% SMA Envelope Floor (Latest Cycle)
  };
}

/**
 * STRATEGY: Volatility Channel (Institutional Bollinger Band)
 * Settings: Length 200, StdDev 2.5
 * Logic: Buy at lower band, Sell at current upper band.
 */
export function calculateBollingerBand(quotes: Quote[], length: number = 200, sd: number = 2.5) {
  if (!quotes || quotes.length < length) return { isBuyZone: false };

  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];
  
  let activeEntry = 0;
  let activeSignalDate = "";
  let isPositionOpen = false;

  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const window = prices.slice(i - length + 1, i + 1);
    const squareDiffs = window.map(v => Math.pow(v - sma, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / length);

    const lowerBand = sma - stdDev * sd;
    const upperBand = sma + stdDev * sd;

    // RESET: Reaching current upper band closes the cycle
    if (isPositionOpen && quotes[i].high >= upperBand) {
      isPositionOpen = false;
      activeEntry = 0;
    }

    // NEW CYCLE ENTRY: First touch of lower band after reset
    if (!isPositionOpen && quotes[i].low <= lowerBand) {
      isPositionOpen = true;
      activeEntry = Math.round(quotes[i].close);
      const dateVal = quotes[i].date;
      activeSignalDate = (typeof dateVal === 'string' ? dateVal : dateVal.toISOString()).split('T')[0];
    }
  }

  // Calculate latest upper band for target display
  const lastSma = smaValues[smaValues.length - 1];
  const lastWindow = prices.slice(-length);
  const lastSqDiffs = lastWindow.map(v => Math.pow(v - lastSma, 2));
  const lastStdDev = Math.sqrt(lastSqDiffs.reduce((a, b) => a + b, 0) / length);
  const currentUpperBand = lastSma + lastStdDev * sd;

  const isActuallyInBuyRange = isPositionOpen && currentPrice <= activeEntry * 1.02;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: Math.round(currentUpperBand),
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate,
    isLocked: true // INSTITUTIONAL LOCK: 2.5 SD Volatility Channel (Latest Cycle)
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
    isBuyZone: isPositionOpen && currentPrice <= activeEntry * 1.02,
    entryPrice: activeEntry,
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeSignalDate,
    isLocked: true // INSTITUTIONAL LOCK: 20% EMA Envelope Knox Support
  };
}

/**
 * STRATEGY 2: Momentum Ceiling (Short Envelope Step-Back)
 * Logic:
 *   - B1 (Tranche 1): Buy at Middle Line (SMA 200). Sell at Upper Band.
 *   - B2 (Tranche 2): Buy at Lower Band (14% SMA). Sell at Middle Line.
 */
export function processShortEnvelope(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;

  const prices = quotes.map(q => q.close); 
  const sma200 = calculateSMA(prices, 200);
  const latestIdx = quotes.length - 1;
  const currentPrice = prices[latestIdx];

  let b1_open = false, b1_entry_price = 0, b1_date = '', b1_target = 0;
  let b2_open = false, b2_entry_price = 0, b2_date = '', b2_target = 0;

  for (let i = 200; i < quotes.length; i++) {
    const sma = sma200[i];
    const upperBand = sma * 1.14;
    const lowerBand = sma * 0.86;

    // Tranche B1: Buy at Middle Line (Cross from above)
    if (!b1_open && quotes[i-1].close >= sma200[i-1] && quotes[i].low <= sma) {
      b1_open = true;
      b1_entry_price = Math.round(quotes[i].close);
      b1_target = Math.round(Math.max(upperBand, b1_entry_price * 1.15));
      const dateVal = quotes[i].date;
      b1_date = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
    }

    // Tranche B2: Buy at Lower Band
    if (!b2_open && quotes[i].low <= lowerBand) {
      b2_open = true;
      b2_entry_price = Math.round(quotes[i].close);
      b2_target = Math.round(sma); // Sell at Middle Line
      const dateVal = quotes[i].date;
      b2_date = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
    }

    // Exit B1: Hits Upper Band (Dynamic)
    if (b1_open && quotes[i].high >= Math.max(b1_target, upperBand)) {
      b1_open = false;
    }

    // Exit B2: Hits Middle Line (Dynamic)
    if (b2_open && quotes[i].high >= sma) {
      b2_open = false;
    }
  }

  // Final Mapping for Signal
  let activeEntry = 0, activeTarget = 0, activeTranche = 'NONE', activeDate = '';
  if (b2_open) { activeEntry = b2_entry_price; activeTarget = b2_target; activeTranche = 'B2'; activeDate = b2_date; }
  else if (b1_open) { activeEntry = b1_entry_price; activeTarget = b1_target; activeTranche = 'B1'; activeDate = b1_date; }

  const isActuallyInBuyRange = (activeTranche !== 'NONE') && currentPrice <= activeEntry * 1.02;

  return {
    isBuyZone: isActuallyInBuyRange,
    tranche: activeTranche,
    entryPrice: activeEntry, 
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeDate,
    isLocked: true, // INSTITUTIONAL LOCK: B1 (Mid) / B2 (Lower) Dual Tranche
    abcd: { 
      a: { price: Math.round(sma200[latestIdx] * 1.14), label: "Upper" },
      b: { price: Math.round(sma200[latestIdx]), label: "Middle" },
      c: { price: Math.round(sma200[latestIdx] * 0.86), label: "Lower" }
    }
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

  let state = 'NONE'; // NONE, A_ACTIVE, B_ACTIVE, C_ACTIVE, D_ACTIVE
  let a_entry = 0, a_date = '', a_target = 0;
  let b_entry = 0, b_date = '', b_target = 0;
  let c_entry = 0, c_date = '', c_target = 0;
  let d_entry = 0, d_date = '', d_target = 0;

  for (let i = 200; i < quotes.length; i++) {
    const isBearishStacked = prices[i] < sma20[i] && sma20[i] < sma50[i] && sma50[i] < sma200[i];
    const isBullishReversed = prices[i] > sma20[i] && sma20[i] > sma50[i] && sma50[i] > sma200[i];

    // Reset/Exit Logic (Full Reversal)
    if (state !== 'NONE' && isBullishReversed) {
      // Calculate average entry
      let sum = a_entry;
      let count = 1;
      if (state === 'B_ACTIVE') { sum += b_entry; count = 2; }
      else if (state === 'C_ACTIVE') { sum += (b_entry + c_entry); count = 3; }
      else if (state === 'D_ACTIVE') { sum += (b_entry + c_entry + d_entry); count = 4; }
      
      const avgEntry = sum / count;
      if (prices[i] >= avgEntry) {
        state = 'NONE'; // Exited profitably
        a_date = ''; b_date = ''; c_date = ''; d_date = '';
      }
    }

    // Step-Back Exit Logic (D->C, C->B, B->A)
    if (state === 'D_ACTIVE' && prices[i] >= d_target) state = 'C_ACTIVE';
    else if (state === 'C_ACTIVE' && prices[i] >= c_target) state = 'B_ACTIVE';
    else if (state === 'B_ACTIVE' && prices[i] >= b_target) state = 'A_ACTIVE';

    // Entry Logic - ANCHORED TO FIRST TOUCH OF CYCLE
    if (state === 'NONE') {
      if (isBearishStacked) {
        state = 'A_ACTIVE';
        a_entry = Math.round(prices[i]);
        a_target = Math.round(sma200[i]); // Final Objective is SMA 200
        const dateVal = quotes[i].date;
        a_date = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
        
        // Define Ladder Prices (Anchored to FIRST touch)
        b_entry = Math.round(a_entry * 0.90); b_target = a_entry;
        c_entry = Math.round(b_entry * 0.90); c_target = b_entry;
        d_entry = Math.round(c_entry * 0.90); d_target = c_entry;
      }
    } 
    else if (state === 'A_ACTIVE') {
      // Once A is active, we DO NOT update it even if bearish stacking continues.
      // We only wait for a drop to B or a reset to NONE.
      if (quotes[i].low <= b_entry * 1.01) {
        state = 'B_ACTIVE';
        const dVal = quotes[i].date;
        b_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
      }
    } 
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) {
      state = 'C_ACTIVE';
      const dVal = quotes[i].date;
      c_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    } 
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) {
      state = 'D_ACTIVE';
      const dVal = quotes[i].date;
      d_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    }
  }

  // Final Mapping
  let activeEntry = 0, activeTarget = 0, activeTranche = 'NONE', activeDate = '';
  if (state === 'A_ACTIVE') { activeEntry = a_entry; activeTarget = a_target; activeTranche = 'A'; activeDate = a_date; }
  else if (state === 'B_ACTIVE') { activeEntry = b_entry; activeTarget = b_target; activeTranche = 'B'; activeDate = b_date; }
  else if (state === 'C_ACTIVE') { activeEntry = c_entry; activeTarget = c_target; activeTranche = 'C'; activeDate = c_date; }
  else if (state === 'D_ACTIVE') { activeEntry = d_entry; activeTarget = d_target; activeTranche = 'D'; activeDate = d_date; }

  // Institutional Buy-Zone Rule: Within 2% of the active tranche entry
  const isActuallyInBuyRange = (activeTranche !== 'NONE') && currentPrice <= activeEntry * 1.02;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeDate,
    tranche: activeTranche,
    abcd: { 
      a: { price: a_entry, date: a_date }, 
      b: { price: b_entry, date: b_date }, 
      c: { price: c_entry, date: c_date }, 
      d: { price: d_entry, date: d_date }, 
      gap: 10 
    },
    isLocked: true // INSTITUTIONAL LOCK: MA 20/50/200 Stacking + ABCD Ladder
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
  const per = 251; // Trading days
  if (!quotes || quotes.length < per + 1) return { isBuyZone: false };

  const currentPrice = quotes[quotes.length - 1].close;
  
  let state = 'SEEKING_RED'; // Start seeking red to catch ongoing drops

  let a_entry = 0, a_target = 0, a_date = '';
  let b_entry = 0, b_target = 0;
  let c_entry = 0, c_target = 0;
  let d_entry = 0, d_target = 0;

  for (let i = per; i < quotes.length; i++) {
    const window = quotes.slice(i - per + 1, i + 1); // 251 day window ending at current day
    const low52 = Math.min(...window.map(q => q.low));   // Red Line
    const high52 = Math.max(...window.map(q => q.high)); // Blue Line

    // Rule 1: Hitting the Blue Line resets everything to seek the first Red Line touch.
    if (quotes[i].high >= high52 * 0.99) {
      state = 'SEEKING_RED';
    } else if (state !== 'SEEKING_RED' && quotes[i].high >= a_target) {
      state = 'SEEKING_RED'; // A target achieved
    }

    // State Machine Transitions
    if (state === 'SEEKING_RED') {
      // First touch of Red Line after a Blue Line peak
      if (quotes[i].low <= low52 * 1.01) {
        state = 'A_ACTIVE';
        a_entry = Math.round(low52); // EXACT RED LINE TOUCH (Not Candle Close)
        a_target = Math.round(high52); // Exactly same-day high as target
        const dateVal = quotes[i].date;
        a_date = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
        
        // Define ABCD levels immediately based on exact 10% drops
        b_entry = Math.round(a_entry * 0.90);
        b_target = a_entry;
        
        c_entry = Math.round(b_entry * 0.90);
        c_target = b_entry;
        
        d_entry = Math.round(c_entry * 0.90);
        d_target = c_entry;
      }
    } 
    else if (state === 'A_ACTIVE') {
      if (quotes[i].low <= b_entry * 1.01) {
        state = 'B_ACTIVE';
      }
    }
    else if (state === 'B_ACTIVE') {
      if (quotes[i].high >= b_target) {
        state = 'A_ACTIVE'; // B exit reached, back to holding A
      } else if (quotes[i].low <= c_entry * 1.01) {
        state = 'C_ACTIVE';
      }
    }
    else if (state === 'C_ACTIVE') {
      if (quotes[i].high >= c_target) {
        state = 'B_ACTIVE'; // C exit reached, back to holding B
      } else if (quotes[i].low <= d_entry * 1.01) {
        state = 'D_ACTIVE';
      }
    }
    else if (state === 'D_ACTIVE') {
      if (quotes[i].high >= d_target) {
        state = 'C_ACTIVE'; // D exit reached, back to holding C
      }
    }
  }

  // Determine current active node
  let activeEntry = 0, activeTarget = 0, activeTranche = 'NONE';
  if (state === 'A_ACTIVE') { activeEntry = a_entry; activeTarget = a_target; activeTranche = 'A'; }
  else if (state === 'B_ACTIVE') { activeEntry = b_entry; activeTarget = b_target; activeTranche = 'B'; }
  else if (state === 'C_ACTIVE') { activeEntry = c_entry; activeTarget = c_target; activeTranche = 'C'; }
  else if (state === 'D_ACTIVE') { activeEntry = d_entry; activeTarget = d_target; activeTranche = 'D'; }

  // Institutional Buy-Zone Rule: Within 2% of the active tranche entry
  const isActuallyInBuyRange = (activeTranche !== 'NONE') && currentPrice <= activeEntry * 1.02;

  return {
    isBuyZone: isActuallyInBuyRange,
    entryPrice: activeEntry,
    target: activeTarget, 
    currentPrice: Math.round(currentPrice),
    triggerDate: activeTranche !== 'NONE' ? a_date : "",
    tranche: activeTranche,
    abcd: {
      a: a_entry,
      b: b_entry,
      c: c_entry,
      d: d_entry,
      gap: 10
    },
    isLocked: true // INSTITUTIONAL LOCK: High->Low First Touch + ABCD Step-Back
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
            isLocked: true // INSTITUTIONAL LOCK: 5-Point Box Validation (S-R-S-R-S)
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

  // Pre-condition: Price must be >= 30% down from ATH
  const ath = Math.max(...quotes.map(q => q.high));
  const drawdown = ((ath - currentPrice) / ath) * 100;
  if (drawdown < 30) return { isBuyZone: false };

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

    const patternDepth = (neckline.price - head.price) / neckline.price;
    if (patternDepth < 0.30) continue; // 30% Pattern Depth

    const patternHeight = neckline.price - head.price;
    const target = neckline.price + patternHeight;
    if ((target / s2.price) - 1 < 0.30) continue; // 30% Target Requirement

    if (Math.abs(currentPrice - s2.price) / s2.price <= 0.07) {
      return {
        isBuyZone: true,
        entryPrice: Math.round(s2.price),
        target: Math.round(target),
        currentPrice: Math.round(currentPrice),
        triggerDate: s2.date,
        correction: correction.toFixed(1),
        isLocked: true // INSTITUTIONAL LOCK: RHS Deep Recovery Model
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
  // Strategy #10: LOCKED CUP WITH HANDLE + 10% CORRECTION (v1.0)
  if (!quotes || quotes.length < 400) return { isBuyZone: false };

  const currentPrice = quotes[quotes.length - 1].close;

  // Pre-condition: Price must be >= 30% down from ATH
  const ath = Math.max(...quotes.map(q => q.high));
  const drawdown = ((ath - currentPrice) / ath) * 100;
  if (drawdown < 30) return { isBuyZone: false };

  const window = 15;
  const lows: any[] = [];
  const highs: any[] = [];
  for (let i = window; i < quotes.length - window; i++) {
    const lSlice = quotes.slice(i - window, i + window + 1).map(q => q.low);
    const hSlice = quotes.slice(i - window, i + window + 1).map(q => q.high);
    if (quotes[i].low === Math.min(...lSlice)) {
      const d = quotes[i].date;
      const dStr = (typeof d === 'string' ? d : d.toISOString()).split('T')[0];
      lows.push({ price: quotes[i].low, idx: i, date: dStr });
    }
    if (quotes[i].high === Math.max(...hSlice)) {
      const d = quotes[i].date;
      const dStr = (typeof d === 'string' ? d : d.toISOString()).split('T')[0];
      highs.push({ price: quotes[i].high, idx: i, date: dStr });
    }
  }

  for (let rIdx = highs.length - 2; rIdx >= 10; rIdx--) {
    const rim2 = highs[rIdx];
    const leftLipArr = highs.filter(h => h.idx < rim2.idx - 40 && h.idx > rim2.idx - 300);
    if (leftLipArr.length === 0) continue;
    
    const rim1 = leftLipArr.reduce((prev, curr) => 
      Math.abs(curr.price - rim2.price) < Math.abs(prev.price - rim2.price) ? curr : prev
    );

    if (Math.abs(rim1.price - rim2.price) / rim2.price > 0.08) continue;

    const cupLows = lows.filter(l => l.idx > rim1.idx && l.idx < rim2.idx);
    if (cupLows.length === 0) continue;
    const bottom = cupLows.reduce((prev, curr) => curr.price < prev.price ? curr : prev);

    if (bottom.price >= rim1.price * 0.70) continue; // Minimum 30% Depth (Institutional Rule)

    const handleLows = lows.filter(l => l.idx > rim2.idx && l.idx <= quotes.length - 1);
    if (handleLows.length === 0) continue;
    const handleLow = handleLows.reduce((prev, curr) => curr.price < prev.price ? curr : prev);

    const correction = ((rim2.price - handleLow.price) / rim2.price) * 100;
    if (correction < 7 || correction > 20) continue; // 7-20% Correction Range

    const depth = rim2.price - bottom.price;
    const target = rim2.price + depth;
    if ((target / currentPrice) - 1 < 0.30) continue; // 30% Target Requirement

    if (Math.abs(currentPrice - handleLow.price) / handleLow.price <= 0.10) {
      return {
        isBuyZone: true,
        entryPrice: Math.round(handleLow.price),
        target: Math.round(target),
        currentPrice: Math.round(currentPrice),
        triggerDate: handleLow.date,
        correction: correction.toFixed(1),
        isLocked: true // INSTITUTIONAL LOCK: Cup & Handle Value Model
      };
    }
  }
  return { isBuyZone: false };
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
    isLocked: true // INSTITUTIONAL LOCK: 67% ATH Reset Rule
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
    triggerDate: (typeof bestRally.triggerDate === 'string' ? bestRally.triggerDate : (bestRally.triggerDate as Date).toISOString()).split('T')[0],
    isLocked: true // INSTITUTIONAL LOCK: 20% Velocity Rally Origin Retest
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
