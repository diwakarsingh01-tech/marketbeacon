export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  tier: 'free' | 'pro' | 'alpha';
  daysRemaining: number | null;
  needsOnboarding?: boolean;
}

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

export interface IndexResult {
  name: string;
  price: number;
  ath: number;
  openPrice: number;
  change: number;
}

export interface StockSearchResult {
  symbol: string;
  baskets: string[];
  price: number;
  change: number;
  isBuyZone?: boolean;
  isPass?: boolean;
  reason?: string;
  strategies?: Array<{ id: string; name: string; status: string; score: number }>;
  peMedians: {
    pe3Y?: number;
    pe5Y?: number;
    pe10Y?: number;
  };
}

export interface ABCDNode {
  price: number;
  label?: string;
  date?: string;
}

export interface StrategyResult {
  isBuyZone: boolean;
  isPass: boolean;
  isObservation?: boolean;
  reason?: string;
  entryPrice: number;
  target: number;
  stopLoss?: number;
  score?: number;
  tranche?: string;
  abcd?: Record<string, ABCDNode>;
  triggerDate?: string;
}

export interface FundamentalData {
  symbol: string;
  price: number;
  roce: number;
  netDebtToEquity: number;
  debtToEquity?: number;
  totalDebtToEquity?: number;
  forwardPe?: number;
  beta?: number;
  strategies: Record<string, StrategyResult>;
  audit?: { score: number; universe?: string; isPass?: boolean; reason?: string };
  industry?: string;
  change?: number;
  peRatio?: number;
  normalizedPe?: number;
  peMedians?: { pe3Y?: number; pe5Y?: number; pe10Y?: number };
  marketCap?: number;
  returnOnEquity?: number;
  fiftyTwoWeekHigh?: number;
  currentSales?: number;
  athSales?: number;
  currentNetProfit?: number;
  athNetProfit?: number;
  pledgePct?: number;
  promoterHolding?: number;
  sector?: { raw: string; isBanking?: boolean; isNBFC?: boolean; isFinance?: boolean };
  ttmVsAth?: {
    sales: { current: number; ath: number; gapPct: number; phase: string; trend: string };
    netProfit: { current: number; ath: number; gapPct: number; phase: string; trend: string };
  };
  lastUpdated?: string;
  dataAge?: { lastUpdated: string; updatedAt: string; fresh: boolean };
}

export interface HistoryQuote {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  price?: number;
}

export interface AllStockItem {
  symbol: string;
  isBuyZone: boolean;
  isPass: boolean;
  isObservation?: boolean;
  reason?: string;
  entryPrice?: number;
  target?: number;
  marketCap?: number;
  sector?: string;
  currentPrice?: number;
  basketSource?: string;
  score?: number;
  auditScore?: number;
  smartMoney?: number;
  strategy?: string;
  entryTime?: string;
  ath?: number;
}

export interface AuditData {
  allStocks: AllStockItem[];
}

export interface WatchlistItem {
  symbol: string;
  quantity?: number;
  buy_price?: number;
}

export interface TradeRecord {
  id?: number;
  symbol: string;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  entry_date: string;
  exit_date?: string;
  target_price?: number;
  stop_loss?: number;
  level?: string;
  strategy?: string;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
  isPaper?: boolean;
  paperId?: string;
}

export interface AlphaHubStock {
  symbol: string;
  sector?: string;
  capType: 'LARGE' | 'MID' | 'SMALL';
  basketSource?: string;
  strategy?: string;
  score?: number;
  entryPrice?: number;
  currentPrice?: number;
  target?: number;
  roi?: number;
  tranche?: string;
}

export interface AlphaHubData {
  stocks: AlphaHubStock[];
}

export interface BacktestData {
  strategy?: {
    cagr?: number;
    totalTrades?: number;
    winRate?: number;
    avgRoi?: number;
    avgDays?: number;
  };
  nifty50?: {
    cagr?: number;
    years?: number;
  };
}

export interface BasketConfig {
  id: string;
  name: string;
  tag: string;
  objective: string;
  risk: string;
  riskColor: string;
  stocks: AlphaHubStock[];
  count: number;
  minAmount: number;
  suggestedPct: number;
}

export interface StockPriceResult {
  symbol: string;
  price?: number;
  ath?: number;
  marketCap?: number;
  sector?: string;
}

export interface Notification {
  id: number;
  message: string;
  unread?: number;
  type?: string;
  title?: string;
  created_at?: string;
  timestamp?: string;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  tier: string;
  created_at?: string;
  subscription_expiry?: string;
  subscription_start?: string;
  mobile?: string;
  is_active?: boolean;
}

export interface Feedback {
  id: number;
  email: string;
  message: string;
  reply?: string;
  created_at?: string;
  user_name?: string;
  user_email?: string;
  rating?: number;
  disposition?: string;
  comment?: string;
  url?: string;
  timestamp?: string;
  reply_text?: string;
  replied_at?: string;
}

export interface Voucher {
  id: number;
  code: string;
  tier: string;
  status: string;
  duration_days?: number;
  current_uses?: number;
  max_uses?: number;
  is_active?: boolean;
}

export interface WaitlistEntry {
  id: number;
  email: string;
  name: string;
  status: string;
  tier_requested: string;
  created_at?: string;
  phone?: string;
}

export interface UpgradeRequest {
  id: number;
  email: string;
  name: string;
  status: string;
  created_at?: string;
  mobile?: string;
  requested_tier?: string;
  billing_cycle?: string;
  transaction_id?: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  tag: string;
  author: string;
  createdAt: string;
  readTime?: string;
}

declare global {
  interface Window {
    recaptchaVerifier: unknown;
  }
}
