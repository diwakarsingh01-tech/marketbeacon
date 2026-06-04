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
 *   - Entry: Price touches or reaches lower band (Red Line).
 *   - Target: Upper Band (Blue Line) of the Entry Date. 
 *   - Includes ABCD 10% Step-Back Ladder.
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200) {
  if (!quotes || quotes.length < length + 1) return null;
  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];

  let state = 'NONE'; // NONE, A_ACTIVE, B_ACTIVE, C_ACTIVE, D_ACTIVE
  let a_entry = 0, a_date = '', a_target = 0;
  let b_entry = 0, b_date = '';
  let c_entry = 0, c_date = '';
  let d_entry = 0, d_date = '';

  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const lowerBand = sma * (1 - percentage / 100);
    const upperBand = sma * (1 + percentage / 100);

    // Rule 1: Reset Cycle (Hit Target)
    if (state !== 'NONE') {
      let currentActiveTarget = a_target;
      if (state === 'B_ACTIVE') currentActiveTarget = a_entry;
      else if (state === 'C_ACTIVE') currentActiveTarget = b_entry;
      else if (state === 'D_ACTIVE') currentActiveTarget = c_entry;

      if (quotes[i].high >= currentActiveTarget) {
        if (state === 'A_ACTIVE') state = 'NONE';
        else if (state === 'B_ACTIVE') state = 'A_ACTIVE';
        else if (state === 'C_ACTIVE') state = 'B_ACTIVE';
        else if (state === 'D_ACTIVE') state = 'C_ACTIVE';
      }
    }

    // Rule 2: Entry A - FIRST touch after a clean state
    if (state === 'NONE') {
      if (quotes[i].low <= lowerBand * 1.01) {
        state = 'A_ACTIVE';
        a_entry = Math.round(lowerBand); 
        a_target = Math.round(upperBand); 
        const dateVal = quotes[i].date;
        a_date = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
        
        // Define ABCD Ladder
        b_entry = Math.round(a_entry * 0.90);
        c_entry = Math.round(b_entry * 0.90);
        d_entry = Math.round(c_entry * 0.90);
        b_date = ''; c_date = ''; d_date = '';
      }
    }
    // Rule 3: ABCD Slide
    else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) {
      state = 'B_ACTIVE';
      const dVal = quotes[i].date;
      b_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
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

  let activeEntry = 0, activeTarget = 0, activeTranche = 'NONE', activeDate = '';
  if (state === 'A_ACTIVE') { activeEntry = a_entry; activeTarget = a_target; activeTranche = 'A'; activeDate = a_date; }
  else if (state === 'B_ACTIVE') { activeEntry = b_entry; activeTarget = a_entry; activeTranche = 'B'; activeDate = b_date; }
  else if (state === 'C_ACTIVE') { activeEntry = c_entry; activeTarget = b_entry; activeTranche = 'C'; activeDate = c_date; }
  else if (state === 'D_ACTIVE') { activeEntry = d_entry; activeTarget = c_entry; activeTranche = 'D'; activeDate = d_date; }

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
      d: { price: d_entry, date: d_date } 
    },
    isLocked: true 
  };
}

/**
 * STRATEGY 2: Momentum Ceiling (Short Envelope Step-Back)
 * Logic:
 *   - A (Tranche 1): Buy at Middle Line (SMA 200). Sell at Upper Band.
 *   - B (Tranche 2): Buy at Lower Band (14% SMA). Sell at Middle Line.
 *   - C/D: 10% drops from B for deep recovery.
 */
export function processShortEnvelope(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;

  const prices = quotes.map(q => q.close); 
  const sma200 = calculateSMA(prices, 200);
  const latestIdx = quotes.length - 1;
  const currentPrice = prices[latestIdx];

  let state = 'NONE'; // NONE, A_ACTIVE, B_ACTIVE, C_ACTIVE, D_ACTIVE
  let a_entry = 0, a_date = '', a_target = 0;
  let b_entry = 0, b_date = '', b_target = 0;
  let c_entry = 0, c_date = '';
  let d_entry = 0, d_date = '';

  for (let i = 200; i < quotes.length; i++) {
    const sma = sma200[i];
    const upperBand = Math.round(sma * 1.14);
    const lowerBand = Math.round(sma * 0.86);

    // RESET/EXIT:
    if (state === 'A_ACTIVE' && quotes[i].high >= a_target) state = 'NONE';
    else if (state === 'B_ACTIVE' && quotes[i].high >= sma) state = 'A_ACTIVE';
    else if (state === 'C_ACTIVE' && quotes[i].high >= b_entry) state = 'B_ACTIVE';
    else if (state === 'D_ACTIVE' && quotes[i].high >= c_entry) state = 'C_ACTIVE';

    // NEW CYCLE ENTRY A: Middle line touch from above
    if (state === 'NONE') {
      if (quotes[i-1].close >= sma200[i-1] && quotes[i].low <= sma) {
        state = 'A_ACTIVE';
        a_entry = Math.round(sma);
        a_target = upperBand;
        const dVal = quotes[i].date;
        a_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
        
        // Define Ladder below
        b_entry = lowerBand;
        c_entry = Math.round(b_entry * 0.90);
        d_entry = Math.round(c_entry * 0.90);
        b_date = ''; c_date = ''; d_date = '';
      }
    }
    // ENTRY B
    else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) {
      state = 'B_ACTIVE';
      const dVal = quotes[i].date;
      b_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    }
    // ENTRY C
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) {
      state = 'C_ACTIVE';
      const dVal = quotes[i].date;
      c_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    }
    // ENTRY D
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) {
      state = 'D_ACTIVE';
      const dVal = quotes[i].date;
      d_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    }
  }

  let activeEntry = 0, activeTarget = 0, activeTranche = 'NONE', activeDate = '';
  if (state === 'A_ACTIVE') { activeEntry = a_entry; activeTarget = a_target; activeTranche = 'A'; activeDate = a_date; }
  else if (state === 'B_ACTIVE') { activeEntry = b_entry; activeTarget = a_entry; activeTranche = 'B'; activeDate = b_date; }
  else if (state === 'C_ACTIVE') { activeEntry = c_entry; activeTarget = b_entry; activeTranche = 'C'; activeDate = c_date; }
  else if (state === 'D_ACTIVE') { activeEntry = d_entry; activeTarget = c_entry; activeTranche = 'D'; activeDate = d_date; }

  const isActuallyInBuyRange = (activeTranche !== 'NONE') && currentPrice <= activeEntry * 1.02;

  return {
    isBuyZone: isActuallyInBuyRange,
    tranche: activeTranche,
    entryPrice: activeEntry, 
    target: activeTarget,
    currentPrice: Math.round(currentPrice),
    triggerDate: activeDate,
    isLocked: true,
    abcd: { 
      a: { price: a_entry, date: a_date }, 
      b: { price: b_entry, date: b_date }, 
      c: { price: c_entry, date: c_date }, 
      d: { price: d_entry, date: d_date } 
    }
  };
}

/**
 * STRATEGY 3: Bollinger Band (Institutional Reversion)
 */
export function calculateBollingerBand(quotes: Quote[], length: number = 200, sd: number = 2.5) {
  if (!quotes || quotes.length < length) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];
  let activeEntry = 0, activeSignalDate = "", isPositionOpen = false;

  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const window = prices.slice(i - length + 1, i + 1);
    const squareDiffs = window.map(v => Math.pow(v - sma, 2));
    const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / length);
    const lowerBand = sma - stdDev * sd;
    const upperBand = sma + stdDev * sd;

    if (isPositionOpen && quotes[i].high >= upperBand) { isPositionOpen = false; activeEntry = 0; }
    if (!isPositionOpen && quotes[i].low <= lowerBand) {
      isPositionOpen = true; activeEntry = Math.round(quotes[i].close);
      const dV = quotes[i].date; activeSignalDate = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0];
    }
  }

  const lastSma = smaValues[smaValues.length - 1];
  const lastWindow = prices.slice(-length);
  const lastStdDev = Math.sqrt(lastWindow.map(v => Math.pow(v - lastSma, 2)).reduce((a, b) => a + b, 0) / length);
  const currentUpperBand = lastSma + lastStdDev * sd;

  return { isBuyZone: isPositionOpen && currentPrice <= activeEntry * 1.02, entryPrice: activeEntry, target: Math.round(currentUpperBand), currentPrice: Math.round(currentPrice), triggerDate: activeSignalDate, isLocked: true };
}

/**
 * STRATEGY 4: MA 20/50/200 Stacking (Bulk Buying Model)
 */
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 300) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const currentPrice = prices[prices.length - 1];
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  let state = 'NONE'; 
  let a_entry = 0, a_date = '', a_target = 0;
  let b_entry = 0, b_date = '', c_entry = 0, c_date = '', d_entry = 0, d_date = '';
  let b_target = 0, c_target = 0, d_target = 0;

  for (let i = 200; i < quotes.length; i++) {
    const isBearishStacked = prices[i] < sma20[i] && sma20[i] < sma50[i] && sma50[i] < sma200[i];
    const isBullishReversed = prices[i] > sma20[i] && sma20[i] > sma50[i] && sma50[i] > sma200[i];

    if (state !== 'NONE' && isBullishReversed) {
      let sum = a_entry;
      let count = 1;
      if (state === 'B_ACTIVE') { sum += b_entry; count = 2; }
      else if (state === 'C_ACTIVE') { sum += (b_entry + c_entry); count = 3; }
      else if (state === 'D_ACTIVE') { sum += (b_entry + c_entry + d_entry); count = 4; }
      const avgEntry = sum / count;
      if (prices[i] >= avgEntry) { state = 'NONE'; a_date = ''; b_date = ''; c_date = ''; d_date = ''; }
    }

    if (state === 'D_ACTIVE' && prices[i] >= d_target) state = 'C_ACTIVE';
    else if (state === 'C_ACTIVE' && prices[i] >= c_target) state = 'B_ACTIVE';
    else if (state === 'B_ACTIVE' && prices[i] >= b_target) state = 'A_ACTIVE';

    if (state === 'NONE') {
      if (isBearishStacked) {
        state = 'A_ACTIVE'; a_entry = Math.round(prices[i]); a_target = Math.round(sma200[i]);
        const dateVal = quotes[i].date; a_date = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];
        b_entry = Math.round(a_entry * 0.90); b_target = a_entry;
        c_entry = Math.round(b_entry * 0.90); c_target = b_entry;
        d_entry = Math.round(c_entry * 0.90); d_target = c_entry;
      }
    } 
    else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) {
      state = 'B_ACTIVE'; const dVal = quotes[i].date; b_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    } 
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) {
      state = 'C_ACTIVE'; const dVal = quotes[i].date; c_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    } 
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) {
      state = 'D_ACTIVE'; const dVal = quotes[i].date; d_date = (typeof dVal === 'string' ? dVal : (dVal as Date).toISOString()).split('T')[0];
    }
  }

  let activeEntry = 0, activeTarget = 0, activeTranche = 'NONE', activeDate = '';
  if (state === 'A_ACTIVE') { activeEntry = a_entry; activeTarget = a_target; activeTranche = 'A'; activeDate = a_date; }
  else if (state === 'B_ACTIVE') { activeEntry = b_entry; activeTarget = a_entry; activeTranche = 'B'; activeDate = b_date; }
  else if (state === 'C_ACTIVE') { activeEntry = c_entry; activeTarget = b_entry; activeTranche = 'C'; activeDate = c_date; }
  else if (state === 'D_ACTIVE') { activeEntry = d_entry; activeTarget = c_entry; activeTranche = 'D'; activeDate = d_date; }

  return { isBuyZone: (activeTranche !== 'NONE') && currentPrice <= activeEntry * 1.02, entryPrice: activeEntry, target: activeTarget, currentPrice: Math.round(currentPrice), triggerDate: activeDate, tranche: activeTranche, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date }, gap: 10 }, isLocked: true };
}

/**
 * STRATEGY 5: 52-Week High/Low (Institutional Rule)
 */
export function calculate52WeekStrategy(quotes: Quote[]) {
  const per = 251; if (!quotes || quotes.length < per + 1) return { isBuyZone: false };
  const currentPrice = quotes[quotes.length - 1].close;
  let state = 'SEEKING_RED', a_entry = 0, a_target = 0, a_date = '', b_entry = 0, c_entry = 0, d_entry = 0;

  for (let i = per; i < quotes.length; i++) {
    const window = quotes.slice(i - per + 1, i + 1);
    const low52 = Math.min(...window.map(q => q.low));
    const high52 = Math.max(...window.map(q => q.high));

    if (quotes[i].high >= high52 * 0.99) state = 'SEEKING_RED';
    else if (state !== 'SEEKING_RED' && quotes[i].high >= a_target) state = 'SEEKING_RED';

    if (state === 'SEEKING_RED' && quotes[i].low <= low52 * 1.01) {
      state = 'A_ACTIVE'; a_entry = Math.round(low52); a_target = Math.round(high52);
      const dV = quotes[i].date; a_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0];
      b_entry = Math.round(a_entry * 0.90); c_entry = Math.round(b_entry * 0.90); d_entry = Math.round(c_entry * 0.90);
    } else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) state = 'B_ACTIVE';
    else if (state === 'B_ACTIVE' && quotes[i].high >= a_entry) state = 'A_ACTIVE';
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) state = 'C_ACTIVE';
    else if (state === 'C_ACTIVE' && quotes[i].high >= b_entry) state = 'B_ACTIVE';
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) state = 'D_ACTIVE';
    else if (state === 'D_ACTIVE' && quotes[i].high >= c_entry) state = 'C_ACTIVE';
  }

  let activeEntry = 0, activeTarget = 0, activeTranche = 'NONE';
  if (state === 'A_ACTIVE') { activeEntry = a_entry; activeTarget = a_target; activeTranche = 'A'; }
  else if (state === 'B_ACTIVE') { activeEntry = b_entry; activeTarget = a_entry; activeTranche = 'B'; }
  else if (state === 'C_ACTIVE') { activeEntry = c_entry; activeTarget = b_entry; activeTranche = 'C'; }
  else if (state === 'D_ACTIVE') { activeEntry = d_entry; activeTarget = c_entry; activeTranche = 'D'; }

  return { isBuyZone: (activeTranche !== 'NONE') && currentPrice <= activeEntry * 1.02, entryPrice: activeEntry, target: activeTarget, currentPrice: Math.round(currentPrice), triggerDate: activeTranche !== 'NONE' ? a_date : "", tranche: activeTranche, abcd: { a: a_entry, b: b_entry, c: c_entry, d: d_entry, gap: 10 }, isLocked: true };
}

/**
 * STRATEGY 6: Supply-Demand Core (Institutional S/R)
 */
export function calculateSRStrategy(quotes: Quote[], screenerData?: any) {
  if (!quotes || quotes.length < 252) return { isBuyZone: false };
  const tolerance = 0.05, currentPrice = quotes[quotes.length - 1].close;
  const pivots: any[] = [];
  for (let i = 2; i < quotes.length - 2; i++) {
    if (quotes[i].low < quotes[i-1].low && quotes[i].low < quotes[i-2].low && quotes[i].low < quotes[i+1].low && quotes[i].low < quotes[i+2].low) pivots.push({ price: quotes[i].low, type: 'support', idx: i, date: quotes[i].date });
    if (quotes[i].high > quotes[i-1].high && quotes[i].high > quotes[i-2].high && quotes[i].high > quotes[i+1].high && quotes[i].high > quotes[i+2].high) pivots.push({ price: quotes[i].high, type: 'resistance', idx: i, date: quotes[i].date });
  }
  const clusterZones = (type: string) => {
    const zones: any[] = [];
    for (const p of pivots.filter(x => x.type === type)) {
      let found = false;
      for (const z of zones) { if (Math.abs(p.price - z.mid) / z.mid <= tolerance) { z.pivots.push(p); z.mid = z.pivots.reduce((a:any, b:any) => a + b.price, 0) / z.pivots.length; found = true; break; } }
      if (!found) zones.push({ mid: p.price, pivots: [p] });
    }
    return zones;
  };
  const supportZones = clusterZones('support'), resistanceZones = clusterZones('resistance');
  const activeSupportZones = supportZones.filter(z => Math.abs(currentPrice - z.mid) / z.mid <= tolerance);
  for (const sl of activeSupportZones) {
    const overhead = resistanceZones.filter(rl => rl.mid >= sl.mid * 1.30);
    if (overhead.length > 0 && sl.pivots.length >= 3) {
      const rl = overhead.sort((a, b) => a.mid - b.mid)[0];
      return { isBuyZone: Math.abs(currentPrice - sl.mid) / sl.mid <= 0.07, entryPrice: Math.round(sl.mid), target: Math.round(rl.mid), currentPrice: Math.round(currentPrice), triggerDate: sl.pivots.sort((a:any,b:any)=>a.idx-b.idx)[sl.pivots.length-1].date, isLocked: true };
    }
  }
  return { isBuyZone: false };
}

/**
 * STRATEGY 7: Dynamic Reversal (Parallel Symmetric RHS)
 */
export function calculateRHS(quotes: Quote[]) {
  if (!quotes || quotes.length < 400) return { isBuyZone: false };
  const currentPrice = quotes[quotes.length - 1].close, ath = Math.max(...quotes.map(q => q.high)), dr = ((ath - currentPrice) / ath) * 100;
  if (dr < 30) return { isBuyZone: false };
  const window = 15, lows: any[] = [], highs: any[] = [];
  for (let i = window; i < quotes.length - window; i++) {
    const lS = quotes.slice(i - window, i + window + 1).map(q => q.low), hS = quotes.slice(i - window, i + window + 1).map(q => q.high);
    if (quotes[i].low === Math.min(...lS)) lows.push({ price: quotes[i].low, idx: i, date: quotes[i].date });
    if (quotes[i].high === Math.max(...hS)) highs.push({ price: quotes[i].high, idx: i, date: quotes[i].date });
  }
  for (let hIdx = lows.length - 2; hIdx >= 1; hIdx--) {
    const head = lows[hIdx], s1A = lows.filter(l => l.idx < head.idx && l.idx > head.idx - 150), s2A = lows.filter(l => l.idx > head.idx && l.idx < head.idx + 150);
    if (s1A.length > 0 && s2A.length > 0) {
      const s1 = s1A[s1A.length - 1], s2 = s2A[0];
      const peaks = highs.filter(h => h.idx > head.idx && h.idx < s2.idx);
      if (peaks.length > 0) {
        const neckline = peaks[0], corr = ((neckline.price - s2.price) / neckline.price) * 100;
        if (corr >= 8 && corr <= 18 && (neckline.price - head.price) / neckline.price >= 0.30) {
          const target = neckline.price + (neckline.price - head.price);
          if ((target / s2.price) - 1 >= 0.30 && Math.abs(currentPrice - s2.price) / s2.price <= 0.07) return { isBuyZone: true, entryPrice: Math.round(s2.price), target: Math.round(target), currentPrice: Math.round(currentPrice), triggerDate: s2.date, correction: corr.toFixed(1), isLocked: true };
        }
      }
    }
  }
  return { isBuyZone: false };
}

/**
 * STRATEGY 8: Structural Pivot (Cup & Handle)
 */
export function calculateCupHandle(quotes: Quote[]) { 
  if (!quotes || quotes.length < 400) return { isBuyZone: false };
  const currentPrice = quotes[quotes.length - 1].close, ath = Math.max(...quotes.map(q => q.high)), dr = ((ath - currentPrice) / ath) * 100;
  if (dr < 30) return { isBuyZone: false };
  const window = 15, lows: any[] = [], highs: any[] = [];
  for (let i = window; i < quotes.length - window; i++) {
    const lS = quotes.slice(i - window, i + window + 1).map(q => q.low), hS = quotes.slice(i - window, i + window + 1).map(q => q.high);
    if (quotes[i].low === Math.min(...lS)) lows.push({ price: quotes[i].low, idx: i, date: quotes[i].date });
    if (quotes[i].high === Math.max(...hS)) highs.push({ price: quotes[i].high, idx: i, date: quotes[i].date });
  }
  for (let rIdx = highs.length - 2; rIdx >= 10; rIdx--) {
    const rim2 = highs[rIdx], leftLipArr = highs.filter(h => h.idx < rim2.idx - 40 && h.idx > rim2.idx - 300);
    if (leftLipArr.length > 0) {
      const rim1 = leftLipArr.reduce((p, c) => Math.abs(c.price - rim2.price) < Math.abs(p.price - rim2.price) ? c : p);
      if (Math.abs(rim1.price - rim2.price) / rim2.price <= 0.08) {
        const cupLows = lows.filter(l => l.idx > rim1.idx && l.idx < rim2.idx);
        if (cupLows.length > 0) {
          const bottom = cupLows.reduce((p, c) => c.price < p.price ? c : p);
          if (bottom.price < rim1.price * 0.70) {
            const handleLows = lows.filter(l => l.idx > rim2.idx && l.idx <= quotes.length - 1);
            if (handleLows.length > 0) {
              const handleLow = handleLows.reduce((p, c) => c.price < p.price ? c : p), corr = ((rim2.price - handleLow.price) / rim2.price) * 100;
              if (corr >= 7 && corr <= 20 && (rim2.price + (rim2.price - bottom.price)) / currentPrice - 1 >= 0.30 && Math.abs(currentPrice - handleLow.price) / handleLow.price <= 0.10) return { isBuyZone: true, entryPrice: Math.round(handleLow.price), target: Math.round(rim2.price + (rim2.price - bottom.price)), currentPrice: Math.round(currentPrice), triggerDate: handleLow.date, correction: corr.toFixed(1), isLocked: true };
            }
          }
        }
      }
    }
  }
  return { isBuyZone: false };
}

/**
 * STRATEGY 9: 67 Ka Funda
 */
export function calculateSixtySevenFunda(quotes: Quote[], data: any) {
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const currentPrice = quotes[quotes.length - 1].close, ath = Math.max(...quotes.map(q => q.high)), dr = ((ath - currentPrice) / ath) * 100;
  if (parseFloat(data?.dividendYield || 0) < 1.0 || dr < 66.5) return { isBuyZone: false };
  return { isBuyZone: true, entryPrice: Math.round(currentPrice), target: Math.round(ath * 0.67), currentPrice: Math.round(currentPrice), triggerDate: new Date().toISOString().split('T')[0], drawdown: dr.toFixed(1), isLocked: true };
}

/**
 * STRATEGY 10: Velocity Retest
 */
export function calculateTwentyRallyRetest(quotes: Quote[]) {
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const ema200 = calculateEMA(quotes.map(q => q.close), 200), latestIdx = quotes.length - 1, currentPrice = quotes[latestIdx].close, rallies = [];
  for (let i = 200; i < latestIdx - 1; i++) {
    if (quotes[i].close > quotes[i].open && quotes[i].close < ema200[i]) {
      let j = i + 1; while (j <= latestIdx && quotes[j].close > quotes[j].open) j++;
      if ((quotes[j-1].close - quotes[i].low) / quotes[i].low >= 0.20) rallies.push({ origin: quotes[i].low, peak: quotes[j-1].close, peakIdx: j - 1, date: quotes[i].date });
    }
  }
  if (rallies.length === 0) return { isBuyZone: false };
  const best = rallies.sort((a, b) => b.peakIdx - a.peakIdx)[0];
  return { isBuyZone: latestIdx - best.peakIdx <= 252 && Math.abs(currentPrice - best.origin) / best.origin <= 0.05 && currentPrice < ema200[latestIdx], entryPrice: Math.round(best.origin), target: Math.round(best.peak), currentPrice: Math.round(currentPrice), triggerDate: (typeof best.date === 'string' ? best.date : best.date.toISOString()).split('T')[0], isLocked: true };
}
