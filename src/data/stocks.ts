export const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['H-Super45'], isLive: true, tier: 'free' },
  { id: 'ENVELOPE_SHORT', name: 'Envelope Short', baskets: ['H-Super45'], isLive: true, tier: 'free' },
  { id: 'ENVELOPE_KNOX', name: 'Envelope + Knox', baskets: ['H-Super45'], isLive: true, tier: 'pro' },
  { id: 'SMA', name: 'SMA', baskets: ['H-Super45'], isLive: true, tier: 'pro' },
  { id: 'BOLLINGER', name: 'Bollinger Band', baskets: ['H-Super45'], isLive: true, tier: 'free' },
  { id: '52W_HIGH_LOW', name: '52 week High Low', baskets: ['H-Super45'], isLive: true, tier: 'pro' },
  { id: 'CUP_HANDLE_ABCD', name: 'Cup with Handle + ABCD', baskets: ['H-GOOD45', 'H-Super45'], isLive: true, tier: 'pro' },
  { id: 'RHS_ABCD', name: 'Reverse Head and Shoulder + ABCD', baskets: ['H-GOOD45', 'H-Super45'], isLive: true, tier: 'pro' },
  { id: 'SMA_BCD', name: 'SMA + BCD', baskets: ['H-GOOD45', 'H-Super45'], isLive: true, tier: 'pro' },
  { id: 'CUP_HANDLE_CORRECTION', name: 'Cup with Handle + 10% correction', baskets: ['H-GOOD45', 'H-Super45'], isLive: true, tier: 'pro' },
  { id: 'RHS_CORRECTION', name: 'Reverse Head and Shoulder + 10% correction', baskets: ['H-GOOD45', 'H-Super45'], isLive: true, tier: 'pro' },
  { id: 'SR_STRATEGY', name: 'Support and Resistance Strategy (S&R)', baskets: ['H-Good200', 'H-GOOD45', 'H-Super45'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'TWENTY_RALLY_RETEST', name: '20% ki rally', baskets: ['H-Good200', 'H-GOOD45', 'H-Super45'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SIXTY_SEVEN_FUNDA', name: '67 ka Funda', baskets: ['H-Good200', 'H-GOOD45', 'H-Super45'], isLive: true, tier: 'alpha', isLocked: true }
];

export const BASKETS: Record<string, string[]> = {
  'H-Super45': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 
    'NIFTYBEES', 'BANKBEES'
  ],
  'H-GOOD45': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ],
  'H-Good200': [
    'CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 
    'MTARTECH', 'MAHLOG', 'PRINCEPIPE', 'ANGELONE', 'MCX', 'KFINTECH', 'DATA PATTERNS', 
    'MAZAGONDOCK', 'COCHINSHIP', 'GRSE', 'RVNL', 'IRCON', 'RITES', 'RAILTEL', 'BEL', 
    'HAL', 'BEML', 'MAZDOCK', 'SOLARINDS', 'BDL', 'KPITTECH', 'COFORGE', 'PERSISTENT', 
    'TATAELXSI', 'ZENTEC', 'NEWGEN', 'MAPMYINDIA', 'CEINFO', 'TANLA', 'ROUTE', 'LATENTVIEW'
  ]
};

// Simplified stocks for backward compatibility if needed
export const stocks = BASKETS['H-Super45'].map(symbol => ({
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
