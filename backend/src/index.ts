import { DEPLOY_VERIFICATION } from './verify_deploy.js';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import etag from 'etag';
import YahooFinanceClass from 'yahoo-finance2';
const yahooFinance = new (YahooFinanceClass as any)({ suppressNotices: ['yahooSurvey'] });
import { 
  initScreenerCron, 
  updateMarketSnapshot, 
  getDynamicBasket,
  initSnapshotCache,
  getMarketSnapshot
} from './screener.js';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { precalculateAlpha40, getAlpha40Cache } from './services/worker.js';
import { supabase, initDB, getDB } from './db.js';

dotenv.config();

const ADMIN_EMAILS = ['ajaythomasjohn@gmail.com', 'admin@marketbeacon.com', 'diwakarsingh01.tech@gmail.com', 'diwakar.singh01@gmail.com'];

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(compression());

// --- CONSTANTS ---
export const MANUAL_SECTOR_MAP: Record<string, string> = {
  // IT & Tech
  'TCS': 'IT Services', 'INFY': 'IT Services', 'HCLTECH': 'IT Services', 'WIPRO': 'IT Services', 'LTTS': 'Engineering Tech', 'KPITTECH': 'Automotive Tech', 'CYIENT': 'IT Services', 'SONATSOFTW': 'IT Services', 'ZENSARTECH': 'IT Services', 'MPHASIS': 'IT Services', 'NEWGEN': 'Software', 'TANLA': 'CPaaS', 'OFSS': 'IT Services',
  // Banking & Finance
  'HDFCBANK': 'Banking', 'ICICIBANK': 'Banking', 'AXISBANK': 'Banking', 'KOTAKBANK': 'Banking', 'UCOBANK': 'Banking', 'CENTRALBK': 'Banking', 'BANDHANBNK': 'Banking', 'J&KBANK': 'Banking', 'KARURVYSYA': 'Banking', 'CUB': 'Banking', 'DCBBANK': 'Banking', 'SBIN': 'Banking', 'RBLBANK': 'Banking', 'UJJIVANSFB': 'Banking',
  'BAJFINANCE': 'NBFC', 'BAJAJFINSV': 'NBFC', 'HDFCAMC': 'Asset Management', 'NAM-INDIA': 'Asset Management', 'CAMS': 'Financial Infrastructure', 'CDSL': 'Exchange/Depository', 'MCX': 'Exchange/Depository', 'MUTHOOTFIN': 'NBFC', 'CHOLAFIN': 'NBFC', 'POONAWALLA': 'NBFC', 'SHRIRAMFIN': 'NBFC', 'MOTILALOFS': 'Financial Services',
  // FMCG & Consumer
  'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'COLPAL': 'FMCG', 'DABUR': 'FMCG', 'MARICO': 'FMCG', 'NESTLEIND': 'FMCG', 'TATACONSUM': 'FMCG', 'BRITANNIA': 'FMCG', 'VGUARD': 'Consumer Durables', 'HAVELS': 'Consumer Durables', 'HAVELLS': 'Consumer Durables', 'WHIRLPOOL': 'Consumer Durables', 'BATAINDIA': 'Footwear', 'RELAXO': 'Footwear', 'PAGEIND': 'Apparel', 'TITAN': 'Jewellery/Watches', 'GODREJCP': 'FMCG', 'TASTYBITE': 'Food Processing', 'TTKPRESTIG': 'Consumer Durables', 'SFL': 'Consumer Durables', 'SYMPHONY': 'Consumer Durables', 'VIPIND': 'Consumer Durables',
  // Paints & Chemicals
  'ASIANPAINT': 'Paints', 'BERGEPAINT': 'Paints', 'KANSAINER': 'Paints', 'AKZOINDIA': 'Paints', 'PIDILITIND': 'Adhesives', 'DEEPAKNTR': 'Chemicals', 'SRF': 'Chemicals', 'NAVINFLUOR': 'Chemicals', 'ATUL': 'Chemicals', 'FINEORG': 'Chemicals', 'VINATIORGA': 'Chemicals',
  // Pharma & Healthcare
  'SANOFI': 'Pharma', 'GLAXO': 'Pharma', 'PFIZER': 'Pharma', 'ABBOTINDIA': 'Pharma', 'APOLLOHOSP': 'Healthcare', 'MAXHEALTH': 'Healthcare', 'LALPATHLAB': 'Diagnostics', 'METROPOLIS': 'Diagnostics', 'SYNGENE': 'Contract Research', 'WOCKPHARMA': 'Pharma', 'NATCOPHARM': 'Pharma', 'JBCHEPHARM': 'Pharma', 'ERIS': 'Pharma', 'AJANTPHARM': 'Pharma', 'SUNPHARMA': 'Pharma', 'DRREDDY': 'Pharma', 'CIPLA': 'Pharma', 'CAPLIPOINT': 'Pharma', 'ASTRAZEN': 'Pharma', 'PGHL': 'Pharma', 'BAYERCROP': 'Agrochemicals',
  // Auto & Engineering
  'BAJAJ-AUTO': 'Automobile', 'EICHERMOT': 'Automobile', 'HEROMOTOCO': 'Automobile', 'TVSMOTOR': 'Automobile', 'MARUTI': 'Automobile', 'M&M': 'Automobile', 'ASHOKLEY': 'Automobile', 'POLYCAB': 'Electricals', 'KEI': 'Electricals', 'FINCABLES': 'Electricals', 'DIXON': 'Electronics Mfg', 'HONAUT': 'Automation', 'ABB': 'Industrial/Power', 'SIEMENS': 'Industrial/Power', 'CUMMINSIND': 'Industrial/Power', 'BOSCHLTD': 'Auto Ancillary', 'TMCV': 'Automobile',
  // Infrastructure, Power, Steel & Cement
  'ULTRACEMCO': 'Cement', 'AMBUJACEM': 'Cement', 'ACC': 'Cement', 'RAMCOCEM': 'Cement', 'JKCEMENT': 'Cement', 'L&T': 'EPC/Infra', 'LT': 'EPC/Infra', 'CONCOR': 'Logistics', 'WELCORP': 'Steel Pipes', 'TRITURBINE': 'Engineering', 'BHARTIARTL': 'Telecom', 'NTPC': 'Power', 'POWERGRID': 'Power', 'COALINDIA': 'Mining', 'ONGC': 'Oil & Gas', 'JSWSTEEL': 'Steel', 'TATASTEEL': 'Steel', 'ADANIPORTS': 'Infrastructure', 'ADANIENT': 'Conglomerate', 'RELIANCE': 'Energy/Conglomerate',
  // Others
  'IEX': 'Energy Exchange', 'NYKAA': 'E-commerce', 'ZOMATO': 'Food Delivery', 'ZEEL': 'Media', 'SUNTV': 'Media', 'SIS': 'Security Services', 'TEAMLEASE': 'Employment Services', 'RAJESHEXPO': 'Jewellery/Watches', 'CERA': 'Sanitaryware', 'AVANTIFEED': 'Aqua Feed', 'KAJARIACER': 'Ceramics', 'JCHAC': 'Consumer Durables', 'NIFTYBEES': 'Index ETF', 'BANKBEES': 'Banking ETF'
};

export const STRATEGIES = [
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Institutional Reset (67%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest (20%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SR_STRATEGY', name: 'Support and Resistance Strategy (S&R)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SMA_BCD', name: 'SMA + BCD', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'RHS_ABCD', name: 'Reverse Head and Shoulder + ABCD', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'CUP_HANDLE_ABCD', name: 'Cup with Handle + ABCD', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: '52W_HIGH_LOW', name: '52 week High Low', baskets: ['Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'BOLLINGER', name: 'Bollinger Band', baskets: ['Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_SHORT', name: 'Envelope Short', baskets: ['Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['Elite Basket'], isLive: true, tier: 'free', isLocked: true }
];

export const BASKETS: Record<string, string[]> = {
  'Elite Basket': ['TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'ASIANPAINT', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 'BHARTIARTL', 'M&M', 'MARUTI', 'TMCV', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'ULTRACEMCO', 'NESTLEIND', 'BRITANNIA', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'ONGC', 'POWERGRID', 'COALINDIA', 'SHRIRAMFIN', 'APOLLOHOSP', 'PIDILITIND', 'HAVELLS', 'EICHERMOT', 'NIFTYBEES', 'BANKBEES'],
  'Quality Basket': ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'],
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
  ]
};

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(403).json({ error: 'User not found.' });

    // --- Subscription Expiry Check ---
    if (user.tier !== 'free' && user.subscription_expiry) {
      const expiry = new Date(user.subscription_expiry);
      if (expiry < new Date()) {
        console.log(`[SUBSCRIPTION] Expiring tier for user ${user.email}`);
        await db.run("UPDATE users SET tier = 'free' WHERE id = ?", [user.id]);
        user.tier = 'free';
      }
    }
    
    // Normalize and Override for Admins
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());
    const finalRole = isAdmin ? 'admin' : (user.role || 'user').toLowerCase();
    const finalTier = isAdmin ? 'alpha' : (user.tier || 'free').toLowerCase();

    req.user = { ...user, role: finalRole, tier: finalTier };
    next();
  } catch (err: any) { 
    console.error('Token verification error:', err.message || err); 
    return res.status(403).json({ error: 'Invalid token.' }); 
  }
};

const getSnapshotFromCloud = async (symbols: string[]) => {
  try {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    // Multi-layer symbols (Institutional Hardening)
    const normalizedSymbols = Array.from(new Set([
       ...symbols,
       ...symbols.map(s => s.includes('.') ? s : `${s}.NS`),
       ...symbols.map(s => s.replace('.NS', ''))
    ]));

    const { data, error } = await supabase.from('market_data').select('*').in('symbol', normalizedSymbols);
    if (error) throw error;
    
    const resultMap: Record<string, any> = {};
    (data || []).forEach(row => {
       resultMap[row.symbol] = row.data;
       resultMap[row.symbol.replace('.NS', '')] = row.data; // Also index by base symbol
    });

    return resultMap;
  } catch (err: any) {
    console.warn(`⚠️ [Supabase Fallback] Query failed: ${err.message}. Serving from memory cache...`);
    const cache = getMarketSnapshot();
    const result: Record<string, any> = {};
    const cacheKeys = Object.keys(cache);

    symbols.forEach(sym => {
      const cleanSym = sym.trim().toUpperCase();
      let snap = cache[cleanSym] || cache[`${cleanSym}.NS`];
      if (!snap) {
         const key = cacheKeys.find(k => k.replace('.NS', '') === cleanSym);
         if (key) snap = cache[key];
      }
      if (snap) result[cleanSym] = snap;
    });
    return result;
  }
};

app.get('/api/health', (req, res) => res.json({ 
  status: 'active', 
  node: 'Supabase-Cloud-Production', 
  version: '14.1.1-PRO-FIX-TARGET',
  verify: 'Alpha Target data binding resolved',
  timestamp: new Date().toISOString()
}));

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token: credential } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Token');
    const email = payload.email!.toLowerCase();
    const db = getDB();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    const role = ['diwakarsingh01.tech@gmail.com', 'admin@marketbeacon.com'].includes(email) ? 'admin' : 'user';
    const tier = role === 'admin' ? 'alpha' : 'free';
    if (!user) {
      const result = await db.run('INSERT INTO users (name, email, password, role, tier) VALUES (?, ?, ?, ?, ?)', [payload.name, email, 'GOOGLE_AUTH', role, tier]);
      user = { id: result.lastID, email, role, tier };
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backtest/audit', authenticateToken, async (req: any, res: any) => {
  try {
    const { basket = 'Elite Basket', strategy: selectedStrategyId } = req.query;
    
    // --- Institutional Tier Guard ---
    const userTier = req.user?.tier || 'free';
    const tierWeights: Record<string, number> = { 'free': 1, 'pro': 2, 'alpha': 3 };
    const strategy = STRATEGIES.find(s => s.id === selectedStrategyId);
    const requiredTier = strategy?.tier || 'free';
    
    if (tierWeights[userTier] < tierWeights[requiredTier]) {
      return res.status(403).json({ 
        error: 'Access Denied', 
        message: `This strategy requires a ${requiredTier.toUpperCase()} tier subscription.`,
        requiredTier 
      });
    }

    const symbols = BASKETS[basket as string] || Array.from(new Set(Object.values(BASKETS).flat()));

    // Deduplicate and filter out index symbols
    const uniqueSymbols = Array.from(new Set(symbols)).filter(s => s && s !== '^NSEI');

    const snapshot = await getSnapshotFromCloud(uniqueSymbols);
    const results = [];
    for (const sym of uniqueSymbols) {
      const cleanSym = sym.trim().toUpperCase();
      let snap = snapshot[cleanSym] || snapshot[`${cleanSym}.NS`];
      
      // Multi-layer lookup fallback
      if (!snap) {
         const keys = Object.keys(snapshot);
         const key = keys.find(k => k.replace('.NS', '') === cleanSym);
         if (key) snap = snapshot[key];
      }

      if (!snap) {
         // Return placeholder node for symbols not yet in cache (Avoids 0 Nodes display)
         results.push({
            symbol: cleanSym,
            entryPrice: 0,
            target: 0,
            currentPrice: 0,
            isBuyZone: false,
            isPass: false,
            score: 0,
            reason: 'Audit Pending: Node Warming Up',
            sector: MANUAL_SECTOR_MAP[cleanSym] || 'General',
            auditSegments: { profitability: { score: 0 }, safety: { score: 0 }, growth: { score: 0 }, efficiency: { score: 0 } }
         });
         continue;
      }

      const audit = await validateBatch9(cleanSym, snap, basket as string);
      const strategyId = (selectedStrategyId as string) || 'SR_STRATEGY';
      const strategyData: any = runStrategyAnalysis(strategyId, snap, snap.quote.marketCap, basket as string);
      
      // Compute ABCD levels fallback if they are not natively provided by the strategy
      const basePrice = strategyData?.entryPrice || snap.quotes[snap.quotes.length - 1].close;
      const abcdLevels = strategyData?.abcd || {
        a: { price: Math.round(basePrice), date: strategyData?.triggerDate || snap.quotes[snap.quotes.length - 1].date || new Date().toISOString().split('T')[0] },
        b: { price: Math.round(basePrice * 0.90), date: '' },
        c: { price: Math.round(basePrice * 0.81), date: '' },
        d: { price: Math.round(basePrice * 0.73), date: '' }
      };

      // Strict Institutional Guard: 60+ Score Required
      const passThreshold = 60;
      const finalPass = audit.score >= passThreshold && !audit.reason.includes('Hard Reject');

      // Bifurcation Logic Alignment
      const isStrategyQualified = strategyData?.status === 'QUALIFIED';
      const isStrategyObservation = strategyData?.status === 'OBSERVATION';

      results.push({
        symbol: sym,
        entryTime: strategyData?.triggerDate || snap.quotes[snap.quotes.length-1].date,
        entryPrice: strategyData?.entryPrice || 0,
        target: strategyData?.target || 0,
        currentPrice: snap.quotes[snap.quotes.length - 1].close,
        isBuyZone: isStrategyQualified, // Strictly QUALIFIED for the 'Open' tab
        isObservation: isStrategyObservation,
        reason: strategyData?.status || 'Pattern Not Found',
        isPass: finalPass,
        score: audit.score,
        abcd: abcdLevels,
        sector: MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General',
        peRatio: snap.quote?.pe || snap.screener?.peRatio,
        peMedians: snap.screener?.peMedians || {},
        auditSegments: {
          profitability: audit.profitabilityQuality,
          safety: audit.balanceSheetSafety,
          growth: audit.growthQuality,
          efficiency: audit.efficiencyGovernance
        }
      });
    }
    res.json({ allStocks: results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backtest/alpha-40', authenticateToken, async (req: any, res) => {
  try {
    // --- Alpha Hub Lockdown ---
    if (req.user.tier !== 'alpha') {
      return res.status(403).json({ 
        error: 'Access Denied', 
        message: 'The Alpha Hub is reserved for Institutional Alpha subscribers.',
        requiredTier: 'alpha'
      });
    }

    const cache = await getAlpha40Cache();
    if (cache) {
      return res.json({ 
        stocks: cache.active, 
        summary: { 
          total: cache.active.length, 
          large: cache.capStats.LARGE, 
          mid: cache.capStats.MID, 
          small: cache.capStats.SMALL, 
          sectorStats: cache.sectorStats 
        } 
      });
    }
    res.status(503).json({ error: 'Terminal warming up...' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/public/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const snapshot = await getSnapshotFromCloud([symbol]);
    const snap = snapshot[symbol];
    if (!snap) return res.status(404).json({ error: 'Asset not found' });
    
    const audit = await validateBatch9(symbol, snap, 'Elite Basket');
    
    let maxUpside = 30; // Default Institutional Target
    const qualified = STRATEGIES.filter(s => {
      const sRes: any = runStrategyAnalysis(s.id, snap, snap.quote.marketCap, 'Elite Basket');
      if (sRes?.isBuyZone && sRes?.target) {
        const lastQuote = snap.quotes[snap.quotes.length - 1];
        const entry = sRes.entryPrice || lastQuote.close;
        const potential = ((sRes.target / entry) - 1) * 100;
        if (potential > maxUpside) maxUpside = Math.round(potential);
      }
      return sRes?.isBuyZone;
    });

    const capCr = (snap.quote?.marketCap || 0) / 10000000;
    const basketType = capCr >= 20000 ? 'LARGE' : (capCr >= 5000 ? 'MID' : 'SMALL');

    // Extract ABCD levels for the primary strategy
    const primaryStrat = qualified[0];
    let abcd = null;
    if (primaryStrat) {
      const sRes: any = runStrategyAnalysis(primaryStrat.id, snap, snap.quote.marketCap, 'Elite Basket');
      abcd = sRes?.abcd;
    }

    // Fallback ABCD levels if none provided
    if (!abcd) {
       const lastPrice = snap.quotes[snap.quotes.length - 1].close;
       abcd = {
          a: { price: Math.round(lastPrice), date: new Date().toISOString() },
          b: { price: Math.round(lastPrice * 0.90), date: '' },
          c: { price: Math.round(lastPrice * 0.81), date: '' },
          d: { price: Math.round(lastPrice * 0.73), date: '' }
       };
    }

    res.json({ 
      symbol, 
      score: audit.score, 
      isPass: audit.isPass, 
      strategies: qualified,
      smartMoney: audit.smartMoneyTotal || 0,
      upside: maxUpside,
      basket: basketType,
      risk: audit.score >= 80 ? 'LOW' : (audit.score >= 70 ? 'MODERATE' : 'HIGH'),
      abcd
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stock-fundamentals', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    const snapshot = await getSnapshotFromCloud([symbol as string]);
    let snap = snapshot[symbol as string];
    
    // Auto-Refresh Logic for Missing or Stale Data
    const isDataIncomplete = !snap || !snap.screener?.athSales || snap.screener?.athSales === 0;
    const isStale = snap && (new Date().getTime() - new Date(snap.lastUpdated).getTime() > 24 * 60 * 60 * 1000);

    if (isDataIncomplete || isStale) {
      console.log(`🔄 [AUTO-REFRESH] Patching data for ${symbol}...`);
      await updateMarketSnapshot([symbol as string]);
      const freshSnapshot = await getSnapshotFromCloud([symbol as string]);
      snap = freshSnapshot[symbol as string];
    }

    if (!snap) return res.status(404).json({ error: 'Asset data unavailable' });

    const audit = await validateBatch9(symbol as string, snap, 'Elite Basket');
    const lastQuote = snap.quotes[snap.quotes.length - 1];
    
    res.json({
      symbol,
      price: lastQuote?.close,
      change: snap.quote?.regularMarketChangePercent || 0,
      marketCap: snap.quote?.marketCap,
      industry: MANUAL_SECTOR_MAP[symbol as string] || snap.screener?.industry || 'General',
      peRatio: snap.quote?.pe || snap.screener?.peRatio,
      peMedians: snap.screener?.peMedians || {},
      returnOnEquity: snap.screener?.returnOnEquity || snap.quote?.roe,
      roce: snap.screener?.roce,
      netDebtToEquity: snap.screener?.netDebtToEquity || (snap.quote?.debtToEquity / 100),
      athSales: snap.screener?.athSales,
      athNetProfit: snap.screener?.athNetProfit,
      currentSales: snap.screener?.currentSales,
      currentNetProfit: snap.screener?.currentNetProfit,
      fiftyTwoWeekHigh: snap.quote?.fiftyTwoWeekHigh,
      beta: snap.quote?.beta,
      shareholding: audit.metrics,
      audit: {
        score: audit.score,
        reason: audit.reason,
        universe: audit.isPass ? 'INSTITUTIONAL' : 'WATCHLIST',
        profitabilityQuality: audit.profitabilityQuality,
        balanceSheetSafety: audit.balanceSheetSafety,
        growthQuality: audit.growthQuality,
        efficiencyGovernance: audit.efficiencyGovernance
      }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ADDITIONAL ROUTES TO CONNECT FRONTEND & LOCAL SERVER ---

const getMarketStatus = () => {
  const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  
  const day = istDate.getDay(); // 0-6
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const currentTime = hours * 100 + minutes;

  if (day === 0 || day === 6) return 'CLOSED'; 
  
  if (currentTime >= 900 && currentTime < 915) return 'PRE-MARKET';
  if (currentTime >= 915 && currentTime <= 1530) return 'LIVE';
  if (currentTime > 1530 && currentTime < 1600) return 'POST-MARKET';
  return 'CLOSED';
};

const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  next();
};

app.get('/api/market-indices', async (req, res) => {
  try {
    const symbols = ['^NSEI', '^NSEBANK', '^BSESN'];
    const status = getMarketStatus();
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // Fetch directly from Yahoo query2 API (which is free from cloud IP rate-limit blocks)
          const response = await axios.get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json'
            }
          });
          const quote = response.data.chart.result[0].meta;
          const price = quote.regularMarketPrice;
          const ath = quote.fiftyTwoWeekHigh;
          const prevClose = quote.chartPreviousClose || price;
          const change = ((price - prevClose) / prevClose) * 100;

          return {
            name: symbol === '^NSEI' ? 'NIFTY 50' : (symbol === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'),
            price,
            ath,
            openPrice: prevClose,
            change
          };
        } catch (e: any) {
          console.warn(`⚠️ [Indices Fallback] query2 failed for ${symbol}: ${e.message}. Attempting library fallback...`);
          try {
            const quote: any = await yahooFinance.quote(symbol);
            return {
              name: symbol === '^NSEI' ? 'NIFTY 50' : (symbol === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'),
              price: quote.regularMarketPrice,
              ath: quote.fiftyTwoWeekHigh,
              openPrice: quote.regularMarketOpen,
              change: quote.regularMarketChangePercent
            };
          } catch (err: any) {
            console.error(`❌ [Indices Fallback] Library fallback also failed for ${symbol}: ${err.message}. Serving updated static estimation.`);
            return {
              name: symbol === '^NSEI' ? 'NIFTY 50' : (symbol === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'),
              price: symbol === '^NSEI' ? 23366 : (symbol === '^NSEBANK' ? 54496 : 74243),
              ath: symbol === '^NSEI' ? 26373 : (symbol === '^NSEBANK' ? 54496 : 74243),
              change: 0
            };
          }
        }
      })
    );
    res.json({ status, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    const db = getDB();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const role = isAdmin ? 'admin' : 'user';
    const tier = isAdmin ? 'alpha' : 'free';

    const result = await db.run(
      'INSERT INTO users (name, email, password, role, tier, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), hashedPassword, role, tier, 1]
    );

    const token = jwt.sign({ id: result.lastID, role }, JWT_SECRET);
    res.json({ token, user: { id: result.lastID, name, email: email.toLowerCase(), role, tier } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`🔑 [LOGIN-ATTEMPT] Email: "${normalizedEmail}"`);
    
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!user) {
      console.log(`❌ [LOGIN-FAILED] User not found for email: "${normalizedEmail}"`);
      return res.status(401).json({ error: 'User not found' });
    }
    
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);
    const isValid = user.password === 'GOOGLE' ? isAdmin : await bcrypt.compare(password, user.password);
    console.log(`ℹ️ [LOGIN-CHECK] Found user. ID: ${user.id}, Role: ${user.role}, IsAdmin: ${isAdmin}, passwordTypeGoogle: ${user.password === 'GOOGLE'}, isValid: ${isValid}`);
    
    if (!isValid) {
      console.log(`❌ [LOGIN-FAILED] Invalid credentials for email: "${normalizedEmail}"`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    console.log(`✅ [LOGIN-SUCCESS] User ${user.id} logged in successfully`);
    res.json({ token, user: { ...user, role: isAdmin ? 'admin' : user.role, tier: isAdmin ? 'alpha' : user.tier } });
  } catch (e: any) { 
    console.error(`🚨 [LOGIN-ERROR] error:`, e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/auth/mobile-send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });
    console.log(`📡 [AUTH] Mobile OTP requested for: ${mobile}`);
    res.json({ success: true, message: 'OTP flow initialized' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/mobile-verify-otp', async (req, res) => {
  const start = Date.now();
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP are required' });

    const db = getDB();
    const identifier = `${mobile}@marketbeacon.com`;
    let user = await db.get('SELECT * FROM users WHERE email = ?', [identifier]);

    const role = 'user';
    const tier = 'free';

    if (!user) {
      console.log(`🆕 [AUTH] Creating new mobile user: ${mobile}`);
      const result = await db.run(
        'INSERT INTO users (name, email, password, role, tier, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [`User ${mobile.slice(-4)}`, identifier, 'MOBILE_AUTH', role, tier, 1]
      );
      user = { id: result.lastID, name: `User ${mobile.slice(-4)}`, email: identifier, role, tier, is_active: 1 };
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    console.log(`✅ [AUTH] Mobile Login Success: ${mobile} (${Date.now() - start}ms)`);
    res.json({ token, user: { ...user, role: user.role, tier: user.tier } });
  } catch (e: any) {
    console.error(`❌ [AUTH ERROR] Mobile Verify Failed:`, e.message);
    res.status(500).json({ error: `Auth Error: ${e.message}` });
  }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  let daysRemaining = null;
  if (req.user?.subscription_expiry) {
    const diff = new Date(req.user.subscription_expiry).getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  res.json({ user: { ...req.user, daysRemaining } });
});

app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const user = await db.get('SELECT id, name, email, mobile, tier, created_at FROM users WHERE id = ?', [req.user.id]);
    
    // Calculate Trading Stats
    const trades = await db.all('SELECT status, entry_price, quantity, exit_price FROM trades WHERE user_id = ?', [req.user.id]);
    
    const stats = {
      totalTrades: trades.length,
      openTrades: trades.filter(t => t.status === 'OPEN').length,
      totalRealizedPnL: trades
        .filter(t => t.status === 'CLOSED' && t.exit_price)
        .reduce((sum, t) => sum + (t.exit_price - t.entry_price) * t.quantity, 0)
    };

    res.json({ ...user, stats });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/redeem-voucher', authenticateToken, async (req: any, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Voucher code is required' });

    const db = getDB();
    
    // 1. Validate Voucher
    const voucher = await db.get('SELECT * FROM vouchers WHERE code = ? AND is_active = 1', [code.toUpperCase()]);
    if (!voucher) return res.status(404).json({ error: 'Invalid or expired voucher code' });

    if (voucher.current_uses >= voucher.max_uses) {
      return res.status(400).json({ error: 'Voucher usage limit reached' });
    }

    // 2. Check for Previous Redemption
    const existing = await db.get('SELECT * FROM voucher_redemptions WHERE voucher_id = ? AND user_id = ?', [voucher.id, req.user.id]);
    if (existing) return res.status(400).json({ error: 'You have already redeemed this voucher' });

    // 3. Process Redemption
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (voucher.duration_days || 7));

    await db.batch([
      { sql: 'UPDATE vouchers SET current_uses = current_uses + 1 WHERE id = ?', args: [voucher.id] },
      { sql: 'INSERT INTO voucher_redemptions (voucher_id, user_id) VALUES (?, ?)', args: [voucher.id, req.user.id] },
      { sql: 'UPDATE users SET tier = ?, subscription_expiry = ?, is_active = 1 WHERE id = ?', args: [voucher.tier, expiry.toISOString(), req.user.id] }
    ]);

    console.log(`🎁 [VOUCHER] User ${req.user.email} redeemed ${code} (Tier: ${voucher.tier})`);
    res.json({ success: true, tier: voucher.tier, expiry: expiry.toISOString() });

  } catch (e: any) {
    console.error('🔥 [Voucher Error]:', e.message);
    res.status(500).json({ error: 'Failed to redeem voucher. System node error.' });
  }
});

app.post('/api/user/upgrade-request', authenticateToken, async (req: any, res) => {
  try {
    const { requested_tier, billing_cycle, transaction_id } = req.body;
    if (!requested_tier || !transaction_id) {
      return res.status(400).json({ error: 'Requested tier and transaction ID are required.' });
    }
    
    // Check UTR format: exactly 12 digits
    if (!/^\d{12}$/.test(transaction_id)) {
      return res.status(400).json({ error: 'Transaction ID must be a 12-digit UTR number.' });
    }

    const db = getDB();
    
    // Check if transaction_id already exists (to prevent duplicate submissions)
    const existing = await db.get('SELECT id FROM upgrade_requests WHERE transaction_id = ?', [transaction_id]);
    if (existing) {
      return res.status(400).json({ error: 'This transaction ID has already been submitted.' });
    }

    // Insert the upgrade request
    await db.run(
      'INSERT INTO upgrade_requests (user_id, requested_tier, billing_cycle, transaction_id, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, requested_tier.toLowerCase(), billing_cycle || 'monthly', transaction_id, 'pending']
    );

    console.log(`💰 [UPGRADE REQUEST] User ${req.user.email} submitted transaction ${transaction_id} for ${requested_tier} (${billing_cycle || 'monthly'})`);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const watchlist = await db.all('SELECT * FROM watchlists WHERE user_id = ? ORDER BY added_at DESC', [req.user.id]);
    res.json(watchlist);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const { symbol } = req.body;
    const db = getDB();
    await db.run('INSERT OR IGNORE INTO watchlists (user_id, symbol) VALUES (?, ?)', [req.user.id, symbol]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/watchlist/:symbol', authenticateToken, async (req: any, res) => {
  try {
    const { quantity, buy_price } = req.body;
    const db = getDB();
    await db.run(
      'UPDATE watchlists SET quantity = ?, buy_price = ? WHERE user_id = ? AND symbol = ?',
      [quantity, buy_price, req.user.id, req.params.symbol]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM watchlists WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/watchlist/bulk', authenticateToken, async (req: any, res) => {
  try {
    const { holdings, mode } = req.body;
    const db = getDB();
    
    if (mode === 'overwrite') {
      await db.run('DELETE FROM watchlists WHERE user_id = ?', [req.user.id]);
    }
    
    await db.run('BEGIN TRANSACTION');
    try {
      for (const item of holdings) {
        const symbol = item.symbol.toUpperCase().trim();
        const quantity = parseFloat(item.quantity) || 0;
        const buyPrice = parseFloat(item.buyPrice) || 0;
        
        const existing = await db.get('SELECT * FROM watchlists WHERE user_id = ? AND symbol = ?', [req.user.id, symbol]);
        if (existing) {
          if (mode === 'merge') {
            const oldQty = existing.quantity || 0;
            const oldPrice = existing.buy_price || 0;
            const newQty = oldQty + quantity;
            const newPrice = newQty > 0 ? ((oldPrice * oldQty) + (buyPrice * quantity)) / newQty : 0;
            await db.run(
              'UPDATE watchlists SET quantity = ?, buy_price = ? WHERE user_id = ? AND symbol = ?',
              [newQty, newPrice, req.user.id, symbol]
            );
          } else {
            await db.run(
              'UPDATE watchlists SET quantity = ?, buy_price = ? WHERE user_id = ? AND symbol = ?',
              [quantity, buyPrice, req.user.id, symbol]
            );
          }
        } else {
          await db.run(
            'INSERT INTO watchlists (user_id, symbol, quantity, buy_price) VALUES (?, ?, ?, ?)',
            [req.user.id, symbol, quantity, buyPrice]
          );
        }
      }
      await db.run('COMMIT');
    } catch (txnError: any) {
      try { await db.run('ROLLBACK'); } catch (_) {}
      throw txnError;
    }
    
    res.json({ success: true, count: holdings.length });
  } catch (e: any) {
    console.error('🔥 [Bulk Watchlist Error]:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/watchlist/:symbol', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM watchlists WHERE user_id = ? AND symbol = ?', [req.user.id, req.params.symbol]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/trades', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const trades = await db.all('SELECT * FROM trades WHERE user_id = ? ORDER BY entry_date DESC', [req.user.id]);
    res.json(trades);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/trades', authenticateToken, async (req: any, res) => {
  try {
    const { symbol, entry_date, entry_price, quantity, strategy, target_price, stop_loss, notes, level } = req.body;
    const db = getDB();
    await db.run(
      'INSERT INTO trades (user_id, symbol, entry_date, entry_price, quantity, strategy, target_price, stop_loss, notes, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, symbol, entry_date, entry_price, quantity, strategy, target_price, stop_loss, notes, level || 'A']
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/trades/:id', authenticateToken, async (req: any, res) => {
  try {
    const { status, exit_date, exit_price, notes } = req.body;
    const db = getDB();
    await db.run(
      'UPDATE trades SET status = ?, exit_date = ?, exit_price = ?, notes = ? WHERE id = ? AND user_id = ?',
      [status, exit_date, exit_price, notes, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Single trade delete ───────────────────────────────────────────────────────
app.delete('/api/trades/:id', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const result = await db.run(
      'DELETE FROM trades WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e: any) {
    console.error('🔥 [Trade Delete Error]:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Bulk trade delete ─────────────────────────────────────────────────────────
app.post('/api/trades/batch-delete', authenticateToken, async (req: any, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided.' });
    }
    const db = getDB();
    const placeholders = ids.map(() => '?').join(', ');
    await db.run(
      `DELETE FROM trades WHERE user_id = ? AND id IN (${placeholders})`,
      [req.user.id, ...ids]
    );
    res.json({ success: true, deleted: ids.length });
  } catch (e: any) {
    console.error('🔥 [Batch Delete Error]:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Reopen a closed trade ─────────────────────────────────────────────────────
app.patch('/api/trades/:id/reopen', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run(
      'UPDATE trades SET status = ?, exit_date = NULL, exit_price = NULL WHERE id = ? AND user_id = ?',
      ['OPEN', req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e: any) {
    console.error('🔥 [Trade Reopen Error]:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/marketplace', async (req, res) => {
  const plans = [
    { 
      id: 1, 
      name: 'Free Institutional', 
      tier: 'free', 
      price: 199,
      cagr: '18%', 
      risk: 'Low', 
      features: [
        'Watchlist', 
        'Basic Signals', 
        'Structural Pivot (Breakouts)', 
        'Dynamic Reversal Matrix', 
        'Annual Range Statistics', 
        'Quantum Stacking Averages', 
        'Standard Portfolio Mix Audit'
      ] 
    },
    { 
      id: 2, 
      name: 'Pro Execution', 
      tier: 'pro', 
      price: 99,
      cagr: '28%', 
      risk: 'Medium', 
      features: [
        'Alpha Hub Access',
        'Matrix Access', 
        'ABCD Ladder',
        'Structural Pivot (Breakouts)', 
        'Dynamic Reversal Matrix', 
        'Annual Range Statistics', 
        'Quantum Stacking Averages', 
        'Standard Portfolio Mix Audit'
      ] 
    },
    { 
      id: 3, 
      name: 'Alpha Priority', 
      tier: 'alpha', 
      price: 199,
      cagr: '42%', 
      risk: 'Institutional', 
      features: [
        'Alpha Hub Access',
        'Priority Institutional Nodes',
        'Velocity Retest (Deep Demand)',
        '67% Deep Recovery Audit',
        'Supply-Demand Resistance Logic',
        'Real-Time Alpha Notifications'
      ] 
    }
  ];
  
  const body = JSON.stringify(plans);
  const tag = etag(body);
  res.setHeader('ETag', tag);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json(plans);
});

app.get('/api/stock-prices', async (req, res) => {
  try {
    const symbolsQuery = req.query.symbols as string;
    if (!symbolsQuery) return res.status(400).json({ error: 'Symbols required' });
    const symbols = symbolsQuery.split(',').map(s => s.trim().toUpperCase());
    const snapshot = await getSnapshotFromCloud(symbols);
    const results = symbols.map(s => {
      const snap = snapshot[s];
      if (!snap) return { symbol: s, price: 0 };
      const lastQuote = snap.quotes && snap.quotes.length > 0 ? snap.quotes[snap.quotes.length - 1] : null;
      return { 
        symbol: s, 
        price: lastQuote?.close || snap.quote?.regularMarketPrice || 0, 
        ath: snap.quote?.fiftyTwoWeekHigh || 0, 
        marketCap: snap.quote?.marketCap || 0, 
        sector: MANUAL_SECTOR_MAP[s] || snap.screener?.industry || 'General',
        change: snap.quote?.regularMarketChangePercent || 0
      };
    });
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const users = await db.all('SELECT id, name, email, mobile, role, tier, subscription_start, subscription_expiry, is_active FROM users');
    res.json(users);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { name, email, mobile, role, tier, subscription_start, subscription_expiry, is_active } = req.body;
    const db = getDB();
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email ? email.toLowerCase() : null); }
    if (mobile !== undefined) { updates.push('mobile = ?'); params.push(mobile); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (tier !== undefined) { updates.push('tier = ?'); params.push(tier); }
    if (subscription_start !== undefined) { updates.push('subscription_start = ?'); params.push(subscription_start || null); }
    if (subscription_expiry !== undefined) { updates.push('subscription_expiry = ?'); params.push(subscription_expiry || null); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(Number(is_active)); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(req.params.id);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/upgrade-requests', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const requests = await db.all(`
      SELECT ur.*, u.name, u.email, u.mobile 
      FROM upgrade_requests ur 
      JOIN users u ON ur.user_id = u.id 
      ORDER BY ur.created_at DESC
    `);
    res.json(requests);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/upgrade-requests/:id/approve', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const requestId = req.params.id;
    const request = await db.get('SELECT * FROM upgrade_requests WHERE id = ?', [requestId]);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    const user = await db.get('SELECT * FROM users WHERE id = ?', [request.user_id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const durationDays = request.billing_cycle === 'yearly' ? 365 : 30;
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + durationDays);

    const startStr = now.toISOString();
    const expiryStr = expiry.toISOString();

    await db.run('UPDATE users SET tier = ?, subscription_start = ?, subscription_expiry = ? WHERE id = ?', [request.requested_tier, startStr, expiryStr, request.user_id]);
    await db.run('UPDATE upgrade_requests SET status = "approved" WHERE id = ?', [requestId]);

    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/vouchers', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const vouchers = await db.all('SELECT * FROM vouchers ORDER BY created_at DESC');
    res.json(vouchers);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/vouchers', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { code, tier, duration_days, max_uses } = req.body;
    if (!code || !tier || !duration_days) return res.status(400).json({ error: 'Missing code, tier, or duration_days' });
    const db = getDB();

    const existing = await db.get('SELECT id FROM vouchers WHERE code = ?', [code.toUpperCase()]);
    if (existing) return res.status(400).json({ error: 'Voucher code already exists' });

    await db.run(
      'INSERT INTO vouchers (code, tier, duration_days, max_uses, current_uses, is_active) VALUES (?, ?, ?, ?, 0, 1)',
      [code.toUpperCase(), tier, Number(duration_days), Number(max_uses || 100)]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- Feedback Endpoints ---
app.post('/api/feedback', authenticateToken, async (req: any, res: any) => {
  try {
    const { rating, disposition, comment, timestamp, url } = req.body;
    const userId = req.user.id;
    const db = getDB();
    
    console.log(`📝 [FEEDBACK] Logging for user ${userId}: ${disposition} (${rating}/5)`);

    await db.run(
      'INSERT INTO feedback (user_id, rating, disposition, comment, timestamp, url) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, rating, disposition, comment, timestamp || new Date().toISOString(), url || '']
    );
    res.json({ success: true, message: 'Feedback logged successfully' });
  } catch (e: any) {
    console.error('🔥 [FEEDBACK ERROR]:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/feedback', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const feedbacks = await db.all(`
      SELECT f.*, u.name as user_name, u.email as user_email 
      FROM feedback f 
      JOIN users u ON f.user_id = u.id 
      ORDER BY f.id DESC
    `);
    res.json(feedbacks);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});



// --- Admin Management Endpoints ---
app.delete('/api/admin/feedback/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM feedback WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/vouchers/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/upgrade-requests/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM upgrade_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- Notifications & Feedback Reply ---
app.get('/api/notifications', authenticateToken, async (req: any, res: any) => {
  try {
    const db = getDB();
    const notes = await db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(notes);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req: any, res: any) => {
  try {
    const db = getDB();
    await db.run('UPDATE notifications SET unread = 0 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/feedback/:id/reply', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const { reply } = req.body;
    const feedbackId = req.params.id;
    const db = getDB();

    // 1. Get feedback details to find the user
    const feedback = await db.get('SELECT user_id, disposition FROM feedback WHERE id = ?', [feedbackId]);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

    // 2. Update feedback with reply
    await db.run(
      'UPDATE feedback SET reply_text = ?, replied_at = ? WHERE id = ?',
      [reply, new Date().toISOString(), feedbackId]
    );

    // 3. Create notification for user
    await db.run(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [feedback.user_id, 'Feedback Resolved', `Admin replied to your ${feedback.disposition} report: "${reply}"`, 'audit']
    );

    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- INSTITUTIONAL WORKER: CACHE PRIMING ---
const precalculateGrowth = async () => {
  try {
    const growthSymbols = await getDynamicBasket();
    console.log(`👷 [WORKER] Priming Growth Basket Cache (${growthSymbols.length} symbols)...`);
    await updateMarketSnapshot(growthSymbols);
    console.log('✅ [WORKER] Growth Basket Cache Primed.');
  } catch (e: any) {
    console.error('❌ [WORKER] Growth Priming Failed:', e.message);
  }
};

const startServer = async () => {
  const PORT = Number(process.env.PORT) || 3001;
  try {
    await initDB();
    await initSnapshotCache();
    initScreenerCron();
    setTimeout(precalculateAlpha40, 5000); 
    setTimeout(precalculateGrowth, 15000); // Prime growth basket shortly after startup
    app.listen(PORT, '0.0.0.0', () => {
      console.log('----------------------------------------------------');
      console.log('🚀 MARKETBEACON PRO: PHASE 1 LAUNCH ACTIVE');
      console.log(`🌐 Terminal Node Cloud Active on Port ${PORT}`);
      console.log('🛡️  Institutional Safe-Guard: Standard Mode');
      console.log('----------------------------------------------------');
    });
  } catch (e) { console.error(e); }
};

startServer();
