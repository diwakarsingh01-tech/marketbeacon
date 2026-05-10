export const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['BLUECHIP'], isLive: true },
  { id: 'SMA', name: 'SMA Support', baskets: ['BLUECHIP', 'HIGH_BETA'], isLive: true },
  { id: 'BOLLINGER', name: 'Bollinger Band', baskets: ['BLUECHIP', 'HIGH_BETA'], isLive: true },
  { id: '52W_HIGH_LOW', name: '52 week High Low', baskets: ['BLUECHIP', 'HIGH_BETA'], isLive: true },
  { id: '67_FUNDA', name: '67 ka Funda', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT_PRUDENCE'], isLive: true },
  { id: '20_RALLY', name: '20% ki rally', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT_PRUDENCE'], isLive: true },
  { id: 'CUP_HANDLE_ABCD', name: 'Cup with Handle', baskets: ['BLUECHIP', 'HIGH_BETA'], isLive: true },
  { id: 'RHS_ABCD', name: 'Reverse Head & Shoulder', baskets: ['BLUECHIP', 'HIGH_BETA'], isLive: true },
  { id: 'SR_STRATEGY', name: 'Support & Resistance (S&R)', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT_PRUDENCE'], isLive: true },
];

export const BASKETS: Record<string, string[]> = {
  'BLUECHIP': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 
    'NIFTYBEES', 'BANKBEES'
  ],
  'HIGH_BETA': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KANSAINER', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ],
  'PROFIT_PRUDENCE': ['Dynamic Screener']
};

// Simplified stocks for backward compatibility if needed
export const stocks = BASKETS['BLUECHIP'].map(symbol => ({
  symbol,
  stockName: symbol,
  strategy: 'Envelope Long',
  currentPrice: 0,
  totalReturn: '0%',
  cagr: '0%',
  winRate: '0%',
  totalTrades: 0,
  status: 'Watchlist',
  sector: 'General'
}));
