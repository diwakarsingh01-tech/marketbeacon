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

// --- Manual Snapshot Trigger ---
app.post('/api/admin/update-snapshot', async (req, res) => {
  try {
    const allSymbols = Array.from(new Set([...BASKETS['BLUECHIP'], ...BASKETS['HIGH_BETA'], ...BASKETS['PROFIT']]));
    updateMarketSnapshot(allSymbols).catch(e => console.error('Background Snapshot Error:', e));
    res.json({ success: true, message: 'Market Snapshot Update started in background.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

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
    if (user.tier !== 'free' && user.subscription_expiry) {
      if (new Date(user.subscription_expiry) < new Date()) {
        await db.run('UPDATE users SET tier = "free" WHERE id = ?', [user.id]);
        user.tier = 'free';
      }
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

const getAccurateSector = async (symbol: string, yahooQuote: any) => {
  const baseSymbol = symbol.split('.')[0].toUpperCase();
  if (MANUAL_SECTOR_MAP[baseSymbol]) return MANUAL_SECTOR_MAP[baseSymbol];
  try {
    const profile = await yahooFinance.quoteSummary(symbol, { modules: ["assetProfile"] });
    return profile?.assetProfile?.sector || yahooQuote?.sector || 'General';
  } catch (e) { return 'General'; }
};

async function validateBatch9(symbol: string, yahooSummary: any, isSnapshot: boolean = false) {
  let screener = yahooSummary?.screener || null;
  const pe = (screener?.peRatio || yahooSummary?.summaryDetail?.trailingPE || 0) as number;
  const debtToEquity = (screener?.netDebtToEquity || (yahooSummary?.financialData?.debtToEquity / 100) || 0) as number;
  const roe = (screener?.returnOnEquity || (yahooSummary?.defaultKeyStatistics?.returnOnEquity * 100) || 0) as number;
  const marketCap = (screener?.marketCap || yahooSummary?.summaryDetail?.marketCap || 0) as number;
  const baseSymbol = symbol.split('.')[0].toUpperCase();
  const isBankingOrNBFC = (MANUAL_SECTOR_MAP[baseSymbol] || '').includes('Bank') || (MANUAL_SECTOR_MAP[baseSymbol] || '').includes('NBFC');
  
  let score = 70; // Institutional Base
  const reasons = [];
  if (pe > 80) reasons.push('High PE');
  if (!isBankingOrNBFC && debtToEquity > 0.50) reasons.push('High Debt');
  if (roe < 12) score -= 15;

  return {
    isPass: reasons.length === 0 && score >= 50,
    score,
    reason: reasons.join(', ') || 'BATCH 9 COMPLIANT',
    metrics: { pe, debtToEquity, roe, marketCap }
  };
}

// --- AUTH ROUTES ---
app.post('/api/auth/mobile-send-otp', async (req, res) => {
  res.json({ success: true, message: 'OTP sent (Simulated: 123456)' });
});

app.post('/api/auth/mobile-verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (otp !== '123456') return res.status(401).json({ error: 'Invalid OTP' });
    const db = getDB();
    let user = await db.get('SELECT * FROM users WHERE mobile = ?', [mobile]);
    if (!user) {
      await db.run('INSERT INTO users (name, email, password, mobile, role, tier) VALUES (?, ?, ?, ?, ?, ?)', ['Beacon User', `${mobile}@beacon.user`, 'MOBILE', mobile, 'user', 'free']);
      user = await db.get('SELECT * FROM users WHERE mobile = ?', [mobile]);
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google Token');
    const db = getDB();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [payload.email]);
    if (!user) {
      await db.run('INSERT INTO users (name, email, password, role, tier) VALUES (?, ?, ?, ?, ?)', [payload.name, payload.email, 'GOOGLE', 'user', 'free']);
      user = await db.get('SELECT * FROM users WHERE email = ?', [payload.email]);
    }
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
      const quotes = snap.quotes;
      let strategyData;
      if (strategyId === 'ENVELOPE_LONG') strategyData = calculateEnvelope(quotes);
      else strategyData = snap.strategies?.[strategyId] || calculateEnvelope(quotes);
      
      const audit = await validateBatch9(baseSymbol, { screener: snap.screener, ...snap.quote });
      results.push({
        symbol: baseSymbol,
        entryPrice: strategyData?.lowerBand || strategyData?.entryPrice || 0,
        target: strategyData?.upperBand || strategyData?.target || 0,
        currentPrice: quotes[quotes.length - 1].close,
        isPass: audit.isPass,
        isBuyZone: !!strategyData?.isBuyZone,
        marketCap: snap.quote.marketCap,
        sector: snap.screener?.industry || 'General'
      });
    }
    res.json({ allStocks: results, open: results.filter(r => r.isBuyZone && r.isPass), rejected: results.filter(r => !r.isPass) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ALPHA-40 HUB ---
app.get('/api/backtest/alpha-40', authenticateToken, async (req: any, res) => {
  try {
    const snapshot = getMarketSnapshot();
    const allSymbols = Array.from(new Set([...BASKETS['BLUECHIP'], ...BASKETS['HIGH_BETA'], ...BASKETS['PROFIT']]));
    const qualifiedStocks: any[] = [];
    for (const baseSymbol of allSymbols) {
      const snap = snapshot[baseSymbol];
      if (!snap) continue;
      const audit = await validateBatch9(baseSymbol, { screener: snap.screener, ...snap.quote });
      if (!audit.isPass) continue;
      for (const strat of STRATEGIES) {
        const stratData = snap.strategies?.[strat.id] || (strat.id === 'ENVELOPE_LONG' ? calculateEnvelope(snap.quotes) : null);
        if (stratData?.isBuyZone) {
          const currentPrice = snap.quotes[snap.quotes.length - 1].close;
          qualifiedStocks.push({
            symbol: baseSymbol,
            strategy: strat.name,
            marketCap: snap.quote.marketCap,
            sector: snap.screener?.industry || 'General',
            currentPrice,
            entryPrice: stratData.lowerBand || stratData.entryPrice || currentPrice,
            target: stratData.upperBand || stratData.target || (currentPrice * 1.3),
            roi: (((stratData.upperBand || currentPrice * 1.3) - currentPrice) / currentPrice) * 100,
            score: audit.score
          });
          break;
        }
      }
    }
    const large = qualifiedStocks.filter(s => s.marketCap / 10000000 >= 65000).sort((a,b) => b.roi - a.roi).slice(0, 20);
    const mid = qualifiedStocks.filter(s => s.marketCap / 10000000 < 65000 && s.marketCap / 10000000 >= 20000).sort((a,b) => b.roi - a.roi).slice(0, 12);
    const small = qualifiedStocks.filter(s => s.marketCap / 10000000 < 20000).sort((a,b) => b.roi - a.roi).slice(0, 8);
    const final = [...large, ...mid, ...small];
    res.json({ stocks: final, summary: { total: final.length, large: large.length, mid: mid.length, small: small.length, avgRoi: final.reduce((a,b) => a + b.roi, 0) / (final.length || 1) } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- USER & ADMIN ROUTES ---
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
  const db = getDB();
  const users = await db.all('SELECT id, name, email, role, tier, subscription_expiry FROM users');
  res.json(users);
});

app.patch('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { name, email, tier, subscription_expiry } = req.body;
    const db = getDB();
    await db.run('UPDATE users SET name = ?, email = ?, tier = ?, subscription_expiry = ? WHERE id = ?', [name, email, tier, subscription_expiry, req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/watchlist', authenticateToken, async (req: any, res) => {
  const db = getDB();
  const list = await db.all('SELECT symbol, quantity, buy_price FROM watchlist WHERE user_id = ?', [req.user.id]);
  res.json(list);
});

app.post('/api/watchlist', authenticateToken, async (req: any, res) => {
  const db = getDB();
  await db.run('INSERT OR IGNORE INTO watchlist (user_id, symbol) VALUES (?, ?)', [req.user.id, req.body.symbol]);
  res.json({ success: true });
});

app.put('/api/watchlist/:symbol', authenticateToken, async (req: any, res) => {
  const db = getDB();
  await db.run('UPDATE watchlist SET quantity = ?, buy_price = ? WHERE user_id = ? AND symbol = ?', [req.body.quantity, req.body.buy_price, req.user.id, req.params.symbol]);
  res.json({ success: true });
});

app.delete('/api/watchlist/:symbol', authenticateToken, async (req: any, res) => {
  const db = getDB();
  await db.run('DELETE FROM watchlist WHERE user_id = ? AND symbol = ?', [req.user.id, req.params.symbol]);
  res.json({ success: true });
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 3001;
async function startServer() {
  try {
    await initDB();
    initSnapshotCache();
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
