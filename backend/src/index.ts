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

app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increased limit for large payloads

// --- Manual Snapshot Trigger ---
app.post('/api/admin/update-snapshot', async (req, res) => {
  try {
    const allSymbols = [...BASKETS['BLUECHIP'], ...BASKETS['HIGH_BETA'], ...BASKETS['PROFIT']];
    // Run in background to avoid timeout
    updateMarketSnapshot(allSymbols).catch(e => console.error('Background Snapshot Error:', e));
    res.json({ success: true, message: 'Market Snapshot Update started in background.' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- Accuracy Helper: Full Knoxville Divergence ---
function checkKnoxville(quotes: any[]) {
  if (quotes.length < 35) return { bullish: false, bearish: false };
  const last = quotes[quotes.length - 1];
  const slice = quotes.slice(-20);
  
  // Bullish: Did we hit a 20-day low RECENTLY (last 5 days)?
  const recentSlice = quotes.slice(-5);
  const hadRecentLow = recentSlice.some(q => q.low <= Math.min(...quotes.slice(-25, -5).map(x => x.low)));
  
  const getRSI = (qts: any[]) => {
    let gains = 0, losses = 0;
    for (let i = qts.length - 14; i < qts.length; i++) {
      const diff = qts[i].close - qts[i-1].close;
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const rs = (gains / 14) / (losses / 14 || 1);
    return 100 - (100 / (1 + rs));
  };

  const currentRSI = getRSI(quotes);
  const prevRSI = getRSI(quotes.slice(0, -1));
  
  // Bullish Div: Price was low, but RSI is turning up (Oversold recovery)
  const bullishDiv = hadRecentLow && currentRSI > prevRSI && currentRSI < 45;
  const mom = last.close - quotes[quotes.length - 21].close;

  return { bullish: bullishDiv && mom > 0 };
}

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

    // --- Subscription Expiry Check ---
    if (user.tier !== 'free' && user.subscription_expiry) {
      const expiry = new Date(user.subscription_expiry);
      if (expiry < new Date()) {
        console.log(`[SUBSCRIPTION] Expiring tier for user ${user.email}`);
        await db.run('UPDATE users SET tier = "free" WHERE id = ?', [user.id]);
        user.tier = 'free';
      }
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// --- ADMIN MIDDLEWARE ---
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

const WHITELISTED_EMAILS = [
  'diwakar.singh01@gmail.com'
];

// --- AUTH ROUTES ---
app.post('/api/auth/mobile-send-otp', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ error: 'Invalid 10-digit mobile number' });
    }
    console.log(`[AUTH] Sending OTP to ${mobile}: 123456`);
    res.json({ success: true, message: 'OTP sent (Simulated: 123456)' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/mobile-verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    // ROOT FIX: Professional Fallback for Testing
    // In live mode, Firebase token would be verified. For now, we use a strict static bypass.
    if (otp !== '123456') {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const db = getDB();
    let user = await db.get('SELECT * FROM users WHERE mobile = ?', [mobile]);
    let needsOnboarding = false;

    if (!user) {
      // Auto-register mobile user
      const beaconEmail = `${mobile}@beacon.user`;
      const id = await db.run(
        'INSERT INTO users (name, email, password, mobile, role, tier, subscription_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`Beacon User`, beaconEmail, 'MOBILE_AUTH', mobile, 'user', 'free', 'FREE']
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [id.lastID]);
      needsOnboarding = true;
      console.log(`[AUTH] New Mobile User Registered: ${mobile}`);
    } else if (user.name === 'Beacon User' || !user.name) {
      needsOnboarding = true;
    }

    const token = jwt.sign({ id: user.id, mobile: user.mobile, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const safeUser = {
      ...user,
      needsOnboarding,
      subscription_expiry: user.subscription_expiry || null,
      daysRemaining: user.subscription_expiry ? Math.max(0, Math.ceil((new Date(user.subscription_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
    };

    res.json({ token, user: safeUser });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    const db = getDB();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      'INSERT INTO users (name, email, password, role, tier, subscription_status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'user', 'free', 'FREE']
    );

    const token = jwt.sign({ id: result.lastID, email, name, role: 'user', tier: 'free' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result.lastID, email, name, role: 'user', tier: 'free' } });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDB();
    
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email, name: user.name, role: user.role, tier: user.tier }, JWT_SECRET, { expiresIn: '7d' });
    
    let daysRemaining = null;
    if (user.subscription_expiry) {
      const diff = new Date(user.subscription_expiry).getTime() - new Date().getTime();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        tier: user.tier,
        daysRemaining
      } 
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    console.log(`[AUTH-GOOGLE] Verifying token (len: ${token?.length})...`);
    
    // Standard JWT ID Token Verification
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      console.error('[AUTH-GOOGLE] Verification failed: Empty payload');
      throw new Error('Invalid token payload');
    }

    const { email, name, sub: googleId } = payload;
    console.log(`[AUTH-GOOGLE] Payload verified for: ${email}`);
    if (!email) throw new Error('Email not provided in Google token');

    const db = getDB();
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    let needsOnboarding = false;

    if (!user) {
      // 100% PUBLIC ACCESS: Auto-register any new Gmail user
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const id = await db.run(
        'INSERT INTO users (name, email, password, role, tier, subscription_status) VALUES (?, ?, ?, ?, ?, ?)',
        [name || 'Gmail User', email, dummyPassword, 'user', 'free', 'FREE']
      );
      user = await db.get('SELECT * FROM users WHERE id = ?', [id.lastID]);
      needsOnboarding = true;
      console.log(`[AUTH-PUBLIC] New Google User: ${email}`);
    } else if (user.name === 'Gmail User' || !user.name) {
      needsOnboarding = true;
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const safeUser = {
      ...user,
      needsOnboarding,
      subscription_expiry: user.subscription_expiry || null,
      daysRemaining: user.subscription_expiry ? Math.max(0, Math.ceil((new Date(user.subscription_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
    };

    res.json({ token: jwtToken, user: safeUser });
  } catch (e: any) { 
    console.error('Google Auth Error:', e.message);
    res.status(500).json({ error: `Google Auth Error: ${e.message}` }); 
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const safeUser = {
      ...user,
      subscription_expiry: user.subscription_expiry || null,
      daysRemaining: user.subscription_expiry ? Math.max(0, Math.ceil((new Date(user.subscription_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null
    };
    res.json({ user: safeUser });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const user = await db.get('SELECT id, name, email, mobile, role, tier, created_at FROM users WHERE id = ?', [req.user.id]);
    
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

app.patch('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const db = getDB();
    await db.run('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ADMIN MANAGEMENT ROUTES ---
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const users = await db.all('SELECT id, name, email, role, tier, created_at FROM users');
    res.json(users);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/admin/users/:id/tier', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { tier } = req.body;
    const db = getDB();
    await db.run('UPDATE users SET tier = ? WHERE id = ?', [tier, id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    if (Number(id) === req.user.id) return res.status(400).json({ error: 'Self-deletion not allowed' });
    
    await db.batch([
      { sql: 'DELETE FROM upgrade_requests WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM watchlists WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM trades WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM feedback WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM users WHERE id = ?', args: [id] }
    ]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/upgrade-requests', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const requests = await db.all(`
      SELECT ur.*, u.email, u.name 
      FROM upgrade_requests ur 
      JOIN users u ON ur.user_id = u.id 
      ORDER BY ur.created_at DESC
    `);
    res.json(requests);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ADMIN UPGRADE APPROVAL ---
app.post('/api/admin/upgrade-requests/:id/approve', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const request = await db.get('SELECT * FROM upgrade_requests WHERE id = ?', [id]);
    
    if (!request) {
      console.log(`[ADMIN] Approval failed: Request ID ${id} not found.`);
      return res.status(404).json({ error: 'Request not found' });
    }

    // Set expiry based on true Calendar Month / Year
    const expiry = new Date();
    if (request.billing_cycle === 'yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }
    const expiryStr = expiry.toISOString();

    console.log(`[ADMIN] Approving ${request.requested_tier} for user ${request.user_id}. Expiry: ${expiryStr}`);

    await db.batch([
      { 
        sql: 'UPDATE users SET tier = ?, subscription_expiry = ? WHERE id = ?', 
        args: [request.requested_tier, expiryStr, request.user_id] 
      },
      { 
        sql: 'UPDATE upgrade_requests SET status = "approved" WHERE id = ?', 
        args: [id] 
      }
    ]);

    console.log(`[ADMIN] SUCCESS: Request ${id} approved.`);
    res.json({ success: true });
  } catch (e: any) { 
    console.error(`[ADMIN ERROR] Approval failed for request ${req.params.id}:`, e.message);
    res.status(500).json({ error: e.message }); 
  }
});

// --- USER UPGRADE ROUTE ---
app.post('/api/user/upgrade-request', authenticateToken, async (req: any, res) => {
  try {
    const { requested_tier, billing_cycle, transaction_id } = req.body;
    
    // UTR Validation: Must be 12-digit numeric string (Standard UPI)
    if (!/^\d{12}$/.test(transaction_id)) {
      return res.status(400).json({ error: 'Invalid UTR format. Please provide the 12-digit transaction ID.' });
    }

    const db = getDB();

    // Check for duplicate transaction ID
    const existing = await db.get('SELECT id FROM upgrade_requests WHERE transaction_id = ?', [transaction_id]);
    if (existing) {
      return res.status(400).json({ error: 'This Transaction ID has already been submitted for verification.' });
    }

    await db.run(
      'INSERT INTO upgrade_requests (user_id, requested_tier, billing_cycle, transaction_id) VALUES (?, ?, ?, ?)',
      [req.user.id, requested_tier, billing_cycle || 'monthly', transaction_id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ANALYST REVIEW ROUTES ---
app.get('/api/admin/reviews', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const db = getDB();
    const reviews = await db.all('SELECT * FROM analyst_reviews');
    res.json(reviews);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/reviews', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { symbol, reason_bucket, reason_text, reason_still_active, future_growth_prospect } = req.body;
    const db = getDB();
    await db.run(
      'INSERT INTO analyst_reviews (symbol, reason_bucket, reason_text, reason_still_active, future_growth_prospect, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(symbol) DO UPDATE SET reason_bucket=excluded.reason_bucket, reason_text=excluded.reason_text, reason_still_active=excluded.reason_still_active, future_growth_prospect=excluded.future_growth_prospect, updated_at=CURRENT_TIMESTAMP',
      [symbol.toUpperCase(), reason_bucket, reason_text, reason_still_active ? 1 : 0, future_growth_prospect ? 1 : 0]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- WATCHLIST ROUTES ---
app.get('/api/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const rows = await db.all('SELECT symbol, quantity, buy_price FROM watchlists WHERE user_id = ?', [req.user.id]);
    res.json(rows.map(r => ({
      symbol: r.symbol,
      quantity: r.quantity || 0,
      buy_price: r.buy_price || 0.0
    })));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/watchlist/:symbol', authenticateToken, async (req: any, res) => {
  try {
    const { symbol } = req.params;
    const { quantity, buy_price } = req.body;
    const db = getDB();
    await db.run(
      'UPDATE watchlists SET quantity = ?, buy_price = ? WHERE user_id = ? AND symbol = ?',
      [quantity, buy_price, req.user.id, symbol.toUpperCase()]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/watchlist', authenticateToken, async (req: any, res) => {
  try {
    const { symbol } = req.body;
    const db = getDB();
    console.log(`📝 Activity Log: User ${req.user.id} added ${symbol} to watchlist`);
    await db.run('INSERT OR IGNORE INTO watchlists (user_id, symbol) VALUES (?, ?)', [req.user.id, symbol.toUpperCase()]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/watchlist/:symbol', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM watchlists WHERE user_id = ? AND symbol = ?', [req.user.id, req.params.symbol.toUpperCase()]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Initialize Daily Screener (4:00 PM IST)
initScreenerCron();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- Helper: Reliable IST Market Status ---
const getMarketStatus = () => {
  const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const day = istDate.getDay(); 
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const currentTime = hours * 100 + minutes;

  if (day === 0 || day === 6) return 'CLOSED'; 
  if (currentTime >= 915 && currentTime <= 1530) return 'LIVE';
  return 'CLOSED';
};

app.get('/api/market-indices', async (req, res) => {
  try {
    const symbols = ['^NSEI', '^NSEBANK', '^BSESN'];
    const status = getMarketStatus();
    const snapshot = getMarketSnapshot();
    
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const quote: any = await yahooFinance.quote(symbol);
          
          if (!quote || !quote.regularMarketPrice || quote.regularMarketPrice === 0) {
            // --- Fallback to Snapshot ---
            const meta = snapshot['METADATA']?.indices?.find((i: any) => 
              i.name === (symbol === '^NSEI' ? 'NIFTY 50' : (symbol === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'))
            );
            if (meta) return meta;
            return { name: symbol, price: 0, change: 0 };
          }

          const current = quote.regularMarketPrice || 0;
          const prevClose = quote.regularMarketPreviousClose || current;
          let change = 0;
          
          if (prevClose > 0) {
            change = ((current - prevClose) / prevClose) * 100;
          }

          return {
            name: symbol === '^NSEI' ? 'NIFTY 50' : (symbol === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'),
            price: current,
            ath: quote.fiftyTwoWeekHigh || current,
            change: change
          };
        } catch (e: any) { 
          const meta = snapshot['METADATA']?.indices?.find((i: any) => 
            i.name === (symbol === '^NSEI' ? 'NIFTY 50' : (symbol === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'))
          );
          if (meta) return meta;
          return { name: symbol, price: 0, change: 0 }; 
        }
      })
    );
    res.json({ status, results });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

const BASKETS: Record<string, string[]> = {
  'BLUECHIP': ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'],
  'HIGH_BETA': ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KANSAINER', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'],
  'PROFIT': [] // Populated dynamically
};

// Function to sync dynamic baskets
function syncBaskets() {
  const dynamicProfit = getDynamicBasket();
  if (dynamicProfit.length > 0) {
    BASKETS['PROFIT'] = dynamicProfit;
  } else {
    // Core fallback if scan hasn't run
    BASKETS['PROFIT'] = ['CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 'MTARTECH', 'MAHLOG', 'PRINCEPIPE'];
  }
}
syncBaskets();

// --- Institutional Fundamental Validator (BATCH 9 PDF STANDARDS) ---
async function validateBatch9(symbol: string, yahooSummary: any, isSnapshot: boolean = false) {
  let screener = yahooSummary?.screener || null;
  
  // PERFORMANCE FIX: Never fetch screener data during a live backtest/scan.
  // Screener data should only be populated during snapshot updates or single-stock audit.
  if (!isSnapshot && !screener && symbol.length > 10) { // Only fetch if specifically asked for 1 stock (long symbol check is a proxy for detail view)
    screener = await fetchScreenerData(symbol);
  }
  
  // Fallback for missing screener data to prevent crashes
  const annualProfit = screener?.historicalNetProfits?.slice(-1)[0] || (yahooSummary?.defaultKeyStatistics?.netIncomeToCommon / 10000000) || 250; 
  const yearsListed = screener?.yearsListed || 15; // Assume 15Y if unknown during fast scan

  const pe = (screener?.peRatio || yahooSummary?.summaryDetail?.trailingPE || yahooSummary?.defaultKeyStatistics?.trailingPE || 0) as number;
  const debtToEquity = (screener?.netDebtToEquity || (yahooSummary?.financialData?.debtToEquity / 100) || 0) as number;
  const roe = (screener?.returnOnEquity || (yahooSummary?.defaultKeyStatistics?.returnOnEquity * 100) || 0) as number;
  const marketCap = (screener?.marketCap || yahooSummary?.summaryDetail?.marketCap || 0) as number;

  const baseSymbol = symbol.split('.')[0].toUpperCase();
  const manualSector = MANUAL_SECTOR_MAP[baseSymbol] || screener?.industry || '';
  const isBankingOrNBFC = manualSector.includes('Bank') || manualSector.includes('NBFC') || manualSector.includes('Insurance') || manualSector.includes('Asset Management');
  const isPSU = (baseSymbol.includes('OIL') || baseSymbol.includes('GAS') || baseSymbol.includes('POWER') || baseSymbol.includes('NTPC') || baseSymbol.includes('ONGC') || baseSymbol.includes('SAIL')) && !manualSector.includes('Bank');

  let score = 0;
  const reasons = [];

  // 1. HARD FILTERS (Course Non-Negotiables)
  if (pe > 80) reasons.push(`High PE (${pe.toFixed(1)} > 80)`);
  if (!isBankingOrNBFC && debtToEquity > 0.50) reasons.push(`High Debt/Equity (${debtToEquity.toFixed(2)} > 0.5)`);
  
  if (annualProfit < 50 && annualProfit !== 0) reasons.push(`Low Net Profit (₹${annualProfit.toFixed(0)} Cr < 50 Cr)`);
  if (marketCap < 5000000000 && marketCap !== 0) reasons.push(`Low Market Cap (₹${(marketCap/10000000).toFixed(0)} Cr < 500 Cr)`);
  
  // Segment 1 (Business Age, PSU, Infra) is now INFORMATIONAL ONLY as per user request.

  // 2. SOFT SCORING (Total: 100 redistributed across Segments 2-9)
  
  // --- SEGMENT 1: BUSINESS QUALITY (Informational - No Weight) ---
  const isMarketLeader = marketCap > 500000000000; 
  const hasPricingPower = roe > 15 && (screener?.profitGrowth3Y > 10 || screener?.salesGrowth3Y > 10);
  const isPrivateSector = !isPSU;

  const businessQuality = {
    score: 0,
    max: 0,
    isInformational: true,
    checks: [
      { label: 'Established (15Y+)', pass: yearsListed >= 15, value: `${yearsListed} Years` },
      { label: 'Market Leader Proxy', pass: isMarketLeader, value: isMarketLeader ? 'YES' : 'NO' },
      { label: 'Pricing Power Proxy', pass: hasPricingPower, value: hasPricingPower ? 'High' : 'Low' },
      { label: 'Private Sector', pass: isPrivateSector, value: isPrivateSector ? 'Private' : 'PSU' }
    ]
  };

  // --- SEGMENT 2: PROFITABILITY QUALITY (Weight: 15) ---
  const profits = screener?.historicalNetProfits || [];
  const profitableYears5Y = profits.slice(-5).filter((p: number) => p > 0).length;
  const opmHistory = screener?.historicalOPM || [];
  const avgOPM = opmHistory.slice(-5).reduce((a: number, b: number) => a + b, 0) / (opmHistory.slice(-5).length || 1);
  const latestOPM = opmHistory.slice(-1)[0] || 0;
  const isMarginStable = latestOPM >= avgOPM * 0.95;

  let profitQualityScore = 0;
  if (annualProfit >= 200) profitQualityScore += 5;
  if (profitableYears5Y >= 4) profitQualityScore += 5;
  if (isMarginStable) profitQualityScore += 5;
  score += profitQualityScore;

  const profitabilityQuality = {
    score: profitQualityScore,
    max: 15,
    checks: [
      { label: 'Net Profit > 200 Cr', pass: annualProfit >= 200, value: `₹ ${annualProfit.toFixed(0)} Cr` },
      { label: '5Y Profit Consistency', pass: profitableYears5Y >= 4, value: `${profitableYears5Y}/5 Years` },
      { label: 'Margin Stability', pass: isMarginStable, value: `${latestOPM.toFixed(1)}% OPM` },
      { label: 'Real Earnings Gen', pass: annualProfit > 0, value: 'Active' }
    ]
  };

  // --- SEGMENT 3: BALANCE SHEET SAFETY (Weight: 20) ---
  const interestCoverage = screener?.interestCoverage || 100;
  const currentRatio = screener?.currentRatio || 2;
  const totalDebt = screener?.totalDebt || 0;
  const cfo = screener?.cashFlowFromOps || 0;
  const cfoToDebt = totalDebt > 0 ? (cfo / totalDebt) : 5; 

  let balanceSheetScore = 0;
  const bsChecks = [];

  if (isBankingOrNBFC) {
    balanceSheetScore = 20; 
    if (roe < 12) balanceSheetScore -= 10;
    bsChecks.push(
      { label: 'Sector Template: Financials', pass: true, value: 'Applied' },
      { label: 'ROE > 12% (Institutional)', pass: roe >= 12, value: `${roe.toFixed(1)}%` }
    );
  } else {
    const passNDtoE = debtToEquity < 0.20;
    const passIntCov = interestCoverage > 3.5;
    const passCurrRatio = currentRatio > 1.25;
    const passCFODebt = cfoToDebt > 0.20;

    if (passNDtoE) balanceSheetScore += 8;
    if (passIntCov) balanceSheetScore += 4;
    if (passCurrRatio) balanceSheetScore += 4;
    if (passCFODebt) balanceSheetScore += 4;

    bsChecks.push(
      { label: 'Net Debt/Equity < 0.2', pass: passNDtoE, value: debtToEquity.toFixed(2) },
      { label: 'Interest Coverage > 3.5', pass: passIntCov, value: interestCoverage.toFixed(1) },
      { label: 'Current Ratio > 1.25', pass: passCurrRatio, value: currentRatio.toFixed(1) },
      { label: 'CFO / Debt > 0.2', pass: passCFODebt, value: cfoToDebt.toFixed(2) }
    );
  }
  score += balanceSheetScore;

  const balanceSheetSafety = {
    score: balanceSheetScore,
    max: 20,
    checks: bsChecks
  };

  // --- SEGMENT 4: GROWTH QUALITY (Weight: 15) ---
  const salesHistory = screener?.historicalSales || [];
  const epsHistory = screener?.historicalEPS || [];

  const calcCAGR = (data: number[], years: number) => {
    if (data.length < years + 1) return 0;
    const start = data[data.length - (years + 1)];
    const end = data[data.length - 1];
    if (start <= 0 || end <= 0) return 0;
    return (Math.pow(end / start, 1 / years) - 1) * 100;
  };

  const salesCAGR3 = calcCAGR(salesHistory, 3);
  const epsCAGR3 = calcCAGR(epsHistory, 3);
  
  let growthConsistencyPass = true;
  if (salesHistory.length > 3) {
    for (let i = salesHistory.length - 3; i < salesHistory.length; i++) {
      if (salesHistory[i] < salesHistory[i-1] * 0.85) growthConsistencyPass = false;
    }
  }

  let growthScore = 0;
  if (salesCAGR3 > 12) growthScore += 5;
  if (epsCAGR3 > 15) growthScore += 5;
  if (growthConsistencyPass) growthScore += 5;
  score += growthScore;

  const growthQuality = {
    score: growthScore,
    max: 15,
    checks: [
      { label: 'Sales CAGR (3Y) > 12%', pass: salesCAGR3 > 12, value: `${salesCAGR3.toFixed(1)}%` },
      { label: 'EPS CAGR (3Y) > 15%', pass: epsCAGR3 > 15, value: `${epsCAGR3.toFixed(1)}%` },
      { label: 'Growth Consistency', pass: growthConsistencyPass, value: growthConsistencyPass ? 'Stable' : 'Volatile' }
    ]
  };

  // --- SEGMENT 5: VALUATION & HISTORY (Weight: 15) ---
  const forwardPE = yahooSummary?.defaultKeyStatistics?.forwardPE || pe * 0.9;
  const pe5yMedian = screener?.pe5yMedian || 28.5;
  const price = yahooSummary?.price?.regularMarketPrice || screener?.currentPrice || 0;
  const twoHundredDMA = yahooSummary?.summaryDetail?.twoHundredDayAverage || (price * 1.05); 
  const isBelow200DMA = price < twoHundredDMA;

  let valScore = 0;
  const peVsMedianPass = pe < pe5yMedian;
  if (peVsMedianPass) valScore += 5;
  if (forwardPE < pe && forwardPE > 0) valScore += 5;
  if (isBelow200DMA) valScore += 5;
  score += valScore;

  const valuationConsistency = {
    score: valScore,
    max: 15,
    checks: [
      { label: 'PE < 5Y Median', pass: peVsMedianPass, value: `${pe.toFixed(1)} vs ${pe5yMedian}` },
      { label: 'Forward PE Awareness', pass: forwardPE < pe, value: `Fwd: ${forwardPE.toFixed(1)}` },
      { label: 'Stock < 200 DMA', pass: isBelow200DMA, value: `Price: ${price.toFixed(0)} < ${twoHundredDMA.toFixed(0)}` }
    ]
  };

  // --- SEGMENT 6: EFFICIENCY & GOVERNANCE (Weight: 10) ---
  const roce = (screener?.roce || 15) as number;
  let efficiencyScore = 0;
  if (roe > 15) efficiencyScore += 5;
  if (roce > 15) efficiencyScore += 5;
  score += efficiencyScore;

  const efficiencyGovernance = {
    score: efficiencyScore,
    max: 10,
    checks: [
      { label: 'ROE > 15%', pass: roe > 15, value: `${roe.toFixed(1)}%` },
      { label: 'ROCE > 15%', pass: roce > 15, value: `${roce.toFixed(1)}%` }
    ]
  };

  // --- SEGMENT 7: CASH FLOW QUALITY (Weight: 10) ---
  const netProfit = profits.slice(-1)[0] || 1;
  const cfoToPat = netProfit > 0 ? (cfo / netProfit) : 0;
  const fcf = cfo - (screener?.capex || 0);
  const fcfToPat = netProfit > 0 ? (fcf / netProfit) : 0;
  
  let cashFlowScore = 0;
  if (cfoToPat >= 0.8) cashFlowScore += 5;
  if (fcf > 0) cashFlowScore += 5;
  score += cashFlowScore;

  const cashFlowQuality = {
    score: cashFlowScore,
    max: 10,
    checks: [
      { label: 'CFO / PAT > 0.8', pass: cfoToPat >= 0.8, value: cfoToPat.toFixed(2) },
      { label: 'Positive FCF', pass: fcf > 0, value: `₹ ${fcf.toFixed(0)} Cr` },
      { label: 'Cash Profit Tracking', pass: cfoToPat > 0.5, value: 'Pass' }
    ]
  };

  // --- SEGMENT 8: MARGIN RESILIENCE (Weight: 10) ---
  const stdDev = (arr: number[]) => {
    const n = arr.length;
    if (n === 0) return 0;
    const mean = arr.reduce((a, b) => a + b) / n;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
  };
  const marginVolatility = stdDev(opmHistory.slice(-5));
  const isMarginResilient = marginVolatility < 5; // Less than 5% fluctuation

  let marginScore = 0;
  if (isMarginResilient) marginScore += 10;
  score += marginScore;

  const marginResilience = {
    score: marginScore,
    max: 10,
    checks: [
      { label: 'Margin Stability', pass: isMarginResilient, value: `±${marginVolatility.toFixed(1)}%` },
      { label: 'Recent Trend', pass: latestOPM >= avgOPM, value: latestOPM >= avgOPM ? 'Stable/Up' : 'Down' }
    ]
  };

  // --- SEGMENT 9: HISTORICAL CONSISTENCY (Weight: 5) ---
  const salesConsistent = salesHistory.slice(-5).every((s: number) => s > 0);
  const profitConsistent = profits.slice(-5).every((p: number) => p > 0);
  
  let consistencyScore = 0;
  if (salesConsistent) consistencyScore += 2;
  if (profitConsistent) consistencyScore += 3;
  score += consistencyScore;

  const historicalConsistency = {
    score: consistencyScore,
    max: 5,
    checks: [
      { label: '5Y Revenue Positive', pass: salesConsistent, value: 'YES' },
      { label: '5Y Profit Positive', pass: profitConsistent, value: 'YES' },
      { label: 'No Major Losses', pass: profitConsistent, value: 'Clean' }
    ]
  };

  // --- UNIVERSE MAPPING (Bluechip -> High Beta -> Profit) ---
  let universe = "WATCHLIST";
  if (BASKETS['BLUECHIP'].includes(baseSymbol)) universe = "BLUECHIP";
  else if (BASKETS['HIGH_BETA'].includes(baseSymbol)) universe = "HIGH BETA";
  else if (BASKETS['PROFIT'].includes(baseSymbol)) universe = "PROFIT";

  return {
    isPass: (reasons.length === 0 && score >= 55) || (score >= 90), // High quality institutional stocks pass regardless of minor filter hits
    score,
    universe,
    businessQuality,
    profitabilityQuality,
    balanceSheetSafety,
    growthQuality,
    valuationConsistency,
    efficiencyGovernance,
    cashFlowQuality,
    marginResilience,
    historicalConsistency,
    reason: reasons.length > 0 && score < 90 ? reasons.join(', ') : 'BATCH 9 COMPLIANT',
    metrics: { pe, debtToEquity, roe, marketCap, score, universe, price, twoHundredDMA }
  };
}

app.post('/api/feedback', authenticateToken, async (req: any, res) => {
  try {
    const { rating, disposition, comment, timestamp, url } = req.body;
    const db = getDB();
    await db.run(
      'INSERT INTO feedback (user_id, rating, disposition, comment, timestamp, url) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, rating, disposition, comment, timestamp, url]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backtest/envelope', async (req, res) => {
  try {
    const basketId = (req.query.basket as string) || 'BLUECHIP';
    const strategyId = (req.query.strategy as string) || 'ENVELOPE_LONG';

    let symbols = BASKETS[basketId] || BASKETS['BLUECHIP'];

    const snapshot = getMarketSnapshot();
    const db = getDB();
    const analystReviews = await db.all('SELECT * FROM analyst_reviews');
    const reviewsMap = new Map(analystReviews.map((r: any) => [r.symbol, r]));

    const openTrades: any[] = [];
    const holdTrades: any[] = [];
    const rejectedStocks: any[] = [];
    const neutralStocks: any[] = [];
    const allScannedStocks: any[] = [];

    const isSnapshotMode = Object.keys(snapshot).length > 0;

    const processBatch = async (batch: string[]) => {
      console.log(`Processing batch of ${batch.length} symbols: ${batch.join(', ')}`);
      await Promise.all(batch.map(async (baseSymbol) => {
        try {
          const symbol = `${baseSymbol}.NS`;
          let history: any, summary: any, strategyData: any, quotes: any[] = [];

          if (isSnapshotMode && snapshot[baseSymbol]) {
            const data = snapshot[baseSymbol];
            history = { quotes: data.quotes };
            quotes = data.quotes;
            summary = {
              summaryDetail: { marketCap: data.quote.marketCap, trailingPE: data.quote.pe, fiftyTwoWeekHigh: data.quote.fiftyTwoWeekHigh },
              defaultKeyStatistics: { returnOnEquity: (data.quote.roe || 15) / 100 },
              financialData: { debtToEquity: data.quote.debtToEquity || 0 },
              screener: data.screener
            };
            
            // --- High-Performance: Use Pre-Calculated Results ---
            // --- High-Performance: Use Pre-Calculated Results ---
            if (data.strategies && data.strategies[strategyId] && strategyId !== 'SIXTY_SEVEN_FUNDA' && strategyId !== 'TWENTY_RALLY_RETEST') {
              strategyData = data.strategies[strategyId];
            } else if (strategyId === 'SIXTY_SEVEN_FUNDA') {
              const athProxy = isSnapshotMode ? (snapshot[baseSymbol]?.quote?.fiftyTwoWeekHigh || 0) : (summary?.summaryDetail?.fiftyTwoWeekHigh || 0);
              const screener = isSnapshotMode ? snapshot[baseSymbol]?.screener : summary?.screener;
              const quarterlyNetIncome = isSnapshotMode ? (snapshot[baseSymbol]?.quote?.quarterlyNetIncome || []) : [];
              strategyData = calculateSixtySevenFunda(quotes, { ...screener, quarterlyNetIncome }, {}, athProxy);
            } else if (strategyId === 'TWENTY_RALLY_RETEST') {
              strategyData = calculateTwentyRallyRetest(quotes, baseSymbol);
            } else if (strategyId === 'ENVELOPE_SHORT') {
              strategyData = processShortEnvelope(quotes, data.quote.marketCap);
            } else if (strategyId === 'BOLLINGER') {
              strategyData = calculateBollingerBand(quotes);
            } else if (strategyId === 'SMA_ABCD') {
              strategyData = calculateSMAStacking(quotes);
            } else if (strategyId === '52W_HIGH_LOW') {
              strategyData = calculate52WeekStrategy(quotes);
            } else if (strategyId === 'CUP_HANDLE_ABCD') {
              strategyData = calculateCupHandle(quotes);
            } else if (strategyId === 'RHS_ABCD') {
              strategyData = calculateRHS(quotes);
            } else if (strategyId === 'SR_STRATEGY') {
              strategyData = calculateSRStrategy(quotes);
            } else if (strategyId === 'TWENTY_RALLY_RETEST') {
              strategyData = calculateTwentyRallyRetest(quotes, baseSymbol);
            } else {
              strategyData = calculateEnvelope(quotes);
            }
          }

          if (!history || !summary) {
            console.log(`[BACKTEST] Missing data for ${baseSymbol}`);
            return;
          }

          const lastQuote = quotes[quotes.length - 1];
          if (!lastQuote) {
            console.log(`[BACKTEST] No quotes for ${baseSymbol}`);
            return;
          }

          const currentPrice = lastQuote.adjclose || lastQuote.adjClose || lastQuote.close || 0;
          const audit = await validateBatch9(baseSymbol, summary, isSnapshotMode);
          const sector = await getAccurateSector(symbol, summary);

          const isShort = strategyId === 'ENVELOPE_SHORT';
          const isBollinger = strategyId === 'BOLLINGER';
          const isSMAStack = strategyId === 'SMA_ABCD';
          const is52W = strategyId === '52W_HIGH_LOW';
          const isCupHandle = strategyId === 'CUP_HANDLE_ABCD';
          const isRHS = strategyId === 'RHS_ABCD';
          const isSR = strategyId === 'SR_STRATEGY';
          const isSixtySeven = strategyId === 'SIXTY_SEVEN_FUNDA';
          const isTwentyRally = strategyId === 'TWENTY_RALLY_RETEST';

          let entryPrice = strategyData.lowerBand || strategyData.entryPrice || strategyData.anchorA || 0;
          let target = strategyData.upperBand || strategyData.target || 0;

          if (isShort) {
            entryPrice = strategyData.ema || 0;
            target = entryPrice * 1.14;
          } else if (is52W) {
            entryPrice = strategyData.rollingLow || 0;
            target = strategyData.rollingHigh || 0;
          } else if (isSMAStack) {
            entryPrice = strategyData.entryPrice || 0;
          } else if (isCupHandle || isRHS || isSR) {
            entryPrice = strategyData.anchorA || 0;
            target = strategyData.target || 0;
          } else if (isSixtySeven) {
            entryPrice = currentPrice;
            target = strategyData.ath || 0;
          } else if (isTwentyRally) {
            entryPrice = strategyData.entryPrice || 0;
            target = strategyData.target || 0;
          } else if (!isBollinger) {
            // Default Envelope Long logic
            target = Math.max(strategyData.upperBand || 0, (lastQuote.adjclose || lastQuote.adjClose || lastQuote.close || 0) * 1.30);
          }

          // --- Direct Entry Rule: Only if Target > 30% ---
          const targetPct = entryPrice > 0 ? ((target - entryPrice) / entryPrice) * 100 : 0;
          const isDirectAllowed = targetPct > 30;

          const abcd = calculateABCDLevels(entryPrice, audit.metrics.marketCap || 0, basketId);

          const calculatedDist = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice * 100) : 100;
          
          const review = reviewsMap.get(baseSymbol);

          const ath = isSixtySeven ? strategyData.ath : (isSnapshotMode ? (snapshot[baseSymbol]?.quote?.fiftyTwoWeekHigh || 0) : (summary?.summaryDetail?.fiftyTwoWeekHigh || 0));

          const position = {
            symbol: baseSymbol,
            entryPrice, 
            actualEntryPrice: currentPrice,
            target,
            currentPrice,
            ath,
            marketCap: audit.metrics.marketCap || 0,
            sector,
            entryTime: strategyData.triggerDate || '-', 
            isPass: (isSixtySeven || isTwentyRally)
              ? (strategyData.verdict !== 'REJECT' && (review ? review.reason_still_active === 0 : true))
              : audit.isPass,
            rejectionReason: (isSixtySeven || isTwentyRally)
              ? (review?.reason_still_active === 1 ? 'Reason still active' : (strategyData.verdict === 'REJECT' ? 'Drawdown/Retest criteria not met' : audit.reason))
              : audit.reason,
            distanceFromLower: isShort ? (strategyData.distanceFromEMA || 0) : (strategyData.distanceFromLower || calculatedDist),
            isBuyZone: (isSixtySeven || isTwentyRally)
              ? (strategyData.verdict === 'QUALIFIED' && (review ? review.reason_still_active === 0 : true))
              : ((isCupHandle || isRHS) ? (isDirectAllowed ? !!strategyData.isBuyZone : false) : !!strategyData.isBuyZone),
            tranche: isShort ? 'B1 (Mid)' : 'A',
            isDirectAllowed,
            targetPct,
            abcd,
            review: {
              reason_bucket: review?.reason_bucket || 'unknown',
              reason_text: review?.reason_text || '',
              reason_resolved: review?.reason_still_active === 0,
              future_growth: review?.future_growth_prospect === 1
            }
          };

          allScannedStocks.push(position);

          if (!position.isPass) {
            rejectedStocks.push(position);
          } 
          else if (position.isBuyZone) {
            openTrades.push(position);
          } 
          else if (position.distanceFromLower <= 10) {
            holdTrades.push(position);
          }
          else {
            neutralStocks.push(position);
          }
        } catch (e) {}
      }));
    };

    const batchSize = 10;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      await processBatch(batch);
    }

    res.json({
      basketName: basketId,
      open: [...new Map(openTrades.map(i => [i.symbol, i])).values()],
      hold: [...new Map(holdTrades.map(i => [i.symbol, i])).values()],
      rejected: [...new Map(rejectedStocks.map(i => [i.symbol, i])).values()], 
      neutral: [...new Map(neutralStocks.map(i => [i.symbol, i])).values()],
      allStocks: [...new Map(allScannedStocks.map(i => [i.symbol, i])).values()],
      summary: {
        totalScanned: symbols.length,
        qualified: openTrades.length,
        observation: holdTrades.length,
        rejected: rejectedStocks.length,
        neutral: neutralStocks.length
      }
    });

  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// --- Helper: Enhanced Sector Mapping ---
const MANUAL_SECTOR_MAP: Record<string, string> = {
  'NIFTYBEES': 'Equity ETF',
  'BANKBEES': 'Banking ETF',
  'AKZOINDIA': 'Paints & Chemicals',
  'ASIANPAINT': 'Paints',
  'BERGEPAINT': 'Paints',
  'KANSAINER': 'Paints',
  'PIDILITIND': 'Chemicals & Adhesives',
  'HDFCBANK': 'Private Bank',
  'ICICIBANK': 'Private Bank',
  'KOTAKBANK': 'Private Bank',
  'AXISBANK': 'Private Bank',
  'ITC': 'FMCG - Diversified',
  'HINDUNILVR': 'FMCG - Household',
  'NESTLEIND': 'FMCG - Food',
  'COLPAL': 'FMCG - Oral Care',
  'DABUR': 'FMCG - Ayurvedic',
  'MARICO': 'FMCG - Consumer',
  'TCS': 'IT Services',
  'INFY': 'IT Services',
  'HCLTECH': 'IT Services',
  'WIPRO': 'IT Services',
  'HDFCAMC': 'Asset Management',
  'NAM-INDIA': 'Asset Management',
  'HDFCLIFE': 'Life Insurance',
  'ICICIPRULI': 'Life Insurance',
  'BAJFINANCE': 'NBFC - Lending',
  'BAJAJFINSV': 'NBFC - Holding',
  'TITAN': 'Consumer Jewelry',
  'BAJAJ-AUTO': 'Automobiles',
  'HEROMOTOCO': 'Automobiles',
  'TVSMOTOR': 'Automobiles',
  'EICHERMOT': 'Automobiles'
};

const getAccurateSector = async (symbol: string, yahooQuote: any) => {
  const baseSymbol = symbol.split('.')[0].toUpperCase();
  if (MANUAL_SECTOR_MAP[baseSymbol]) return MANUAL_SECTOR_MAP[baseSymbol];
  
  try {
    const profile = await yahooFinance.quoteSummary(symbol, { modules: ["assetProfile"] });
    if (profile?.assetProfile?.sector) {
      const s = profile.assetProfile.sector;
      if (s === 'Financial Services') return profile.assetProfile.industry || 'Financials';
      if (s === 'Technology') return 'Information Technology';
      if (s === 'Basic Materials') return profile.assetProfile.industry || 'Basic Materials';
      if (s === 'Consumer Defensive') return 'FMCG';
      if (s === 'Consumer Cyclical') return 'Consumer Discretionary';
      return s;
    }
  } catch (e) {}
  return yahooQuote?.sector || 'General';
};

app.get('/api/stock-prices', async (req, res) => {
  try {
    const symbolsQuery = req.query.symbols as string;
    if (!symbolsQuery) return res.status(400).json({ error: 'No symbols' });
    const symbols = symbolsQuery.split(',');
    const results = await Promise.all(symbols.map(async (s) => {
      const cleanSymbol = s.trim().toUpperCase();
      try {
        let yahooSymbol = cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.NS`;
        let quote: any = await yahooFinance.quote(yahooSymbol);
        if (!quote || !quote.regularMarketPrice) {
          yahooSymbol = `${cleanSymbol}.BO`;
          quote = await yahooFinance.quote(yahooSymbol);
        }
        const sector = await getAccurateSector(yahooSymbol, quote);
        return { 
          symbol: cleanSymbol, 
          name: quote.longName || quote.shortName || cleanSymbol, 
          price: quote.regularMarketPrice, 
          change: quote.regularMarketChangePercent, 
          ath: quote.fiftyTwoWeekHigh, 
          marketCap: quote.marketCap,
          sector
        };
      } catch (e) { 
        return { symbol: s, price: 0 }; 
      }
    }));
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/stock-fundamentals', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string);
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    const cleanSymbol = symbol.trim().toUpperCase().split('.')[0];
    const yahooSymbol = `${cleanSymbol}.NS`;
    const [screenerData, yahooSummary] = await Promise.all([
      fetchScreenerData(cleanSymbol),
      yahooFinance.quoteSummary(yahooSymbol, {
        modules: ["price", "summaryDetail", "defaultKeyStatistics", "assetProfile", "financialData", "summaryProfile"]
      }).catch(() => null)
    ]);
    if (!screenerData && !yahooSummary) throw new Error('Data not found');

    const audit = await validateBatch9(cleanSymbol, { ...yahooSummary, screener: screenerData }, false);

    const sd = yahooSummary?.summaryDetail;
    const stats = yahooSummary?.defaultKeyStatistics;
    const profile = yahooSummary?.summaryProfile;
    const priceModule = yahooSummary?.price;

    const shareholding = screenerData?.shareholding || yahooSummary?.shareholding || { promoter: 0, fii: 0, dii: 0, public: 0, pledged: 0 };
    const smartMoneyTotal = (shareholding.promoter || 0) + (shareholding.fii || 0) + (shareholding.dii || 0);

    const result = {
      symbol: cleanSymbol,
      name: priceModule?.longName || cleanSymbol,
      price: priceModule?.regularMarketPrice || sd?.regularMarketPrice || screenerData?.currentPrice,
      change: priceModule?.regularMarketChangePercent || 0,
      marketCap: screenerData?.marketCap || sd?.marketCap,
      peRatio: screenerData?.peRatio || sd?.trailingPE || stats?.trailingPE,
      dividendYield: screenerData?.dividendYield || (sd?.dividendYield * 100)?.toFixed(2) || 0,
      roce: screenerData?.roce || 18.5,
      returnOnEquity: screenerData?.returnOnEquity || (stats?.returnOnEquity * 100)?.toFixed(1) || 0,
      netDebtToEquity: screenerData?.netDebtToEquity || (yahooSummary?.financialData?.debtToEquity / 100)?.toFixed(2) || 0,
      fiftTwoWeekHigh: sd?.fiftyTwoWeekHigh || yahooSummary?.price?.regularMarketDayHigh,
      fiftTwoWeekLow: sd?.fiftyTwoWeekLow || yahooSummary?.price?.regularMarketDayLow,
      beta: sd?.beta || 0,
      industry: screenerData?.industry || profile?.industry || 'N/A',
      sector: profile?.sector || 'N/A',
      summary: profile?.longBusinessSummary || `Institutional analysis for ${cleanSymbol} based on Batch 9 framework.`,
      faceValue: screenerData?.faceValue || 10,
      audit,
      peComparison: { current: screenerData?.peRatio || sd?.trailingPE, fiveYearAvg: 28.5 },
      growth3Yr: { 
        sales: screenerData?.salesGrowth3Y || 0, 
        eps: audit?.growthQuality?.checks?.find((c: any) => c.label.includes('EPS'))?.value || '0%'
      },
      shareholding: {
        ...shareholding,
        smartMoneyTotal,
        publicAndOthers: (100 - smartMoneyTotal).toFixed(2)
      },
      forwardPE: stats?.forwardPE || 0,
      industryPe: screenerData ? (screenerData.peRatio * 0.9).toFixed(1) : 25.0
    };
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// --- JOURNAL & MARKETPLACE (Omitted for brevity, preserved in file) ---
app.get('/api/trades', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    const trades = await db.all('SELECT * FROM trades WHERE user_id = ? ORDER BY entry_date DESC', [req.user.id]);
    res.json(trades);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/trades', authenticateToken, async (req: any, res) => {
  try {
    const { symbol, entry_price, quantity, entry_date, strategy, notes, target_price, stop_loss, level } = req.body;
    const db = getDB();
    const result = await db.run(
      'INSERT INTO trades (user_id, symbol, entry_price, quantity, entry_date, strategy, notes, target_price, stop_loss, level, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "OPEN")',
      [req.user.id, symbol, entry_price, quantity, entry_date, strategy, notes, target_price, stop_loss, level || 'A']
    );
    res.json({ id: result.lastID });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/trades/:id', authenticateToken, async (req: any, res) => {
  try {
    const { status, exit_price, exit_date, notes } = req.body;
    const db = getDB();
    await db.run(
      'UPDATE trades SET status = ?, exit_price = ?, exit_date = ?, notes = ? WHERE id = ? AND user_id = ?',
      [status, exit_price, exit_date, notes, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/trades/:id/close', authenticateToken, async (req: any, res) => {
  try {
    const { exit_price, exit_date, quantity_to_close, notes } = req.body;
    const db = getDB();
    const trade = await db.get('SELECT * FROM trades WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    if (quantity_to_close < trade.quantity) {
      // Partial close: split trade
      const remainingQty = trade.quantity - quantity_to_close;
      await db.run('UPDATE trades SET quantity = ? WHERE id = ?', [remainingQty, trade.id]);
      
      await db.run(
        'INSERT INTO trades (user_id, symbol, status, entry_date, entry_price, quantity, target_price, level, exit_date, exit_price, strategy, notes) VALUES (?, ?, "CLOSED", ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, trade.symbol, trade.entry_date, trade.entry_price, quantity_to_close, trade.target_price, trade.level, exit_date, exit_price, trade.strategy, notes]
      );
    } else {
      // Full close
      await db.run(
        'UPDATE trades SET status = "CLOSED", exit_price = ?, exit_date = ?, notes = ? WHERE id = ?',
        [exit_price, exit_date, notes, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/trades/:id/reopen', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('UPDATE trades SET status = "OPEN", exit_price = NULL, exit_date = NULL WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/trades/batch', authenticateToken, async (req: any, res) => {
  try {
    const { trades } = req.body;
    const db = getDB();
    console.log(`[BATCH] Starting transaction for ${trades?.length} trades`);
    
    // Efficient Batch Execution for Turso
    const queries = trades.map((t: any) => ({
      sql: 'INSERT INTO trades (user_id, symbol, status, entry_date, entry_price, quantity, target_price, level, strategy, notes, exit_date, exit_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [req.user.id, t.symbol, t.status || 'OPEN', t.entry_date, t.entry_price, t.quantity, t.target_price, t.level || 'A', t.strategy, t.notes, t.exit_date || null, t.exit_price || null]
    }));

    await db.batch(queries);
    
    console.log(`[BATCH] Transaction successful`);
    res.json({ success: true, count: trades.length });
  } catch (e: any) { 
    console.error(`[BATCH ERROR]: ${e.message}`);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/trades/batch-delete', authenticateToken, async (req: any, res) => {
  try {
    const { ids } = req.body;
    const db = getDB();
    const placeholders = ids.map(() => '?').join(',');
    await db.run(`DELETE FROM trades WHERE user_id = ? AND id IN (${placeholders})`, [req.user.id, ...ids]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/trades/:id', authenticateToken, async (req: any, res) => {
  try {
    const db = getDB();
    await db.run('DELETE FROM trades WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/marketplace', async (req, res) => {
  res.json([
    { 
      id: 'pro_yearly', 
      type: 'MEMBERSHIP', 
      name: 'PRO Institutional (Yearly)', 
      desc: '12-month access to Structural Patterns, Quantum Stacking, and Full Portfolio Risk Analytics.', 
      cagr: '28.4%', 
      winRate: '68%', 
      risk: 'Medium-Low', 
      price: '₹799/yr', 
      isUnlocked: false,
      tier: 'pro'
    },
    { 
      id: 'alpha_yearly', 
      type: 'MEMBERSHIP', 
      name: 'ALPHA Institutional (Yearly)', 
      desc: 'Complete 1-year license for Velocity Retest, Deep Recovery Audit, and Supply-Demand Core Engine.', 
      cagr: '42.2%', 
      winRate: '74%', 
      risk: 'Medium', 
      price: '₹1599/yr', 
      isUnlocked: false,
      tier: 'alpha'
    }
  ]);
});

const PORT = process.env.PORT || 3001;
async function startServer() {
  try {
    await initDB();
    initSnapshotCache();
    app.listen(PORT, () => console.log(`SuperTracker Backend running on port ${PORT}`));
  } catch (e) { 
    console.error('SERVER STARTUP ERROR:', e);
    process.exit(1); 
  }
}
startServer();
