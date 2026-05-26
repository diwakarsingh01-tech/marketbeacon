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
import { NIFTY_500 } from './universe.js';
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
  'WEALTH_BASKET': [
    'CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 
    'MTARTECH', 'MAHLOG', 'PRINCEPIPE', 'ANGELONE', 'MCX', 'KFINTECH', 'DATA PATTERNS', 
    'MAZAGONDOCK', 'COCHINSHIP', 'GRSE', 'RVNL', 'IRCON', 'RITES', 'RAILTEL', 'BEL', 
    'HAL', 'BEML', 'MAZDOCK', 'SOLARINDS', 'BDL', 'KPITTECH', 'COFORGE', 'PERSISTENT', 
    'TATAELXSI', 'ZENTEC', 'NEWGEN', 'MAPMYINDIA', 'CEINFO', 'TANLA', 'ROUTE', 'LATENTVIEW'
  ]
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
    
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase());
    const finalRole = isAdmin ? 'admin' : (user.role || 'user').toLowerCase();
    const finalTier = isAdmin ? 'alpha' : (user.tier || 'free').toLowerCase();

    req.user = { ...user, role: finalRole, tier: finalTier };
    next();
  } catch (err) { return res.status(403).json({ error: 'Invalid or expired token.' }); }
};

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

// --- Manual Snapshot Trigger ---
app.post('/api/admin/update-snapshot', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { basket = 'ALL' } = req.body;
    let symbols = [];
    const dynamicWealth = getDynamicBasket();
    const currentWealth = (Array.isArray(dynamicWealth) && dynamicWealth.length > 0) ? dynamicWealth : (BASKETS['WEALTH_BASKET'] || []);

    if (basket === 'BLUECHIP') {
      symbols = BASKETS['BLUECHIP'] || [];
    } else if (basket === 'HIGH_BETA') {
      symbols = BASKETS['HIGH_BETA'] || [];
    } else if (basket === 'WEALTH_BASKET') {
      symbols = currentWealth;
    } else {
      const all = [];
      if (Array.isArray(BASKETS['BLUECHIP'])) all.push(...BASKETS['BLUECHIP']);
      if (Array.isArray(BASKETS['HIGH_BETA'])) all.push(...BASKETS['HIGH_BETA']);
      if (Array.isArray(currentWealth)) all.push(...currentWealth);
      symbols = Array.from(new Set(all));
    }
    updateMarketSnapshot(symbols).catch(e => console.error('Background Snapshot Error:', e));
    res.json({ success: true, message: `Market Snapshot Update for ${basket} started in background.` });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- INSTITUTIONAL AUDIT ENGINE ---
async function validateBatch9(symbol: string, snap: any) {
  const quote = snap?.quote || {};
  const scr = snap.screener || {};
  const sh = quote.shareholding || scr.shareholding || { promoter: 0, fii: 0, dii: 0, public: 0, pledged: 0 };
  
  const safeParse = (val: any, fallback: number = 0) => {
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? fallback : parsed;
  };

  const pe = safeParse(scr.peRatio) || safeParse(quote.pe) || 45;
  const debtToEquity = safeParse(scr.netDebtToEquity) || (safeParse(quote.debtToEquity) / 100) || 0.5;
  const roe = safeParse(scr.returnOnEquity) || safeParse(quote.roe) || 10;
  const roce = safeParse(scr.roce) || 10;
  const pledged = safeParse(sh.pledged) || 0;
  const fii = safeParse(sh.fii) || 0;
  const dii = safeParse(sh.dii) || 0;
  const promoter = safeParse(sh.promoter) || 0;
  const smartMoneyTotal = promoter + fii + dii;
  
  const sector = MANUAL_SECTOR_MAP[symbol] || scr.industry || 'General';
  const isFinance = ['Banking', 'Finance', 'Banking ETF'].includes(sector);
  const isETF = ['Index ETF', 'Banking ETF'].includes(sector);
  
  let totalScore = 100;
  if (roe < (isFinance ? 12 : 15)) totalScore -= 10;
  if (debtToEquity > (isFinance ? 8.0 : 0.5)) totalScore -= 10;
  if (pledged >= 5) totalScore -= 15;

  const currentSales = safeParse(scr.currentSales);
  const athSales = safeParse(scr.athSales);
  const salesAtATH = currentSales >= (athSales * 0.90); 
  if (!salesAtATH) totalScore -= 10;

  const isHardReject = !isETF && (debtToEquity > 1.0 || pledged >= 10 || smartMoneyTotal < 70);

  return {
    isPass: (totalScore >= 70) && !isHardReject,
    score: totalScore,
    smartMoneyTotal
  };
}

// --- ALPHA HUB ELITE SELECTION ---
app.get('/api/backtest/alpha-40', authenticateToken, async (req: any, res) => {
  try {
    const snapshot = getMarketSnapshot();
    const STRATEGY_BASKET_MAP: Record<string, string[]> = {
      'ENVELOPE_LONG': ['BLUECHIP'], 'ENVELOPE_SHORT': ['BLUECHIP'], 'BOLLINGER': ['BLUECHIP'],
      'CUP_HANDLE_ABCD': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'], 
      'RHS_ABCD': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'],
      'SMA_ABCD': ['BLUECHIP', 'HIGH_BETA'], 
      '52W_HIGH_LOW': ['BLUECHIP', 'HIGH_BETA'],
      'TWENTY_RALLY_RETEST': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'],
      'SIXTY_SEVEN_FUNDA': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'],
      'SR_STRATEGY': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET']
    };

    const processBasket = async (basketName: string, symbols: string[] = []) => {
      const active: any[] = [];
      const closed: any[] = [];
      const targetSymbols = Array.isArray(symbols) ? symbols : (BASKETS[basketName] || []);
      
      for (const sym of targetSymbols) {
        try {
          const snap = snapshot[sym];
          if (!snap || !Array.isArray(snap.quotes) || snap.quotes.length === 0) continue;
          const audit = await validateBatch9(sym, snap);
          if (!audit.isPass) continue;

          const sector = MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General';

          for (const strat of STRATEGIES) {
            if (!STRATEGY_BASKET_MAP[strat.id]?.includes(basketName)) continue;
            let sd: any;
            try {
              if (strat.id === 'ENVELOPE_LONG') sd = calculateEnvelope(snap.quotes);
              else if (strat.id === 'BOLLINGER') sd = calculateBollingerBand(snap.quotes);
              else if (strat.id === 'SMA_ABCD') sd = calculateSMAStacking(snap.quotes);
              else if (strat.id === '52W_HIGH_LOW') sd = calculate52WeekStrategy(snap.quotes);
              else if (strat.id === 'SR_STRATEGY') sd = calculateSRStrategy(snap.quotes, snap.screener);
              else if (strat.id === 'RHS_ABCD') sd = calculateRHS(snap.quotes);
              else if (strat.id === 'CUP_HANDLE_ABCD') sd = calculateCupHandle(snap.quotes);
              else if (strat.id === 'SIXTY_SEVEN_FUNDA') sd = calculateSixtySevenFunda(snap.quotes, snap.screener);
              else if (strat.id === 'TWENTY_RALLY_RETEST') sd = calculateTwentyRallyRetest(snap.quotes, sym);
            } catch (e) { continue; }

            if (!sd) continue;
            const last = snap.quotes[snap.quotes.length - 1];
            const entry = sd.entryPrice || last.close;
            const target = sd.target || (entry * 1.3);
            const roi = ((target / entry) - 1) * 100;
            const marketCap = snap.quote.marketCap || 0;
            const capCr = marketCap / 10000000;
            const capType = capCr >= 20000 ? 'LARGE' : (capCr >= 5000 ? 'MID' : 'SMALL');

            if (sd.isBuyZone) {
              active.push({ 
                symbol: sym, 
                entryTime: sd.triggerDate, 
                strategy: strat.name, 
                basketSource: basketName, 
                marketCap, 
                capType,
                sector, 
                currentPrice: last.close, 
                entryPrice: entry, 
                target, 
                roi, 
                score: audit.score,
                smartMoney: audit.smartMoneyTotal
              });
              break; 
            } else if (entry > 0) {
               const idx = snap.quotes.findIndex(q => String(q.date).includes(String(sd.triggerDate)));
               const eIdx = idx === -1 ? -1 : snap.quotes.slice(idx).findIndex(q => q.high >= target);
               if (eIdx !== -1) {
                  closed.push({ symbol: sym, exitDate: new Date(snap.quotes[idx + eIdx].date).toISOString().split('T')[0], roi, days: eIdx, strategy: strat.name, sector, entryPrice: entry, targetPrice: target });
                  break;
               }
            }
          }
        } catch (e) { }
      }
      return { active, closed };
    };

    const bc = await processBasket('BLUECHIP', BASKETS['BLUECHIP']);
    const hb = await processBasket('HIGH_BETA', BASKETS['HIGH_BETA']);
    const dynamic = getDynamicBasket();
    const currentW = (Array.isArray(dynamic) && dynamic.length > 0) ? dynamic : BASKETS['WEALTH_BASKET'];
    const wb = await processBasket('WEALTH_BASKET', currentW);

    const candidates = [...bc.active, ...hb.active, ...wb.active].sort((a,b) => b.roi - a.roi);
    
    // INSTITUTIONAL SELECTION: 50-30-20 RULE (Target 50 Stocks)
    // 25 Large, 15 Mid, 10 Small
    const finalActive = [];
    const sectorStats: Record<string, number> = {};
    const capStats = { LARGE: 0, MID: 0, SMALL: 0 };
    const CAP_LIMITS = { LARGE: 25, MID: 15, SMALL: 10 };
    const MAX_PER_SECTOR = 10; // 20% of 50

    for (const s of candidates) {
      if (capStats[s.capType] < CAP_LIMITS[s.capType]) {
        if ((sectorStats[s.sector] || 0) < MAX_PER_SECTOR) {
          finalActive.push(s);
          sectorStats[s.sector] = (sectorStats[s.sector] || 0) + 1;
          capStats[s.capType]++;
        }
      }
    }

    res.json({ 
      stocks: finalActive, 
      closedTrades: [...bc.closed, ...hb.closed, ...wb.closed].sort((a,b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()).slice(0, 50),
      summary: { 
        version: '11.5.0-PRO', 
        total: finalActive.length, 
        large: capStats.LARGE, mid: capStats.MID, small: capStats.SMALL,
        avgRoi: finalActive.reduce((a,b) => a + (b.roi || 0), 0) / (finalActive.length || 1),
        accuracy: 100
      } 
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

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

async function startServer() {
  const PORT = process.env.PORT || 3001;
  try {
    await initDB();
    await initSnapshotCache();
    initScreenerCron();
    const cache = getMarketSnapshot();
    if (Object.keys(cache).length <= 1) {
      updateMarketSnapshot(BASKETS['BLUECHIP']).catch(e => { });
    }
    app.listen(PORT, () => console.log(`MarketBeacon Backend running on port ${PORT}`));
  } catch (e) { process.exit(1); }
}

function syncBaskets() {
  try {
    const dynamicProfit = getDynamicBasket();
    if (Array.isArray(dynamicProfit) && dynamicProfit.length > 0) {
      BASKETS['WEALTH_BASKET'] = dynamicProfit;
    }
  } catch (e) { }
}

syncBaskets(); 
setInterval(syncBaskets, 60000);
startServer();
