export interface Trade {
  id: string;
  entryTime: string;
  exitTime: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  roi: number;
  status: 'WIN' | 'LOSS' | 'ENTRY' | 'HOLD' | 'CLOSED' | 'NO_TRADE';
  currentLevel?: string;
  currentPrice?: number;
  basket?: string;
  target?: number;
  gap?: number;
}

export interface StrategyStats {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  recoveryFactor: number;
  sharpeRatio: number;
}
