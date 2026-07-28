export const STRATEGIES = [
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Institutional Reset (67%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket', 'Fallen Value Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest (20%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SR_STRATEGY', name: 'Support and Resistance Strategy (S&R)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SMA_BCD', name: 'SMA + BCD', baskets: ['Elite Basket', 'Quality Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'CUP_HANDLE_ABCD', name: 'Cup with Handle + ABCD', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: '52W_HIGH_LOW', name: '52 week High Low', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'BOLLINGER', name: 'Bollinger Band', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_SHORT', name: 'Envelope Short', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'REVERSE_HEAD_SHOULDERS', name: 'Reverse Head & Shoulders (RHS)', baskets: ['Quality Basket', 'Elite Basket', 'Growth Basket'], isLive: true, tier: 'pro', isLocked: true }
];

export const BASKETS: Record<string, string[]> = {
  'Elite Basket': [
    'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'KOTAKBANK', 'AXISBANK', 'SBIN', 
    'LT', 'ITC', 'HINDUNILVR', 'ASIANPAINT', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 
    'BHARTIARTL', 'M&M', 'MARUTI', 'TMCV', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 
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
    "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS", "HINDUNILVR", "INFY", "SUNPHARMA", "MARUTI", "AXISBANK",
    "KOTAKBANK", "ITC", "ONGC", "ULTRACEMCO", "HCLTECH", "BEL", "COALINDIA", "HAL", "DMART", "NESTLEIND",
    "ASIANPAINT", "HINDZINC", "WIPRO", "EICHERMOT", "VBL", "DIVISLAB", "SOLARINDS", "IDEA", "CUMMINSIND", "BSE",
    "ABB", "PIDILITIND", "TRENT", "CGPOWER", "POLYCAB", "DLF", "BANKBARODA", "TMCV", "BHEL", "SIEMENS",
    "TECHM", "UNIONBANK", "HDFCLIFE", "BRITANNIA", "CANBK", "PNB", "JINDALSTEL", "BAJAJHLDNG", "INDIANB", "CIPLA",
    "GAIL", "BOSCHLTD", "HDFCAMC", "DRREDDY", "MARICO", "AMBUJACEM", "LUPIN", "GODREJCP", "MAZDOCK", "HEROMOTOCO",
    "INDHOTEL", "SHREECEM", "OFSS", "AUROPHARMA", "NMDC", "SRF", "PERSISTENT", "IDBI", "LAURUSLABS", "SUZLON",
    "DABUR", "FEDERALBNK", "YESBANK", "FORTIS", "NATIONALUM", "AUBANK", "HAVELLS", "MCX", "NAM-INDIA", "INDUSINDBK",
    "ICICIPRULI", "DIXON", "GICRE", "BIOCON", "BANKINDIA", "NAUKRI", "IOB", "SCHAEFFLER", "ALKEM", "PHOENIXLTD",
    "IDFCFIRSTB", "GLENMARK", "MAHABANK", "TIINDIA", "LINDEINDIA", "COFORGE", "OBEROIRLTY", "BERGEPAINT", "JSL", "MFSL",
    "THERMAX", "COLPAL", "COROMANDEL", "MRF", "KEI", "HINDCOPPER", "APLAPOLLO", "RADICO", "SUPREMEIND", "MPHASIS",
    "AIAENG", "VOLTAS", "IPCALAB", "BALKRISIND", "PIIND", "ASTRAL", "PETRONET", "COCHINSHIP", "KPRMILL", "AJANTPHARM",
    "GLAXO", "WELCORP", "NAVINFLUOR", "3MINDIA", "ENDURANCE", "GODFRYPHLP", "UBL", "JBCHEPHARM", "HSCL", "CONCOR",
    "LTTS", "EXIDEIND", "TATAINVEST", "BLUESTARCO", "UCOBANK", "WOCKPHARMA", "ESCORTS", "NBCC", "HFCL", "CRISIL",
    "CENTRALBK", "TIMKEN", "TATAELXSI", "LALPATHLAB", "CDSL", "APOLLOTYRE", "ACC", "NIACL", "MTARTECH", "IGL",
    "DEEPAKNTR", "KAYNES", "TRITURBINE", "RBLBANK", "GRINDWELL", "GMDCLTD", "GESHIP", "RAMCOCEM", "KPITTECH", "PFIZER",
    "SUNTV", "CARBORUNIV", "ATUL", "BAYERCROP", "ELGIEQUIP", "GRANULES", "CAMS", "CHAMBLFERT", "REDINGTON", "VTL",
    "EIHOTEL", "SUNDRMFAST", "CHENNPETRO", "SYNGENE", "KAJARIACER", "KANSAINER", "EMAMILTD", "J&KBANK", "FINCABLES", "NATCOPHARM",
    "JINDALSAW", "DCMSHRIRAM", "GSPL", "CAPLIPOINT", "AVANTIFEED", "INOXWIND", "BASF", "FINEORG", "BEML", "APLLTD",
    "SOBHA", "ZENTEC", "GRAPHITE", "KFINTECH", "VGUARD", "VINATIORGA", "ENGINERSIN", "EIDPARRY", "ECLERX", "TRIDENT",
    "SOUTHBANK", "ZENSARTECH", "IEX", "ZEEL", "MGL", "FINPIPE", "BBTC", "SHILPAMED", "HEG", "INTELLECT",
    "RAILTEL", "MMTC", "WHIRLPOOL", "RITES", "WABAG", "KTKBANK", "CYIENT", "NCC", "PCJEWELLER", "TIMETECHNO",
    "STARCEMENT", "MAHSEAMLES", "THYROCARE", "KRBL", "SHARDACROP", "SKFINDIA", "NESCO", "GPPL", "BIRLACORPN", "GNFC",
    "JYOTHYLAB", "SONATSOFTW", "SANOFI", "TTKPRESTIG", "BAJAJCON", "CERA", "SFL", "SPARC", "TANLA", "LATENTVIEW",
    "JKPAPER", "GSFC", "GALAXYSURF", "FDC", "NEWGEN", "MOIL", "ITDC", "PTC", "IFBIND", "ICRA",
    "JAMNAAUTO", "CARERATING", "MAPMYINDIA", "BLISSGVS", "GULFOILLUB", "JUSTDIAL", "THOMASCOOK", "RALLIS", "KSCL", "VSTIND",
    "SUNTECK", "ADVENZYMES", "GHCL", "LUXIND", "KNRCON", "DBCORP", "QUESS", "ASHOKA", "RELINFRA", "ROUTE",
    "BALMLAWRIE", "DCAL", "HERITGFOOD", "RAJESHEXPO", "TEAMLEASE", "JAICORPLTD", "HATHWAY", "NILKAMAL", "DELTACORP", "JAGRAN",
    "RUPA"
  ],
  'Fallen Value Basket': [
    "BANDHANBNK", "VENKEYS", "ZEEL", "DELTACORP", "IEX", "NEWGEN", "MAPMYINDIA", "JUSTDIAL", "SKFINDIA"
  ]
};


