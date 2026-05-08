export const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT_PRUDENCE'] },
  { id: 'ENVELOPE_SHORT', name: 'Envelope Short', baskets: ['BLUECHIP', 'HIGH_BETA'] },
  { id: 'ENVELOPE_KNOX', name: 'Envelope Knoxville', baskets: ['BLUECHIP', 'HIGH_BETA'] },
  { id: 'MA_CROSSOVER', name: 'SMA Crossover', baskets: ['BLUECHIP'] },
  { id: 'BREAKOUT', name: 'Institutional Breakout', baskets: ['BLUECHIP', 'HIGH_BETA'] },
];

export const BASKETS: Record<string, string[]> = {
  'BLUECHIP': [
    'ITC', 'WIPRO', 'KANSAINER', 'DABUR', 'BATAINDIA', 'WHIRLPOOL', 'COLPAL',
    'TCS', 'HCLTECH', 'INFY', 'HAVELLS', 'PIDILITIND', 'NESTLEIND', 'HINDUNILVR',
    'SANOFI', 'PGHH', 'ASIANPAINT', 'TITAN', 'NIFTYBEES', 'ICICIPRULI', 'AKZOINDIA',
    'KOTAKBANK', 'AXISBANK', 'ULTRACEMCO', 'BAJAJ-AUTO', 'BERGEPAINT', 'PAGEIND',
    'HDFCBANK', 'ICICIBANK', 'MARICO', 'BAJAJHLDNG', 'ICICIGI', 'BAJAJFINSV',
    'HDFCLIFE', 'PFIZER', 'BANKBEES', 'GLAXO', 'GILLETTE', 'AMBUJACEM', 'ABBOTINDIA',
    'BAJFINANCE', 'HDFCAMC', 'NAM-INDIA'
  ],
  'HIGH_BETA': [
    'AVANTIFEED', 'VIPIND', 'SYMPHONY', 'EQUITASBNK', 'RAJESHEXPO', 'TEAMLEASE', 
    'FINCABLES', 'KANSAINER', 'SIS', 'CERA', 'TTKPRESTIG', 'SUNTV', 'BAYERCROP', 
    '3MINDIA', 'UNITDSPR', 'KEI', 'SFL', 'ASTRAZEN', 'CAPLIPOINT', 'FINEORG', 
    'KAJARIACER', 'HONAUT', 'VINATIORGA', 'RELAXO', 'DIXON', 'HEROMOTOCO', 'OFSS', 
    'GODREJCP', 'PGHL', 'TASTYBITE', 'LALPATHLAB', 'UJJIVANSFB', 'EICHERMOT', 
    'VGUARD', 'POLYCAB', 'JCHAC', 'BOSCHLTD', 'MOTILALOFS', 'TVSMOTOR', 'ERIS', 
    'RADICO', 'MCX', 'IEX'
  ],
  'PROFIT_PRUDENCE': [
    'CDSL', 'BSE', 'MCX', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 
    'KAYNES', 'MTARTECH', 'MAHLOG', 'PRINCEPIPE'
  ]
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
