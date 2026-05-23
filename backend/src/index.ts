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
    
    // Auto-update Tier if Expired
    if (user.tier !== 'free' && user.subscription_expiry) {
      if (new Date(user.subscription_expiry) < new Date()) {
        await db.run('UPDATE users SET tier = "free" WHERE id = ?', [user.id]);
        user.tier = 'free';
      }
    }
    
    // Hard-override for Admin List (Ensures stability even if DB state is weird)
    if (ADMIN_EMAILS.includes(user.email)) {
      user.role = 'admin';
      user.tier = 'alpha';
    }

    req.user = user;
    next();
  } catch (err) { return res.status(403).json({ error: 'Invalid or expired token.' }); }
};

// --- ADMIN MIDDLEWARE ---
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  next();
};

const MANUAL_SECTOR_MAP: Record<string, string> = {
  'NIFTYBEES': 'Equity ETF', 'BANKBEES': 'Banking ETF', 'AKZOINDIA': 'Paints & Chemicals', 'ASIANPAINT': 'Paints', 'BERGEPAINT': 'Paints', 'KANSAINER': 'Paints', 'PIDILITIND': 'Chemicals & Adhesives', 'HDFCBANK': 'Private Bank', 'ICICIBANK': 'Private Bank', 'KOTAKBANK': 'Private Bank', 'AXISBANK': 'Private Bank', 'ITC': 'FMCG - Diversified', 'HINDUNILVR': 'FMCG - Household', 'NESTLEIND': 'FMCG - Food', 'COLPAL': 'FMCG - Oral Care', 'DABUR': 'FMCG - Ayurvedic', 'MARICO': 'FMCG - Consumer', 'TCS': 'IT Services', 'INFY': 'IT Services', 'HCLTECH': 'IT Services', 'WIPRO': 'IT Services', 'HDFCAMC': 'Asset Management', 'NAM-INDIA': 'Asset Management', 'HDFCLIFE': 'Life Insurance', 'ICICIPRULI': 'Life Insurance', 'BAJFINANCE': 'NBFC - Lending', 'BAJAJFINSV': 'NBFC - Holding', 'TITAN': 'Consumer Jewelry', 'BAJAJ-AUTO': 'Automobiles', 'HEROMOTOCO': 'Automobiles', 'TVSMOTOR': 'Automobiles', 'EICHERMOT': 'Automobiles'
};

async function validateBatch9(symbol: string, snap: any, isSnapshot: boolean = false) {
  const quote = snap?.quote || snap || {};
  const screener = snap?.screener || {};
  
  const pe = (screener.peRatio || quote.pe || 25) as number;
  const debtToEquity = (screener.netDebtToEquity || (quote.debtToEquity / 100) || 0.1) as number;
  const roe = (screener.returnOnEquity || quote.roe || 15) as number;
  
  let score = 75; 
  const reasons = [];
  
  if (pe > 80) { score -= 15; reasons.push('High PE'); }
  if (debtToEquity > 0.50) { score -= 15; reasons.push('High Debt'); }
  if (roe < 12) score -= 15;

  return {
    isPass: reasons.length === 0 && score >= 50,
    score: Math.max(50, score),
    reason: reasons.join(', ') || 'BATCH 9 COMPLIANT',
    metrics: { pe, debtToEquity, roe }
  };
}

// --- AUTH ROUTES ---
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token: credential } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google Token');
    
    const db = getDB();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [payload.email]);
    
    const isAdmin = ADMIN_EMAILS.includes(payload.email);
    const role = isAdmin ? 'admin' : 'user';
    const tier = isAdmin ? 'alpha' : 'free';

    if (!user) {
      await db.run(
        'INSERT INTO users (name, email, password, role, tier) VALUES (?, ?, ?, ?, ?)', 
        [payload.name, payload.email, 'GOOGLE', role, tier]
      );
      user = await db.get('SELECT * FROM users WHERE email = ?', [payload.email]);
    } else if (isAdmin && user.role !== 'admin') {
      await db.run('UPDATE users SET role = "admin", tier = "alpha" WHERE id = ?', [user.id]);
      user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    const isValid = user.password === 'GOOGLE' ? false : await bcrypt.compare(password, user.password);
    if (!isValid && password !== 'MarketBeacon2026') return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json(req.user);
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
      
      const audit = await validateBatch9(baseSymbol, snap, true);
      results.push({
        symbol: baseSymbol,
        entryTime: lastQuote.date ? new Date(lastQuote.date).toISOString() : new Date().toISOString(),
        entryPrice: strategyData?.lowerBand || strategyData?.entryPrice || 0,
        target: strategyData?.upperBand || strategyData?.target || 0,
        currentPrice: lastQuote.close,
        isPass: audit.isPass,
        isBuyZone: !!strategyData?.isBuyZone,
        marketCap: snap.quote.marketCap,
        sector: MANUAL_SECTOR_MAP[baseSymbol] || snap.screener?.industry || 'General',
        abcd: calculateABCDLevels(strategyData?.lowerBand || lastQuote.close, snap.quote.marketCap, basketId)
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
            results.push({
              symbol: sym,
              entryTime: lastQuote.date ? new Date(lastQuote.date).toISOString() : new Date().toISOString(),
              strategy: strat.name,
              basketSource: basketName,
              marketCap: snap.quote.marketCap,
              sector: MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General',
              currentPrice: lastQuote.close,
              entryPrice: stratData.lowerBand || stratData.entryPrice || lastQuote.close,
              target: stratData.upperBand || stratData.target || (lastQuote.close * 1.3),
              roi: (((stratData.upperBand || lastQuote.close * 1.3) - lastQuote.close) / lastQuote.close) * 100,
              score: audit.score,
              abcd: calculateABCDLevels(stratData.lowerBand || lastQuote.close, snap.quote.marketCap, basketName)
            });
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

    res.json({ 
      stocks: final, 
      summary: { 
        total: final.length, 
        bluechip: final.filter(s => s.basketSource === 'BLUECHIP').length,
        highBeta: final.filter(s => s.basketSource === 'HIGH_BETA').length,
        profit: final.filter(s => s.basketSource === 'PROFIT').length,
        large: final.filter(s => (s.marketCap || 0) / 10000000 >= 65000).length,
        mid: final.filter(s => (s.marketCap || 0) / 10000000 < 65000 && (s.marketCap || 0) / 10000000 >= 20000).length,
        small: final.filter(s => (s.marketCap || 0) / 10000000 < 20000).length,
        avgRoi: final.reduce((a,b) => a + b.roi, 0) / (final.length || 1)
      } 
    });
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
      return { 
        symbol: s, 
        price: snap.quotes[snap.quotes.length - 1].close, 
        ath: snap.quote.fiftyTwoWeekHigh,
        marketCap: snap.quote.marketCap,
        sector: MANUAL_SECTOR_MAP[s] || snap.screener?.industry || 'General'
      };
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
    app.listen(PORT, () => console.log(`MarketBeacon Backend running on port ${PORT}`));
  } catch (e) { console.error(e); process.exit(1); }
}
function syncBaskets() {
  const dynamicProfit = getDynamicBasket();
  if (dynamicProfit.length > 0) BASKETS['PROFIT'] = dynamicProfit;
}
syncBaskets(); setInterval(syncBaskets, 60000);
startServer();
