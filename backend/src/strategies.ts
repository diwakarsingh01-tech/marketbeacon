
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
}

export interface Quote {
  date: Date | string;
  close: number;
  adjClose?: number;
  low: number;
  high: number;
}

/**
 * Calculates 200-day SMA and 14% Envelopes with high precision.
 * Uses adjClose to handle splits/dividends automatically.
 */
export function calculateEnvelope(quotes: Quote[], percentage: number = 14, length: number = 200): EnvelopeResult | null {
  if (!quotes || quotes.length < length) return null;

  // Use adjClose for accuracy, fallback to close
  const prices = quotes.map(q => q.adjClose || q.close);
  const latestQuote = quotes[quotes.length - 1];
  const currentPrice = latestQuote.adjClose || latestQuote.close;

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
      const currentPriceInLoop = q.adjClose || q.close;
      
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
    triggerDate
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

  const prices = quotes.map(q => q.adjClose || q.close);
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
      const pPrice = quotes[i-1].adjClose || quotes[i-1].close;
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
    currentPrice: prices[latestIdx]
  };
}/**
 * Trade Management Logic
...
 * Determines if a trade should exit based on the target logic.
 */
export function checkExitSignal(currentQuote: Quote, entryPrice: number, entryUpperBand: number): boolean {
  const currentPrice = currentQuote.adjClose || currentQuote.close;
  const target = Math.max(entryUpperBand, entryPrice * 1.30);
  
  // High accuracy check: Did the high of the day reach the target?
  return currentQuote.high >= target;
}
