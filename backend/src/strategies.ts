
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
export function processShortEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200) {
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
    abcd: calculateABCDLevels(currentEMA, 50000000000) // Dummy MCap for now, actual MCap passed in index.ts
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
export function calculateSMAStacking(quotes: Quote[]) {
  if (!quotes || quotes.length < 200) return null;

  const prices = quotes.map(q => q.adjclose || q.adjClose || q.close);
  const latestQuote = quotes[quotes.length - 1];
  const currentPrice = latestQuote.adjclose || latestQuote.adjClose || latestQuote.close;

  // Helper to calculate SMA for a specific window
  const getSMA = (data: number[], len: number) => data.slice(-len).reduce((a, b) => a + b, 0) / len;

  const sma20 = getSMA(prices, 20);
  const sma50 = getSMA(prices, 50);
  const sma200 = getSMA(prices, 200);

  let isBuyZone = false;
  let triggerDate: string | undefined = undefined;
  let entryPrice: number | undefined = undefined;

  // Search back for NEAREST CROSSOVER
  for (let i = quotes.length - 1; i >= 201; i--) {
    const pI = prices.slice(0, i + 1);
    const pPrev = prices.slice(0, i);
    const s20 = getSMA(pI, 20);
    const s50 = getSMA(pI, 50);
    const s200 = getSMA(pI, 200);
    const cI = prices[i];

    // Today's Condition
    const isTodaySatisfied = cI < s20 && s20 < s50 && s50 < s200;

    if (isTodaySatisfied) {
      // Check if it's the START of the crossover (Yesterday was NOT satisfied)
      const prev20 = getSMA(pPrev, 20);
      const prev50 = getSMA(pPrev, 50);
      const prev200 = getSMA(pPrev, 200);
      const cPrev = prices[i-1];
      const isPrevSatisfied = cPrev < prev20 && prev20 < prev50 && prev50 < prev200;

      if (!isPrevSatisfied) {
        // This is the NEAREST CROSSOVER
        // Check if EXIT has occurred between this crossover and today
        let targetHit = false;
        for (let j = i + 1; j < quotes.length; j++) {
          const pJ = prices.slice(0, j + 1);
          const sj20 = getSMA(pJ, 20);
          const sj50 = getSMA(pJ, 50);
          const sj200 = getSMA(pJ, 200);
          if (prices[j] > sj20 && sj20 > sj50 && sj50 > sj200) {
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
    sma20, sma50, sma200,
    isBuyZone,
    triggerDate,
    entryPrice,
    currentPrice,
    target: sma200 // SMA 200 as the primary milestone target
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
