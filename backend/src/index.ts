import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { 
  initScreenerCron, 
  updateMarketSnapshot, 
  getDynamicBasket,
  initSnapshotCache
} from './screener.js';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { precalculateAlpha40, getAlpha40Cache } from './services/worker.js';
import { supabase, initDB, getDB } from './db.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(compression());

// --- CONSTANTS ---
export const MANUAL_SECTOR_MAP: Record<string, string> = {
  // IT & Tech
  'TCS': 'IT Services', 'INFY': 'IT Services', 'HCLTECH': 'IT Services', 'WIPRO': 'IT Services', 'LTTS': 'Engineering Tech', 'KPITTECH': 'Automotive Tech', 'CYIENT': 'IT Services', 'SONATSOFTW': 'IT Services', 'ZENSARTECH': 'IT Services', 'MPHASIS': 'IT Services', 'NEWGEN': 'Software', 'TANLA': 'CPaaS',
  // Banking & Finance
  'HDFCBANK': 'Banking', 'ICICIBANK': 'Banking', 'AXISBANK': 'Banking', 'KOTAKBANK': 'Banking', 'UCOBANK': 'Banking', 'CENTRALBK': 'Banking', 'BANDHANBNK': 'Banking', 'J&KBANK': 'Banking', 'KARURVYSYA': 'Banking', 'CUB': 'Banking', 'DCBBANK': 'Banking',
  'BAJFINANCE': 'NBFC', 'BAJAJFINSV': 'NBFC', 'HDFCAMC': 'Asset Management', 'NAM-INDIA': 'Asset Management', 'CAMS': 'Financial Infrastructure', 'CDSL': 'Exchange/Depository', 'MCX': 'Exchange/Depository', 'RBLBANK': 'Banking', 'MUTHOOTFIN': 'NBFC', 'CHOLAFIN': 'NBFC', 'POONAWALLA': 'NBFC',
  // FMCG & Consumer
  'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'COLPAL': 'FMCG', 'DABUR': 'FMCG', 'MARICO': 'FMCG', 'NESTLEIND': 'FMCG', 'TATACONSUM': 'FMCG', 'BRITANNIA': 'FMCG', 'VGUARD': 'Consumer Durables', 'HAVELS': 'Consumer Durables', 'WHIRLPOOL': 'Consumer Durables', 'BATAINDIA': 'Footwear', 'RELAXO': 'Footwear', 'PAGEIND': 'Apparel', 'TITAN': 'Jewellery/Watches',
  // Paints & Chemicals
  'ASIANPAINT': 'Paints', 'BERGEPAINT': 'Paints', 'KANSAINER': 'Paints', 'AKZOINDIA': 'Paints', 'PIDILITIND': 'Adhesives', 'DEEPAKNTR': 'Chemicals', 'SRF': 'Chemicals', 'NAVINFLUOR': 'Chemicals', 'ATUL': 'Chemicals', 'FINEORG': 'Chemicals', 'VINATIORGA': 'Chemicals',
  // Pharma & Healthcare
  'SANOFI': 'Pharma', 'GLAXO': 'Pharma', 'PFIZER': 'Pharma', 'ABBOTINDIA': 'Pharma', 'APOLLOHOSP': 'Healthcare', 'MAXHEALTH': 'Healthcare', 'LALPATHLAB': 'Diagnostics', 'METROPOLIS': 'Diagnostics', 'SYNGENE': 'Contract Research', 'WOCKPHARMA': 'Pharma', 'NATCOPHARM': 'Pharma', 'JBCHEPHARM': 'Pharma', 'ERIS': 'Pharma', 'AJANTPHARM': 'Pharma',
  // Auto & Engineering
  'BAJAJ-AUTO': 'Automobile', 'EICHERMOT': 'Automobile', 'HEROMOTOCO': 'Automobile', 'TVSMOTOR': 'Automobile', 'MARUTI': 'Automobile', 'M&M': 'Automobile', 'ASHOKLEY': 'Automobile', 'POLYCAB': 'Electricals', 'KEI': 'Electricals', 'DIXON': 'Electronics Mfg', 'HONAUT': 'Automation', 'ABB': 'Industrial/Power', 'SIEMENS': 'Industrial/Power', 'CUMMINSIND': 'Industrial/Power',
  // Infrastructure & Cement
  'ULTRACEMCO': 'Cement', 'AMBUJACEM': 'Cement', 'ACC': 'Cement', 'RAMCOCEM': 'Cement', 'JKCEMENT': 'Cement', 'L&T': 'EPC/Infra', 'CONCOR': 'Logistics', 'WELCORP': 'Steel Pipes', 'TRITURBINE': 'Engineering',
  // Others
  'IEX': 'Energy Exchange', 'NYKAA': 'E-commerce', 'ZOMATO': 'Food Delivery', 'ZEEL': 'Media', 'SUNTV': 'Media'
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
  'Elite Basket': ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'],
  'Quality Basket': ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'],
  'Growth Basket': [] 
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
    req.user = user;
    next();
  } catch (err) { return res.status(403).json({ error: 'Invalid token.' }); }
};

const getSnapshotFromCloud = async (symbols: string[]) => {
  const { data, error } = await supabase.from('market_data').select('*').in('symbol', symbols);
  if (error) throw error;
  return Object.fromEntries(data.map(row => [row.symbol, row.data]));
};

app.get('/api/health', (req, res) => res.json({ 
  status: 'active', 
  node: 'Supabase-Cloud-Production', 
  version: '12.2.1-PRO-FIX',
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
      const result = await db.run('INSERT INTO users (name, email, role, tier) VALUES (?, ?, ?, ?)', [payload.name, email, role, tier]);
      user = { id: result.lastID, email, role, tier };
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backtest/audit', authenticateToken, async (req, res) => {
  try {
    const { basket = 'Elite Basket', strategy: selectedStrategyId } = req.query;
    let symbols: string[] = [];
    if (basket === 'Elite Basket') symbols = BASKETS['Elite Basket'];
    else if (basket === 'Quality Basket') symbols = BASKETS['Quality Basket'];
    else if (basket === 'Growth Basket') symbols = await getDynamicBasket();
    else symbols = Array.from(new Set(Object.values(BASKETS).flat()));

    // Deduplicate symbols to prevent duplicate rows in Screener
    const uniqueSymbols = Array.from(new Set(symbols));

    const snapshot = await getSnapshotFromCloud(uniqueSymbols);
    const results = [];
    for (const sym of uniqueSymbols) {
      const snap = snapshot[sym];
      if (!snap) continue;
      const audit = await validateBatch9(sym, snap, basket as string);
      const strategyId = (selectedStrategyId as string) || 'SR_STRATEGY';
      const strategyData: any = runStrategyAnalysis(strategyId, snap, snap.quote.marketCap, basket as string);
      results.push({
        symbol: sym,
        entryTime: strategyData?.triggerDate || snap.quotes[snap.quotes.length-1].date,
        entryPrice: strategyData?.entryPrice || 0,
        target: strategyData?.target || 0,
        currentPrice: snap.quotes[snap.quotes.length - 1].close,
        isBuyZone: !!strategyData?.isBuyZone,
        isPass: audit.isPass,
        score: audit.score,
        abcd: strategyData?.abcd || null,
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
    const qualified = STRATEGIES.filter(s => {
      const res: any = runStrategyAnalysis(s.id, snap, snap.quote.marketCap, 'Elite Basket');
      return res?.isBuyZone;
    });
    res.json({ symbol, score: audit.score, isPass: audit.isPass, strategies: qualified });
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

const startServer = async () => {
  const PORT = Number(process.env.PORT) || 3001;
  try {
    await initDB();
    await initSnapshotCache();
    initScreenerCron();
    setTimeout(precalculateAlpha40, 5000); 
    app.listen(PORT, '0.0.0.0', () => console.log(`MarketBeacon Cloud Active on Port ${PORT}`));
  } catch (e) { console.error(e); }
};

startServer();
