
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
 * Trade Management Logic
 * Determines if a trade should exit based on the target logic.
 */
export function checkExitSignal(currentQuote: Quote, entryPrice: number, entryUpperBand: number): boolean {
  const currentPrice = currentQuote.adjClose || currentQuote.close;
  const target = Math.max(entryUpperBand, entryPrice * 1.30);
  
  // High accuracy check: Did the high of the day reach the target?
  return currentQuote.high >= target;
}
