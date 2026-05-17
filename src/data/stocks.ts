export const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Institutional Floor', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'ENVELOPE_SHORT', name: 'Momentum Ceiling', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'BOLLINGER', name: 'Volatility Channel', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'SMA_ABCD', name: 'Quantum Stacking', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: '52W_HIGH_LOW', name: 'Annual Range Matrix', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Deep Recovery Audit', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'CUP_HANDLE_ABCD', name: 'Structural Pivot', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'RHS_ABCD', name: 'Dynamic Reversal', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
  { id: 'SR_STRATEGY', name: 'Supply-Demand Core', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true },
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
  'PROFIT': [
    'CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 
    'MTARTECH', 'MAHLOG', 'PRINCEPIPE'
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
