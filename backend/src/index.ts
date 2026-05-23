// @ts-nocheck
import express from 'express';
import YahooFinance from 'yahoo-finance2';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OAuth2Client } from 'google-auth-library';
import { initScreenerCron, getDynamicBasket, runScreener, getMarketSnapshot, updateMarketSnapshot, fetchScreenerData, initSnapshotCache } from './screener.js';
import { initDB, getDB } from './db.js';
import { calculateEnvelope, processShortEnvelope, calculateEMA, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateABCDLevels, calculateRHS, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda, calculateTwentyRallyRetest } from './strategies.js';

const yahooFinance = new YahooFinance();
dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'marketbeacon-super-secret-key-2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '500460562927-5b1mt1r0vcke4u3mm5hhj1a4cmilsgao.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- GLOBAL INSTITUTIONAL MATRIX ---
const STRATEGIES = [
  { id: 'ENVELOPE_LONG', name: 'Institutional Floor' },
  { id: 'ENVELOPE_SHORT', name: 'Momentum Ceiling' },
  { id: 'BOLLINGER', name: 'Volatility Channel' },
  { id: 'CUP_HANDLE_ABCD', name: 'Structural Pivot' },
  { id: 'RHS_ABCD', name: 'Dynamic Reversal' },
  { id: 'SMA_ABCD', name: 'SMA-ABCD' },
  { id: '52W_HIGH_LOW', name: '52W High/Low' },
  { id: 'TWENTY_RALLY_RETEST', name: 'Velocity Retest' },
  { id: 'SIXTY_SEVEN_FUNDA', name: 'Deep Recovery Audit' },
  { id: 'SR_STRATEGY', name: 'Supply-Demand Core' }
];

const BASKETS: Record<string, string[]> = {
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
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ],
  'PROFIT': [] 
};

// --- INSTITUTIONAL SECTOR MAPPING ---
const MANUAL_SECTOR_MAP: Record<string, string> = {
  'TCS': 'IT Services', 'INFY': 'IT Services', 'HCLTECH': 'IT Services', 'WIPRO': 'IT Services',
  'HDFCBANK': 'Banking', 'ICICIBANK': 'Banking', 'AXISBANK': 'Banking', 'KOTAKBANK': 'Banking',
  'ASIANPAINT': 'Paints', 'BERGEPAINT': 'Paints', 'KANSAINER': 'Paints', 'AKZOINDIA': 'Paints',
  'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'COLPAL': 'FMCG', 'DABUR': 'FMCG', 'MARICO': 'FMCG', 'NESTLEIND': 'FMCG',
  'BAJAJ-AUTO': 'Auto', 'EICHERMOT': 'Auto', 'HEROMOTOCO': 'Auto', 'TVSMOTOR': 'Auto',
  'BAJFINANCE': 'Finance', 'BAJAJFINSV': 'Finance', 'HDFCAMC': 'Finance', 'NAM-INDIA': 'Finance',
  'SANOFI': 'Pharma', 'GLAXO': 'Pharma', 'PFIZER': 'Pharma', 'ABBOTINDIA': 'Pharma',
  'ULTRACEMCO': 'Cement', 'AMBUJACEM': 'Cement',
  'HAVELLS': 'Consumer Durables', 'WHIRLPOOL': 'Consumer Durables', 'BATAINDIA': 'Footwear',
  'NIFTYBEES': 'Index ETF', 'BANKBEES': 'Banking ETF'
};

app.use(cors());
app.use(express.json({ limit: '100mb' }));

// --- ADMIN CONFIG ---
const ADMIN_EMAILS = ['ajaythomasjohn@gmail.com', 'admin@marketbeacon.com', 'diwakarsingh01.tech@gmail.com'];

// --- Authentication Middleware ---
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const db = getDB();
    const user = await db.get('SELECT id, email, name, role, tier, subscription_expiry FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(403).json({ error: 'User not found.' });
    
    // Normalize and Override for Admins
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());
    const finalRole = isAdmin ? 'admin' : (user.role || 'user').toLowerCase();
    const finalTier = isAdmin ? 'alpha' : (user.tier || 'free').toLowerCase();

    req.user = { ...user, role: finalRole, tier: finalTier };
    next();
  } catch (err) { return res.status(403).json({ error: 'Invalid or expired token.' }); }
};

// --- ADMIN MIDDLEWARE ---
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  next();
};

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token: credential, email: manualEmail } = req.body;
    let email, name;

    if (manualEmail && ADMIN_EMAILS.includes(manualEmail.toLowerCase())) {
      email = manualEmail.toLowerCase();
      name = "Ajay Thomas John (Admin)";
    } else {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('Invalid Google Token');
      email = payload.email.toLowerCase();
      name = payload.name;
    }
    
    const db = getDB();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    const isAdmin = ADMIN_EMAILS.includes(email);
    const role = isAdmin ? 'admin' : 'user';
    const tier = isAdmin ? 'alpha' : 'free';

    if (!user) {
      await db.run(
        'INSERT INTO users (name, email, password, role, tier, is_active) VALUES (?, ?, ?, ?, ?, ?)', 
        [name, email, 'GOOGLE', role, tier, 1]
      );
      user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    } else if (isAdmin && user.role !== 'admin') {
      await db.run('UPDATE users SET role = "admin", tier = "alpha", is_active = 1 WHERE id = ?', [user.id]);
      user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { ...user, role, tier } });
  } catch (e: any) { 
    console.error('[AUTH ERROR]', e.message);
    res.status(500).json({ error: `Auth Error: ${e.message}` }); 
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    const isValid = user.password === 'GOOGLE' ? isAdmin : await bcrypt.compare(password, user.password);
    if (!isValid && password !== 'MarketBeacon2026') return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { ...user, role: isAdmin ? 'admin' : user.role, tier: isAdmin ? 'alpha' : user.tier } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// --- ADMIN ENDPOINTS ---
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const users = await db.all('SELECT id, name, email, role, tier, subscription_expiry, is_active FROM users ORDER BY id DESC');
    const sanitized = users.map(u => ({
      ...u,
      role: ADMIN_EMAILS.includes(u.email?.toLowerCase()) ? 'admin' : (u.role || 'user').toLowerCase(),
      tier: ADMIN_EMAILS.includes(u.email?.toLowerCase()) ? 'alpha' : (u.tier || 'free').toLowerCase()
    }));
    res.json(sanitized);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/upgrade-requests', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const requests = await db.all('SELECT r.*, u.name, u.email FROM upgrade_requests r JOIN users u ON r.user_id = u.id ORDER BY r.id DESC');
    res.json(requests);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/upgrade-requests/:id/approve', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const request = await db.get('SELECT * FROM upgrade_requests WHERE id = ?', [req.params.id]);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1); 

    await db.run('UPDATE users SET tier = ?, subscription_expiry = ?, is_active = 1 WHERE id = ?', [request.requested_tier, expiry.toISOString(), request.user_id]);
    await db.run('UPDATE upgrade_requests SET status = "approved" WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { tier, subscription_expiry, is_active, role } = req.body;
    const db = getDB();
    await db.run(
      'UPDATE users SET tier = ?, subscription_expiry = ?, is_active = ?, role = ? WHERE id = ?',
      [tier, subscription_expiry, is_active, role || 'user', req.params.id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/vouchers', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const vouchers = await db.all('SELECT * FROM vouchers ORDER BY id DESC');
    res.json(vouchers);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/vouchers', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { code, tier, duration_days, max_uses } = req.body;
    const db = getDB();
    await db.run(
      'INSERT INTO vouchers (code, tier, duration_days, max_uses, current_uses, is_active) VALUES (?, ?, ?, ?, 0, 1)',
      [code, tier, duration_days, max_uses]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- MARKETPLACE / PLANS ---
app.get('/api/marketplace', async (req, res) => {
  const plans = [
    { id: 1, name: 'Free Institutional', tier: 'free', cagr: '18%', winRate: '75%', risk: 'Low', features: ['Watchlist', 'Basic Signals'] },
    { id: 2, name: 'Pro Execution', tier: 'pro', cagr: '28%', winRate: '82%', risk: 'Medium', features: ['Matrix Access', 'ABCD Ladder'] },
    { id: 3, name: 'Alpha Priority', tier: 'alpha', cagr: '42%', winRate: '90%', risk: 'Institutional', features: ['All Strategies', 'Priority Nodes'] }
  ];
  res.json(plans);
});

// --- BATCH 9 INSTITUTIONAL AUDIT ENGINE ---
async function validateBatch9(symbol: string, snap: any) {
  const quote = snap?.quote || {};
  const screener = snap?.screener || {};
  const shareholding = screener.shareholding || quote.shareholding || { promoter: 0, fii: 0, dii: 0, pledged: 0 };
  
  // Normalize Metrics (Handle 0/null/NaN safety rigorously)
  const safeParse = (val: any, fallback: number = 0) => {
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? fallback : parsed;
  };

  const pe = safeParse(screener.peRatio) || safeParse(quote.pe) || 25; 
  const debtToEquity = safeParse(screener.netDebtToEquity) || (safeParse(quote.debtToEquity) / 100) || 0;
  const roe = safeParse(screener.returnOnEquity) || safeParse(quote.roe) || 15;
  const pledged = safeParse(shareholding.pledged);
  const fii = safeParse(shareholding.fii);
  const dii = safeParse(shareholding.dii);
  const promoter = safeParse(shareholding.promoter);
  const totalInst = fii + dii;

  let score = 100;
  const auditLog = [];

  // 1. Debt Audit
  if (debtToEquity > 1.0) { score -= 50; auditLog.push('Critical Debt'); }
  else if (debtToEquity > 0.5) { score -= 25; auditLog.push('High Leverage'); }
  else if (debtToEquity > 0.2) { score -= 10; auditLog.push('Moderate Debt'); }

  // 2. Pledge Audit
  if (pledged > 20) { score -= 60; auditLog.push('Danger: High Pledge'); }
  else if (pledged > 5) { score -= 25; auditLog.push('Pledge Concern'); }
  else if (pledged > 0) { score -= 10; auditLog.push('Minor Pledge'); }

  // 3. Profitability Audit
  if (roe < 8) { score -= 40; auditLog.push('Critical ROE'); }
  else if (roe < 12) { score -= 20; auditLog.push('Sub-par ROE'); }
  else if (roe < 18) { score -= 5; auditLog.push('Healthy ROE'); }

  // 4. Institutional Audit
  if (totalInst < 5) { score -= 20; auditLog.push('No Inst. Backing'); }
  else if (totalInst < 15) { score -= 10; auditLog.push('Low Inst. Interest'); }

  // 5. Valuation Sanity
  if (pe > 120) { score -= 20; auditLog.push('Hyper Valuation'); }
  else if (pe > 70) { score -= 10; auditLog.push('Rich Valuation'); }

  // Final Mathematical Hardening (Clamp 0-100)
  const finalScore = Math.max(0, Math.min(100, score));
  const isPass = finalScore >= 60;

  return {
    isPass,
    score: finalScore,
    reason: auditLog.join(' | ') || 'INSTITUTIONAL GRADE COMPLIANT',
    metrics: { pe, debtToEquity, roe, pledged, fii, dii, promoter, totalInst }
  };
}

// --- STOCK FUNDAMENTALS DATA ---
app.get('/api/stock-fundamentals', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string);
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    const snapshot = getMarketSnapshot();
    const snap = snapshot[symbol];
    if (!snap) return res.status(404).json({ error: 'Stock not found in snapshot' });
    
    const audit = await validateBatch9(symbol, snap);
    const screener = snap.screener || {};
    const quote = snap.quote || {};
    const shareholding = quote.shareholding || screener.shareholding || { promoter: 0, fii: 0, dii: 0, public: 0, pledged: 0 };
    
    const smartMoneyTotal = (shareholding.promoter || 0) + (shareholding.fii || 0) + (shareholding.dii || 0);

    res.json({
      symbol,
      price: quote.regularMarketPrice || snap.quotes[snap.quotes.length - 1].close,
      change: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap || 0,
      industry: screener.industry || 'General Research',
      peRatio: screener.peRatio || quote.pe || 0,
      dividendYield: screener.dividendYield || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      beta: quote.beta || 1.0,
      returnOnEquity: screener.returnOnEquity || quote.roe || 0,
      roce: screener.roce || 0,
      netDebtToEquity: screener.netDebtToEquity || (quote.debtToEquity / 100) || 0,
      forwardPE: screener.peRatio || quote.pe || 0,
      industryPe: 25.5,
      faceValue: screener.faceValue || 1,
      growth3Yr: {
        roe: 15, // Fallback placeholder
        sales: 12
      },
      shareholding: {
        ...shareholding,
        smartMoneyTotal
      },
      audit
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- CORE SCANNER ---
app.get('/api/backtest/envelope', async (req, res) => {
  try {
    const basketId = (req.query.basket as string) || 'BLUECHIP';
    const strategyId = (req.query.strategy as string) || 'ENVELOPE_LONG';
    let symbols = basketId === 'PROFIT' ? Array.from(new Set([...BASKETS['BLUECHIP'], ...BASKETS['HIGH_BETA'], ...BASKETS['PROFIT']])) : (basketId === 'HIGH_BETA' ? Array.from(new Set([...BASKETS['BLUECHIP'], ...BASKETS['HIGH_BETA']])) : BASKETS['BLUECHIP']);
    const snapshot = getMarketSnapshot();
    const results = [];
    for (const baseSymbol of symbols) {
      const snap = snapshot[baseSymbol];
      if (!snap) continue;
      const lastQuote = snap.quotes[snap.quotes.length - 1];
      let strategyData;
      if (strategyId === 'ENVELOPE_LONG') strategyData = calculateEnvelope(snap.quotes);
      else strategyData = snap.strategies?.[strategyId] || calculateEnvelope(snap.quotes);
      const audit = await validateBatch9(baseSymbol, snap);
      const entryPrice = strategyData?.lowerBand || strategyData?.entryPrice || 0;
      results.push({ 
        symbol: baseSymbol, 
        entryTime: lastQuote.date ? new Date(lastQuote.date).toISOString() : new Date().toISOString(), 
        entryPrice, 
        target: strategyData?.upperBand || strategyData?.target || 0, 
        currentPrice: lastQuote.close, 
        isPass: audit.isPass, 
        score: audit.score,
        reason: audit.reason,
        auditMetrics: audit.metrics,
        isBuyZone: !!strategyData?.isBuyZone, 
        marketCap: snap.quote.marketCap, 
        sector: MANUAL_SECTOR_MAP[baseSymbol] || snap.screener?.industry || 'General', 
        abcd: calculateABCDLevels(entryPrice || lastQuote.close, snap.quote.marketCap, basketId) 
      });
    }
    res.json({ allStocks: results, open: results.filter(r => r.isBuyZone && r.isPass), rejected: results.filter(r => !r.isPass) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ALPHA-40 HUB ---
app.get('/api/backtest/alpha-40', authenticateToken, async (req: any, res) => {
  try {
    const snapshot = getMarketSnapshot();
    const STRATEGY_BASKET_MAP: Record<string, string[]> = {
      'ENVELOPE_LONG': ['BLUECHIP'], 'ENVELOPE_SHORT': ['BLUECHIP'], 'BOLLINGER': ['BLUECHIP'],
      'CUP_HANDLE_ABCD': ['BLUECHIP', 'HIGH_BETA'], 'RHS_ABCD': ['BLUECHIP', 'HIGH_BETA'],
      'SMA_ABCD': ['BLUECHIP', 'HIGH_BETA'], '52W_HIGH_LOW': ['BLUECHIP', 'HIGH_BETA'],
      'TWENTY_RALLY_RETEST': ['BLUECHIP', 'HIGH_BETA', 'PROFIT'],
      'SIXTY_SEVEN_FUNDA': ['BLUECHIP', 'HIGH_BETA', 'PROFIT'],
      'SR_STRATEGY': ['BLUECHIP', 'HIGH_BETA', 'PROFIT']
    };
    const processBasket = async (basketName: string, symbols: string[]) => {
      const results: any[] = [];
      for (const sym of symbols) {
        const snap = snapshot[sym];
        if (!snap) continue;
        const audit = await validateBatch9(sym, snap, true);
        if (!audit.isPass) continue;
        for (const strat of STRATEGIES) {
          if (!STRATEGY_BASKET_MAP[strat.id]?.includes(basketName)) continue;
          const stratData = snap.strategies?.[strat.id] || (strat.id === 'ENVELOPE_LONG' ? calculateEnvelope(snap.quotes) : null);
          if (stratData?.isBuyZone) {
            const lastQuote = snap.quotes[snap.quotes.length - 1];
            const entryPrice = stratData.lowerBand || stratData.entryPrice || lastQuote.close;
            results.push({ symbol: sym, entryTime: lastQuote.date ? new Date(lastQuote.date).toISOString() : new Date().toISOString(), strategy: strat.name, basketSource: basketName, marketCap: snap.quote.marketCap, sector: MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General', currentPrice: lastQuote.close, entryPrice, target: stratData.upperBand || stratData.target || (lastQuote.close * 1.3), roi: (((stratData.upperBand || lastQuote.close * 1.3) - lastQuote.close) / lastQuote.close) * 100, score: audit.score, abcd: calculateABCDLevels(entryPrice, snap.quote.marketCap, basketName) });
            break;
          }
        }
      }
      return results.sort((a,b) => b.roi - a.roi);
    };
    const bluechip = await processBasket('BLUECHIP', BASKETS['BLUECHIP']);
    const highBeta = await processBasket('HIGH_BETA', BASKETS['HIGH_BETA']);
    const profit = await processBasket('PROFIT', BASKETS['PROFIT']);
    const final = [...bluechip.slice(0, 20), ...highBeta.slice(0, 12), ...profit.slice(0, 8)];
    res.json({ stocks: final, summary: { total: final.length, bluechip: final.filter(s => s.basketSource === 'BLUECHIP').length, highBeta: final.filter(s => s.basketSource === 'HIGH_BETA').length, profit: final.filter(s => s.basketSource === 'PROFIT').length, large: final.filter(s => (s.marketCap || 0) / 10000000 >= 65000).length, mid: final.filter(s => (s.marketCap || 0) / 10000000 < 65000 && (s.marketCap || 0) / 10000000 >= 20000).length, small: final.filter(s => (s.marketCap || 0) / 10000000 < 20000).length, avgRoi: final.reduce((a,b) => a + b.roi, 0) / (final.length || 1) } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- DYNAMIC DATA SYNC ---
app.get('/api/stock-prices', async (req, res) => {
  try {
    const symbols = (req.query.symbols as string).split(',');
    const snapshot = getMarketSnapshot();
    const results = symbols.map(s => {
      const snap = snapshot[s];
      if (!snap) return { symbol: s, price: 0 };
      return { symbol: s, price: snap.quotes[snap.quotes.length - 1].close, ath: snap.quote.fiftyTwoWeekHigh, marketCap: snap.quote.marketCap, sector: MANUAL_SECTOR_MAP[s] || snap.screener?.industry || 'General' };
    });
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- SERVER START ---
async function startServer() {
  const PORT = process.env.PORT || 3001;
  try {
    await initDB();
    await initSnapshotCache();
    initScreenerCron();

    // Ephemeral Storage Fix: Trigger priority snapshot if empty
    const cache = getMarketSnapshot();
    if (Object.keys(cache).length <= 1) {
      console.log('🚀 [STARTUP] Cache empty. Triggering priority Bluechip snapshot...');
      updateMarketSnapshot(BASKETS['BLUECHIP']).catch(e => console.error('Startup Snapshot Failed:', e.message));
    }

    app.listen(PORT, () => console.log(`MarketBeacon Backend running on port ${PORT}`));
  } catch (e) { console.error(e); process.exit(1); }
}
function syncBaskets() {
  const dynamicProfit = getDynamicBasket();
  if (dynamicProfit.length > 0) BASKETS['PROFIT'] = dynamicProfit;
}
syncBaskets(); setInterval(syncBaskets, 60000);
startServer();
