export const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['BLUECHIP'] },
  { id: 'ENVELOPE_SHORT', name: 'Envelope Short', baskets: ['BLUECHIP'] },
  { id: 'ENVELOPE_KNOX', name: 'Envelope + Knox', baskets: ['BLUECHIP'] },
  { id: 'SMA', name: 'SMA', baskets: ['BLUECHIP'] },
  { id: 'BOLLINGER', name: 'Bollinger Band', baskets: ['BLUECHIP'] },
  { id: '52W_HIGH_LOW', name: '52 week High Low', baskets: ['BLUECHIP'] },
  { id: 'CUP_HANDLE_ABCD', name: 'Cup with Handle + ABCD', baskets: ['BLUECHIP'] },
  { id: 'RHS_ABCD', name: 'Reverse Head and Shoulder + ABCD', baskets: ['BLUECHIP', 'HIGH_BETA'] },
  { id: 'SMA_BCD', name: 'SMA + BCD', baskets: ['BLUECHIP', 'HIGH_BETA'] },
  { id: 'CUP_HANDLE_CORRECTION', name: 'Cup with Handle + 10% correction', baskets: ['BLUECHIP', 'HIGH_BETA'] },
  { id: 'RHS_CORRECTION', name: 'Reverse Head and Shoulder + 10% correction', baskets: ['BLUECHIP', 'HIGH_BETA'] },
  { id: 'SR_STRATEGY', name: 'Support and Resistance Strategy (S&R)', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT_PRUDENCE'] },
  { id: '20_RALLY', name: '20% ki rally', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT_PRUDENCE'] },
  { id: '67_FUNDA', name: '67 ka Funda', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT_PRUDENCE'] },
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
