export const STRATEGIES = [
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Institutional Reset (67%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest (20%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SR_STRATEGY', name: 'Support and Resistance Strategy (S&R)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SMA_BCD', name: 'SMA + BCD', baskets: ['Elite Basket', 'Quality Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'RHS_ABCD', name: 'Reverse Head and Shoulder + ABCD', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'CUP_HANDLE_ABCD', name: 'Cup with Handle + ABCD', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: '52W_HIGH_LOW', name: '52 week High Low', baskets: ['Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'BOLLINGER', name: 'Bollinger Band', baskets: ['Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_SHORT', name: 'Envelope Short', baskets: ['Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['Elite Basket'], isLive: true, tier: 'free', isLocked: true }
];

export const BASKETS: Record<string, string[]> = {
  'Elite Basket': [
    'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'KOTAKBANK', 'AXISBANK', 'SBIN', 
    'LT', 'ITC', 'HINDUNILVR', 'ASIANPAINT', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 
    'BHARTIARTL', 'M&M', 'MARUTI', 'TATAMOTORS', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 
    'ULTRACEMCO', 'NESTLEIND', 'BRITANNIA', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 
    'TATASTEEL', 'NTPC', 'ONGC', 'POWERGRID', 'COALINDIA', 'SHRIRAMFIN', 'APOLLOHOSP', 
    'PIDILITIND', 'HAVELLS', 'EICHERMOT', 'NIFTYBEES', 'BANKBEES'
  ],
  'Quality Basket': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ],
  'Growth Basket': [
    "SPARC", "IEX", "TATAELXSI", "CAMS", "CHENNPETRO", "THYROCARE", "ECLERX", "SONATSOFTW", "EMAMILTD", "TRITURBINE", 
    "GODFRYPHLP", "AJANTPHARM", "BAJAJCON", "CDSL", "CRISIL", "SHARDACROP", "NBCC", "ENGINERSIN", "KFINTECH", "JAMNAAUTO", 
    "ELGIEQUIP", "LTTS", "TANLA", "GPPL", "KPITTECH", "CHAMBLFERT", "NAVINFLUOR", "NEWGEN", "WELCORP", "JBCHEPHARM", 
    "BBTC", "JYOTHYLAB", "GESHIP", "PETRONET", "MPHASIS", "ZENSARTECH", "HSCL", "GRINDWELL", "BLUESTARCO", "AIAENG", 
    "NATCOPHARM", "REDINGTON", "IFBIND", "ICRA", "KPRMILL", "IPCALAB", "WABAG", "RITES", "ENDURANCE", "J&KBANK", 
    "SUNDRMFAST", "SKFINDIA", "NESCO", "EIHOTEL", "ASTRAL", "TIMKEN", "IGL", "GRANULES", "MGL", "APLLTD", 
    "TIMETECHNO", "APOLLOTYRE", "STARCEMENT", "FDC", "MTARTECH", "COCHINSHIP", "INTELLECT", "LATENTVIEW", "RAILTEL", "ESCORTS", 
    "CENTRALBK", "DCMSHRIRAM", "KRBL", "BALKRISIND", "PIIND", "ATUL", "BASF", "ACC", "GALAXYSURF", "ZENTEC", 
    "CROMPTON", "MAHSEAMLES", "PTC", "DEEPAKNTR", "PCJEWELLER", "GSPL", "CONCOR", "FINPIPE", "KAYNES", "SHILPAMED", 
    "NCC", "GNFC", "CYIENT", "UCOBANK", "UBL", "GMDCLTD", "MOIL", "EIDPARRY", "JINDALSAW", "TRIDENT", 
    "SYNGENE", "BIRLACORPN", "HEG", "VTL", "INOXWIND", "HFCL", "CARBORUNIV", "EXIDEIND", "WOCKPHARMA", "VOLTAS", 
    "GSFC", "RBLBANK", "MMTC", "JKPAPER", "BEML", "NIACL", "SOBHA", "RAMCOCEM", "GRAPHITE", "ZEEL", 
    "PRAJIND", "TATAINVEST", "GRSE", "BDL", "BANDHANBNK", "CASTROLIND", "CUB", "DCBBANK", "KARURVYSYA", "MAHSCOOTER"
  ]
};

// Simplified stocks for backward compatibility if needed
export const stocks = BASKETS['Elite Basket'].map(symbol => ({
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
