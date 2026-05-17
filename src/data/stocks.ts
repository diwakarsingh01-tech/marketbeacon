export const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Institutional Floor', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'free' },
  { id: 'ENVELOPE_SHORT', name: 'Momentum Ceiling', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'free' },
  { id: 'BOLLINGER', name: 'Volatility Channel', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'free' },
  { id: 'CUP_HANDLE_ABCD', name: 'Structural Pivot', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'pro' },
  { id: 'RHS_ABCD', name: 'Dynamic Reversal', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'pro' },
  { id: '52W_HIGH_LOW', name: 'Annual Range Matrix', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'pro' },
  { id: 'SMA_ABCD', name: 'Quantum Stacking', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'pro' },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'alpha' },
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Deep Recovery Audit', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'alpha' },
  { id: 'SR_STRATEGY', name: 'Supply-Demand Core', baskets: ['BLUECHIP', 'HIGH_BETA', 'PROFIT'], isLive: true, tier: 'alpha' },
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
