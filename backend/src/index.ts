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
import cron from 'node-cron';
import { 
  initScreenerCron, 
  updateMarketSnapshot, 
  getDynamicBasket,
  initSnapshotCache,
  getMarketSnapshot
} from './screener.js';
import { NIFTY_500 } from './universe.js';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { precalculateAlpha40, getAlpha40Cache } from './services/worker.js';
import { initDB, getDB } from './db.js';
import { notifyAdmins } from './services/notificationService.js';
import { runHealthCheck, runAndNotifyHealthCheck } from './services/healthCheck.js';
import { scheduleAuditCron } from './cron/auditScheduler.js';
import { backtestAllStrategies, backtestStrategy } from './services/backtestEngine.js';

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
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Institutional Reset (67%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket', 'Fallen Value Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest (20%)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SR_STRATEGY', name: 'Support and Resistance Strategy (S&R)', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'alpha', isLocked: true },
  { id: 'SMA_BCD', name: 'SMA + BCD', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'RHS_ABCD', name: 'Reverse Head and Shoulder + ABCD', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'CUP_HANDLE_ABCD', name: 'Cup with Handle + ABCD', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: '52W_HIGH_LOW', name: '52 week High Low', baskets: ['Quality Basket', 'Elite Basket'], isLive: true, tier: 'pro', isLocked: true },
  { id: 'BOLLINGER', name: 'Bollinger Band', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_SHORT', name: 'Envelope Short', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'free', isLocked: true },
  { id: 'ENVELOPE_LONG', name: 'Envelope Long', baskets: ['Growth Basket', 'Quality Basket', 'Elite Basket'], isLive: true, tier: 'free', isLocked: true }
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
    "IDFCFIRSTB", "GLENMARK", "MAHABANK", "TIINDIA", "LINDEINDIA", "COFORGE", "OBEROIRLTY", "BERGEPAINT", "JSL", "MFSL", "TATAMOTORS",
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
};

app.get('/api/health', (req, res) => res.json({ 
  status: 'active', 
  node: 'Turbo-Local-Production', 
  version: '18.0.8-PRO',
  verify: 'Alpha data binding resolved — Supabase dependency removed',
  timestamp: new Date().toISOString()
}));

app.post('/api/leads', async (req, res) => {
  try {
    const { email, segment } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const db = getDB();
    await db.run('INSERT INTO leads (email, segment) VALUES (?, ?)', [email.trim().toLowerCase(), segment || 'retail']);
    res.json({ success: true });
  } catch (err: any) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.json({ success: true, duplicate: true });
    }
    console.error('Lead capture error:', err);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

// --- Waitlist ---
app.post('/api/waitlist', async (req, res) => {
  try {
    const { name, email, phone, tier_requested } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }
    const db = getDB();
    await db.run('INSERT INTO waitlist (name, email, phone, tier_requested) VALUES (?, ?, ?, ?)', [name.trim(), email.trim().toLowerCase(), phone || null, tier_requested || 'alpha']);
    res.json({ success: true, message: 'You are on the waiting list. We will notify you when a slot opens.' });
  } catch (err: any) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.json({ success: true, duplicate: true, message: 'Already on waitlist!' });
    }
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

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
    const { basket: basketParam = 'Elite Basket', strategy: selectedStrategyId } = req.query;
    const basket = basketParam as string;
    
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

    // If a strategy has configured baskets, use the union of all its baskets' symbols;
    // otherwise fall back to the requested basket or all symbols.
    let symbols: string[];
    if (strategy?.baskets?.length) {
      symbols = Array.from(new Set(strategy.baskets.flatMap(b => BASKETS[b] || [])));
    } else {
      symbols = BASKETS[basket] || Array.from(new Set(Object.values(BASKETS).flat()));
    }

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
      // Use the strategy's native isBuyZone (most strategies set this directly)
      // and upgrade status: ENVELOPE_LONG/BOLLINGER etc don't set 'status' field
      const strategyIsBuyZone = strategyData?.isBuyZone === true;
      const strategyObservation = strategyData?.status === 'OBSERVATION';
      
      // Reason: prefer fundamental audit reason when failing, strategy status when passing
      const displayReason = strategyData?.status 
        ? strategyData.status 
        : (strategyIsBuyZone ? 'QUALIFIED' : 'Pattern Not Found - ' + audit.reason);

      results.push({
        symbol: sym,
        entryTime: strategyData?.triggerDate || snap.quotes[snap.quotes.length-1].date,
        entryPrice: strategyData?.entryPrice || 0,
        target: strategyData?.target || 0,
        currentPrice: snap.quotes[snap.quotes.length - 1].close,
        isBuyZone: strategyIsBuyZone,
        isObservation: strategyObservation,
        reason: displayReason,
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

// ── Strategy Backtest History (20-year walk) ──
app.get('/api/backtest/history', async (req, res) => {
  try {
    const { symbol, strategy } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    const sym = (symbol as string).toUpperCase();
    const snapshot = await getSnapshotFromCloud([sym]);
    const snap = snapshot[sym];
    if (!snap || !snap.quotes || snap.quotes.length < 200) {
      return res.status(404).json({ error: 'Insufficient historical data for this symbol' });
    }
    const results = backtestAllStrategies(snap.quotes, snap.screener);
    if (strategy) {
      const stratResults = results[strategy as string];
      if (!stratResults) return res.status(404).json({ error: 'Strategy not found' });
      return res.json(stratResults);
    }
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Consolidated backtest for all symbols in a basket ──
app.get('/api/backtest/basket-summary', async (req, res) => {
  try {
    const { basket = 'Elite Basket' } = req.query;
    const symbols = BASKETS[basket as string] || Array.from(new Set(Object.values(BASKETS).flat()));
    const uniqueSymbols = Array.from(new Set(symbols as string[])).filter(s => s && s !== '^NSEI');
    const snapshot = await getSnapshotFromCloud(uniqueSymbols);
    const summary: Record<string, any> = {};

    for (const sym of uniqueSymbols) {
      const snap = snapshot[sym];
      if (!snap || !snap.quotes || snap.quotes.length < 200) continue;
      const results = backtestAllStrategies(snap.quotes, snap.screener, true);
      let bestWinRate = 0, bestAvgRoi = 0, bestStrategy = '', totalTradesAll = 0, winsAll = 0;
      for (const [sid, r] of Object.entries(results)) {
        if (r.totalTrades > 0) {
          totalTradesAll += r.totalTrades;
          winsAll += r.wins;
          if (r.winRate > bestWinRate) { bestWinRate = r.winRate; bestAvgRoi = r.avgRoi; bestStrategy = sid; }
        }
      }
      summary[sym] = { bestStrategy, bestWinRate, bestAvgRoi, totalTradesAll, winsAll, winRateAll: totalTradesAll > 0 ? Math.round((winsAll / totalTradesAll) * 10000) / 100 : 0 };
    }
    res.json({ basket, totalSymbols: uniqueSymbols.length, withData: Object.keys(summary).length, stocks: summary });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── NIFTY 50 vs Strategy Comparison (Cache-backed) ──
const NIFTY_SYMBOL = '^NSEI';

const BACKTEST_CACHE_PATH = path.resolve(process.cwd(), 'backtest_nifty_cache.json');

function loadBacktestCache(): any {
  try {
    if (fs.existsSync(BACKTEST_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(BACKTEST_CACHE_PATH, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveBacktestCache(data: any) {
  try { fs.writeFileSync(BACKTEST_CACHE_PATH, JSON.stringify(data)); } catch {}
}

app.get('/api/backtest/nifty-comparison', async (req, res) => {
  try {
    const { refresh } = req.query;

    // Check cache first (unless refresh=1)
    if (refresh !== '1') {
      const cached = loadBacktestCache();
      if (cached && cached.nifty50) return res.json(cached);
    }

    let niftyQuotes: any[] = [];
    const snapshot = await getSnapshotFromCloud([NIFTY_SYMBOL]);
    const niftySnap = snapshot[NIFTY_SYMBOL];
    if (niftySnap?.quotes?.length > 200) {
      niftyQuotes = niftySnap.quotes as any[];
    } else {
      try {
        const period1 = new Date(); period1.setFullYear(period1.getFullYear() - 20);
        const chart = await yahooFinance.chart('^NSEI', { period1: period1.toISOString().split('T')[0], interval: '1d' as any });
        if (chart?.quotes) niftyQuotes = chart.quotes.filter((q: any) => q.close && q.low && q.high);
      } catch (e) {
        return res.status(503).json({ error: 'NIFTY data not available. Could not fetch from upstream.' });
      }
    }
    const niftyStart = niftyQuotes[0]?.close || 0;
    const niftyEnd = niftyQuotes[niftyQuotes.length - 1]?.close || 0;
    const niftyYears = niftyQuotes.length / 252;
    const niftyCagr = niftyYears > 0 ? (Math.pow(niftyEnd / niftyStart, 1 / niftyYears) - 1) * 100 : 0;

    // Use INFY as representative for quick comparison
    const symbols = ['INFY', 'TCS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK'];
    const batchSnapshot = await getSnapshotFromCloud(symbols);

    let totalTrades = 0, totalWins = 0, totalRoiSum = 0, totalDaysSum = 0;
    const strategyTotals: Record<string, { trades: number; wins: number; roiSum: number; daysSum: number }> = {};

    const stratIds = ['BOLLINGER', 'ENVELOPE_LONG', 'ENVELOPE_SHORT'];
    for (const sym of symbols) {
      const snap = batchSnapshot[sym];
      if (!snap || !snap.quotes || snap.quotes.length < 200) continue;
      for (const sid of stratIds) {
        const r = backtestStrategy(sid, snap.quotes, snap.screener, true);
        if (r.totalTrades === 0) continue;
        if (!strategyTotals[sid]) strategyTotals[sid] = { trades: 0, wins: 0, roiSum: 0, daysSum: 0 };
        strategyTotals[sid].trades += r.totalTrades;
        strategyTotals[sid].wins += r.wins;
        strategyTotals[sid].roiSum += r.avgRoi * r.totalTrades;
        strategyTotals[sid].daysSum += r.avgDays * r.totalTrades;
        totalTrades += r.totalTrades;
        totalWins += r.wins;
        totalRoiSum += r.avgRoi * r.totalTrades;
        totalDaysSum += r.avgDays * r.totalTrades;
      }
    }

    const result = {
      nifty50: {
        startPrice: Math.round(niftyStart),
        endPrice: Math.round(niftyEnd),
        years: Math.round(niftyYears * 10) / 10,
        cagr: Math.round(niftyCagr * 100) / 100,
      },
      strategy: {
        totalTrades,
        totalWins,
        winRate: totalTrades > 0 ? Math.round((totalWins / totalTrades) * 10000) / 100 : 0,
        avgRoi: totalTrades > 0 ? Math.round((totalRoiSum / totalTrades) * 100) / 100 : 0,
        avgDays: totalTrades > 0 ? Math.round(totalDaysSum / totalTrades) : 0,
        cagr: totalTrades > 0 && totalDaysSum > 0 ? (() => {
          const winProb = totalWins / totalTrades;
          const avgRoiDec = totalRoiSum / totalTrades / 100;
          const avgFactor = 1 + avgRoiDec * (2 * winProb - 1);
          const tradesPerYear = totalTrades / (niftyYears || 1);
          return Math.round((Math.pow(avgFactor, tradesPerYear) - 1) * 10000) / 100;
        })() : 0,
        strategyBreakdown: Object.entries(strategyTotals).map(([sid, s]) => ({
          strategyId: sid,
          strategyName: sid.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          totalTrades: s.trades,
          winRate: s.trades > 0 ? Math.round((s.wins / s.trades) * 10000) / 100 : 0,
          avgRoi: s.trades > 0 ? Math.round((s.roiSum / s.trades) * 100) / 100 : 0,
          avgDays: s.trades > 0 ? Math.round(s.daysSum / s.trades) : 0,
        })).sort((a, b) => b.winRate - a.winRate),
      }
    };

    saveBacktestCache(result);
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Helper: find which basket a symbol belongs to
function getBasketForSymbol(sym: string): string {
  for (const [basketName, symbols] of Object.entries(BASKETS)) {
    if (symbols.includes(sym)) return basketName;
  }
  return 'Elite Basket'; // fallback
}

app.get('/api/public/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const snapshot = await getSnapshotFromCloud([symbol]);
    const snap = snapshot[symbol];
    if (!snap) return res.status(404).json({ error: 'Asset not found' });
    
    // Determine the stock's actual basket (Elite / Quality / Growth / Fallen Value)
    const stockBasket = getBasketForSymbol(symbol);
    
    const audit = await validateBatch9(symbol, snap, stockBasket);
    
    let maxUpside = 30; // Default Institutional Target
    const qualified = STRATEGIES.filter(s => {
      const sRes: any = runStrategyAnalysis(s.id, snap, snap.quote.marketCap, stockBasket);
      if (sRes?.isBuyZone && sRes?.target) {
        const lastQuote = snap.quotes[snap.quotes.length - 1];
        const entry = sRes.entryPrice || lastQuote.close;
        const potential = ((sRes.target / entry) - 1) * 100;
        if (potential > maxUpside) maxUpside = Math.round(potential);
      }
      return sRes?.isBuyZone;
    });

    // Build detailed strategies array with entry/target/abcd data (aligned with stock-fundamentals)
    const detailedStrategies = qualified.map(s => {
      const sRes: any = runStrategyAnalysis(s.id, snap, snap.quote.marketCap, stockBasket);
      return {
        id: s.id,
        name: s.name,
        tier: s.tier,
        isBuyZone: !!sRes?.isBuyZone,
        entryPrice: sRes?.entryPrice || null,
        target: sRes?.target || null,
        abcd: sRes?.abcd || null,
        tranche: sRes?.tranche || null,
        triggerDate: sRes?.triggerDate || null,
        reason: sRes?.reason || null,
        basketAuthorized: stockBasket
      };
    });

    const capCr = (snap.quote?.marketCap || 0) / 10000000;
    const basketType = capCr >= 20000 ? 'LARGE' : (capCr >= 5000 ? 'MID' : 'SMALL');

    // Extract ABCD levels for the primary strategy
    const primaryStrat = qualified[0];
    let abcd = null;
    if (primaryStrat) {
      const sRes: any = runStrategyAnalysis(primaryStrat.id, snap, snap.quote.marketCap, stockBasket);
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

    function r0(v: number) { return Math.round(v); }
    function r2(v: number) { return Math.round(v * 100) / 100; }
    function cleanPrice(o: any, depth = 0) {
      if (!o || typeof o !== 'object') return;
      for (const k of Object.keys(o)) {
        if (k === 'price' && typeof o[k] === 'number') {
          const before = o[k];
          o[k] = r0(o[k]);
          if (before !== o[k]) console.log(`[CLEAN] ${symbol} ${depth}:${k} ${before} -> ${o[k]}`);
        } else if (typeof o[k] === 'object') {
          cleanPrice(o[k], depth + 1);
        }
      }
    }
    if (abcd) {
      if (abcd.a && typeof abcd.a.price === 'number') abcd.a.price = Math.round(abcd.a.price);
      if (abcd.b && typeof abcd.b.price === 'number') abcd.b.price = Math.round(abcd.b.price);
      if (abcd.c && typeof abcd.c.price === 'number') abcd.c.price = Math.round(abcd.c.price);
      if (abcd.d && typeof abcd.d.price === 'number') abcd.d.price = Math.round(abcd.d.price);
    }

    const response = { 
      symbol, 
      score: Math.round(audit.score), 
      isPass: audit.isPass, 
      strategies: detailedStrategies,
      smartMoney: r2(audit.smartMoneyTotal || 0),
      upside: maxUpside,
      basket: basketType,
      basketName: stockBasket,
      risk: audit.score >= 80 ? 'LOW' : (audit.score >= 70 ? 'MODERATE' : 'HIGH'),
      abcd
    };
    res.json(response);
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

    // Determine the stock's actual basket
    const stockBasket = getBasketForSymbol(symbol as string);
    const mcapCr = (snap.quote?.marketCap || 1) / 10000000;

    const audit = await validateBatch9(symbol as string, snap, stockBasket);
    const lastQuote = snap.quotes[snap.quotes.length - 1];
    const lastPrice = lastQuote?.close || 0;
    const change = snap.quote?.regularMarketChangePercent || 0;

    // Run strategy analysis for this stock with its correct basket
    const computedStrategies: Record<string, any> = {};
    for (const strat of STRATEGIES) {
      try {
        const sRes: any = runStrategyAnalysis(strat.id, snap, mcapCr * 10000000, stockBasket);
        computedStrategies[strat.id] = {
          entryPrice: sRes?.entryPrice,
          target: sRes?.target,
          isBuyZone: !!sRes?.isBuyZone,
          tranche: sRes?.tranche || null,
          abcd: sRes?.abcd || null,
          entryTime: sRes?.triggerDate || null,
          reason: sRes?.reason || null,
          basketAuthorized: stockBasket
        };
      } catch {
        computedStrategies[strat.id] = { isBuyZone: false, reason: 'Error' };
      }
    }
    
    res.json({
      symbol,
      price: Math.round(lastPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      marketCap: snap.quote?.marketCap,
      industry: MANUAL_SECTOR_MAP[symbol as string] || snap.screener?.industry || 'General',
      peRatio: snap.quote?.pe || snap.screener?.peRatio || 0,
      peMedians: snap.screener?.peMedians || {},
      returnOnEquity: Math.round((snap.screener?.returnOnEquity || snap.quote?.roe || 0) * 100) / 100,
      roce: Math.round((snap.screener?.roce || 0) * 100) / 100,
      netDebtToEquity: Math.round((snap.screener?.netDebtToEquity || (snap.quote?.debtToEquity / 100) || 0) * 100) / 100,
      athSales: snap.screener?.athSales,
      athNetProfit: snap.screener?.athNetProfit,
      currentSales: snap.screener?.currentSales,
      currentNetProfit: snap.screener?.currentNetProfit,
      fiftyTwoWeekHigh: snap.quote?.fiftyTwoWeekHigh,
      beta: snap.quote?.beta,
      shareholding: audit.metrics,
      strategies: computedStrategies,
      basketName: stockBasket,
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

// --- Admin: Waitlist ---
app.get('/api/admin/waitlist', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    let sql = 'SELECT * FROM waitlist';
    let countSql = 'SELECT COUNT(*) as total FROM waitlist';
    const params: any[] = [];
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      sql += ' WHERE status = ?';
      countSql += ' WHERE status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows, countResult] = await Promise.all([
      db.all(sql, params),
      db.get(countSql, status && ['pending', 'approved', 'rejected'].includes(status) ? [status] : [])
    ]);
    res.json({ data: rows, total: (countResult as any)?.total || 0, page, limit });
  } catch (err) {
    console.error('Admin waitlist error:', err);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

app.post('/api/admin/waitlist/:id/approve', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    const entry = await db.get('SELECT * FROM waitlist WHERE id = ?', [req.params.id]);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if ((entry as any).status !== 'pending') return res.status(400).json({ error: 'Already processed' });
    const code = `WL${String((entry as any).id).padStart(4, '0')}${Date.now().toString(36).slice(-3).toUpperCase()}`;
    const tier = (entry as any).tier_requested || 'alpha';
    const duration = req.body.duration_days || 7;
    await db.run('INSERT INTO vouchers (code, tier, duration_days, max_uses, current_uses) VALUES (?, ?, ?, 1, 0)', [code, tier, duration]);
    await db.run('UPDATE waitlist SET status = ?, voucher_code = ? WHERE id = ?', ['approved', code, req.params.id]);
    res.json({ success: true, voucher_code: code, tier, duration_days: duration });
  } catch (err) {
    console.error('Waitlist approve error:', err);
    res.status(500).json({ error: 'Failed to approve' });
  }
});

app.post('/api/admin/waitlist/:id/reject', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    await db.run('UPDATE waitlist SET status = ? WHERE id = ?', ['rejected', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Waitlist reject error:', err);
    res.status(500).json({ error: 'Failed to reject' });
  }
});

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
    const user = await db.get('SELECT id, name, email, mobile, tier, created_at, twofa_enabled FROM users WHERE id = ?', [req.user.id]);
    
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

// ── 2FA Setup ──────────────────────────────────────────────────────────────────
app.post('/api/user/2fa/setup', authenticateToken, async (req: any, res) => {
  try {
    const { authenticator } = require('otplib');
    const QRCode = require('qrcode');

    const db = getDB();
    const user = await db.get('SELECT email, twofa_secret, twofa_enabled FROM users WHERE id = ?', [req.user.id]);
    if (user?.['twofa_enabled']) return res.status(400).json({ error: '2FA is already enabled. Disable it first to re-setup.' });

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'MarketBeacon Pro', secret);

    await db.run('UPDATE users SET twofa_secret = ?, twofa_enabled = 0 WHERE id = ?', [secret, req.user.id]);

    const qrDataUrl = await QRCode.toDataURL(otpauth);
    res.json({ secret, qrDataUrl, otpauth });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── 2FA Verify & Enable ────────────────────────────────────────────────────────
app.post('/api/user/2fa/verify', authenticateToken, async (req: any, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token required' });

    const { authenticator } = require('otplib');
    const db = getDB();
    const user = await db.get('SELECT twofa_secret FROM users WHERE id = ?', [req.user.id]);
    if (!user?.['twofa_secret']) return res.status(400).json({ error: 'No 2FA secret found. Run setup first.' });

    const isValid = authenticator.verify({ token, secret: user['twofa_secret'] });
    if (!isValid) return res.status(401).json({ error: 'Invalid token' });

    await db.run('UPDATE users SET twofa_enabled = 1 WHERE id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── 2FA Disable ─────────────────────────────────────────────────────────────────
app.post('/api/user/2fa/disable', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('UPDATE users SET twofa_secret = NULL, twofa_enabled = 0 WHERE id = ?', [req.user.id]);
    res.json({ success: true });
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
      const price = lastQuote?.close || snap.quote?.regularMarketPrice || 0;
      return { 
        symbol: s, 
        price: Math.round(price * 100) / 100, 
        ath: snap.quotes ? Math.round(Math.max(...snap.quotes.map((q: any) => q.high || 0))) : snap.quote?.fiftyTwoWeekHigh || 0, 
        marketCap: snap.quote?.marketCap || 0, 
        sector: MANUAL_SECTOR_MAP[s] || snap.screener?.industry || 'General',
        change: snap.quote?.regularMarketChangePercent || 0
      };
    });
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stock-history', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    const sym = (symbol as string).trim().toUpperCase();
    const snapshot = await getSnapshotFromCloud([sym]);
    const snap = snapshot[sym];
    if (!snap) return res.status(404).json({ error: 'Asset data unavailable' });
    
    const history = (snap.quotes || []).map((q: any) => {
      let timeStr = '';
      if (q.date) {
        if (typeof q.date === 'string') {
          timeStr = q.date.split('T')[0];
        } else if (q.date instanceof Date) {
          timeStr = q.date.toISOString().split('T')[0];
        } else if (typeof q.date.toISOString === 'function') {
          timeStr = q.date.toISOString().split('T')[0];
        } else {
          timeStr = String(q.date).split('T')[0];
        }
      } else {
        timeStr = q.time || q.timestamp;
      }
      return {
        time: timeStr,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume
      };
    });
    
    res.json({
      symbol: sym,
      history
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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

app.post('/api/admin/refresh-alpha', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    res.json({ status: 'calculating...' });
    await precalculateAlpha40();
  } catch (e: any) {
    console.error('❌ [Admin] Refresh Alpha-40 failed:', e.message);
  }
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

// --- STOCK SEARCH (basket + strategy qualification) ---
app.get('/api/search/stock', async (req: any, res: any) => {
  try {
    const query = ((req.query.q || '') as string).toUpperCase().trim();
    if (!query || query.length < 1) return res.json({ results: [] });

    const snap = getMarketSnapshot();
    const matchedSymbols = new Set<string>();
    const basketMap: Record<string, string[]> = {};

    // Search baskets first
    for (const [basket, symbols] of Object.entries(BASKETS)) {
      const found = symbols.filter(s => s.includes(query));
      for (const s of found) {
        matchedSymbols.add(s);
        if (!basketMap[s]) basketMap[s] = [];
        basketMap[s].push(basket);
      }
    }

    // Also search full universe if under 10 results
    if (matchedSymbols.size < 10) {
      const universeFound = (NIFTY_500 || [])
        .map(s => s.replace('.NS', ''))
        .filter(s => s.includes(query) && !matchedSymbols.has(s));
      for (const s of universeFound.slice(0, 10 - matchedSymbols.size)) {
        matchedSymbols.add(s);
      }
    }

    const results = Array.from(matchedSymbols).slice(0, 10).map(sym => {
      const stockSnap = snap[sym];
      const strategies: any[] = [];
      if (stockSnap?.strategies) {
        for (const [key, val] of Object.entries(stockSnap.strategies)) {
          if (typeof val === 'object' && val !== null && (val as any).isBuyZone) {
            const stratName = STRATEGIES.find(s => s.id === key)?.name || key;
            strategies.push({ id: key, name: stratName, status: (val as any).status || 'ACTIVE' });
          }
        }
      }
      let peMedians = stockSnap?.screener?.peMedians || {};
      if (!peMedians.pe3Y && !peMedians.pe5Y) {
        const pe = stockSnap?.quote?.pe || 0;
        if (pe > 0) peMedians = { pe3Y: pe, pe5Y: pe };
      }
      return {
        symbol: sym,
        baskets: basketMap[sym] || [],
        strategies,
        price: Math.round((stockSnap?.quote?.regularMarketPrice || 0) * 100) / 100,
        change: stockSnap?.quote?.regularMarketChangePercent || 0,
        peMedians
      };
    });

    res.json({ results });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- SYSTEM HEALTH CHECK ---
app.get('/api/admin/health-check', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const report = await runHealthCheck();
    res.json(report);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/health-check/run', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const report = await runHealthCheck();
    const failCount = report.results.filter(r => r.status === 'fail').length;
    const warnCount = report.results.filter(r => r.status === 'warn').length;
    const passCount = report.results.filter(r => r.status === 'pass').length;
    await notifyAdmins(
      failCount > 0
        ? `System Health: ${failCount} failure(s)`
        : warnCount > 0
          ? `System Health: Passed with ${warnCount} warning(s)`
          : `System Health: All systems operational`,
      `Manual health check at ${report.timestamp}\nPass: ${passCount} | Warn: ${warnCount} | Fail: ${failCount}`,
      'system'
    );
    res.json({ ...report, notified: true });
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

// --- ADMIN: Audit endpoints ---
import { runAuditEngine } from './services/audit/engine.js';
import fs from 'fs';
import path from 'path';

app.get('/api/admin/audit/latest', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reportPath = path.resolve(process.cwd(), 'audit_reports', `${today}.json`);
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      return res.json({
        date: report.date,
        status: report.status,
        summary: report.summary,
        changes: report.changes,
        checks: report.checks.filter((c: any) => c.status !== 'pass'),
        reportUrl: `/admin/audit/${today}`
      });
    }
    res.json({ message: 'No audit run today yet. Run /api/admin/audit/run to trigger.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/audit/run', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const report = await runAuditEngine(BASKETS);
    res.json({ status: report.status, date: report.date, summary: report.summary });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/audit/:date', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const reportPath = path.resolve(process.cwd(), 'audit_reports', `${req.params.date}.json`);
    if (fs.existsSync(reportPath)) {
      return res.json(JSON.parse(fs.readFileSync(reportPath, 'utf-8')));
    }
    res.status(404).json({ error: 'Report not found' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── n8n Integration ──
const N8N_API_KEY = process.env.N8N_API_KEY || 'mb_linkedin_2026_secret_key';

function verifyN8n(req: any, res: any) {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey !== N8N_API_KEY) { res.status(403).json({ error: 'Invalid API key' }); return false; }
  return true;
}

app.get('/api/n8n/qualified-stocks', async (req, res) => {
  try {
    if (!verifyN8n(req, res)) return;
    const basket = (req.query.basket as string) || 'Elite Basket';
    const symbols = BASKETS[basket] || BASKETS['Elite Basket'];
    const uniqueSymbols = Array.from(new Set(symbols)).filter(s => s && s !== '^NSEI');
    const snapshot = await getSnapshotFromCloud(uniqueSymbols);
    const results = [];
    for (const sym of uniqueSymbols) {
      try {
        const cleanSym = sym.trim().toUpperCase();
        let snap = snapshot[cleanSym] || snapshot[`${cleanSym}.NS`];
        if (!snap) { const k = Object.keys(snapshot).find(k => k.replace('.NS', '') === cleanSym); if (k) snap = snapshot[k]; }
        if (!snap) continue;
        const audit = await validateBatch9(cleanSym, snap, basket);
        const qualified = STRATEGIES.filter(s => { const r: any = runStrategyAnalysis(s.id, snap, snap.quote?.marketCap || 0, basket); return r?.isBuyZone; });
        if (!audit.isPass && qualified.length === 0) continue;
        results.push({
          symbol: cleanSym,
          score: Math.round(audit.score),
          isPass: audit.isPass,
          strategies: qualified.map(s => s.name),
          price: Math.round((snap.quotes?.[snap.quotes.length - 1]?.close || 0) * 100) / 100,
          change: Math.round((snap.quote?.regularMarketChangePercent || 0) * 100) / 100,
          sector: MANUAL_SECTOR_MAP[cleanSym] || snap.screener?.industry || 'General',
          marketCap: snap.quote?.marketCap,
          peRatio: snap.quote?.pe || snap.screener?.peRatio || 0,
          profitabilityQuality: audit.profitabilityQuality,
          balanceSheetSafety: audit.balanceSheetSafety,
          growthQuality: audit.growthQuality
        });
      } catch (e: any) { /* skip symbol on error */ }
    }
    results.sort((a, b) => b.score - a.score);
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/n8n/stock-data/:symbol', async (req, res) => {
  try {
    if (!verifyN8n(req, res)) return;
    const { symbol } = req.params;
    const cleanSym = symbol.trim().toUpperCase();
    const snapshot = await getSnapshotFromCloud([cleanSym]);
    let snap = snapshot[cleanSym] || snapshot[`${cleanSym}.NS`];
    if (!snap) { const k = Object.keys(snapshot).find(k => k.replace('.NS', '') === cleanSym); if (k) snap = snapshot[k]; }
    if (!snap) return res.status(404).json({ error: 'Symbol not found' });
    const audit = await validateBatch9(cleanSym, snap, 'Elite Basket');
    const lastQuote = snap.quotes?.[snap.quotes.length - 1];
    const qualified = STRATEGIES.filter(s => { const r: any = runStrategyAnalysis(s.id, snap, snap.quote?.marketCap || 0, 'Elite Basket'); return r?.isBuyZone; });
    let maxUpside = 30;
    let abcd: any = null;
    if (qualified.length > 0) {
      const sRes: any = runStrategyAnalysis(qualified[0].id, snap, snap.quote?.marketCap || 0, 'Elite Basket');
      abcd = sRes?.abcd;
      if (sRes?.target) {
        const entry = sRes.entryPrice || lastQuote?.close || 0;
        if (entry > 0) maxUpside = Math.round(((sRes.target / entry) - 1) * 100);
      }
    }
    res.json({
      symbol: cleanSym,
      price: Math.round((lastQuote?.close || 0) * 100) / 100,
      change: Math.round((snap.quote?.regularMarketChangePercent || 0) * 100) / 100,
      sector: MANUAL_SECTOR_MAP[cleanSym] || snap.screener?.industry || 'General',
      marketCap: snap.quote?.marketCap,
      peRatio: snap.quote?.pe || snap.screener?.peRatio || 0,
      peMedians: snap.screener?.peMedians || {},
      returnOnEquity: Math.round((snap.screener?.returnOnEquity || 0) * 100) / 100,
      roce: Math.round((snap.screener?.roce || 0) * 100) / 100,
      debtToEquity: Math.round((snap.screener?.netDebtToEquity || (snap.quote?.debtToEquity / 100) || 0) * 100) / 100,
      athSales: snap.screener?.athSales,
      athNetProfit: snap.screener?.athNetProfit,
      currentSales: snap.screener?.currentSales || snap.screener?.sales,
      currentNetProfit: snap.screener?.currentNetProfit || snap.screener?.netProfit,
      fiftyTwoWeekHigh: snap.quote?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: snap.quote?.fiftyTwoWeekLow,
      beta: snap.quote?.beta,
      auditScore: Math.round(audit.score),
      isQualified: audit.isPass,
      strategies: qualified.map(s => ({ id: s.id, name: s.name, tier: s.tier })),
      upside: maxUpside,
      abcd,
      profitabilityQuality: audit.profitabilityQuality,
      balanceSheetSafety: audit.balanceSheetSafety,
      growthQuality: audit.growthQuality,
      efficiencyGovernance: audit.efficiencyGovernance
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/n8n/blog-post', async (req, res) => {
  try {
    if (!verifyN8n(req, res)) return;
    const db = getDB();
    const { title, slug, meta_description, content, tag, tag_color, read_time, date, key_takeaways, related_slug, related_title } = req.body;
    if (!title || !slug) return res.status(400).json({ error: 'title and slug required' });
    const result = await db.run(
      `INSERT INTO blog_posts (title, slug, meta_description, content, tag, tag_color, read_time, date, key_takeaways, related_slug, related_title, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [title, slug, meta_description || '', JSON.stringify(content || []), tag || 'Analysis', tag_color || 'text-blue-400 bg-blue-400/10 border-blue-400/20', read_time || '3 min read', date || new Date().toISOString().split('T')[0], JSON.stringify(key_takeaways || []), related_slug || null, related_title || null]
    );
    res.json({ id: result.lastID, slug });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Recent Blog Posts (for homepage) ──
app.get('/api/blog/recent', async (req, res) => {
  try {
    const db = getDB();
    const limit = Math.min(parseInt(req.query.limit as string) || 3, 10);
    const posts = await db.all('SELECT id, title, slug, meta_description, tag, tag_color, read_time, date, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(posts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Blog API ──
app.get('/api/blog', async (req, res) => {
  try {
    const db = getDB();
    const posts = await db.all('SELECT id, title, slug, meta_description, tag, tag_color, read_time, date, key_takeaways, related_slug, related_title, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC');
    res.json(posts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/blog/:slug', async (req, res) => {
  try {
    const db = getDB();
    const post = await db.get('SELECT * FROM blog_posts WHERE slug = ? AND published = 1', [req.params.slug]);
    if (!post) return res.status(404).json({ error: 'Article not found' });
    post.content = JSON.parse(post.content || '[]');
    post.key_takeaways = JSON.parse(post.key_takeaways || '[]');
    res.json(post);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/blog', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    const { title, slug, meta_description, content, tag, tag_color, read_time, date, key_takeaways, related_slug, related_title, published } = req.body;
    const result = await db.run(
      `INSERT INTO blog_posts (title, slug, meta_description, content, tag, tag_color, read_time, date, key_takeaways, related_slug, related_title, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, meta_description, JSON.stringify(content), tag || 'General', tag_color || 'text-blue-400 bg-blue-400/10 border-blue-400/20', read_time || '5 min read', date, JSON.stringify(key_takeaways || []), related_slug || null, related_title || null, published ?? 1]
    );
    res.json({ id: result.lastID });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/blog/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    const { title, slug, meta_description, content, tag, tag_color, read_time, date, key_takeaways, related_slug, related_title, published } = req.body;
    await db.run(
      `UPDATE blog_posts SET title=?, slug=?, meta_description=?, content=?, tag=?, tag_color=?, read_time=?, date=?, key_takeaways=?, related_slug=?, related_title=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [title, slug, meta_description, JSON.stringify(content), tag, tag_color, read_time, date, JSON.stringify(key_takeaways || []), related_slug, related_title, published ?? 1, req.params.id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/blog/:id', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/blog', authenticateToken, requireAdmin, async (req: any, res: any) => {
  try {
    const db = getDB();
    const posts = await db.all('SELECT id, title, slug, tag, published, date, created_at FROM blog_posts ORDER BY created_at DESC');
    res.json(posts);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── Sitemap (dynamic, includes blog posts from DB) ──
app.get('/api/sitemap.xml', async (req, res) => {
  try {
    const db = getDB();
    const posts = await db.all('SELECT slug, date, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC');
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { path: '', priority: '1.0', freq: 'daily' },
      { path: '/blog', priority: '0.9', freq: 'daily' },
      { path: '/login', priority: '0.9', freq: 'weekly' },
      { path: '/license-desk', priority: '0.9', freq: 'weekly' },
      { path: '/pricing', priority: '0.8', freq: 'weekly' },
      { path: '/privacy-policy', priority: '0.5', freq: 'monthly' },
    ];

    const blogUrls = (posts || []).map((p: any) => ({
      path: `/blog/${p.slug}`,
      priority: '0.85',
      freq: 'weekly',
      lastmod: p.created_at?.split('T')[0] || today,
    }));

    const seen = new Set<string>();
    const stockUrls = NIFTY_500
      .map((s: string) => `/analysis/${s.replace('.NS', '')}`)
      .filter((p: string) => { if (seen.has(p)) return false; seen.add(p); return true; })
      .map((p: string) => ({ path: p, priority: '0.7', freq: 'daily' }));

    const allUrls = [...staticPages, ...blogUrls, ...stockUrls];

    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>https://marketbeaconpro.com${u.path}</loc>
    <lastmod>${(u as any).lastmod || today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── RSS Feed ──
app.get('/api/rss.xml', async (req, res) => {
  try {
    const db = getDB();
    const posts = await db.all('SELECT title, slug, meta_description, date, created_at FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT 20');

    const escXml = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');

    res.header('Content-Type', 'application/rss+xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MarketBeacon Pro Blog</title>
    <link>https://marketbeaconpro.com/blog</link>
    <description>Institutional stock research - ABCD Tranche, Smart Money tracking, and 100-point audit scores for Indian stock market.</description>
    <language>en-in</language>
    <atom:link href="https://marketbeaconpro.com/api/rss.xml" rel="self" type="application/rss+xml"/>
${(posts || []).map((p: any) => `    <item>
      <title>${escXml(p.title)}</title>
      <link>https://marketbeaconpro.com/blog/${encodeURIComponent(p.slug)}</link>
      <guid isPermaLink="true">https://marketbeaconpro.com/blog/${encodeURIComponent(p.slug)}</guid>
      <description>${escXml(p.meta_description || '')}</description>
      <pubDate>${new Date(p.created_at || p.date).toUTCString()}</pubDate>
    </item>`).join('\n')}
  </channel>
</rss>`);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

async function seedBlogPosts(db: any) {
  const count = await db.get('SELECT COUNT(*) as cnt FROM blog_posts');
  if (count && count.cnt > 0) return;
  const articles = [
    { slug: 'abcd-tranche-laddering-guide', title: "What is ABCD Tranche Laddering? A Beginner's Guide for Indian Traders", meta_description: "Learn ABCD Tranche Laddering — the institutional method to split stock purchases into 4 systematic tranches. Used by FII/DII desks in India. Free guide for retail traders.", tag: 'Strategy', tag_color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', read_time: '6 min read', date: 'Jun 06, 2026', content: '[{"heading":"The Problem With How Most Retail Traders Buy Stocks","body":"Most retail traders do the same thing..."},{"heading":"What Is ABCD Tranche Laddering?","body":"ABCD Tranche Laddering is a capital deployment method..."},{"heading":"How Each Tranche Works","body":"Stage A (25% Allocation)..."},{"heading":"Why Does This Work? The Math Behind It","body":"Let\'s say a stock is at ₹1000..."},{"heading":"How MarketBeacon Pro Implements This","body":"MarketBeacon Pro\'s ABCD Ladder strategy..."}]', key_takeaways: '["Never allocate 100% at one price...","Stage C (the deepest pullback)...","Tranche buyers consistently achieve...","MarketBeacon Pro automatically calculates...","This is the same method FII/DII desks..."]', related_slug: 'how-to-trade-like-fii-dii-india', related_title: 'How to Trade Like FII/DII in India' },
    { slug: 'what-is-sebi-compliant-stock-screener', title: "What Should a Responsible Stock Research Tool Look Like? A SEBI Framework Guide", meta_description: "Learn what SEBI regulations say about stock screeners and research tools in India.", tag: 'Education', tag_color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', read_time: '5 min read', date: 'Jun 06, 2026', content: '[{"heading":"The Problem With Many Stock Tip Platforms in India","body":"There are hundreds of stock screener apps..."},{"heading":"What SEBI Says: The Three Categories","body":"SEBI distinguishes between..."},{"heading":"Where MarketBeacon Pro Stands","body":"MarketBeacon Pro is an educational quantitative research tool..."},{"heading":"What to Look For in Any Research Platform","body":"Whether you use MarketBeacon Pro..."}]', key_takeaways: '["SEBI requires Investment Advisers to be registered...","MarketBeacon Pro is NOT a SEBI-registered IA or RA...","All audit scores are for educational purposes...","Always consult a SEBI-registered advisor...","Good research tools are transparent..."]', related_slug: 'institutional-audit-score-explained', related_title: 'The 100-Point Institutional Audit Score Explained' },
    { slug: 'how-to-trade-like-fii-dii-india', title: "How to Trade Like FII/DII in India: The Institutional Strategy Explained", meta_description: "Learn how FIIs and DIIs build positions in Indian stocks.", tag: 'Institutional', tag_color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', read_time: '8 min read', date: 'Jun 06, 2026', content: '[{"heading":"Why FIIs and DIIs Don\'t Think Like Retail Traders","body":"Foreign Institutional Investors..."},{"heading":"Principle 1: Institutions Buy at Value Floors","body":"Retail traders often buy..."},{"heading":"Principle 2: Smart Money Tracking via Shareholding Data","body":"Every quarter..."},{"heading":"Principle 3: Fundamental Conviction Before Any Entry","body":"Institutions will not invest..."},{"heading":"How to Apply This As a Retail Trader","body":"You can\'t replicate..."}]', key_takeaways: '["FIIs/DIIs buy at value floors...","Rising FII/DII holding during a price decline...","Institutions reject stocks with high debt...","Retail traders can replicate institutional logic...","Patience is the institutional edge..."]', related_slug: 'abcd-tranche-laddering-guide', related_title: 'ABCD Tranche Laddering: The Complete Guide' },
    { slug: 'institutional-audit-score-explained', title: "The 100-Point Institutional Audit Score: How Stocks Are Graded", meta_description: "MarketBeacon Pro grades every stock on a 100-point institutional audit score.", tag: 'Deep Dive', tag_color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', read_time: '7 min read', date: 'Jun 06, 2026', content: '[{"heading":"Why We Built a 100-Point Score","body":"Most stock screeners show you raw data..."},{"heading":"The Three Rating Categories","body":"Every stock receives one of three ratings..."},{"heading":"The 12 Audit Parameters","body":"Parameter 1 — Debt-to-Equity..."},{"heading":"How the Score Is Calculated","body":"Each of the 12 parameters is weighted..."}]', key_takeaways: '["100-point audit score converts complex analysis...","Qualified = 80+, Neutral = 50-79, Rejected = 0-49","Hard reject rules immediately disqualify stocks...","Scores update daily with live market data...","12 parameters cover debt, growth, valuation..."]', related_slug: 'what-is-sebi-compliant-stock-screener', related_title: 'What Is a SEBI Compliant Stock Screener?' },
  ];
  for (const article of articles) {
    try {
      await db.run('INSERT OR IGNORE INTO blog_posts (title, slug, meta_description, content, tag, tag_color, read_time, date, key_takeaways, related_slug, related_title, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
        [article.title, article.slug, article.meta_description, article.content, article.tag, article.tag_color, article.read_time, article.date, article.key_takeaways, article.related_slug, article.related_title]);
    } catch (e: any) { console.error('Seed article failed:', article.slug, e.message); }
  }
  console.log(`Seeded ${articles.length} blog articles.`);
}

const startServer = async () => {
  const PORT = Number(process.env.PORT) || 3001;
  try {
    const db = await initDB();
    initScreenerCron();

    // Start accepting connections FIRST, before loading the 364MB snapshot file,
    // so the server can respond to auth/health requests without blocking.
    app.listen(PORT, '0.0.0.0', () => {
      console.log('----------------------------------------------------');
      console.log('🚀 MARKETBEACON PRO: PHASE 1 LAUNCH ACTIVE');
      console.log(`🌐 Terminal Node Cloud Active on Port ${PORT}`);
      console.log('🛡️  Institutional Safe-Guard: Standard Mode');
      console.log('----------------------------------------------------');
    });

    // Background: load snapshot cache (337MB JSON parse is CPU-heavy).
    // Delay by 2s so auth/health endpoints get priority during cold start.
    setTimeout(() => {
      initSnapshotCache().catch((e: any) => console.error('Snapshot cache init failed:', e.message));
    }, 2000);

    // Background: seed blog posts (DB write, not latency-critical)
    seedBlogPosts(db).catch((e: any) => console.error('Blog seed failed:', e.message));

    // 8:30 PM IST - Daily Alpha-40 institutional recalculation
    cron.schedule('30 20 * * *', async () => { await precalculateAlpha40(); });

    // 7:00 PM IST - Daily system health check (after market close)
    cron.schedule('0 19 * * *', runAndNotifyHealthCheck);

    setTimeout(precalculateAlpha40, 5000); // Warm cache on boot
    // Growth basket priming moved to cron only (blocks event loop for 5+ min on 281 symbols)
    scheduleAuditCron(BASKETS);
  } catch (e) { console.error(e); }
};

startServer();
