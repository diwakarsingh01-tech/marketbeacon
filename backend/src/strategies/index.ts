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
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200) {
  if (!quotes || quotes.length < length + 1) return null;
  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];

  let state = 'NONE'; 
  let a_entry = 0, a_date = '', a_target = 0;
  let b_entry = 0, b_date = '', c_entry = 0, c_date = '', d_entry = 0, d_date = '';

  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const lowerBand = sma * (1 - percentage / 100);
    const upperBand = sma * (1 + percentage / 100);

    if (state !== 'NONE') {
      let curT = a_target;
      if (state === 'B_ACTIVE') curT = a_entry;
      else if (state === 'C_ACTIVE') curT = b_entry;
      else if (state === 'D_ACTIVE') curT = c_entry;
      if (quotes[i].high >= curT) {
        if (state === 'A_ACTIVE') state = 'NONE';
        else if (state === 'B_ACTIVE') state = 'A_ACTIVE';
        else if (state === 'C_ACTIVE') state = 'B_ACTIVE';
        else if (state === 'D_ACTIVE') state = 'C_ACTIVE';
      }
    }

    if (state === 'NONE' && quotes[i].low <= lowerBand * 1.01) {
      state = 'A_ACTIVE'; a_entry = Math.round(lowerBand); a_target = Math.round(upperBand);
      const dV = quotes[i].date; a_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0];
      b_entry = Math.round(a_entry * 0.90); c_entry = Math.round(b_entry * 0.90); d_entry = Math.round(c_entry * 0.90);
      b_date = ''; c_date = ''; d_date = '';
    }
    else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) { state = 'B_ACTIVE'; const dV = quotes[i].date; b_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0]; }
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) { state = 'C_ACTIVE'; const dV = quotes[i].date; c_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0]; }
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) { state = 'D_ACTIVE'; const dV = quotes[i].date; d_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0]; }
  }

  let activeE = 0, activeT = 0, activeTr = 'NONE';
  if (state === 'A_ACTIVE') { activeE = a_entry; activeT = a_target; activeTr = 'A'; }
  else if (state === 'B_ACTIVE') { activeE = b_entry; activeT = a_entry; activeTr = 'B'; }
  else if (state === 'C_ACTIVE') { activeE = c_entry; activeT = b_entry; activeTr = 'C'; }
  else if (state === 'D_ACTIVE') { activeE = d_entry; activeT = c_entry; activeTr = 'D'; }

  return { isBuyZone: (activeTr !== 'NONE') && Math.abs(currentPrice - activeE) / activeE <= 0.022, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: a_date, tranche: activeTr, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date } }, isLocked: true };
}

/**
 * STRATEGY 2: Momentum Ceiling (Short Envelope Step-Back)
 * Logic:
 *   - A: Buy at Middle Line (SMA 200). Target: Upper Band of entry date.
 *   - B: Buy at Lower Band (14%). Target: SMA 200.
 *   - C/D: 10% steps below B. Target: Previous tranche.
 */
export function processShortEnvelope(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;
  const prices = quotes.map(q => q.close), sma200 = calculateSMA(prices, 200), currentPrice = prices[prices.length - 1];
  let state = 'NONE', a_entry = 0, a_date = '', a_target = 0, b_entry = 0, b_date = '', c_entry = 0, c_date = '', d_entry = 0, d_date = '';

  for (let i = 200; i < quotes.length; i++) {
    const sma = sma200[i], upperBand = Math.round(sma * 1.14), lowerBand = Math.round(sma * 0.86);
    if (state === 'A_ACTIVE' && quotes[i].high >= a_target) state = 'NONE';
    else if (state === 'B_ACTIVE' && quotes[i].high >= sma) state = 'A_ACTIVE';
    else if (state === 'C_ACTIVE' && quotes[i].high >= b_entry) state = 'B_ACTIVE';
    else if (state === 'D_ACTIVE' && quotes[i].high >= c_entry) state = 'C_ACTIVE';

    if (state === 'NONE' && quotes[i-1].close >= sma200[i-1] && quotes[i].low <= sma) {
      state = 'A_ACTIVE'; a_entry = Math.round(sma); a_target = upperBand;
      const dV = quotes[i].date; a_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0];
      b_entry = lowerBand; c_entry = Math.round(b_entry * 0.90); d_entry = Math.round(c_entry * 0.90);
      b_date = ''; c_date = ''; d_date = '';
    }
    else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) { state = 'B_ACTIVE'; const dV = quotes[i].date; b_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0]; }
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) { state = 'C_ACTIVE'; const dV = quotes[i].date; c_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0]; }
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) { state = 'D_ACTIVE'; const dV = quotes[i].date; d_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0]; }
  }

  let activeE = 0, activeT = 0, activeTr = 'NONE';
  if (state === 'A_ACTIVE') { activeE = a_entry; activeT = a_target; activeTr = 'A'; }
  else if (state === 'B_ACTIVE') { activeE = b_entry; activeT = Math.round(sma200[prices.length-1]); activeTr = 'B'; }
  else if (state === 'C_ACTIVE') { activeE = c_entry; activeT = b_entry; activeTr = 'C'; }
  else if (state === 'D_ACTIVE') { activeE = d_entry; activeT = c_entry; activeTr = 'D'; }

  return { isBuyZone: (activeTr !== 'NONE') && Math.abs(currentPrice - activeE) / activeE <= 0.022, tranche: activeTr, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: a_date, isLocked: true, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date } } };
}

/**
 * STRATEGY 3: Bollinger Band (Institutional Reversion)
 * Settings: Length 200, StdDev 2.5
 * Logic: 
 *   - A: Buy at Lower Band. Target: Upper Band of entry date.
 *   - B/C/D: 10% steps below A. Target: Previous tranche.
 */
export function calculateBollingerBand(quotes: Quote[], length: number = 200, sd: number = 2.5) {
  if (!quotes || quotes.length < length + 1) return { isBuyZone: false };
  const prices = quotes.map(q => q.close);
  const smaValues = calculateSMA(prices, length);
  const currentPrice = prices[prices.length - 1];

  let state = 'NONE'; 
  let a_entry = 0, a_date = '', a_target = 0;
  let b_entry = 0, b_date = '', c_entry = 0, c_date = '', d_entry = 0, d_date = '';

  for (let i = length; i < quotes.length; i++) {
    const sma = smaValues[i];
    const window = prices.slice(i - length + 1, i + 1);
    const stdDev = Math.sqrt(window.map(v => Math.pow(v - sma, 2)).reduce((a, b) => a + b, 0) / length);
    const lowerBand = sma - stdDev * sd;
    const upperBand = sma + stdDev * sd;

    // Rule 1: Reset/Exit Cycle
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

    // Rule 2: Entry A - FIRST touch
    if (state === 'NONE' && quotes[i].low <= lowerBand * 1.01) {
      state = 'A_ACTIVE';
      a_entry = Math.round(lowerBand); 
      a_target = Math.round(upperBand); 
      const dVal = quotes[i].date; a_date = (typeof dVal === 'string' ? dVal : dVal.toISOString()).split('T')[0];
      
      // Define Ladder
      b_entry = Math.round(a_entry * 0.90);
      c_entry = Math.round(b_entry * 0.90);
      d_entry = Math.round(c_entry * 0.90);
      b_date = ''; c_date = ''; d_date = '';
    }
    // Rule 3: ABCD Slide
    else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) {
      state = 'B_ACTIVE'; const dV = quotes[i].date; b_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0];
    }
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) {
      state = 'C_ACTIVE'; const dV = quotes[i].date; c_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0];
    }
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) {
      state = 'D_ACTIVE'; const dV = quotes[i].date; d_date = (typeof dV === 'string' ? dV : dV.toISOString()).split('T')[0];
    }
  }

  let activeE = 0, activeT = 0, activeTr = 'NONE';
  if (state === 'A_ACTIVE') { activeE = a_entry; activeT = a_target; activeTr = 'A'; }
  else if (state === 'B_ACTIVE') { activeE = b_entry; activeT = a_entry; activeTr = 'B'; }
  else if (state === 'C_ACTIVE') { activeE = c_entry; activeT = b_entry; activeTr = 'C'; }
  else if (state === 'D_ACTIVE') { activeE = d_entry; activeT = c_entry; activeTr = 'D'; }

  return { 
    isBuyZone: (activeTr !== 'NONE') && Math.abs(currentPrice - activeE) / activeE <= 0.022, 
    entryPrice: activeE, 
    target: activeT, 
    currentPrice: Math.round(currentPrice), 
    triggerDate: a_date, 
    tranche: activeTr,
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
 * STRATEGY 4: MA 20/50/200 Stacking (Bulk Buying Model)
 */
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 300) return { isBuyZone: false };
  const prices = quotes.map(q => q.close), currentPrice = prices[prices.length - 1], sma20 = calculateSMA(prices, 20), sma50 = calculateSMA(prices, 50), sma200 = calculateSMA(prices, 200);
  let state = 'NONE', a_entry = 0, a_date = '', a_target = 0, b_entry = 0, b_date = '', c_entry = 0, c_date = '', d_entry = 0, d_date = '', b_target = 0, c_target = 0, d_target = 0;
  for (let i = 200; i < quotes.length; i++) {
    const isBear = prices[i] < sma20[i] && sma20[i] < sma50[i] && sma50[i] < sma200[i], isBull = prices[i] > sma20[i] && sma20[i] > sma50[i] && sma50[i] > sma200[i];
    if (state !== 'NONE' && isBull) {
      let sum = a_entry, count = 1;
      if (state === 'B_ACTIVE') { sum += b_entry; count = 2; } else if (state === 'C_ACTIVE') { sum += (b_entry + c_entry); count = 3; } else if (state === 'D_ACTIVE') { sum += (b_entry + c_entry + d_entry); count = 4; }
      if (prices[i] >= sum / count) { state = 'NONE'; a_date = ''; b_date = ''; c_date = ''; d_date = ''; }
    }
    if (state === 'D_ACTIVE' && prices[i] >= d_target) state = 'C_ACTIVE'; else if (state === 'C_ACTIVE' && prices[i] >= c_target) state = 'B_ACTIVE'; else if (state === 'B_ACTIVE' && prices[i] >= b_target) state = 'A_ACTIVE';
    if (state === 'NONE') {
      if (isBear) {
        state = 'A_ACTIVE'; a_entry = Math.round(prices[i]); a_target = Math.round(sma200[i]);
        const dV = quotes[i].date; a_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0];
        b_entry = Math.round(a_entry * 0.90); b_target = a_entry; c_entry = Math.round(b_entry * 0.90); c_target = b_entry; d_entry = Math.round(c_entry * 0.90); d_target = c_entry;
      }
    } 
    else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) { state = 'B_ACTIVE'; const dV = quotes[i].date; b_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0]; }
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) { state = 'C_ACTIVE'; const dV = quotes[i].date; c_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0]; }
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) { state = 'D_ACTIVE'; const dV = quotes[i].date; d_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0]; }
  }
  let activeE = 0, activeT = 0, activeTr = 'NONE';
  // SMA-BCD: A = TRIGGER ONLY (signal detection). No buy at A.
  // Buy zone starts at B. B/C/D are the actual staggered buys.
  if (state === 'A_ACTIVE') { activeE = a_entry; activeT = a_target; activeTr = 'A'; }
  else if (state === 'B_ACTIVE') { activeE = b_entry; activeT = a_entry; activeTr = 'B'; }
  else if (state === 'C_ACTIVE') { activeE = c_entry; activeT = b_entry; activeTr = 'C'; }
  else if (state === 'D_ACTIVE') { activeE = d_entry; activeT = c_entry; activeTr = 'D'; }
  // Buy zone: only B/C/D (A is signal-only for SMA-BCD)
  const isBuyZoneForSMA = (activeTr === 'B' || activeTr === 'C' || activeTr === 'D') && Math.abs(currentPrice - activeE) / activeE <= 0.022;
  return { isBuyZone: isBuyZoneForSMA, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: a_date, tranche: activeTr, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date }, gap: 10 }, isLocked: true };
}

/**
 * STRATEGY 5: 52-Week High/Low (Institutional Rule)
 */
export function calculate52WeekStrategy(quotes: Quote[]) {
  const per = 251; if (!quotes || quotes.length < per + 1) return { isBuyZone: false };
  const currentPrice = quotes[quotes.length - 1].close;
  let state = 'SEEKING_RED', a_entry = 0, a_target = 0, a_date = '', b_entry = 0, b_date = '', c_entry = 0, c_date = '', d_entry = 0, d_date = '';
  for (let i = per; i < quotes.length; i++) {
    const window = quotes.slice(i - per + 1, i + 1), low52 = Math.min(...window.map(q => q.low)), high52 = Math.max(...window.map(q => q.high));
    const dateVal = quotes[i].date;
    const dStr = (typeof dateVal === 'string' ? dateVal : (dateVal as Date).toISOString()).split('T')[0];

    if (quotes[i].high >= high52 * 0.99 || (state !== 'SEEKING_RED' && quotes[i].high >= a_target)) state = 'SEEKING_RED';
    if (state === 'SEEKING_RED' && quotes[i].low <= low52 * 1.01) {
      state = 'A_ACTIVE'; a_entry = Math.round(low52); a_target = Math.round(high52);
      a_date = dStr;
      b_entry = Math.round(a_entry * 0.90); c_entry = Math.round(b_entry * 0.90); d_entry = Math.round(c_entry * 0.90);
      b_date = ''; c_date = ''; d_date = '';
    } else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) { state = 'B_ACTIVE'; b_date = dStr; }
    else if (state === 'B_ACTIVE' && quotes[i].high >= a_entry) state = 'A_ACTIVE';
    else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) { state = 'C_ACTIVE'; c_date = dStr; }
    else if (state === 'C_ACTIVE' && quotes[i].high >= b_entry) state = 'B_ACTIVE';
    else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) { state = 'D_ACTIVE'; d_date = dStr; }
    else if (state === 'D_ACTIVE' && quotes[i].high >= c_entry) state = 'C_ACTIVE';
  }
  let activeE = 0, activeT = 0, activeTr = 'NONE', activeD = '';
  if (state === 'A_ACTIVE') { activeE = a_entry; activeT = a_target; activeTr = 'A'; activeD = a_date; }
  else if (state === 'B_ACTIVE') { activeE = b_entry; activeT = a_entry; activeTr = 'B'; activeD = b_date; }
  else if (state === 'C_ACTIVE') { activeE = c_entry; activeT = b_entry; activeTr = 'C'; activeD = c_date; }
  else if (state === 'D_ACTIVE') { activeE = d_entry; activeT = c_entry; activeTr = 'D'; activeD = d_date; }
  return { isBuyZone: (activeTr !== 'NONE') && Math.abs(currentPrice - activeE) / activeE <= 0.022, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: activeD, tranche: activeTr, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date }, gap: 10 }, isLocked: true };
}

/**
 * STRATEGY 6: Supply-Demand Core (WM Swing - Institutional Locked)
 * Strict B-T-B-T-B sequencing with 2.2% merge tolerance and 30% conservative band gap.
 */
export function calculateSRStrategy(quotes: Quote[], screenerData?: any) {
  const max_lookback_bars = 1100;
  if (!quotes || quotes.length < 50) return { isBuyZone: false };

  // Calculate ATR
  const getATR = (qs: Quote[], period: number = 14) => {
    const tr = [0];
    for (let i = 1; i < qs.length; i++) {
      const hl = qs[i].high - qs[i].low;
      const hc = Math.abs(qs[i].high - qs[i-1].close);
      const lc = Math.abs(qs[i].low - qs[i-1].close);
      tr.push(Math.max(hl, hc, lc));
    }
    const atr = new Array(qs.length).fill(0);
    let sum = 0;
    for (let i = 1; i <= period && i < tr.length; i++) sum += tr[i];
    if (tr.length > period) atr[period] = sum / period;
    for (let i = period + 1; i < tr.length; i++) {
      atr[i] = (atr[i-1] * (period - 1) + tr[i]) / period;
    }
    return atr;
  };

  const swing_lookback = 3;
  const currentIdx = quotes.length - 1;
  const currentPrice = quotes[currentIdx].close;
  const startIdx = Math.max(swing_lookback, quotes.length - max_lookback_bars);
  
  const swingLows: any[] = [];
  const swingHighs: any[] = [];

  for (let i = startIdx; i < quotes.length - swing_lookback; i++) {
    let isLow = true;
    let isHigh = true;
    for (let j = i - swing_lookback; j <= i + swing_lookback; j++) {
      if (j === i) continue;
      if (quotes[j].low <= quotes[i].low) isLow = false;
      if (quotes[j].high >= quotes[i].high) isHigh = false;
    }
    if (isLow) swingLows.push({ price: quotes[i].low, idx: i, date: quotes[i].date });
    if (isHigh) swingHighs.push({ price: quotes[i].high, idx: i, date: quotes[i].date });
  }

  const level_tolerance_pct = 5.0; // Per MEMORY.md (Institutional Standard)
  const cluster_levels = (points: any[]) => {
    const clusters: any[] = [];
    for (const p of points) {
      let added = false;
      for (const c of clusters) {
        if (Math.abs(p.price - c.mean) / c.mean <= level_tolerance_pct / 100) {
          c.points.push(p);
          c.mean = c.points.reduce((sum: number, pt: any) => sum + pt.price, 0) / c.points.length;
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push({ mean: p.price, points: [p] });
      }
    }
    return clusters;
  };

  const supportClusters = cluster_levels(swingLows);
  const resistanceClusters = cluster_levels(swingHighs);

  for (const S of supportClusters) {
    if (S.points.length < 3) continue;

    const supportPoints = S.points.sort((a: any, b: any) => a.idx - b.idx);
    const supportFloor = Math.min(...S.points.map(p => p.price));
    const supportCeiling = Math.max(...S.points.map(p => p.price));
    
    for (let i = 0; i <= supportPoints.length - 3; i++) {
      const B1 = supportPoints[i];
      const B2 = supportPoints[i + 1];
      const B3 = supportPoints[i + 2];

      // Institutional Window: 1 Year (252 bars)
      if (currentIdx - B3.idx > 252) continue; 

      for (const R of resistanceClusters) {
        if (R.points.length < 2) continue;

        const targetPrice = Math.min(...R.points.map(p => p.price));
        const gap = (targetPrice / supportFloor) - 1;
        
        const tops = R.points.sort((a:any, b:any) => a.idx - b.idx);
        const T1 = tops.find((t: any) => t.idx > B1.idx && t.idx < B2.idx);
        const T2 = tops.find((t: any) => t.idx > B2.idx && t.idx < B3.idx);

        if (T1 && T2) {
           let entryIndex = -1;
           let consecutiveCount = 0;
           for (let j = B3.idx + 1; j <= currentIdx; j++) {
             if (quotes[j].close > quotes[j-1].close && quotes[j].low > quotes[j-1].low) {
               consecutiveCount++;
             } else {
               consecutiveCount = 0;
             }
             if (consecutiveCount >= 2) {
               entryIndex = j;
               break;
             }
           }

             if (entryIndex !== -1) {
               const entryPrice = quotes[entryIndex].close;
               const atrArr = getATR(quotes, 14);
             const atr = atrArr[entryIndex] || 0;
             const SL = Math.min(supportFloor, quotes[entryIndex].low) - 0.5 * atr;
             const RRR = (targetPrice - entryPrice) / (entryPrice - SL);

             // ABCD Tranche Integration
             const abcd = calculateABCDLevels(supportCeiling);
             let activeTr = 'NONE';
             
             // Strict +/- 2.2% Range Check for each Tranche (Per Institutional Mandate)
             const tolerance = 0.022; 
             if (Math.abs(currentPrice - abcd.a.price) / abcd.a.price <= tolerance) activeTr = 'A';
             else if (Math.abs(currentPrice - abcd.b.price) / abcd.b.price <= tolerance) activeTr = 'B';
             else if (Math.abs(currentPrice - abcd.c.price) / abcd.c.price <= tolerance) activeTr = 'C';
             else if (Math.abs(currentPrice - abcd.d.price) / abcd.d.price <= tolerance) activeTr = 'D';

              // STRICT RULE: 30% Gap Mandatory (support floor → target)
              const isGapValid = gap >= 0.30;
              // STRICT RULE: Entry → Target must also be ≥ 30%
              const entryTargetGap = (targetPrice / entryPrice) - 1;
              const isEntryTargetGapValid = entryTargetGap >= 0.30;
              const isQualified = activeTr !== 'NONE';
              const isObservation = !isQualified && currentPrice <= supportCeiling * 1.15;

              if (isGapValid && isEntryTargetGapValid && (isQualified || isObservation)) {
               const triggerDateObj = quotes[entryIndex].date;
               const triggerDate = typeof triggerDateObj === 'string' ? triggerDateObj : (triggerDateObj as any).toISOString();
               
               return { 
                 isBuyZone: isQualified, 
                 status: isQualified ? "QUALIFIED" : "OBSERVATION",
                 tranche: activeTr,
                 abcd: abcd,
                 entryPrice: Math.round(entryPrice), 
                 target: Math.round(targetPrice), 
                 currentPrice: Math.round(currentPrice), 
                 triggerDate: triggerDate.split('T')[0], 
                 isLocked: true,
                 touches: S.points.length,
                 upside: ((targetPrice / currentPrice - 1) * 100).toFixed(1) + "%",
                 rrr: RRR.toFixed(2),
                 stopLoss: Math.round(SL),
                 structure: "B-T-B-T-B"
               };
             }
           }
        }
      }
    }
  }
  return { isBuyZone: false, status: "REJECTED" };
}

/**
 * STRATEGY 8: Structural Pivot (Cup & Handle)
 * Rules: 30% ATH Drawdown + 30% Pattern Depth + 30% Target
 */
export function calculateCupHandle(quotes: Quote[]) { 
  if (!quotes || quotes.length < 400) return { isBuyZone: false };
  const currentPrice = quotes[quotes.length - 1].close, ath = Math.max(...quotes.map(q => q.high)), dr = ((ath - currentPrice) / ath) * 100;
  
  // Rule 1: 30% ATH Drawdown
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
          
          // Rule 2: 30% Pattern Depth (Rim to Bottom)
          if (bottom.price < rim1.price * 0.70) {
            const handleLows = lows.filter(l => l.idx > rim2.idx && l.idx <= quotes.length - 1);
            if (handleLows.length > 0) {
              const handleLow = handleLows.reduce((p, c) => c.price < p.price ? c : p), corr = ((rim2.price - handleLow.price) / rim2.price) * 100;
              
              const target = rim2.price + (rim2.price - bottom.price);
              // Rule 3: 30% Target Upside Gap
              if (corr >= 7 && corr <= 20 && (target / currentPrice) - 1 >= 0.30 && Math.abs(currentPrice - handleLow.price) / handleLow.price <= 0.022) {
                return { isBuyZone: true, entryPrice: Math.round(handleLow.price), target: Math.round(target), currentPrice: Math.round(currentPrice), triggerDate: handleLow.date, correction: corr.toFixed(1), isLocked: true };
              }
            }
          }
        }
      }
    }
  }
  return { isBuyZone: false };
}

/**
 * STRATEGY 9: 67 Ka Funda — Contrarian Value Strategy
 * Course: Hemant Jain — Equity Course Batch 4
 *
 * "67" = stock that has fallen ≥67% from its All-Time High.
 * 10-point binary checklist (pass/fail). No numerical scoring.
 *
 * Automated checks (what we can calculate):
 *   1. Stock ≥67% down from ATH
 *   2. Min 100% profit potential from entry to ATH
 *   3. Net Profit > ₹50 Cr (avoid SME/junk)
 *   4. D/E < 0.5 (or < 4 for finance)
 *   5. PE below 3Y median
 *   6. Quarterly sales & profit improving
 *
 * Manual review required (flagged for user):
 *   - Why did the stock fall? (sentiment / business / fundamental)
 *   - Does that reason no longer exist?
 *   - Proven track record & future growth prospects
 *   - Exit rule: sell at 100% gain if within 1 year, else hold to ATH or 3x
 */
export function calculateSixtySevenFunda(quotes: Quote[], data: any) {
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const latestIdx = quotes.length - 1;
  const currentPrice = quotes[latestIdx].close;

  // Find ATH
  let ath = 0, athIdx = 0;
  for (let i = 0; i < quotes.length; i++) {
    if (quotes[i].high > ath) { ath = quotes[i].high; athIdx = i; }
  }

  const dr = ((ath - currentPrice) / ath) * 100;
  const checklist: string[] = [];
  const failed: string[] = [];

  // RULE 1: Stock must be ≥67% down from ATH
  if (dr < 67) { failed.push(`Drawdown ${dr.toFixed(1)}% < 67%`); }
  else { checklist.push(`Drawdown ${dr.toFixed(1)}% ≥ 67%`); }

  // RULE 7: Min 100% profit potential (ATH / current >= 2x)
  const profitPotential = (ath / currentPrice) - 1;
  if (profitPotential < 1.0) { failed.push(`Profit potential ${(profitPotential * 100).toFixed(0)}% < 100%`); }
  else { checklist.push(`Profit potential ${(profitPotential * 100).toFixed(0)}% ≥ 100%`); }

  if (failed.length > 0) {
    return { isBuyZone: false, reason: failed.join("; "), drawdown: dr.toFixed(1), profitPotential: (profitPotential * 100).toFixed(0) + "%", triggerDate: "" };
  }

  // Fundamental filters (bare minimum)
  const pe = parseFloat(data?.peRatio) || 0;
  const peMedians = data?.peMedians || {};
  const pe3Y = peMedians.pe3Y || 0;
  const pe5Y = peMedians.pe5Y || 0;
  // FIX (2026-08-02): screener stores TTM profit as `currentNetProfit`, not `netProfit`.
  // Reading `data?.netProfit` always yielded 0, so the profit checks ran against 0 and
  // rejected/passed stocks for the wrong reason (e.g. "Net profit ₹0Cr < 95% of ATH").
  const netProfit = parseFloat(data?.currentNetProfit) || parseFloat(data?.netProfit) || 0;
  const de = parseFloat(data?.netDebtToEquity) || 0;
  const sector = (data?.industry || '').trim();
  const isFinance = ['Banking', 'Finance', 'NBFC', 'Financial Services', 'Asset Management'].includes(sector) || sector.toLowerCase().includes('finance');
  const isCapitalIntensive67 = ['EPC/Infra', 'Automobile', 'Infrastructure', 'Power', 'Steel', 'Telecom', 'Cement', 'Metal', 'Engineering', 'Industrial/Power', 'Utilities',
    'Oil & Gas', 'Energy/Conglomerate', 'Oil, Gas & Consumable Fuels', 'Petrochemicals',
    'Pharma', 'Pharmaceuticals', 'Chemicals', 'Mining', 'Logistics',
    'Textiles', 'Media', 'Entertainment', 'Electricals', 'Electronics Mfg',
    'Healthcare', 'Hospitality', 'Food Processing'
  ].includes(sector)
    || sector.toLowerCase().includes('infra') || sector.toLowerCase().includes('power') || sector.toLowerCase().includes('steel') || sector.toLowerCase().includes('telecom') || sector.toLowerCase().includes('auto')
    || sector.toLowerCase().includes('oil') || sector.toLowerCase().includes('gas') || sector.toLowerCase().includes('energy')
    || sector.toLowerCase().includes('pharma') || sector.toLowerCase().includes('chemical')
    || sector.toLowerCase().includes('mining') || sector.toLowerCase().includes('logistic')
    || sector.toLowerCase().includes('textile') || sector.toLowerCase().includes('media')
    || sector.toLowerCase().includes('electrical') || sector.toLowerCase().includes('healthcare');
  const debtLimit = isFinance ? 7.0 : (isCapitalIntensive67 ? 1.5 : 0.5);

  // RULE 3: Net Profit > ₹50 Cr
  if (netProfit > 0 && netProfit < 50) { failed.push(`Net profit ₹${netProfit}Cr < ₹50Cr`); }
  else if (netProfit > 0) { checklist.push(`Net profit ₹${netProfit}Cr > ₹50Cr`); }

  // RULE 4: Quarterly improvement proxy — sales & profit growing YoY
  const currentSales = parseFloat(data?.currentSales) || 0;
  const athSales = parseFloat(data?.athSales) || 0;
  const athNetProfit = parseFloat(data?.athNetProfit) || 0;
  if (currentSales > 0 && athSales > 0) {
    const salesNearATH = currentSales >= athSales * 0.95;
    const profitNearATH = netProfit >= athNetProfit * 0.95;
    if (!salesNearATH) { failed.push(`Sales ₹${currentSales}Cr < 95% of ATH ₹${athSales}Cr`); }
    else { checklist.push(`Sales ₹${currentSales}Cr ≥ 95% of ATH`); }
    if (!profitNearATH) { failed.push(`Net profit ₹${netProfit}Cr < 95% of ATH ₹${athNetProfit}Cr`); }
    else { checklist.push(`Net profit ₹${netProfit}Cr ≥ 95% of ATH`); }
  } else if (currentSales <= 0 && athSales <= 0 && netProfit <= 0 && athNetProfit <= 0) {
    // FAIL-CLOSED (2026-08-02): previously this branch silently passed with
    // "manual check required" when the screener scrape was incomplete (e.g. RELAXO —
    // athSales=0, athNetProfit=0, epsHistory=[]). Missing fundamentals now REJECT.
    failed.push('Fundamental data missing (screener scrape incomplete)');
  } else {
    checklist.push("Quarterly improvement — manual check required");
  }

  // RULE 5: D/E < 0.5 (or < 4 for finance)
  if (de > debtLimit) { failed.push(`D/E ${de.toFixed(2)} > ${debtLimit}`); }
  else if (de > 0) { checklist.push(`D/E ${de.toFixed(2)} ≤ ${debtLimit}`); }

  // PE sanity
  if (pe > 0 && pe > 60) { failed.push(`P/E ${pe.toFixed(1)} > 60`); }
  if (pe3Y > 0 && pe > pe3Y) { failed.push(`P/E ${pe.toFixed(1)} > 3Y median ${pe3Y.toFixed(1)}`); }
  if (pe5Y > 0 && pe > pe5Y) { failed.push(`P/E ${pe.toFixed(1)} > 5Y median ${pe5Y.toFixed(1)}`); }

  if (failed.length > 0) {
    return { isBuyZone: false, reason: failed.join("; "), drawdown: dr.toFixed(1), profitPotential: (profitPotential * 100).toFixed(0) + "%", triggerDate: "" };
  }

  // Entry: lock at max qualifying price (ATH * 0.33) — does not float with CMP
  const isEntryZone = currentPrice <= ath * 0.33;
  const entryPrice = ath * 0.33;

  // Target 1: +67% within 1 year (primary target)
  const target67 = Math.round(entryPrice * 1.67);
  // Target 2: +100% if 67% not reached within 1 year (fallback)
  const target100 = Math.round(entryPrice * 2.0);
  const targetATH = Math.round(ath);

  // Closer target is the active one — 67% is the first milestone
  const primaryTarget = Math.min(target67, target100);

  return {
    isBuyZone: isEntryZone,
    entryPrice: Math.round(entryPrice),
    target: primaryTarget,
    target67,         // +67% in 1yr
    target100,        // +100% fallback
    targetATH,
    targetLogic: "Target 1: +67% in 1yr. If not met: roll to +100%.",
    currentPrice: Math.round(currentPrice),
    triggerDate: new Date().toISOString().split('T')[0],
    drawdown: dr.toFixed(1) + "%",
    profitPotential: (profitPotential * 100).toFixed(0) + "%",
    checklist,
    manualReview: [
      "Why did the stock fall? (sentiment / business / fundamental)",
      "Does that reason no longer exist?",
      "Future growth prospects (industry outlook, business moat, competitive advantage)",
      "Exit rule: sell at +67% if within 1yr, else hold to +100% or ATH"
    ],
    isLocked: true
  };
}

/**
 * STRATEGY 10: 20% Rally Retest (Super Strategy)
 * Course: Hemant Jain — Equity Course Batch 4
 * Rules:
 *   - Start: close > prev close AND price < EMA200
 *   - ALL candles must be green (close > open), no red allowed
 *   - Gain from lowest wick to highest wick >= 20%
 *   - Single candle exception: >= 19% qualifies
 *   - Entry: price falls back to rally origin (within 2.2%)
 *   - Target: rally peak (highest wick)
 *   - Fall must occur within ~1 year (252 trading days)
 *   - Prefer entry below EMA200
 */
export function calculateTwentyRallyRetest(quotes: Quote[]) {
  if (!quotes || quotes.length < 250) return { isBuyZone: false };
  const ema200 = calculateEMA(quotes.map(q => q.close), 200);
  const latestIdx = quotes.length - 1;
  const currentPrice = quotes[latestIdx].close;

  // Scan backwards to find the most recent valid rally
  for (let i = latestIdx - 1; i >= 200; i--) {
    // Start condition: close > prev close AND below EMA200
    if (!(quotes[i].close > quotes[i-1].close && quotes[i].close < ema200[i])) continue;

    // Ensure this is the TRUE start (previous candle didn't also meet start condition)
    if (i > 200 && quotes[i-1].close > quotes[i-2].close && quotes[i-1].close < ema200[i-1]) continue;

    let j = i;
    let lowest = quotes[i].low;
    let highest = quotes[i].high;

    // Extend forward: every candle must be green (close > open) AND make higher low (wicks included)
    while (j <= latestIdx && quotes[j].close > quotes[j].open && (j === i || quotes[j].low > quotes[j-1].low)) {
      lowest = Math.min(lowest, quotes[j].low);
      highest = Math.max(highest, quotes[j].high);
      j++;
    }

    const candleCount = j - i;
    if (candleCount === 0) continue;

    // Calculate gain from lowest wick → highest wick (course rule)
    const gain = (highest - lowest) / lowest;

    // Check threshold: 19% for single candle, 20% for multi-candle
    const minGain = candleCount === 1 ? 0.19 : 0.20;
    if (gain < minGain) continue;

    // Valid rally found — check entry conditions
    const rallyOrigin = lowest;
    const rallyPeak = highest;
    const peakIdx = j - 1;

    // Must fall back within 1 year (~252 trading days)
    if (latestIdx - peakIdx > 252) continue;

    // Current price must be near rally origin (entry zone)
    const isAtOrigin = Math.abs(currentPrice - rallyOrigin) / rallyOrigin <= 0.022;

    if (isAtOrigin) {
      const triggerDate = typeof quotes[i].date === 'string'
        ? quotes[i].date
        : (quotes[i].date as Date).toISOString().split('T')[0];
      const isBelow200 = currentPrice < ema200[latestIdx];

      return {
        isBuyZone: true,
        entryPrice: Math.round(rallyOrigin),
        target: Math.round(rallyPeak),
        currentPrice: Math.round(currentPrice),
        triggerDate,
        candleCount,
        gain: (gain * 100).toFixed(1) + "%",
        below200MA: isBelow200,
        isLocked: true
      };
    }

    // Found the most recent rally — if not at entry, stop searching
    break;
  }

  return { isBuyZone: false };
}

/**
 * UTILITY: ABCD Level Calculation (Institutional 10% Model)
 */
/**
 * Reverse Head & Shoulders (RHS) Pattern Recognition
 * 
 * Detects a bullish reversal pattern after a downtrend:
 * - Left Shoulder (S1): Swing low
 * - Head (H): Lower swing low (deeper than shoulders)
 * - Right Shoulder (S2): Higher swing low (similar level to S1)
 * - Neckline: Resistance level drawn across the highs between shoulders and head
 * - Breakout: Price closes above the neckline
 */
export function calculateReverseHeadShoulders(quotes: Quote[]) {
  if (!quotes || quotes.length < 350) return { isBuyZone: false };

  const swingLookback = 3;
  const currentIdx = quotes.length - 1;
  const currentPrice = quotes[currentIdx].close;
  const startIdx = Math.max(swingLookback, quotes.length - 1100);

  // Find swing lows and swing highs
  const swingLows: { price: number; idx: number; date: string }[] = [];
  const swingHighs: { price: number; idx: number; date: string }[] = [];

  for (let i = startIdx; i < quotes.length - swingLookback; i++) {
    let isLow = true, isHigh = true;
    for (let j = i - swingLookback; j <= i + swingLookback; j++) {
      if (j === i) continue;
      if (j >= 0 && j < quotes.length) {
        if (quotes[j].low <= quotes[i].low) isLow = false;
        if (quotes[j].high >= quotes[i].high) isHigh = false;
      }
    }
    if (isLow) swingLows.push({ price: quotes[i].low, idx: i, date: String(quotes[i].date || '') });
    if (isHigh) swingHighs.push({ price: quotes[i].high, idx: i, date: String(quotes[i].date || '') });
  }

  if (swingLows.length < 3 || swingHighs.length < 2) return { isBuyZone: false };

  // Scan for RHS pattern by looking at last N low pivots
  const searchRange = Math.min(swingLows.length, 30);
  
  for (let j = swingLows.length - 1; j >= 2; j--) {
    const s2 = swingLows[j];       // Right shoulder (most recent)
    const head = swingLows[j - 1]; // Head (in the middle, lowest)
    const s1 = swingLows[j - 2];   // Left shoulder (oldest)

    // Pattern width: at least 90 trading days from S1 to S2
    const patternWidth = s2.idx - s1.idx;
    if (patternWidth < 90) continue;

    // Head must be lower than both shoulders
    if (head.price >= s1.price || head.price >= s2.price) continue;

    // Shoulders should be at similar level (within 7% of each other)
    const shoulderDiffPct = Math.abs(s1.price - s2.price) / Math.max(s1.price, s2.price);
    if (shoulderDiffPct > 0.07) continue;

    // Find the neckline: swing highs between S1 and S2
    const highsInPattern = swingHighs.filter(h => h.idx >= s1.idx && h.idx <= s2.idx);
    
    // Find two key highs: one before head (between S1 and head), one after (between head and S2)
    const highsBeforeHead = highsInPattern.filter(h => h.idx > s1.idx && h.idx < head.idx);
    const highsAfterHead = highsInPattern.filter(h => h.idx > head.idx && h.idx < s2.idx);
    
    if (highsBeforeHead.length === 0 || highsAfterHead.length === 0) continue;

    const p1 = highsBeforeHead[highsBeforeHead.length - 1]; // Last high before head
    const p2 = highsAfterHead[0]; // First high after head

    // Neckline: the higher of the two pivot highs that form the neckline
    const neckline = (p1.price + p2.price) / 2; // Average of two highs as neckline
    
    // Head depth from neckline (should be at least 25%)
    const headDepthPct = (neckline - head.price) / neckline;
    if (headDepthPct < 0.25) continue;

    // Check for breakout: current price should be near or above neckline
    const breakoutThreshold = currentPrice >= neckline * 0.98;
    if (!breakoutThreshold) continue;

    // Calculate target: neckline + (neckline - head.price)
    const target = neckline + (neckline - head.price);
    const upsidePct = ((target / currentPrice) - 1) * 100;

    return {
      isBuyZone: true,
      entryPrice: Math.round(currentPrice),
      target: Math.round(target),
      neckline: Math.round(neckline),
      stopLoss: Math.round(s2.price * 0.96), // Below right shoulder
      headDepth: Math.round(headDepthPct * 100 * 10) / 10,
      patternStart: s1.date,
      patternEnd: s2.date,
      upside: Math.round(upsidePct * 10) / 10
    };
  }

  return { isBuyZone: false };
}

export function calculateABCDLevels(anchorPrice: number, marketCap: number = 0) {
  const gap = 0.10;
  return { 
    a: { price: Math.round(anchorPrice), label: "A" }, 
    b: { price: Math.round(anchorPrice * (1 - gap)), label: "B" }, 
    c: { price: Math.round(anchorPrice * Math.pow(1 - gap, 2)), label: "C" }, 
    d: { price: Math.round(anchorPrice * Math.pow(1 - gap, 3)), label: "D" }, 
    gap: Math.round(gap * 100) 
  };
}

/**
 * STRATEGY 11: Short Term Investing (ABCD)
 * Swing high A = signal anchor. Buy ladder B → C → D (10% gap per leg).
 * Targets = D → C → B → A (each target is the previous level up, ~10% gain per leg).
 */
export function calculateShortTermABCD(quotes: Quote[]) {
  const MIN_BARS = 150;
  const LOOKBACK = 60;   // bars to detect swing high A
  const TOLERANCE = 0.022; // buy-zone tolerance (existing convention)
  if (!quotes || quotes.length < MIN_BARS) return { isBuyZone: false };

  const currentPrice = quotes[quotes.length - 1].close;
  let state = 'SEEKING_A', a_entry = 0, a_date = '', b_entry = 0, b_date = '', c_entry = 0, c_date = '', d_entry = 0, d_date = '';

  for (let i = LOOKBACK; i < quotes.length; i++) {
    // Full recovery above anchor A invalidates the current ABCD ladder.
    if (state !== 'SEEKING_A' && quotes[i].high >= a_entry) {
      state = 'SEEKING_A';
      b_date = ''; c_date = ''; d_date = '';
    }

    if (state === 'SEEKING_A') {
      // Detect swing high A: max high in trailing LOOKBACK bars, followed by a confirmed decline.
      const window = quotes.slice(i - LOOKBACK, i);
      let swingHigh = -Infinity, swingIdx = -1;
      for (let j = 0; j < window.length; j++) {
        if (window[j].high > swingHigh) { swingHigh = window[j].high; swingIdx = j; }
      }
      const barsSinceHigh = window.length - swingIdx;
      if (swingHigh > 0 && barsSinceHigh >= 3 && quotes[i].close < swingHigh * 0.99) {
        const dV = window[swingIdx].date;
        a_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0];
        a_entry = Math.round(swingHigh);
        b_entry = Math.round(a_entry * 0.90);
        c_entry = Math.round(b_entry * 0.90);
        d_entry = Math.round(c_entry * 0.90);
        state = 'A_ACTIVE';
        b_date = ''; c_date = ''; d_date = '';
      }
    } else if (state === 'A_ACTIVE' && quotes[i].low <= b_entry * 1.01) {
      state = 'B_ACTIVE';
      const dV = quotes[i].date;
      b_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0];
    } else if (state === 'B_ACTIVE' && quotes[i].low <= c_entry * 1.01) {
      state = 'C_ACTIVE';
      const dV = quotes[i].date;
      c_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0];
    } else if (state === 'C_ACTIVE' && quotes[i].low <= d_entry * 1.01) {
      state = 'D_ACTIVE';
      const dV = quotes[i].date;
      d_date = (typeof dV === 'string' ? dV : (dV as Date).toISOString()).split('T')[0];
    }
  }

  // A = signal only (no buy at A). Buy ladder: B → C → D. Targets: levels above (D→C→B→A).
  let activeE = 0, activeTr = 'NONE', activeD = '';
  if (state === 'B_ACTIVE') { activeE = b_entry; activeTr = 'B'; activeD = b_date; }
  else if (state === 'C_ACTIVE') { activeE = c_entry; activeTr = 'C'; activeD = c_date; }
  else if (state === 'D_ACTIVE') { activeE = d_entry; activeTr = 'D'; activeD = d_date; }

  const isBuyZone = activeTr !== 'NONE' && Math.abs(currentPrice - activeE) / activeE <= TOLERANCE;

  // Targets ladder from active tranche upward — exact % gain from entry price.
  const targets: any[] = [];
  if (activeTr === 'D') {
    targets.push(
      { level: 'C', price: c_entry, gainPct: Math.round(((c_entry - d_entry) / d_entry) * 100) },
      { level: 'B', price: b_entry, gainPct: Math.round(((b_entry - d_entry) / d_entry) * 100) },
      { level: 'A', price: a_entry, gainPct: Math.round(((a_entry - d_entry) / d_entry) * 100) }
    );
  } else if (activeTr === 'C') {
    targets.push(
      { level: 'B', price: b_entry, gainPct: Math.round(((b_entry - c_entry) / c_entry) * 100) },
      { level: 'A', price: a_entry, gainPct: Math.round(((a_entry - c_entry) / c_entry) * 100) }
    );
  } else if (activeTr === 'B') {
    targets.push({ level: 'A', price: a_entry, gainPct: Math.round(((a_entry - b_entry) / b_entry) * 100) });
  }

  return {
    isBuyZone,
    entryPrice: activeE,
    target: targets[0]?.price || 0,
    targets,
    currentPrice: Math.round(currentPrice),
    triggerDate: a_date,
    tranche: activeTr,
    abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date }, gap: 10 },
    timeframe: 'SHORT_TERM',
    isLocked: true
  };
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], length: number): number[] {
  const rsi: number[] = new Array(prices.length).fill(50);
  if (prices.length < length + 1) return rsi;

  let gain = 0, loss = 0;
  for (let i = 1; i <= length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gain += diff; else loss -= diff;
  }

  let avgGain = gain / length;
  let avgLoss = loss / length;
  rsi[length] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = length + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    avgGain = (avgGain * (length - 1) + (diff > 0 ? diff : 0)) / length;
    avgLoss = (avgLoss * (length - 1) + (diff < 0 ? -diff : 0)) / length;
    rsi[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  }

  return rsi;
}

/**
 * Calculates Momentum (price - price[n] periods ago)
 */
export function calculateMomentum(prices: number[], length: number): number[] {
  const mom: number[] = new Array(prices.length).fill(0);
  for (let i = length; i < prices.length; i++) {
    mom[i] = prices[i] - prices[i - length];
  }
  return mom;
}

/**
 * Institutional Mandates — enforces D/E limits, Smart Money threshold and
 * sector concentration caps before a stock may qualify as a signal.
 */
export function checkInstitutionalMandates(screenerData: any, symbol: string = '') {
  if (!screenerData) return { passed: true };

  const de = screenerData.netDebtToEquity || 0;
  const sm = screenerData.smartMoneyTotal || 0;
  const pe = screenerData.peRatio || 0;
  const peMedians = screenerData.peMedians || {};
  const pe3Y = peMedians.pe3Y || 0;
  const pe5Y = peMedians.pe5Y || 0;
  const mcapCr = (screenerData.marketCap || 0) / 10000000;
  const sector = (screenerData.industry || '').trim();

  const isFinance = ['Banking', 'Finance', 'Banking ETF', 'NBFC', 'Financial Services', 'Asset Management', 'Exchange/Depository', 'Financial Infrastructure'].includes(sector)
    || sector.toLowerCase().includes('finance') || sector.toLowerCase().includes('nbfc');
  const isCapitalIntensive = ['EPC/Infra', 'Automobile', 'Infrastructure', 'Power', 'Steel', 'Telecom', 'Cement', 'Metal', 'Engineering', 'Industrial/Power', 'Utilities',
    'Oil & Gas', 'Energy/Conglomerate', 'Oil, Gas & Consumable Fuels', 'Petrochemicals',
    'Pharma', 'Pharmaceuticals', 'Chemicals', 'Mining', 'Logistics',
    'Textiles', 'Media', 'Entertainment', 'Electricals', 'Electronics Mfg',
    'Healthcare', 'Hospitality', 'Food Processing'
  ].includes(sector)
    || ['LT', 'BHARTIARTL', 'M&M', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'POWERGRID', 'TMCV',
        'RELIANCE', 'ONGC', 'BPCL', 'IOC', 'GAIL', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB',
        'APOLLOHOSP', 'LALPATHLAB', 'HINDALCO', 'HINDZINC', 'NATIONALUM', 'NMDC',
        'JSWENERGY', 'TORNTPOWER', 'ADANIGREEN', 'SUZLON', 'SIEMENS', 'ABB'
    ].includes(symbol)
    || sector.toLowerCase().includes('infra') || sector.toLowerCase().includes('steel') || sector.toLowerCase().includes('telecom') || sector.toLowerCase().includes('auto')
    || sector.toLowerCase().includes('oil') || sector.toLowerCase().includes('gas') || sector.toLowerCase().includes('energy')
    || sector.toLowerCase().includes('pharma') || sector.toLowerCase().includes('chemical')
    || sector.toLowerCase().includes('mining') || sector.toLowerCase().includes('logistic')
    || sector.toLowerCase().includes('textile') || sector.toLowerCase().includes('media')
    || sector.toLowerCase().includes('electrical') || sector.toLowerCase().includes('healthcare');

  const debtLimit = isFinance ? 7.0 : (isCapitalIntensive ? 1.5 : 0.5);

  const reasons = [];
  if (de > debtLimit) reasons.push(`D/E High (${de.toFixed(2)})`);
  if (sm < 30) reasons.push(`SM Critical (${sm.toFixed(1)}%)`);
  if (pe > 60) reasons.push(`P/E High (${pe.toFixed(1)})`);
  // PE vs median: current PE must be ≤ both 3Y and 5Y median
  if (pe3Y > 0 && pe > pe3Y) reasons.push(`P/E > 3Y Median (${pe.toFixed(1)} vs ${pe3Y.toFixed(1)})`);
  if (pe5Y > 0 && pe > pe5Y) reasons.push(`P/E > 5Y Median (${pe.toFixed(1)} vs ${pe5Y.toFixed(1)})`);

  return {
    passed: reasons.length === 0,
    reasons
  };
}

