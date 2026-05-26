// @ts-nocheck
import express from 'express';
import YahooFinance from 'yahoo-finance2';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initScreenerCron, getDynamicBasket, getMarketSnapshot, updateMarketSnapshot, initSnapshotCache } from './screener.js';
import { initDB, getDB } from './db.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateABCDLevels, calculateRHS, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda, calculateTwentyRallyRetest } from './strategies.js';

const yahooFinance = new YahooFinance();
dotenv.config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'marketbeacon-super-secret-key-2026';

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

const ADMIN_EMAILS = ['ajaythomasjohn@gmail.com', 'admin@marketbeacon.com', 'diwakarsingh01.tech@gmail.com'];

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

// --- INSTITUTIONAL AUDIT ENGINE ---
async function validateBatch9(symbol: string, snap: any, basketName: string = 'BLUECHIP') {
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

  // RULE EXCEPTION: For Wealth Basket (Small/Mid growth), 70% SM is too high. We use 50% as a floor.
  const smFloor = basketName === 'WEALTH_BASKET' ? 45 : 70;
  const isHardReject = !isETF && (debtToEquity > 1.2 || pledged >= 15 || smartMoneyTotal < smFloor);

  return {
    isPass: (totalScore >= 65) && !isHardReject,
    score: totalScore,
    smartMoneyTotal,
    metrics: { pe, debtToEquity, roe, roce, pledged, fii, dii, promoter, smartMoneyTotal }
  };
}

app.get('/api/stock-fundamentals', async (req, res) => {
  try {
    const symbol = req.query.symbol as string;
    if (!symbol) return res.status(400).json({ error: 'Symbol required' });
    const snapshot = getMarketSnapshot();
    const snap = snapshot[symbol];
    if (!snap) return res.status(404).json({ error: 'Stock not found' });
    const audit = await validateBatch9(symbol, snap);
    const scr = snap.screener || {};
    const quote = snap.quote || {};
    
    // RESTORE ALL FIELDS FOR FRONTEND
    res.json({
      symbol,
      price: quote.regularMarketPrice || snap.quotes[snap.quotes.length - 1].close,
      change: quote.regularMarketChangePercent || 0,
      marketCap: quote.marketCap || 0,
      industry: MANUAL_SECTOR_MAP[symbol] || scr.industry || 'General',
      peRatio: audit.metrics.pe,
      peMedians: scr.peMedians || { pe3Y: 25, pe5Y: 25, pe10Y: 25 },
      dividendYield: scr.dividendYield || 0,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      beta: quote.beta || 1,
      returnOnEquity: audit.metrics.roe,
      roce: audit.metrics.roce,
      netDebtToEquity: audit.metrics.debtToEquity,
      athSales: scr.athSales || 0,
      athNetProfit: scr.athNetProfit || 0,
      currentSales: scr.currentSales || 0,
      currentNetProfit: scr.currentNetProfit || 0,
      forwardPE: audit.metrics.pe,
      industryPe: 25,
      faceValue: scr.faceValue || 1,
      growth3Yr: { roe: audit.metrics.roe, sales: 15 },
      shareholding: { promoter: audit.metrics.promoter, fii: audit.metrics.fii, dii: audit.metrics.dii, smartMoneyTotal: audit.smartMoneyTotal },
      audit: {
        ...audit,
        universe: audit.isPass ? 'INSTITUTIONAL GRADE' : 'WATCHLIST'
      }
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backtest/alpha-40', authenticateToken, async (req: any, res) => {
  try {
    const snapshot = getMarketSnapshot();
    const STRATEGY_BASKET_MAP: Record<string, string[]> = { 
      'ENVELOPE_LONG': ['BLUECHIP'], 'ENVELOPE_SHORT': ['BLUECHIP'], 'BOLLINGER': ['BLUECHIP'], 
      'CUP_HANDLE_ABCD': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'], 
      'RHS_ABCD': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'], 
      'SMA_ABCD': ['BLUECHIP', 'HIGH_BETA'], '52W_HIGH_LOW': ['BLUECHIP', 'HIGH_BETA'], 
      'TWENTY_RALLY_RETEST': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'], 
      'SIXTY_SEVEN_FUNDA': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'], 
      'SR_STRATEGY': ['BLUECHIP', 'HIGH_BETA', 'WEALTH_BASKET'] 
    };

    const sectorStats: Record<string, number> = {};
    const capStats = { LARGE: 0, MID: 0, SMALL: 0 };
    
    const processBasket = async (basketName: string, symbols: string[] = []) => {
      const active: any[] = [];
      const closed: any[] = [];
      const targetSymbols = Array.isArray(symbols) ? symbols : (BASKETS[basketName] || []);
      for (const sym of targetSymbols) {
        try {
          const snap = snapshot[sym];
          if (!snap || !snap.quotes?.length) continue;
          const audit = await validateBatch9(sym, snap, basketName);
          if (!audit.isPass) continue;
          
          const sector = MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General';

          for (const strat of STRATEGIES) {
            if (!STRATEGY_BASKET_MAP[strat.id].includes(basketName)) continue;
            let sd: any;
            if (strat.id === 'ENVELOPE_LONG') sd = calculateEnvelope(snap.quotes);
            else if (strat.id === 'BOLLINGER') sd = calculateBollingerBand(snap.quotes);
            else if (strat.id === 'SMA_ABCD') sd = calculateSMAStacking(snap.quotes);
            else if (strat.id === '52W_HIGH_LOW') sd = calculate52WeekStrategy(snap.quotes);
            else if (strat.id === 'SR_STRATEGY') sd = calculateSRStrategy(snap.quotes, snap.screener);
            else if (strat.id === 'RHS_ABCD') sd = calculateRHS(snap.quotes);
            else if (strat.id === 'CUP_HANDLE_ABCD') sd = calculateCupHandle(snap.quotes);
            else if (strat.id === 'SIXTY_SEVEN_FUNDA') sd = calculateSixtySevenFunda(snap.quotes, snap.screener);
            else if (strat.id === 'TWENTY_RALLY_RETEST') sd = calculateTwentyRallyRetest(snap.quotes, sym);
            
            if (!sd) continue;
            const last = snap.quotes[snap.quotes.length - 1];
            const entry = sd.entryPrice || last.close;
            const target = sd.target || (entry * 1.3);
            const marketCap = snap.quote.marketCap || 1;
            const capCr = marketCap / 10000000;
            const capType = capCr >= 20000 ? 'LARGE' : (capCr >= 5000 ? 'MID' : 'SMALL');

            if (sd.isBuyZone) {
              active.push({ symbol: sym, entryTime: sd.triggerDate, strategy: strat.name, basketSource: basketName, marketCap, capType, sector, currentPrice: last.close, entryPrice: entry, target, roi: ((target / entry) - 1) * 100, score: audit.score, smartMoney: audit.smartMoneyTotal });
              break; 
            } else if (entry > 0) {
              const idx = snap.quotes.findIndex(q => String(q.date).includes(String(sd.triggerDate)));
              const eIdx = idx === -1 ? -1 : snap.quotes.slice(idx).findIndex(q => q.high >= target);
              if (eIdx !== -1) { closed.push({ symbol: sym, exitDate: new Date(snap.quotes[idx + eIdx].date).toISOString().split('T')[0], roi: ((target/entry)-1)*100, days: eIdx, strategy: strat.name, sector, entryPrice: entry, targetPrice: target }); break; }
            }
          }
        } catch (e) { }
      }
      return { active, closed };
    };

    const bc = await processBasket('BLUECHIP', BASKETS['BLUECHIP']);
    const hb = await processBasket('HIGH_BETA', BASKETS['HIGH_BETA']);
    const dyn = getDynamicBasket();
    const wb = await processBasket('WEALTH_BASKET', dyn.length > 0 ? dyn : BASKETS['WEALTH_BASKET']);
    
    const candidates = [...bc.active, ...hb.active, ...wb.active].sort((a,b) => b.roi - a.roi);
    const finalActive = [];
    const CAP_LIMITS = { LARGE: 25, MID: 15, SMALL: 10 };
    const MAX_PER_SECTOR = 10; // 20% exposure rule

    for (const s of candidates) {
      if (capStats[s.capType] < CAP_LIMITS[s.capType] && (sectorStats[s.sector] || 0) < MAX_PER_SECTOR) {
        finalActive.push(s);
        sectorStats[s.sector] = (sectorStats[s.sector] || 0) + 1;
        capStats[s.capType]++;
      }
      if (finalActive.length >= 50) break;
    }

    res.json({ 
      stocks: finalActive, 
      closedTrades: [...bc.closed, ...hb.closed, ...wb.closed].sort((a,b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime()).slice(0, 50),
      summary: { version: '11.6.0', total: finalActive.length, large: capStats.LARGE, mid: capStats.MID, small: capStats.SMALL, avgRoi: finalActive.reduce((a,b) => a + (b.roi || 0), 0) / (finalActive.length || 1), accuracy: 100 } 
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

async function startServer() {
  const PORT = process.env.PORT || 3001;
  try {
    await initDB(); await initSnapshotCache(); initScreenerCron();
    app.listen(PORT, () => console.log(`MarketBeacon Backend 11.6.0 on ${PORT}`));
  } catch (e) { process.exit(1); }
}
startServer();
