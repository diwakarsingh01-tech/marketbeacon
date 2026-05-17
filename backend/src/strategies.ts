
/**
 * MarketBeacon Strategy Engine (Batch 9)
 * High-Accuracy Implementation of Long Envelope Strategy
 */

export interface EnvelopeResult {
  sma: number;
  upperBand: number;
  lowerBand: number;
  isBuyZone: boolean;
  distanceFromLower: number;
  triggerDate?: string;
  entryLowerBand?: number;
  currentPrice: number;
  abcd?: {
    a: number;
    b: number;
    c: number;
    d: number;
    gap: number;
  };
}

/**
 * Calculates ABCD Laddered Levels based on Market Cap and Basket Type
 * Large: 10%, Mid: 15%, Small/HighBeta: 15-20%
 */
export function calculateABCDLevels(anchorPrice: number, marketCap: number, basket: string = 'BLUECHIP') {
  let gapPct = 0.10; // Default Large Cap 10%
  
  const mCapCr = marketCap / 10000000; // Convert to Crores
  
  if (basket === 'HIGH_BETA' || basket === 'HIGH_BITA' || basket === 'PROFIT') {
    gapPct = 0.15;
  } else if (mCapCr > 100000) {
    gapPct = 0.10; // Large Cap
  } else if (mCapCr > 33000) {
    gapPct = 0.15; // Mid Cap
  } else {
    gapPct = 0.15; // Small Cap
  }

  return {
    a: anchorPrice,
    b: anchorPrice * (1 - gapPct),
    c: anchorPrice * (1 - 2 * gapPct),
    d: anchorPrice * (1 - 3 * gapPct),
    gap: gapPct * 100
  };
}

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
 * Calculates 200-day SMA and 14% Envelopes with high precision.
 * Uses adjClose to handle splits/dividends automatically.
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200): EnvelopeResult | null {
  if (!quotes || quotes.length < length) return null;

  // Use adjClose/adjclose for accuracy, fallback to close
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const latestQuote = quotes[quotes.length - 1];
  const currentPrice = latestQuote.adjclose || latestQuote.adjClose || latestQuote.close;

  // SMA calculation for the last 'length' days
  const periodPrices = prices.slice(-length);
  const sum = periodPrices.reduce((a, b) => a + b, 0);
  const sma = sum / length;

  const lowerBand = sma * (1 - percentage / 100);
  const upperBand = sma * (1 + percentage / 100);

  // Buy Zone: Current price is at or below lower band
  // Accuracy: Also check if 'low' of the day touched it
  const isBuyZone = latestQuote.low <= lowerBand || currentPrice <= lowerBand;
  
  const distanceFromLower = ((currentPrice - lowerBand) / lowerBand) * 100;

  // Find the first date it entered the buy zone in the current streak
  let triggerDate: string | undefined = undefined;
  if (isBuyZone) {
    // Default to latest date in case loop fails to find a streak start
    const latestDate = typeof latestQuote.date === 'string' 
      ? latestQuote.date.split('T')[0] 
      : latestQuote.date.toISOString().split('T')[0];
    
    triggerDate = latestDate;

    // We go backwards to find when the continuous "touch" started
    for (let i = quotes.length - 1; i >= length - 1; i--) {
      const q = quotes[i];
      if (!q) continue;

      // SMA for day 'i' uses prices from i-length+1 to i
      const startIdx = Math.max(0, i - length + 1);
      const window = prices.slice(startIdx, i + 1);
      
      if (window.length < length) break;

      const currentSma = window.reduce((a, b) => a + b, 0) / length;
      const currentLower = currentSma * (1 - percentage / 100);
      const currentPriceInLoop = q.adjclose || q.adjClose || q.close;
      
      if (q.low <= currentLower || currentPriceInLoop <= currentLower) {
        // Condition met, update triggerDate to this earlier date
        const d = typeof q.date === 'string' ? q.date.split('T')[0] : q.date.toISOString().split('T')[0];
        if (d) triggerDate = d;
      } else {
        // Continuous streak broken, stop looking further back
        break; 
      }
    }
  }

  return {
    sma,
    upperBand,
    lowerBand,
    isBuyZone,
    distanceFromLower,
    triggerDate,
    currentPrice
  };
}
/**
 * Calculates Exponential Moving Average (EMA)
 */
/**
 * 20% Green Rally Retest Strategy
 * Logic: 
 * 1. Find consecutive green candles where gain >= 20%
 * 2. Entire rally must be below 200 EMA
 * 3. Entry triggers when price returns to 'Rally Start Low'
 * 4. Validity: Entry must happen within 1 year (251 bars) of rally completion.
 */
export function calculateTwentyRallyRetest(quotes: Quote[], symbol?: string) {
  if (!quotes || quotes.length < 250) return null;

  const closePrices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const ema200 = calculateEMA(closePrices, 200);
  
  // 1. Identify all valid 20% rallies in history
  const rallies = [];
  let currentRally: any = null;

  for (let i = 1; i < quotes.length; i++) {
    const q = quotes[i];
    const isGreen = q.close > q.open; 
    const currentEMA = ema200[i];

    if (isGreen) {
      if (!currentRally) {
        currentRally = {
          startIdx: i,
          startLow: q.low,
          high: q.high,
          isBelowEMA: currentEMA ? q.low < currentEMA : false,
          startDate: q.date
        };
      } else {
        currentRally.high = Math.max(currentRally.high, q.high);
      }
    } else {
      if (currentRally) {
        const gain = ((currentRally.high - currentRally.startLow) / currentRally.startLow) * 100;
        if (gain >= 20 && currentRally.isBelowEMA) {
          rallies.push({ ...currentRally, endIdx: i - 1, gain });
        }
      }
      currentRally = null;
    }
  }

  if (rallies.length === 0) return null;
  
  // 2. Find the FIRST retest event for each rally and pick the most recent valid one
  for (let r = rallies.length - 1; r >= 0; r--) {
    const rally = rallies[r];
    const base = rally.startLow;
    
    // Search history AFTER the rally completion for a retest
    for (let i = rally.endIdx + 1; i < quotes.length; i++) {
      const q = quotes[i];
      const low = q.low;
      const high = q.high;
      
      const isRetest = low <= base * 1.015 && high >= base * 0.985;
      
      if (isRetest) {
        const retestDate = q.date;
        const currentPrice = closePrices[quotes.length - 1];

        const barsRallyToRetest = i - rally.endIdx;
        if (barsRallyToRetest > 251) continue; 

        const isCurrentlyTradable = currentPrice <= base * 1.15 && currentPrice >= base * 0.80;

        const formattedRetestDate = typeof retestDate === 'string' 
          ? retestDate.split('T')[0] 
          : (retestDate as Date).toISOString().split('T')[0];

        return {
          isBuyZone: isCurrentlyTradable,
          entryPrice: base,
          target: rally.high,
          rallyGain: rally.gain,
          triggerDate: formattedRetestDate,
          verdict: isCurrentlyTradable ? 'QUALIFIED' : 'WATCHLIST',
          rallyStartDate: typeof rally.startDate === 'string' ? rally.startDate.split('T')[0] : (rally.startDate as Date).toISOString().split('T')[0]
        };
      }
    }
  }

  // 3. If no retest has happened yet, show in Watchlist (Observation)
  const latestRally = rallies[rallies.length - 1];
  return {
    isBuyZone: false,
    entryPrice: latestRally.startLow,
    target: latestRally.high,
    rallyGain: latestRally.gain,
    triggerDate: '-',
    verdict: 'WATCHLIST',
    rallyStartDate: latestRally.startDate
  };
}

export function calculateEMA(prices: number[], length: number): number[] {
  const ema: number[] = [];
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
 * Short Envelope Strategy Implementation (Simplified)
 * Entry: Price touches 200 EMA from above
 * Target: Entry Price + 14%
 */
export function processShortEnvelope(quotes: Quote[], marketCap: number, percentage: number = 14, length: number = 200) {
  if (!quotes || quotes.length < length) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const emaValues = calculateEMA(prices, length);

  const latestIdx = quotes.length - 1;
  const currentEMA = emaValues[latestIdx];
  const latestQuote = quotes[latestIdx];

  const prevPrice = prices[latestIdx - 1];
  const prevEMA = emaValues[latestIdx - 1];

  // Trigger: Price is at or below the 200 EMA
  const isBuyZone = latestQuote.low <= currentEMA;

  let triggerDate: string | undefined = undefined;
  if (isBuyZone) {
    const latestDate = typeof latestQuote.date === 'string' 
      ? latestQuote.date.split('T')[0] 
      : latestQuote.date.toISOString().split('T')[0];
    triggerDate = latestDate;

    // Search back for the start of the EMA touch streak
    for (let i = latestIdx; i >= length; i--) {
      const q = quotes[i];
      const pEMA = emaValues[i-1];
      const pPrice = quotes[i-1].adjclose || quotes[i-1].adjClose || quotes[i-1].close;
      const cEMA = emaValues[i];

      if (q.low <= cEMA && pPrice > pEMA) {
        const d = typeof q.date === 'string' ? q.date.split('T')[0] : q.date.toISOString().split('T')[0];
        triggerDate = d;
      } else if (q.low <= cEMA) {
        // Continuous touch, keep going back
        const d = typeof q.date === 'string' ? q.date.split('T')[0] : q.date.toISOString().split('T')[0];
        triggerDate = d;
      } else {
        break;
      }
    }
  }

  const target = currentEMA * (1 + percentage / 100);

  return {
    ema: currentEMA,
    target,
    isBuyZone,
    triggerDate,
    currentPrice: prices[latestIdx],
    abcd: calculateABCDLevels(currentEMA, marketCap)
  };
}

/**
 * Trade Management Logic
 */
export function checkExitSignal(currentQuote: Quote, entryPrice: number, entryUpperBand: number): boolean {
  const currentPrice = currentQuote.adjclose || currentQuote.adjClose || currentQuote.close;
  const target = Math.max(entryUpperBand, entryPrice * 1.30);
  
  // High accuracy check: Did the high of the day reach the target?
  return currentQuote.high >= target;
}

/**
 * Bollinger Band Strategy (Sibling of Long Envelope)
 * Length: 200, StdDev: 2.5
 * Rule: Buy at lower band, Sell at upper band.
 * Logic: We search back for the most recent lower-band touch. 
 * If found, we check if the price hit the upper band after that touch.
 */
export function calculateBollingerBand(quotes: Quote[], length: number = 200, stdDevMultiplier: number = 2.5) {
  if (!quotes || quotes.length < length) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const latestQuote = quotes[quotes.length - 1];
  const currentPrice = latestQuote.adjclose || latestQuote.adjClose || latestQuote.close;

  // 1. Calculate Current Levels
  const periodPrices = prices.slice(-length);
  const sma = periodPrices.reduce((a, b) => a + b, 0) / length;
  const squareDiffs = periodPrices.map(p => Math.pow(p - sma, 2));
  const stdDev = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / length);
  const upperBand = sma + stdDevMultiplier * stdDev;
  const lowerBand = sma - stdDevMultiplier * stdDev;

  let isBuyZone = false;
  let triggerDate: string | undefined = undefined;
  let entryLowerBand: number | undefined = undefined;

  // 2. Search back for the most recent trigger
  for (let i = quotes.length - 1; i >= length - 1; i--) {
    const q = quotes[i];
    const startIdx = Math.max(0, i - length + 1);
    const window = prices.slice(startIdx, i + 1);
    const currentSma = window.reduce((a, b) => a + b, 0) / length;
    const windowSqDiffs = window.map(p => Math.pow(p - currentSma, 2));
    const currentStdDev = Math.sqrt(windowSqDiffs.reduce((a, b) => a + b, 0) / length);
    const currentLower = currentSma - stdDevMultiplier * currentStdDev;
    const currentUpper = currentSma + stdDevMultiplier * currentStdDev;

    // Check if triggered at index 'i'
    if (q.low <= currentLower || (q.adjclose || q.adjClose || q.close) <= currentLower) {
      // Trigger found! Now check if target was hit between i and Today
      let targetHit = false;
      for (let j = i + 1; j < quotes.length; j++) {
        // Recalculate Upper Band for day 'j' to see if it was hit
        const sJ = Math.max(0, j - length + 1);
        const wJ = prices.slice(sJ, j + 1);
        const smaJ = wJ.reduce((a, b) => a + b, 0) / length;
        const sqDJ = wJ.map(p => Math.pow(p - smaJ, 2));
        const sdJ = Math.sqrt(sqDJ.reduce((a, b) => a + b, 0) / length);
        const upperJ = smaJ + stdDevMultiplier * sdJ;

        if (quotes[j].high >= upperJ) {
          targetHit = true;
          break;
        }
      }

      if (!targetHit) {
        isBuyZone = true;
        triggerDate = typeof q.date === 'string' ? q.date.split('T')[0] : q.date.toISOString().split('T')[0];
        entryLowerBand = currentLower;
      }
      
      // Found the most recent streak/touch, stop search
      break;
    }
  }

  const distanceFromLower = ((currentPrice - lowerBand) / lowerBand) * 100;

  return {
    sma,
    upperBand,
    lowerBand,
    isBuyZone,
    distanceFromLower,
    triggerDate,
    entryLowerBand,
    currentPrice,
    abcd: calculateABCDLevels(lowerBand, 50000000000)
  };
}

/**
 * SMA Stacking Strategy (20/50/200)
 * Buy: Price < SMA20 < SMA50 < SMA200 (Bearish Stacking)
 * Sell: Price > SMA20 > SMA50 > SMA200 (Bullish Stacking)
 */
export function calculateEMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const ema20Arr = calculateEMA(prices, 20);
  const ema50Arr = calculateEMA(prices, 50);
  const ema200Arr = calculateEMA(prices, 200);

  const latestIdx = quotes.length - 1;
  const ema20 = ema20Arr[latestIdx];
  const ema50 = ema50Arr[latestIdx];
  const ema200 = ema200Arr[latestIdx];
  const currentPrice = prices[latestIdx];

  let isBuyZone = false;
  let triggerDate: string | undefined = undefined;
  let entryPrice: number | undefined = undefined;

  // Search back for NEAREST BEARISH CROSSOVER (Price < 20 < 50 < 200)
  for (let i = latestIdx; i >= 201; i--) {
    const e20 = ema20Arr[i];
    const e50 = ema50Arr[i];
    const e200 = ema200Arr[i];
    const cI = prices[i];

    // Today's Condition
    const isTodaySatisfied = cI < e20 && e20 < e50 && e50 < e200;

    if (isTodaySatisfied) {
      // Check if it's the START of the crossover (Yesterday was NOT satisfied)
      const prev20 = ema20Arr[i-1];
      const prev50 = ema50Arr[i-1];
      const prev200 = ema200Arr[i-1];
      const cPrev = prices[i-1];
      const isPrevSatisfied = cPrev < prev20 && prev20 < prev50 && prev50 < prev200;

      if (!isPrevSatisfied) {
        // This is the NEAREST CROSSOVER
        // Check if EXIT (Bullish Alignment) has occurred between this crossover and today
        let targetHit = false;
        for (let j = i + 1; j <= latestIdx; j++) {
          if (prices[j] > ema20Arr[j] && ema20Arr[j] > ema50Arr[j] && ema50Arr[j] > ema200Arr[j]) {
            targetHit = true;
            break;
          }
        }

        if (!targetHit) {
          isBuyZone = true; 
          const crossoverQ = quotes[i];
          triggerDate = typeof crossoverQ.date === 'string' ? crossoverQ.date.split('T')[0] : crossoverQ.date.toISOString().split('T')[0];
          entryPrice = cI;
        }
        break; 
      }
    }
  }

  return {
    ema20, ema50, ema200,
    isBuyZone,
    triggerDate,
    entryPrice,
    currentPrice,
    target: ema200
  };
}

/**
 * 52-Week High/Low Strategy
 * Buy at 52-week low (+ tolerance)
 * Sell at 52-week high (- tolerance)
 */
export function calculate52WeekStrategy(quotes: Quote[], tolerance: number = 0.02) {
  const window = 252; // Trading days in a year
  if (!quotes || quotes.length < window) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const lows = quotes.map(q => q.low);
  const highs = quotes.map(q => q.high);
  const latestIdx = quotes.length - 1;
  const currentPrice = prices[latestIdx];

  const rollingLow = Math.min(...lows.slice(-window));
  const rollingHigh = Math.max(...highs.slice(-window));

  let isBuyZone = false;
  let triggerDate: string | undefined = undefined;
  let entryPrice: number | undefined = undefined;

  for (let i = latestIdx; i >= window; i--) {
    const rLow = Math.min(...lows.slice(i - window + 1, i + 1));
    const rHigh = Math.max(...highs.slice(i - window + 1, i + 1));
    const cI = prices[i];

    if (cI <= rLow * (1 + tolerance)) {
      // Triggered at i! Check if 52w high was hit since then
      let targetHit = false;
      for (let j = i + 1; j < quotes.length; j++) {
        const rHighJ = Math.max(...highs.slice(j - window + 1, j + 1));
        if (prices[j] >= rHighJ * (1 - tolerance)) {
          targetHit = true;
          break;
        }
      }

      if (!targetHit) {
        isBuyZone = true;
        triggerDate = typeof quotes[i].date === 'string' ? (quotes[i].date as string).split('T')[0] : (quotes[i].date as Date).toISOString().split('T')[0];
        entryPrice = cI;
      }
      break;
    }
  }

  return {
  rollingLow,
  rollingHigh,
  isBuyZone,
  triggerDate,
  entryPrice,
  currentPrice,
  target: rollingHigh,
  abcd: calculateABCDLevels(rollingLow, 50000000000)
  };
  }

  /**
  * --- Advanced Pattern Engineering (Institutional Grade) ---
  */

  export interface Pivot {
  index: number;
  price: number;
  type: 'high' | 'low';
  date: string;
  }

  /**
  * Finds local pivots (highs and lows) using a fixed window.
  * High Accuracy: Requires being higher/lower than ALL neighbors in the window.
  */
  export function findPivots(quotes: Quote[], window: number = 10): Pivot[] {
  const pivots: Pivot[] = [];
  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);

  for (let i = window; i < quotes.length - window; i++) {
  const current = prices[i];
  const leftSide = prices.slice(i - window, i);
  const rightSide = prices.slice(i + 1, i + window + 1);

  // High Pivot
  if (current > Math.max(...leftSide) && current > Math.max(...rightSide)) {
    pivots.push({
      index: i,
      price: current,
      type: 'high',
      date: typeof quotes[i].date === 'string' ? (quotes[i].date as string).split('T')[0] : (quotes[i].date as Date).toISOString().split('T')[0]
    });
  }

  // Low Pivot
  if (current < Math.min(...leftSide) && current < Math.min(...rightSide)) {
    pivots.push({
      index: i,
      price: current,
      type: 'low',
      date: typeof quotes[i].date === 'string' ? (quotes[i].date as string).split('T')[0] : (quotes[i].date as Date).toISOString().split('T')[0]
    });
  }
  }
  return pivots;
  }

  /**
  * RHS + ABCD Strategy
  * Strict Rule: Shoulders within 5% height. Head must be lowest. Neckline relatively flat.
  */
  export function calculateRHS(quotes: Quote[]) {
  if (!quotes || quotes.length < 100) return null;

  const pivots = findPivots(quotes, 5);
  const lowPivots = pivots.filter(p => p.type === 'low');
  const highPivots = pivots.filter(p => p.type === 'high');

  if (lowPivots.length < 3) return null;

  // We need 3 consecutive lows: L-Shoulder, Head, R-Shoulder
  for (let i = lowPivots.length - 1; i >= 2; i--) {
  const ls = lowPivots[i - 2];
  const head = lowPivots[i - 1];
  const rs = lowPivots[i];

  // Head must be lower than shoulders
  if (head.price < ls.price && head.price < rs.price) {
    // Symmetry: Shoulders within 8%
    const diff = Math.abs(ls.price - rs.price) / Math.max(ls.price, rs.price);
    if (diff <= 0.08) {
      // Neckline: Find the high pivot between LS and Head, and between Head and RS
      const n1 = highPivots.find(p => p.index > ls.index && p.index < head.index);
      const n2 = highPivots.find(p => p.index > head.index && p.index < rs.index);

      if (n1 && n2) {
        const neckline = (n1.price + n2.price) / 2;
        const target = neckline + (neckline - head.price);
        const latestPrice = quotes[quotes.length - 1].adjclose || quotes[quotes.length - 1].adjClose || quotes[quotes.length - 1].close;

        // Breakout Check: Has price crossed the neckline?
        if (latestPrice >= neckline * 0.98) { // 2% buffer for proximity
          return {
            type: 'RHS',
            anchorA: neckline,
            target,
            head,
            ls,
            rs,
            isBuyZone: true, // Used by API to filter
            triggerDate: rs.date
          };
        }
        }
        }
        }
        }
        return null;
        }

/**
 * WM Bands – Swing Entry Strategy (Batch 9 Standard)
 * Sequence: B-T-B-T-B (Bottom-Top-Bottom-Top-Bottom)
 * Merge Tolerance: 2.2% to 2.5%
 * Min Gap: 30%
 */
/**
 * WM Bands – Swing Entry Strategy (RE-ENGINEERED FROM PINE SCRIPT)
 * Sequence: B-T-B-T-B (3 Bottoms, 2 Tops)
 * Lookback: 1100 bars
 * Merge: 2.2% - 2.5%
 */
export function calculateSRStrategy(quotes: Quote[]) {
  const pivotLen = 3; // Reduced from 5 for higher sensitivity
  const lookback = 500; 
  if (!quotes || quotes.length < 300) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const highs = quotes.map(q => q.high);
  const lows = quotes.map(q => q.low);
  const latestPrice = prices[prices.length - 1];

  // 1. Detect ALL Pivots in lookback
  const hiPivs: { p: number, b: number }[] = [];
  const loPivs: { p: number, b: number }[] = [];

  const startIdx = Math.max(0, quotes.length - lookback);
  for (let i = startIdx + pivotLen; i < quotes.length - pivotLen; i++) {
    const leftH = highs.slice(i - pivotLen, i);
    const rightH = highs.slice(i + 1, i + pivotLen + 1);
    if (highs[i] >= Math.max(...leftH) && highs[i] >= Math.max(...rightH)) {
      hiPivs.push({ p: highs[i], b: i });
    }

    const leftL = lows.slice(i - pivotLen, i);
    const rightL = lows.slice(i + 1, i + pivotLen + 1);
    if (lows[i] <= Math.min(...leftL) && lows[i] <= Math.min(...rightL)) {
      loPivs.push({ p: lows[i], b: i });
    }
  }

  const mergeTol = 0.0235; // 2.35%
  const minGap = 0.30; // 30%

  // 2. Pivot Clustering (Matching Pine Script Simple Average)
  const buildBands = (pivs: { p: number, b: number }[]) => {
    const bands: { price: number, count: number, bars: number[] }[] = [];
    pivs.forEach(piv => {
      let found = false;
      for (let b of bands) {
        // Strict 2.2% tolerance for clustering
        if (Math.abs(b.price - piv.p) <= (b.price * 0.022)) {
          // Pine Script: (old + p) / 2.0
          b.price = (b.price + piv.p) / 2.0;
          b.count++;
          b.bars.push(piv.b);
          found = true;
          break;
        }
      }
      if (!found) bands.push({ price: piv.p, count: 1, bars: [piv.b] });
    });
    return bands;
  };

  const supportBands = buildBands(loPivs);
  const resistanceBands = buildBands(hiPivs);

  let bestSetup: any = null;
  let maxScore = -1;

  // 3. Pair Scoring and Sequence Validation
  for (let s of supportBands) {
    if (s.count < 3) continue; // B1, B2, B3 mandatory

    for (let r of resistanceBands) {
      if (r.count < 2 || r.price <= s.price) continue;

      const gap = (r.price - s.price) / s.price;
      if (gap < minGap) continue;

      // 4. Sequencing: Combine and sort touches
      const timeline = [
        ...s.bars.map(b => ({ t: 'B', b })),
        ...r.bars.map(b => ({ t: 'T', b }))
      ].sort((a, b) => a.b - b.b);

      // Extract unique sequential touches (B-T-B-T-B)
      let sequence: string = "";
      let lastType = "";
      let seqBars: number[] = [];

      timeline.forEach(point => {
        if (point.t !== lastType) {
          sequence += point.t;
          seqBars.push(point.b);
          lastType = point.t;
        }
      });

      // Find last valid sequence (Prefer BTBTB, fallback to BTB)
      let foundPattern = false;
      let patternEndBar = 0;
      
      if (sequence.includes("BTBTB")) {
        foundPattern = true;
        const idx = sequence.lastIndexOf("BTBTB");
        patternEndBar = seqBars[idx + 4];
      } else if (sequence.includes("BTB")) {
        foundPattern = true;
        const idx = sequence.lastIndexOf("BTB");
        patternEndBar = seqBars[idx + 2];
      }

      if (foundPattern) {
        // Proximity Check: Is latest price near this specific support?
        const isNearSupport = Math.abs(latestPrice - s.price) / s.price <= mergeTol;
        
        // Scoring: Higher score for longer sequences
        let score = s.count * 0.4 + (gap / 0.4) * 0.3 + (s.count + r.count) * 0.2;
        if (sequence.includes("BTBTB")) score += 2; // Priority boost for 5-point sequence

        if (isNearSupport && score > maxScore) {
          maxScore = score;
          bestSetup = {
            type: 'WM_SWING',
            anchorA: s.price,
            target: r.price,
            isBuyZone: true,
            triggerDate: typeof quotes[patternEndBar].date === 'string' ? quotes[patternEndBar].date : (quotes[patternEndBar].date as Date).toISOString(),
            reboundCount: s.count,
            gap: gap * 100
          };
        }
      }
    }
  }

  return bestSetup;
}



/**
 * Calculates Simple Moving Average (SMA)
 */
export function calculateSMA(prices: number[], length: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < length - 1) {
      sma[i] = 0;
      continue;
    }
    const window = prices.slice(i - length + 1, i + 1);
    sma[i] = window.reduce((a, b) => a + b, 0) / length;
  }
  return sma;
}

/**
 * SMA Stacking Strategy (20/50/200)
 * Logic: We look for stocks where Price is near or below SMA 200
 * AND MAs are in a Bearish Stacking (20 < 50 < 200) indicating deep value/oversold.
 */
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const sma20Arr = calculateSMA(prices, 20);
  const sma50Arr = calculateSMA(prices, 50);
  const sma200Arr = calculateSMA(prices, 200);

  const latestIdx = quotes.length - 1;
  const sma20 = sma20Arr[latestIdx];
  const sma50 = sma50Arr[latestIdx];
  const sma200 = sma200Arr[latestIdx];
  const currentPrice = prices[latestIdx];

  // Buy Zone: Price is at or below SMA 200 AND Bearish Stacked (Value Entry)
  const isBuyZone = currentPrice <= sma200 && sma20 < sma50 && sma50 < sma200;

  let triggerDate: string | undefined = undefined;
  if (isBuyZone) {
    const d = quotes[latestIdx].date;
    triggerDate = typeof d === 'string' ? d.split('T')[0] : (d as Date).toISOString().split('T')[0];
  }

  return {
    sma20, sma50, sma200,
    isBuyZone,
    triggerDate,
    entryPrice: sma200, // Entering at SMA 200
    currentPrice,
    target: sma200 * 1.15 // Target 15% recovery
  };
}

/**
 * 67 Ka Funda Strategy (RE-ENGINEERED)
 * Rule 1: Drawdown from ATH >= 67%
 * Rule 2: Upside to ATH >= 100%
 * Rule 3: Improving Quarterly Numbers (Sales or Profit)
 */
export function calculateSixtySevenFunda(quotes: Quote[], screenerData: any, config: any = {}, manualATH?: number) {
  if (!quotes || quotes.length < 20) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const currentPrice = prices[prices.length - 1];
  
  // High Accuracy ATH: Search all history + Yahoo Proxy
  const localHigh = Math.max(...quotes.map(q => q.high));
  const ath = Math.max(localHigh, manualATH || 0);
  
  const drawdown = ath > 0 ? ((ath - currentPrice) / ath) * 100 : 0;
  const upside = currentPrice > 0 ? ((ath - currentPrice) / currentPrice) * 100 : 0;

  const minDrawdown = config.min_drawdown_pct || 66; // Changed from 67 to 66 for 1% tolerance
  const minUpside = config.min_upside_pct || 100;

  // Quarterly Improvement check (Prioritize Quarterly data)
  // Support fallback for Yahoo Finance quarterly data
  const qProfits = screenerData?.quarterlyNetProfits || screenerData?.quarterlyNetIncome || [];
  const qSales = screenerData?.quarterlySales || [];
  const aProfits = screenerData?.historicalNetProfits || [];
  const aSales = screenerData?.historicalSales || [];
  
  const isImproving = (series: number[]) => {
    if (!series || series.length < 2) return false;
    const recent = series.slice(-3); // Check last 3 periods
    if (recent.length === 3) return recent[2] > recent[1] || recent[1] > recent[0];
    return recent[1] > recent[0];
  };

  const profitImproving = isImproving(qProfits) || isImproving(aProfits);
  const salesImproving = isImproving(qSales) || isImproving(aSales);

  const checks = {
    drawdown_rule: drawdown >= minDrawdown,
    upside_rule: upside >= minUpside,
    profit_improving: profitImproving,
    sales_improving: salesImproving,
    quarterly_rule: profitImproving || salesImproving
  };

  // Verdict Logic: 
  // WATCHLIST = Hit the drawdown/upside targets.
  // QUALIFIED = Hit targets + Financials improving.
  let verdict = "REJECT";
  let score = 0;

  if (checks.drawdown_rule && checks.upside_rule) {
    verdict = "WATCHLIST";
    score = 50;
    if (checks.quarterly_rule) {
      verdict = "QUALIFIED";
      score = 80;
    }
  }

  return {
    drawdown,
    upside,
    ath,
    checks,
    score,
    verdict,
    currentPrice,
    isBuyZone: verdict === "QUALIFIED" // This triggers 'Open' tab
  };
  }

  /**
  * Cup & Handle + ABCD Strategy
  * Strict Rule: Lips within 5%. Cup Depth > 15%. Handle retracement < 50% of Cup.
  */
  export function calculateCupHandle(quotes: Quote[]) {
  if (!quotes || quotes.length < 150) return null;

  const pivots = findPivots(quotes, 10);
  const highPivots = pivots.filter(p => p.type === 'high');
  const lowPivots = pivots.filter(p => p.type === 'low');

  if (highPivots.length < 2) return null;

  // Look for two high pivots forming the "rim" of the cup
  for (let i = highPivots.length - 1; i >= 1; i--) {
  const leftLip = highPivots[i - 1];
  const rightLip = highPivots[i];

  // Symmetry: Lips within 8%
  const diff = Math.abs(leftLip.price - rightLip.price) / Math.max(leftLip.price, rightLip.price);
  if (diff <= 0.08) {
    // Find the lowest point between lips (The Cup bottom)
    const cupLow = lowPivots.find(p => p.index > leftLip.index && p.index < rightLip.index);
    if (cupLow) {
      const cupDepth = (Math.max(leftLip.price, rightLip.price) - cupLow.price) / Math.max(leftLip.price, rightLip.price);

      // Cup Depth must be > 15%
      if (cupDepth >= 0.15) {
        // Handle: Minor consolidation after right lip
        const handleLow = quotes.slice(rightLip.index).reduce((min, q) => {
          const p = q.adjclose || q.adjClose || q.close;
          return p < min ? p : min;
        }, rightLip.price);

        const handleRetrace = (rightLip.price - handleLow) / (rightLip.price - cupLow.price);

        // Handle retrace max 50% of cup depth
        if (handleRetrace <= 0.50) {
          const latestPrice = quotes[quotes.length - 1].adjclose || quotes[quotes.length - 1].adjClose || quotes[quotes.length - 1].close;
          const target = rightLip.price * (1 + cupDepth);

          // Breakout check
          if (latestPrice >= rightLip.price * 0.98) {
            return {
              type: 'CUP_HANDLE',
              anchorA: rightLip.price,
              target,
              cupLow,
              leftLip,
              rightLip,
              isBuyZone: true,
              triggerDate: rightLip.date
            };
          }
        }
      }
    }
  }
  }
  return null;
  }
