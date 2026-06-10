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

  return { isBuyZone: (activeTr !== 'NONE') && currentPrice <= activeE * 1.02, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: a_date, tranche: activeTr, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date } }, isLocked: true };
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

  return { isBuyZone: (activeTr !== 'NONE') && currentPrice <= activeE * 1.02, tranche: activeTr, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: a_date, isLocked: true, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date } } };
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
    isBuyZone: (activeTr !== 'NONE') && currentPrice <= activeE * 1.02, 
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
  if (state === 'A_ACTIVE') { activeE = a_entry; activeT = a_target; activeTr = 'A'; }
  else if (state === 'B_ACTIVE') { activeE = b_entry; activeT = a_entry; activeTr = 'B'; }
  else if (state === 'C_ACTIVE') { activeE = c_entry; activeT = b_entry; activeTr = 'C'; }
  else if (state === 'D_ACTIVE') { activeE = d_entry; activeT = c_entry; activeTr = 'D'; }
  return { isBuyZone: (activeTr !== 'NONE') && currentPrice <= activeE * 1.02, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: a_date, tranche: activeTr, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date }, gap: 10 }, isLocked: true };
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
  return { isBuyZone: (activeTr !== 'NONE') && currentPrice <= activeE * 1.02, entryPrice: activeE, target: activeT, currentPrice: Math.round(currentPrice), triggerDate: activeD, tranche: activeTr, abcd: { a: { price: a_entry, date: a_date }, b: { price: b_entry, date: b_date }, c: { price: c_entry, date: c_date }, d: { price: d_entry, date: d_date }, gap: 10 }, isLocked: true };
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

  const level_tolerance_pct = 2.2; // Institutional Tolerance
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
             
             // Strict +/- 2.2% Range Check for each Tranche
             const tolerance = 0.022;
             if (Math.abs(currentPrice - abcd.a.price) / abcd.a.price <= tolerance) activeTr = 'A';
             else if (Math.abs(currentPrice - abcd.b.price) / abcd.b.price <= tolerance) activeTr = 'B';
             else if (Math.abs(currentPrice - abcd.c.price) / abcd.c.price <= tolerance) activeTr = 'C';
             else if (Math.abs(currentPrice - abcd.d.price) / abcd.d.price <= tolerance) activeTr = 'D';

             // STRICT RULE: 30% Gap Mandatory
             const isGapValid = gap >= 0.30;
             const isQualified = activeTr !== 'NONE';
             const isObservation = !isQualified && currentPrice <= supportCeiling * 1.15;

             if (isGapValid && (isQualified || isObservation)) {
               const triggerDateObj = quotes[entryIndex].date;
               const triggerDate = typeof triggerDateObj === 'string' ? triggerDateObj : (triggerDateObj as any).toISOString();
               
               return { 
                 isBuyZone: true, 
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
  return { isBuyZone: false, status: "REJECT" };
}

/**
 * STRATEGY 7: Dynamic Reversal (Parallel Symmetric RHS)
 * Rules: 30% ATH Drawdown + 30% Pattern Depth + 30% Target
 */
export function calculateRHS(quotes: Quote[]) {
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
  for (let hIdx = lows.length - 2; hIdx >= 1; hIdx--) {
    const head = lows[hIdx], s1A = lows.filter(l => l.idx < head.idx && l.idx > head.idx - 150), s2A = lows.filter(l => l.idx > head.idx && l.idx < head.idx + 150);
    if (s1A.length > 0 && s2A.length > 0) {
      const s1 = s1A[s1A.length - 1], s2 = s2A[0];
      const peaks = highs.filter(h => h.idx > head.idx && h.idx < s2.idx);
      if (peaks.length > 0) {
        const neckline = peaks[0];
        
        // Rule 2: 30% Pattern Depth (Neckline to Head)
        const depth = (neckline.price - head.price) / neckline.price;
        if (depth < 0.30) continue;

        const corr = ((neckline.price - s2.price) / neckline.price) * 100;
        if (corr >= 8 && corr <= 18) {
          const target = neckline.price + (neckline.price - head.price);
          
          // Rule 3: 30% Target Upside Gap
          if ((target / s2.price) - 1 >= 0.30 && Math.abs(currentPrice - s2.price) / s2.price <= 0.07) {
            return { isBuyZone: true, entryPrice: Math.round(s2.price), target: Math.round(target), currentPrice: Math.round(currentPrice), triggerDate: s2.date, correction: corr.toFixed(1), isLocked: true };
          }
        }
      }
    }
  }
  return { isBuyZone: false };
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
              if (corr >= 7 && corr <= 20 && (target / currentPrice) - 1 >= 0.30 && Math.abs(currentPrice - handleLow.price) / handleLow.price <= 0.10) {
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
    if (quotes[i].close > quotes[i-1].close && quotes[i].close < ema200[i]) {
      let j = i + 1; while (j <= latestIdx && quotes[j].close > quotes[j].open) j++;
      if ((quotes[j-1].close - quotes[i].low) / quotes[i].low >= 0.20) rallies.push({ origin: quotes[i].low, peak: quotes[j-1].close, peakIdx: j - 1, date: quotes[i].date });
    }
  }
  if (rallies.length === 0) return { isBuyZone: false };
  const best = rallies.sort((a, b) => b.peakIdx - a.peakIdx)[0];
  return { isBuyZone: latestIdx - best.peakIdx <= 252 && Math.abs(currentPrice - best.origin) / best.origin <= 0.05 && currentPrice < ema200[latestIdx], entryPrice: Math.round(best.origin), target: Math.round(best.peak), currentPrice: Math.round(currentPrice), triggerDate: (typeof best.date === 'string' ? best.date : (best.date as Date).toISOString()).split('T')[0], isLocked: true };
}

/**
 * UTILITY: ABCD Level Calculation (Institutional 10% Model)
 */
export function calculateABCDLevels(anchorPrice: number, marketCap: number = 0) {
  const gap = 0.10; // Forced 10% institutional step
  return { 
    a: { price: anchorPrice, label: "A" }, 
    b: { price: Math.round(anchorPrice * (1 - gap)), label: "B" }, 
    c: { price: Math.round(anchorPrice * Math.pow(1 - gap, 2)), label: "C" }, 
    d: { price: Math.round(anchorPrice * Math.pow(1 - gap, 3)), label: "D" }, 
    gap: Math.round(gap * 100) 
  };
}

/**
 * GLOBAL MANDATE: Hard Reject Audit
 * Enforces D/E <= 1.0 and Smart Money >= 70%
 */
export function checkInstitutionalMandates(screenerData: any) {
  if (!screenerData) return { passed: true }; // Defensive fallback if no data
  
  const de = screenerData.netDebtToEquity || 0;
  const sm = screenerData.smartMoneyTotal || 0;
  const mcapCr = (screenerData.marketCap || 0) / 10000000;

  const reasons = [];
  if (de > 1.0) reasons.push(`D/E High (${de.toFixed(2)})`);
  if (sm < 70 && mcapCr > 1000) reasons.push(`SM Low (${sm.toFixed(1)}%)`); // 70% SM floor for Large/Mid caps
  
  return {
    passed: reasons.length === 0,
    reasons
  };
}

