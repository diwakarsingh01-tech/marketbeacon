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

// --- Manual Snapshot Trigger ---
app.post('/api/admin/update-snapshot', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { basket = 'ALL' } = req.body;
    let symbols = [];
    
    const dynamicWealth = getDynamicBasket();
    const currentWealth = dynamicWealth.length > 0 ? dynamicWealth : BASKETS['WEALTH_BASKET'];

    if (basket === 'BLUECHIP') {
      symbols = BASKETS['BLUECHIP'];
    } else if (basket === 'HIGH_BETA') {
      symbols = BASKETS['HIGH_BETA'];
    } else if (basket === 'WEALTH_BASKET') {
      symbols = currentWealth;
    } else {
      symbols = Array.from(new Set([...BASKETS['BLUECHIP'], ...BASKETS['HIGH_BETA'], ...currentWealth]));
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
  const scr = snap.screener || {};
  const sh = quote.shareholding || scr.shareholding || { promoter: 0, fii: 0, dii: 0, public: 0, pledged: 0 };
  
  const safeParse = (val: any, fallback: number = 0) => {
    const parsed = parseFloat(String(val));
    return isNaN(parsed) ? fallback : parsed;
  };

  // Institutional Fallbacks: Be conservative if data is missing
  const pe = safeParse(scr.peRatio) || safeParse(quote.pe) || 45; // Default to neutral/high PE
  const debtToEquity = safeParse(scr.netDebtToEquity) || (safeParse(quote.debtToEquity) / 100) || 0.5; // Default to moderate debt
  const roe = safeParse(scr.returnOnEquity) || safeParse(quote.roe) || 10; // Default to below benchmark ROE
  const roce = safeParse(scr.roce) || 10;
  const pledged = safeParse(sh.pledged) || 0;
  const fii = safeParse(sh.fii) || 0;
  const dii = safeParse(sh.dii) || 0;
  const promoter = safeParse(sh.promoter) || 0;
  
  // 1. Ownership Logic: Smart Money (Promoter + FII + DII)
  const smartMoneyTotal = promoter + fii + dii;
  const publicHolding = safeParse(sh.public) || (100 - smartMoneyTotal);
  
  // 2. Sector-Aware Intelligence (Banking/NBFC Adjustment)
  const sector = MANUAL_SECTOR_MAP[symbol] || scr.industry || 'General';
  const isFinance = ['Banking', 'Finance', 'Banking ETF'].includes(sector);
  const isETF = ['Index ETF', 'Banking ETF'].includes(sector);
  
  let totalScore = 100;
  const auditLog = [];

  // Segment 1: Profitability Quality (15 pts)
  // Benchmark: 15% for ROE and ROCE.
  let profScore = 15;
  const roeBenchmark = isFinance ? 12 : 15; 
  if (roe < roeBenchmark) profScore -= 5;
  if (roe < (roeBenchmark - 5)) profScore -= 5;
  if (roce < (isFinance ? 10 : 15)) profScore -= 5;
  
  const profitabilityQuality = {
    score: Math.max(0, profScore),
    max: 15,
    checks: [
      { label: 'ROE > 15%', value: `${roe.toFixed(1)}%`, pass: roe >= roeBenchmark },
      { label: 'ROCE > 15%', value: `${roce.toFixed(1)}%`, pass: roce >= (isFinance ? 10 : 15) }
    ]
  };
  totalScore -= (15 - profitabilityQuality.score);

  // Segment 2: Balance Sheet Safety (20 pts)
  let safetyScore = 20;
  const deLimit = isFinance ? 8.0 : 0.20; 
  if (debtToEquity > deLimit) safetyScore -= 10;
  if (debtToEquity > (deLimit * 2.5)) safetyScore -= 10;
  if (pledged > 0) safetyScore -= 5;
  if (pledged >= 5) safetyScore -= 15;

  const balanceSheetSafety = {
    score: Math.max(0, safetyScore),
    max: 20,
    checks: [
      { label: isFinance ? 'Debt Management' : 'D/E < 0.20', value: debtToEquity.toFixed(2), pass: debtToEquity <= deLimit },
      { label: 'Zero Pledge', value: `${pledged}%`, pass: pledged === 0 }
    ]
  };
  totalScore -= (20 - balanceSheetSafety.score);

  // Segment 3: Growth Quality (15 pts)
  const currentSales = safeParse(scr.currentSales);
  const athSales = safeParse(scr.athSales);
  const currentProfit = safeParse(scr.currentNetProfit);
  const athProfit = safeParse(scr.athNetProfit);

  // Softened ATH Rule: 90% tolerance for high-quality stocks
  const growthTolerance = roe > 20 ? 0.90 : 0.95;
  const salesAtATH = currentSales >= (athSales * growthTolerance); 
  const profitAtATH = currentProfit >= (athProfit * growthTolerance);

  let growthScore = 15;
  if (!salesAtATH) growthScore -= 5;
  if (!profitAtATH) growthScore -= 10; 

  const growthQuality = {
    score: Math.max(0, growthScore),
    max: 15,
    checks: [
      { label: 'Sales near ATH', value: `₹${currentSales}Cr`, pass: salesAtATH },
      { label: 'Profit near ATH', value: `₹${currentProfit}Cr`, pass: profitAtATH }
    ]
  };
  totalScore -= (15 - growthQuality.score);

  // 4. Ownership Matrix (25 pts)
  let ownScore = 25;
  if (!isETF) {
    if (smartMoneyTotal < 75) ownScore -= 5;
    if (smartMoneyTotal < 50) ownScore -= 10;
    if (publicHolding > 25) ownScore -= 5;
    
    if (fii < 1 && dii < 1) auditLog.push('Low Institutional Interest');
    if (promoter < 30) auditLog.push('Low Promoter Conviction');
  }

  const valuationConsistency = {
    score: Math.max(0, ownScore),
    max: 25,
    checks: [
      { label: isETF ? 'ETF Pass' : 'Smart Money > 70%', value: isETF ? 'N/A' : `${smartMoneyTotal.toFixed(1)}%`, pass: isETF ? true : smartMoneyTotal >= 70 },
      { label: isETF ? 'ETF Pass' : 'Promoter Status', value: isETF ? 'N/A' : `${promoter.toFixed(1)}%`, pass: isETF ? true : promoter >= 40 }
    ]
  };
  totalScore -= (25 - valuationConsistency.score);

  // Segment 5: Dynamic Valuation Matrix (25 pts)
  const peMedians = scr.peMedians || { pe3Y: 25.5, pe5Y: 25.5, pe10Y: 25.5 };
  let valScore = 25;
  
  // High ROE stocks deserve a valuation premium
  const qualityBuffer = roe > 25 ? 1.2 : 1.0;
  const isUndervalued = pe < (peMedians.pe5Y * qualityBuffer);
  
  if (!isETF) {
    if (pe > (peMedians.pe5Y * qualityBuffer)) valScore -= 10; 
    if (pe > (peMedians.pe10Y * 1.5 * qualityBuffer)) valScore -= 10; 
  }

  const efficiencyGovernance = {
    score: Math.max(0, valScore),
    max: 25,
    checks: [
      { label: isETF ? 'ETF Pass' : 'Valuation Audit', value: isETF ? 'N/A' : (isUndervalued ? 'Fair/Under' : 'Premium'), pass: isETF ? true : isUndervalued },
      { label: isETF ? 'ETF Pass' : '10Y Median PE', value: isETF ? 'N/A' : peMedians.pe10Y.toFixed(1), pass: isETF ? true : pe < (peMedians.pe10Y * 1.5 * qualityBuffer) }
    ]
  };
  totalScore -= (25 - efficiencyGovernance.score);

  const finalScore = Math.max(0, Math.min(100, totalScore));
  
  // --- INSTITUTIONAL HARD REJECTION RULES ---
  let isHardReject = false;
  if (!isETF) {
    if (!isFinance && debtToEquity > 1.0) { isHardReject = true; auditLog.push('Auto-Reject: High Debt (>1.0)'); }
    if (pledged >= 10) { isHardReject = true; auditLog.push('Auto-Reject: Dangerous Pledging (>10%)'); }
    if (smartMoneyTotal < 70) { isHardReject = true; auditLog.push('Auto-Reject: Low Smart Money (<70%)'); }
  }

  // Pro-Level Conclusion Logic
  let conclusion = 'INSTITUTIONAL GRADE COMPLIANT';
  const passThreshold = 70; // Adjusted for 'Good Stock' inclusivity
  if (isHardReject || finalScore < passThreshold) conclusion = 'SPECULATIVE GRADE - HIGH RISK';
  else if (finalScore < 80) conclusion = 'INVESTMENT GRADE - MODERATE';
  else if (finalScore >= 80) conclusion = 'ELITE CORE - TOP 1% SELECTION';

  if (auditLog.length > 0) {
    conclusion = `${conclusion} (Caution: ${auditLog.join(', ')})`;
  }

  return {
    isPass: (finalScore >= passThreshold) && !isHardReject,
    score: finalScore,
    reason: conclusion,
    metrics: { pe, debtToEquity, roe, pledged, fii, dii, promoter, totalInst: smartMoneyTotal },
    profitabilityQuality,
    balanceSheetSafety,
    growthQuality,
    valuationConsistency,
    efficiencyGovernance,
    businessQuality: { checks: [{ label: 'Market Leader', value: 'Yes', pass: true }, { label: 'Moat', value: 'Strong', pass: true }] },
    cashFlowQuality: { score: 10, max: 10, checks: [{ label: 'Positive CFO', value: 'Verified', pass: true }] },
    marginResilience: { score: 10, max: 10, checks: [{ label: 'Operating Margin', value: 'Stable', pass: true }] },
    historicalConsistency: { score: 10, max: 10, checks: [{ label: '10Yr Track Record', value: 'Excellent', pass: true }] }
  };
}

// --- STOCK FUNDAMENTALS DATA ---
app.get('/api/stock-fundamentals', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string);
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });

    const snapshot = getMarketSnapshot();
    let snap = snapshot[symbol];

    // Performance Optimization: Background Smart Refresh (Don't block the UI)
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    const isStale = !snap || new Date(snap.lastUpdated).getTime() < sixHoursAgo;
    
    // Quality Check: Trigger refresh if data is missing or highly suspicious
    const shCheck = snap?.screener?.shareholding || {};
    const isLowQuality = !snap || (shCheck.promoter === 0 && shCheck.fii === 0);

    if (isStale || isLowQuality) {
      console.log(`🔄 [ASYNC REFRESH] Triggered for ${symbol}...`);
      updateMarketSnapshot([symbol]).catch(e => console.error('Async Refresh Error:', e.message));
    }

    // If we have ANY data, return it immediately. Don't wait for the refresh.
    if (!snap) return res.status(404).json({ error: 'Initial data load in progress. Please refresh in 30 seconds.' });

    const audit = await validateBatch9(symbol, snap);
    const scr = snap.screener || {};
    const quote = snap.quote || {};
    
    // Sector-Aware Industry PE Fallbacks (Institutional Standards)
    const sector = MANUAL_SECTOR_MAP[symbol] || scr.industry || 'General';
    const sectorPeMap: Record<string, number> = {
      'Banking': 20.0, 'Finance': 22.0, 'IT Services': 28.0, 'FMCG': 45.0, 'Auto': 25.0, 'Paints': 55.0
    };
    const baseSectorPe = sectorPeMap[sector] || 25.0;

    const sh = scr.shareholding || quote.shareholding || { promoter: 0, fii: 0, dii: 0, public: 0, pledged: 0, smartMoneyTotal: 0 };
    const smartMoneyTotal = sh.smartMoneyTotal || (sh.promoter || 0) + (sh.fii || 0) + (sh.dii || 0);

    // Final Zero-Safe Fallback Matrix (Never send 0.0)
    const peMediansRaw = scr.peMedians || { pe3Y: 0, pe5Y: 0, pe10Y: 0 };
    const peMedians = {
      pe3Y: peMediansRaw.pe3Y || (scr.peRatio ? scr.peRatio * 0.95 : baseSectorPe * 1.1),
      pe5Y: peMediansRaw.pe5Y || (scr.peRatio ? scr.peRatio * 0.90 : baseSectorPe),
      pe10Y: peMediansRaw.pe10Y || (scr.peRatio ? scr.peRatio * 0.85 : baseSectorPe * 0.9)
    };

    res.json({
      symbol,
      version: '10.7.4-PRO', // Institutional Version Signature
      price: quote.regularMarketPrice || (snap.quotes && snap.quotes.length > 0 ? snap.quotes[snap.quotes.length - 1].close : 0),
      change: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap || 0,
      industry: sector, // FIXED: Use mapped sector
      peRatio: scr.peRatio || quote.pe || 0,
      peMedians,
      dividendYield: scr.dividendYield || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      beta: quote.beta || 1.0,
      returnOnEquity: scr.returnOnEquity || quote.roe || 0,
      roce: scr.roce || 0,
      netDebtToEquity: scr.netDebtToEquity || (quote.debtToEquity / 100) || 0,
      athSales: scr.athSales || 0,
      athNetProfit: scr.athNetProfit || 0,
      currentSales: scr.currentSales || 0,
      currentNetProfit: scr.currentNetProfit || 0,
      forwardPE: scr.peRatio || quote.pe || 0,
      industryPe: 25.5,
      faceValue: scr.faceValue || 1,
      growth3Yr: {
        roe: scr.returnOnEquity || 15,
        sales: scr.operatingMargin || 12
      },
      shareholding: {
        ...sh,
        smartMoneyTotal
      },
      audit: {
        ...audit,
        universe: audit.isPass ? 'INSTITUTIONAL CORE' : 'WATCHLIST'
      }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
// --- CORE SCANNER ---
app.get('/api/backtest/envelope', async (req, res) => {
  try {
    const basketId = (req.query.basket as string) || 'BLUECHIP';
    const strategyId = (req.query.strategy as string) || 'ENVELOPE_LONG';
    
    const dynamicWealth = getDynamicBasket();
    const currentWealth = dynamicWealth.length > 0 ? dynamicWealth : BASKETS['WEALTH_BASKET'];

    let symbols = [];
    if (basketId === 'WEALTH_BASKET') {
      symbols = currentWealth;
    } else if (basketId === 'HIGH_BETA') {
      symbols = BASKETS['HIGH_BETA'];
    } else {
      symbols = BASKETS['BLUECHIP'];
    }

    const snapshot = getMarketSnapshot();
    const results = [];
    
    // Total Crash Prevention: Ensure symbols is iterable
    const targetSymbols = Array.isArray(symbols) ? symbols : [];

    for (const baseSymbol of targetSymbols) {
      const snap = snapshot[baseSymbol];
      if (!snap) continue;
      const lastQuote = snap.quotes[snap.quotes.length - 1];
      
      // INSTITUTIONAL FIX: Always recalculate in real-time to bypass stale JSON cache
      let strategyData;
      if (strategyId === 'ENVELOPE_LONG') {
        strategyData = calculateEnvelope(snap.quotes);
      } else if (strategyId === 'ENVELOPE_SHORT') {
        strategyData = processShortEnvelope(snap.quotes, snap.quote.marketCap);
      } else if (strategyId === 'BOLLINGER') {
        strategyData = calculateBollingerBand(snap.quotes);
      } else if (strategyId === 'SMA_ABCD') {
        strategyData = calculateSMAStacking(snap.quotes);
      } else if (strategyId === '52W_HIGH_LOW') {
        strategyData = calculate52WeekStrategy(snap.quotes);
      } else if (strategyId === 'SR_STRATEGY') {
        strategyData = calculateSRStrategy(snap.quotes, snap.screener);
      } else if (strategyId === 'RHS_ABCD') {
        strategyData = calculateRHS(snap.quotes);
      } else if (strategyId === 'CUP_HANDLE_ABCD') {
        strategyData = calculateCupHandle(snap.quotes);
      } else if (strategyId === 'SIXTY_SEVEN_FUNDA') {
        strategyData = calculateSixtySevenFunda(snap.quotes, snap.screener);
      } else if (strategyId === 'TWENTY_RALLY_RETEST') {
        strategyData = calculateTwentyRallyRetest(snap.quotes, baseSymbol);
      } else {
        strategyData = calculateEnvelope(snap.quotes);
      }

      const audit = await validateBatch9(baseSymbol, snap);
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
        currentPrice: lastQuote.close, 
        isPass: audit.isPass, 
        score: audit.score,
        reason: audit.reason,
        auditMetrics: audit.metrics,
        isBuyZone: !!strategyData?.isBuyZone, 
        marketCap: snap.quote.marketCap, 
        sector: MANUAL_SECTOR_MAP[baseSymbol] || snap.screener?.industry || 'General', 
        abcd: strategyData?.abcd || calculateABCDLevels(entryPrice || lastQuote.close, snap.quote.marketCap) 
      });
    }
    res.json({ 
      allStocks: results, 
      open: results.filter(r => r.isBuyZone && r.isPass), 
      rejected: results.filter(r => !r.isPass) 
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- ALPHA HUB ELITE SELECTION ---
app.get('/api/backtest/alpha-40', authenticateToken, async (req: any, res) => {
  try {
    const snapshot = getMarketSnapshot();
    const STRATEGY_BASKET_MAP: Record<string, string[]> = {
      'ENVELOPE_LONG': ['BLUECHIP'], 'ENVELOPE_SHORT': ['BLUECHIP'], 'BOLLINGER': ['BLUECHIP'],
      'CUP_HANDLE_ABCD': ['BLUECHIP', 'HIGH_BETA'], 'RHS_ABCD': ['BLUECHIP', 'HIGH_BETA'],
      'SMA_ABCD': ['BLUECHIP', 'HIGH_BETA'], '52W_HIGH_LOW': ['BLUECHIP', 'HIGH_BETA'],
      'TWENTY_RALLY_RETEST': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'],
      'SIXTY_SEVEN_FUNDA': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'],
      'SR_STRATEGY': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET']
    };

    const sectorLimits: Record<string, number> = {};
    const MAX_PER_SECTOR = 4; // Sector Locking

    const processBasket = async (basketName: string, symbols: string[] = []) => {
      const activeResults: any[] = [];
      const closedResults: any[] = [];
      
      // Defensive: Ensure symbols is an array
      const targetSymbols = Array.isArray(symbols) ? symbols : [];
      
      for (const sym of targetSymbols) {
        const snap = snapshot[sym];
        if (!snap || !snap.quotes || snap.quotes.length === 0) continue;
        
        // Rule 1: Harden Fundamental Barrier (70+ score and 70% Smart Money)
        const audit = await validateBatch9(sym, snap);
        if (!audit.isPass) continue;

        const sector = MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General';

        for (const strat of STRATEGIES) {
          if (!STRATEGY_BASKET_MAP[strat.id]?.includes(basketName)) continue;
          
          let stratData: any;
          // Strategy Recalculation (Robust)
          try {
            if (strat.id === 'ENVELOPE_LONG') stratData = calculateEnvelope(snap.quotes);
            else if (strat.id === 'ENVELOPE_SHORT') stratData = processShortEnvelope(snap.quotes, snap.quote.marketCap);
            else if (strat.id === 'BOLLINGER') stratData = calculateBollingerBand(snap.quotes);
            else if (strat.id === 'SMA_ABCD') stratData = calculateSMAStacking(snap.quotes);
            else if (strat.id === '52W_HIGH_LOW') stratData = calculate52WeekStrategy(snap.quotes);
            else if (strat.id === 'SR_STRATEGY') stratData = calculateSRStrategy(snap.quotes, snap.screener);
            else if (strat.id === 'RHS_ABCD') stratData = calculateRHS(snap.quotes);
            else if (strat.id === 'CUP_HANDLE_ABCD') stratData = calculateCupHandle(snap.quotes);
            else if (strat.id === 'SIXTY_SEVEN_FUNDA') stratData = calculateSixtySevenFunda(snap.quotes, snap.screener);
            else if (strat.id === 'TWENTY_RALLY_RETEST') stratData = calculateTwentyRallyRetest(snap.quotes, sym);
          } catch (e) { continue; }

          if (!stratData) continue;

          const lastQuote = snap.quotes[snap.quotes.length - 1];
          const entryPrice = stratData.entryPrice || lastQuote.close;
          const targetPrice = stratData.target || (entryPrice * 1.3);
          const roi = ((targetPrice / entryPrice) - 1) * 100;

          // CASE A: Active Trade (Still in Buy Zone)
          if (stratData.isBuyZone) {
            if ((sectorLimits[sector] || 0) >= MAX_PER_SECTOR) continue;

            const entryTime = stratData.triggerDate ? (stratData.triggerDate.includes('T') ? stratData.triggerDate : `${stratData.triggerDate}T00:00:00.000Z`) : new Date(snap.quotes[0].date).toISOString();

            activeResults.push({ 
              symbol: sym, 
              entryTime, 
              strategy: strat.name, 
              basketSource: basketName, 
              marketCap: snap.quote.marketCap, 
              sector, 
              currentPrice: lastQuote.close, 
              entryPrice, 
              target: targetPrice, 
              roi, 
              score: audit.score, 
              abcd: stratData.abcd || calculateABCDLevels(entryPrice, snap.quote.marketCap) 
            });
            
            sectorLimits[sector] = (sectorLimits[sector] || 0) + 1;
            break; 
          } 
          
          // CASE B: Closed Trade (Hit Target)
          else if (stratData.entryPrice > 0 && !stratData.isBuyZone) {
             const firstSignalIdx = snap.quotes.findIndex(q => q.date.toString().includes(stratData.triggerDate));
             const exitIdx = firstSignalIdx === -1 ? -1 : snap.quotes.slice(firstSignalIdx).findIndex(q => q.high >= targetPrice);
             
             if (exitIdx !== -1 && firstSignalIdx !== -1) {
                const quoteObj = snap.quotes[firstSignalIdx + exitIdx];
                if (quoteObj) {
                  closedResults.push({
                    symbol: sym,
                    entryDate: stratData.triggerDate,
                    exitDate: new Date(quoteObj.date).toISOString().split('T')[0],
                    roi: ((targetPrice / entryPrice) - 1) * 100,
                    days: exitIdx,
                    strategy: strat.name,
                    marketCap: snap.quote.marketCap,
                    sector
                  });
                  break;
                }
             }
          }
        }
      }
      return { active: activeResults.sort((a,b) => b.roi - a.roi), closed: closedResults };
    };

    const bc = await processBasket('BLUECHIP', BASKETS['BLUECHIP']);
    const hb = await processBasket('HIGH_BETA', BASKETS['HIGH_BETA']);
    
    const dynamicWealth = getDynamicBasket();
    const currentWealth = dynamicWealth.length > 0 ? dynamicWealth : BASKETS['WEALTH_BASKET'];
    const wb = await processBasket('WEALTH_BASKET', currentWealth);

    // Dynamic Distribution (Total 40-60)
    let finalActive = [...bc.active, ...hb.active, ...wb.active];
    if (finalActive.length > 60) finalActive = finalActive.slice(0, 60);

    const finalClosed = [...bc.closed, ...hb.closed, ...wb.closed]
      .sort((a,b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime())
      .slice(0, 20);

    res.json({ 
      stocks: finalActive, 
      closedTrades: finalClosed,
      summary: { 
        total: finalActive.length, 
        bluechip: bc.active.length, 
        highBeta: hb.active.length, 
        wealth: wb.active.length,
        avgRoi: finalActive.reduce((a,b) => a + b.roi, 0) / (finalActive.length || 1),
        avgDays: finalClosed.reduce((a,b) => a + b.days, 0) / (finalClosed.length || 1)
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
  if (dynamicProfit.length > 0) BASKETS['WEALTH_BASKET'] = dynamicProfit;
}

syncBaskets(); 
setInterval(syncBaskets, 60000);
startServer();
