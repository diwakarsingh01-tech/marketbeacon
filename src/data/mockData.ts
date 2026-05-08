import type { Trade, StrategyStats } from '../types';

export const generateEnvelopeData = (strategy: string = 'ENVELOPE'): { trades: Trade[], stats: StrategyStats } => {
  const trades: Trade[] = [];
  let totalPnl = 0;
  let wins = 0;

  // Change volatility based on strategy
  const volatility = strategy === 'BREAKOUT' ? 8000 : (strategy === 'RSI_REVERSAL' ? 3000 : 5000);
  const winProbability = strategy === 'ENVELOPE' ? 0.6 : (strategy === 'BREAKOUT' ? 0.45 : 0.55);

  const symbols = [
    'ITC', 'WIPRO', 'KANSAINER', 'DABUR', 'BATAINDIA', 'WHIRLPOOL', 'COLPAL',
    'TCS', 'HCLTECH', 'INFY', 'HAVELLS', 'PIDILITIND', 'NESTLEIND', 'HINDUNILVR',
    'SANOFI', 'PGHH', 'ASIANPAINT', 'TITAN', 'NIFTYBEES', 'ICICIPRULI', 'AKZOINDIA',
    'KOTAKBANK', 'AXISBANK', 'ULTRACEMCO', 'BAJAJ-AUTO', 'BERGEPAINT', 'PAGEIND',
    'HDFCBANK', 'ICICIBANK', 'MARICO', 'BAJAJHLDNG', 'ICICIGI', 'BAJAJFINSV',
    'HDFCLIFE', 'PFIZER', 'BANKBEES', 'GLAXO', 'GILLETTE', 'AMBUJACEM', 'ABBOTINDIA',
    'BAJFINANCE', 'HDFCAMC', 'NAM-INDIA'
  ];
  
  for (let i = 1; i <= 50; i++) {
    const isWin = Math.random() < winProbability;
    const pnl = isWin ? Math.floor(Math.random() * volatility) + 1000 : - (Math.floor(Math.random() * (volatility * 0.7)) + 500);
    const entryPrice = Math.floor(Math.random() * 20000) + 1000;
    const exitPrice = entryPrice + (pnl / 10);
    
    if (isWin) wins++;
    totalPnl += pnl;

    const date = new Date(2024, 0, 1); // Start from Jan 1st 2024
    let businessDaysCount = 0;
    
    while (businessDaysCount < i) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        businessDaysCount++;
      }
    }

    trades.push({
      id: `T-${i}`,
      entryTime: date.toISOString().split('T')[0],
      exitTime: date.toISOString().split('T')[0],
      symbol: symbols[i % symbols.length],
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      entryPrice,
      exitPrice,
      quantity: 10,
      pnl,
      roi: (pnl / (entryPrice * 10)) * 100,
      status: isWin ? 'WIN' : 'LOSS'
    });
  }

  const stats: StrategyStats = {
    totalPnl,
    winRate: (wins / trades.length) * 100,
    totalTrades: trades.length,
    maxDrawdown: strategy === 'BREAKOUT' ? 18.2 : 12.5,
    recoveryFactor: strategy === 'RSI_REVERSAL' ? 4.1 : 3.2,
    sharpeRatio: strategy === 'ENVELOPE' ? 2.1 : 1.8
  };

  return { trades: trades.reverse(), stats };
};
