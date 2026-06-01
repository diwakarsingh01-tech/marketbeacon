export const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Institutional Floor', baskets: ['Bluechip'], isLive: true, tier: 'free' },
  { id: 'ENVELOPE_SHORT', name: 'Momentum Ceiling', baskets: ['Bluechip'], isLive: true, tier: 'free' },
  { id: 'BOLLINGER', name: 'Volatility Channel', baskets: ['Bluechip'], isLive: true, tier: 'free' },
  { id: 'CUP_HANDLE_ABCD', name: 'Structural Pivot', baskets: ['Bluechip', 'High Beta'], isLive: true, tier: 'pro' },
  { id: 'RHS_ABCD', name: 'Dynamic Reversal', baskets: ['Bluechip', 'High Beta'], isLive: true, tier: 'pro' },
  { id: 'SMA_ABCD', name: 'SMA-ABCD', baskets: ['Bluechip', 'High Beta'], isLive: true, tier: 'pro' },
  { id: '52W_HIGH_LOW', name: '52W High/Low', baskets: ['Bluechip', 'High Beta'], isLive: true, tier: 'pro' },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest', baskets: ['Bluechip', 'High Beta', 'Wealth Universe'], isLive: true, tier: 'alpha' },
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Deep Recovery Audit', baskets: ['Bluechip', 'High Beta', 'Wealth Universe'], isLive: true, tier: 'alpha' },
  { id: 'SR_STRATEGY', name: 'Supply-Demand Core', baskets: ['Bluechip', 'High Beta', 'Wealth Universe'], isLive: true, tier: 'alpha' },
];

export const BASKETS: Record<string, string[]> = {
  'Bluechip': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 
    'NIFTYBEES', 'BANKBEES'
  ],
  'High Beta': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ],
  'Wealth Universe': [
    'CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 
    'MTARTECH', 'MAHLOG', 'PRINCEPIPE', 'ANGELONE', 'MCX', 'KFINTECH', 'DATA PATTERNS', 
    'MAZAGONDOCK', 'COCHINSHIP', 'GRSE', 'RVNL', 'IRCON', 'RITES', 'RAILTEL', 'BEL', 
    'HAL', 'BEML', 'MAZDOCK', 'SOLARINDS', 'BDL', 'KPITTECH', 'COFORGE', 'PERSISTENT', 
    'TATAELXSI', 'ZENTEC', 'NEWGEN', 'MAPMYINDIA', 'CEINFO', 'TANLA', 'ROUTE', 'LATENTVIEW'
  ]
};

// Simplified stocks for backward compatibility if needed
export const stocks = BASKETS['Bluechip'].map(symbol => ({
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
