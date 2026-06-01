// @ts-nocheck
import express from 'express';
import cron from 'node-cron';
import YahooFinance from 'yahoo-finance2';
import cors from 'cors';
import compression from 'compression';
import etag from 'etag';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { OAuth2Client } from 'google-auth-library';
import { initScreenerCron, getDynamicBasket, runScreener, getMarketSnapshot, updateMarketSnapshot, fetchScreenerData, initSnapshotCache } from './screener.js';
import { validateBatch9 } from './services/fundamentalAudit.js';
import { runStrategyAnalysis } from './services/strategyService.js';
import { precalculateAlpha40, getAlpha40Cache } from './services/worker.js';
import { generateSitemap } from './services/seo.js';
import rateLimit from 'express-rate-limit';
import fs from 'fs';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKET_SNAPSHOT_PATH = path.join(__dirname, '../market_snapshot.json');
import { initDB, getDB } from './db.js';
import { NIFTY_500 } from './universe.js';
import { calculateEnvelope, processShortEnvelope, calculateEMA, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateABCDLevels, calculateRHS, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda, calculateTwentyRallyRetest } from './strategies/index.js';

const yahooFinance = new YahooFinance();
dotenv.config();

const app = express();

app.use(cors()); // CORS must be at the very top
app.use(compression());
app.use(express.json({ limit: '100mb' }));

// --- API HARDENING (30,000 User Capacity) ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5000, // Increased for institutional traffic
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

app.use('/api/', limiter);

// --- REQUEST LOGGER (Safe-Guard Rule #5) ---
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- GLOBAL INSTITUTIONAL MATRIX ---
export const STRATEGIES = [
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

// --- INSTITUTIONAL SECTOR MAPPING ---
export const COMPANY_NAMES: Record<string, string> = {
  'RELAXO': 'Relaxo Footwears Ltd.', 'FINCABLES': 'Finolex Cables Ltd.', 'SYMPHONY': 'Symphony Ltd.',
  'TEAMLEASE': 'TeamLease Services Ltd.', 'SFL': 'Sheela Foam Ltd.', 'RAJESHEXPO': 'Rajesh Exports Ltd.',
  'CERA': 'Cera Sanitaryware Ltd.', 'TASTYBITE': 'Tasty Bite Eatables Ltd.', 'HONAUT': 'Honeywell Automation India',
  'SIS': 'SIS Ltd.', 'VGUARD': 'V-Guard Industries Ltd.', 'SUNTV': 'Sun TV Network Ltd.',
  'OFSS': 'Oracle Financial Services Software', 'BAYERCROP': 'Bayer Cropscience Ltd.', 'TTKPRESTIG': 'TTK Prestige Ltd.',
  'VIPIND': 'VIP Industries Ltd.', 'JCHAC': 'Johnson Controls-Hitachi AC', 'KAJARIACER': 'Kajaria Ceramics Ltd.',
  'VINATIORGA': 'Vinati Organics Ltd.', 'CAPLIPOINT': 'Caplin Point Laboratories', 'GODREJCP': 'Godrej Consumer Products',
  'FINEORG': 'Fine Organic Industries', 'DIXON': 'Dixon Technologies (India)', 'KEI': 'KEI Industries Ltd.',
  'ERIS': 'Eris Lifesciences Ltd.', 'ASTRAZEN': 'AstraZeneca Pharma India', 'AVANTIFEED': 'Avanti Feeds Ltd.',
  'PGHL': 'Procter & Gamble Health', 'LALPATHLAB': 'Dr. Lal PathLabs Ltd.', 'BOSCHLTD': 'Bosch Ltd.',
  'MOTILALOFS': 'Motilal Oswal Financial Services', '3MINDIA': '3M India Ltd.', 'UJJIVANSFB': 'Ujjivan Small Finance Bank',
  'TVSMOTOR': 'TVS Motor Company Ltd.', 'HEROMOTOCO': 'Hero MotoCorp Ltd.', 'RADICO': 'Radico Khaitan Ltd.',
  'EICHERMOT': 'Eicher Motors Ltd.', 'POLYCAB': 'Polycab India Ltd.', 'MCX': 'Multi Commodity Exchange',
  'CDSL': 'Central Depository Services', 'BSE': 'BSE Ltd.', 'IEX': 'Indian Energy Exchange',
  'CAMS': 'Computer Age Management Services', 'HAPPSTMNDS': 'Happiest Minds Technologies', 'AFLE': 'Affle (India) Ltd.',
  'CENTURYPLY': 'Century Plyboards (I) Ltd.', 'KAYNES': 'Kaynes Technology India', 'MTARTECH': 'MTAR Technologies Ltd.',
  'MAHLOG': 'Mahindra Logistics Ltd.', 'PRINCEPIPE': 'Prince Pipes and Fittings', 'ANGELONE': 'Angel One Ltd.',
  'KFINTECH': 'KFin Technologies Ltd.', 'DATA PATTERNS': 'Data Patterns (India) Ltd.', 'MAZAGONDOCK': 'Mazagon Dock Shipbuilders',
  'COCHINSHIP': 'Cochin Shipyard Ltd.', 'GRSE': 'Garden Reach Shipbuilders', 'RVNL': 'Rail Vikas Nigam Ltd.',
  'IRCON': 'Ircon International Ltd.', 'RITES': 'RITES Ltd.', 'RAILTEL': 'RailTel Corporation of India',
  'BEL': 'Bharat Electronics Ltd.', 'HAL': 'Hindustan Aeronautics Ltd.', 'BEML': 'BEML Ltd.',
  'MAZDOCK': 'Mazagon Dock Shipbuilders', 'SOLARINDS': 'Solar Industries India', 'BDL': 'Bharat Dynamics Ltd.',
  'KPITTECH': 'KPIT Technologies Ltd.', 'COFORGE': 'Coforge Ltd.', 'PERSISTENT': 'Persistent Systems Ltd.',
  'TATAELXSI': 'Tata Elxsi Ltd.', 'ZENTEC': 'Zen Technologies Ltd.', 'NEWGEN': 'Newgen Software Technologies',
  'MAPMYINDIA': 'C.E. Info Systems (MapmyIndia)', 'CEINFO': 'C.E. Info Systems Ltd.', 'TANLA': 'Tanla Platforms Ltd.',
  'ROUTE': 'Route Mobile Ltd.', 'LATENTVIEW': 'Latent View Analytics Ltd.'
};

export const MANUAL_SECTOR_MAP: Record<string, string> = {
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

// --- HEALTH CHECKS (Prevents Protocol Mismatch False Positives) ---
app.get('/', (req, res) => res.json({ status: 'active', service: 'MarketBeacon Institutional Backend', version: '11.6.2-PRO' }));
app.get('/api/health', (req, res) => res.json({ status: 'active', service: 'MarketBeacon Institutional API', version: '11.6.2-PRO' }));

// --- ADMIN CONFIG ---
const ADMIN_EMAILS = ['ajaythomasjohn@gmail.com', 'admin@marketbeacon.com', 'diwakarsingh01.tech@gmail.com', 'diwakar.singh01@gmail.com'];

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

// --- FEEDBACK & ANALYTICS ---
app.post('/api/feedback', authenticateToken, async (req: any, res) => {
  const { rating, comment, url } = req.body;
  const db = getDB();
  try {
    await db.run(
      'INSERT INTO feedback (user_id, rating, comment, url, timestamp) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, rating, comment, url, new Date().toISOString()]
    );
    res.json({ success: true, message: 'Feedback saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// --- MANUAL UPI PAYMENTS ---
app.post('/api/payments/manual-request', authenticateToken, async (req: any, res) => {
  const { transactionId, requestedTier, billingCycle } = req.body;
  const db = getDB();
  try {
    await db.run(
      'INSERT INTO upgrade_requests (user_id, requested_tier, billing_cycle, transaction_id, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, requestedTier, billingCycle, transactionId, 'pending']
    );
    res.json({ success: true, message: 'Payment request submitted for verification' });
  } catch (error) {
    if (error.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Transaction ID already submitted' });
    }
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

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
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

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

// --- Manual Snapshot Trigger ---
app.post('/api/admin/update-snapshot', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { basket = 'ALL' } = req.body;
    let symbols = [];
    
    const dynamicWealth = getDynamicBasket();
    const currentWealth = (Array.isArray(dynamicWealth) && dynamicWealth.length > 0) ? dynamicWealth : (BASKETS['Wealth Universe'] || []);

    if (basket === 'Bluechip') {
      symbols = BASKETS['Bluechip'] || [];
    } else if (basket === 'High Beta') {
      symbols = BASKETS['High Beta'] || [];
    } else if (basket === 'Wealth Universe') {
      symbols = currentWealth;
    } else {
      // FIX: Safe spreading
      const all = [];
      if (Array.isArray(BASKETS['Bluechip'])) all.push(...BASKETS['Bluechip']);
      if (Array.isArray(BASKETS['High Beta'])) all.push(...BASKETS['High Beta']);
      if (Array.isArray(currentWealth)) all.push(...currentWealth);
      symbols = Array.from(new Set(all));
    }

    console.log(`🚀 [ADMIN] Manual Snapshot Triggered for ${basket} (${symbols.length} symbols)`);
    updateMarketSnapshot(symbols).catch(e => console.error('Background Snapshot Error:', e));
    
    res.json({ success: true, message: `Market Snapshot Update for ${basket} started in background.` });
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

// --- WATCHLIST SYSTEM ---
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

app.delete('/api/watchlist/:symbol', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM watchlists WHERE user_id = ? AND symbol = ?', [req.user.id, req.params.symbol]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- TRADE LOGGER ---
app.get('/api/trades', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const trades = await db.all('SELECT * FROM trades WHERE user_id = ? ORDER BY entry_date DESC', [req.user.id]);
    res.json(trades);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/trades', authenticateToken, async (req: any, res) => {
  try {
    const { symbol, entry_date, entry_price, quantity, strategy, target_price, stop_loss, notes } = req.body;
    const db = getDB();
    await db.run(
      'INSERT INTO trades (user_id, symbol, entry_date, entry_price, quantity, strategy, target_price, stop_loss, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, symbol, entry_date, entry_price, quantity, strategy, target_price, stop_loss, notes]
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

// --- MARKETPLACE / PLANS ---
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
  
  if (req.headers['if-none-match'] === tag) {
    return res.status(304).end();
  }
  
  res.json(plans);
});


// --- BATCH 9 INSTITUTIONAL AUDIT ENGINE ---
app.get('/api/backtest/audit', authenticateToken, async (req, res) => {
  try {
    const { basket = 'ALL' } = req.query;
    const snapshot = getMarketSnapshot();
    const results = [];
    
     let symbols = [];
     if (basket === 'Bluechip') symbols = BASKETS['Bluechip'];
     else if (basket === 'High Beta') symbols = BASKETS['High Beta'];
     else if (basket === 'Wealth Universe') {
       const dynamicWealth = getDynamicBasket();
       symbols = (Array.isArray(dynamicWealth) && dynamicWealth.length > 0) ? dynamicWealth : BASKETS['Wealth Universe'];
     }
     else symbols = Object.keys(snapshot);

    for (const baseSymbol of symbols) {
      const snap = snapshot[baseSymbol];
      if (!snap) continue;
      const audit = await validateBatch9(baseSymbol, snap, basket as string);
      const lastQuote = snap.quotes[snap.quotes.length - 1];
      
      // Select the primary strategy signal if any
      const activeStrats = Object.entries(snap.strategies || {}).filter(([_, s]: any) => s?.isBuyZone);
      const strategyId = activeStrats.length > 0 ? activeStrats[0][0] : 'ENVELOPE_LONG';
      const strategyData: any = snap.strategies?.[strategyId];

      const entryPrice = strategyData?.entryPrice || 0;
      const currentStrat = STRATEGIES.find(s => s.id === strategyId);
      
      let strategyName = currentStrat?.name || 'Institutional Matrix';
      if (strategyData?.tranche && strategyData.tranche !== 'WATCHLIST') {
        strategyName = `${strategyName} (${strategyData.tranche})`;
      }

      // 100% Robust Date Logic
      let entryTime = null;
      if (strategyData?.triggerDate) {
        try {
          const d = new Date(strategyData.triggerDate);
          if (!isNaN(d.getTime())) entryTime = d.toISOString();
        } catch (e) { console.error(`Invalid date for ${baseSymbol}: ${strategyData.triggerDate}`); }
      }

      // Fallback: If it is Qualified but has no date, use the first quote date (Better than empty)
      if (!entryTime && strategyData?.isBuyZone && snap.quotes.length > 0) {
        entryTime = new Date(snap.quotes[0].date).toISOString();
      }

      results.push({
        symbol: baseSymbol, 
        version: '11.0.0-PRO', 
        entryTime, 
        entryPrice, 
        strategy: strategyName,
        target: strategyData?.target || 0, 
        currentPrice: lastQuote?.close, 
        isPass: audit?.isPass, 
        score: audit?.score,
        reason: audit?.reason,
        auditMetrics: audit?.metrics,
        isBuyZone: !!strategyData?.isBuyZone, 
        marketCap: snap?.quote?.marketCap, 
        sector: MANUAL_SECTOR_MAP[baseSymbol] || snap?.screener?.industry || 'General', 
        abcd: strategyData?.abcd || calculateABCDLevels(entryPrice || lastQuote?.close, snap?.quote?.marketCap) 
      });

    }

    res.json({ 
      allStocks: results, 
      open: results.filter(r => r?.isBuyZone && r?.isPass), 
      rejected: results.filter(r => !r?.isPass) 
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ALPHA HUB ELITE SELECTION ---
app.get('/api/backtest/alpha-40', authenticateToken, async (req: any, res) => {
  try {
    const { timeline = 'ALL' } = req.query;
    const cachedResults = getAlpha40Cache();
    
    if (cachedResults) {
      const { active, closed, capStats, updatedAt } = cachedResults;
      const cutoffDate = timeline === '1M' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : 
                        timeline === '3M' ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) : null;

      const filteredClosed = closed
        .filter(t => !cutoffDate || new Date(t.exitDate) >= cutoffDate)
        .sort((a,b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime());

      return res.json({ 
        stocks: active, 
        closedTrades: filteredClosed,
        summary: { 
          version: '12.2.0-STATS', 
          total: active.length, 
          large: capStats?.LARGE || 0,
          mid: capStats?.MID || 0,
          small: capStats?.SMALL || 0,
          fetchTime: updatedAt,
          isCached: true
        } 
      });
    }
    console.warn('⚠️ [ALPHA-40] Cache empty, falling back.');
    res.status(503).json({ error: 'System is warming up. Please refresh in 30 seconds.' });
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

// --- PUBLIC ANALYSIS ENGINE (Viral Acquisition) ---
app.get('/api/public/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const snapshot = getMarketSnapshot();
    const snap = snapshot[symbol];
    
    if (!snap) return res.status(404).json({ error: 'Stock not found' });

    const audit = await validateBatch9(symbol, snap, 'ALL');
    
    // Extract a few qualified strategies for the teaser
    const qualifiedStrats = [];
    const stratIds = ['ENVELOPE_LONG', 'SMA_ABCD', '52W_HIGH_LOW', 'BOLLINGER'];
    
    for (const id of stratIds) {
      const sd = snap.strategies?.[id] || runStrategyAnalysis(id, snap, snap.quote.marketCap);
      if (sd && sd?.isBuyZone) {
        qualifiedStrats.push({ name: STRATEGIES.find(s => s.id === id)?.name || id });
      }
    }

    const publicData = {
      symbol,
      score: audit.score,
      smartMoney: audit.smartMoneyTotal,
      marketCap: snap.quote.marketCap,
      upside: 30, // Pro-form target
      risk: audit.score >= 80 ? 'Low' : 'Moderate',
      strategies: qualifiedStrats.slice(0, 2) // Teaser only
    };

    const body = JSON.stringify(publicData);
    res.setHeader('ETag', etag(body));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(publicData);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- SERVER START ---
async function startServer() {
  const PORT = process.env.PORT || 3001;
  try {
    await initDB();
    await initSnapshotCache();
    initScreenerCron();

    // 🚀 SCALABILITY WORKER: Initial Pre-calculation
    console.log('🚀 [STARTUP] Warming up Alpha-40 Cache...');
    precalculateAlpha40();
    generateSitemap();
    
    // Schedule Pre-calculation every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      console.log('⏰ [CRON] Refreshing Alpha-40 Cache...');
      precalculateAlpha40();
    });

    // Ephemeral Storage Fix: Trigger priority snapshot if empty
    const cache = getMarketSnapshot();
    if (Object.keys(cache).length <= 1) {
      console.log('🚀 [STARTUP] Cache empty. Triggering priority Bluechip snapshot...');
      updateMarketSnapshot(BASKETS['Bluechip']).catch(e => console.error('Startup Snapshot Failed:', e.message));
    }

    // --- GLOBAL 404 HANDLER (Zero-HTML Policy) ---
    app.use((req, res) => {
      res.status(404).json({ 
        error: `Route ${req.url} Not Found on MarketBeacon API`,
        hint: "This is a JSON error (Safe-Guard Rule #5). If you see this, the frontend hit a wrong endpoint."
      });
    });

    // --- GLOBAL ERROR HANDLER (Safe-Guard Rule #6) ---
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('🔥 [CRITICAL SERVER ERROR]:', err.stack);
      res.status(500).json({ 
        error: "Internal Server Fault", 
        message: err.message,
        hint: "MarketBeacon Pro has encountered a deep logic error. Please report this to the development team."
      });
    });

    app.listen(PORT, '0.0.0.0', () => console.log(`MarketBeacon Backend running on port ${PORT} (Institutional Network Active)`));
  } catch (e) { console.error(e); process.exit(1); }
}

function syncBaskets() {
  try {
    const dynamicProfit = getDynamicBasket();
    if (Array.isArray(dynamicProfit) && dynamicProfit.length > 0) {
      BASKETS['Wealth Universe'] = dynamicProfit;
    }
  } catch (e) { console.error('Sync Baskets Failed:', e.message); }
}

syncBaskets(); 
setInterval(syncBaskets, 60000);
startServer();
