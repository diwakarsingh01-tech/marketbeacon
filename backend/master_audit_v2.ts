import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const snapshotPath = path.join(__dirname, '../market_snapshot.json');
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

// --- BASKETS ---
const hSuper45 = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];
const hGood45 = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
const hGood200 = ['CDSL', 'BSE', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 'KAYNES', 'MTARTECH', 'MAHLOG', 'PRINCEPIPE', 'ANGELONE', 'KFINTECH', 'DATA PATTERNS', 'MAZAGONDOCK', 'COCHINSHIP', 'GRSE', 'RVNL', 'IRCON', 'RITES', 'RAILTEL', 'BEL', 'HAL', 'BEML', 'MAZDOCK', 'SOLARINDS', 'BDL', 'KPITTECH', 'COFORGE', 'PERSISTENT', 'TATAELXSI', 'ZENTEC', 'NEWGEN', 'MAPMYINDIA', 'CEINFO', 'TANLA', 'ROUTE', 'LATENTVIEW'];

// --- UTILS ---
function calculateSMA(prices: number[], length: number) {
  if (prices.length < length) return new Array(prices.length).fill(0);
  const sma = new Array(prices.length).fill(0);
  for (let i = length - 1; i < prices.length; i++) {
    sma[i] = prices.slice(i - length + 1, i + 1).reduce((a, b) => a + b, 0) / length;
  }
  return sma;
}

// --- STRATEGY 14: 67 KA FUNDA ---
function audit67(quotes: any[], screener: any) {
  const current = quotes[quotes.length - 1].close;
  const ath = Math.max(...quotes.map(q => q.high));
  const dd = ((ath - current) / ath) * 100;
  const div = parseFloat(screener?.dividendYield || '0');
  const target = Math.round(ath * 0.67);
  if (dd >= 66.5 && div >= 1.0) return { status: 'QUALIFIED', entry: current, target, metric: `DD: ${dd.toFixed(1)}%` };
  if (dd >= 66.5) return { status: 'REJECTED', reason: `Zero/Low Div (${div}%)` };
  return { status: 'NEUTRAL', metric: `DD: ${dd.toFixed(1)}%` };
}

// --- STRATEGY 13: 20% RALLY ---
function audit20(quotes: any[]) {
  const prices = quotes.map(q => q.close);
  const sma200 = calculateSMA(prices, 200);
  const current = prices[prices.length - 1];
  let rally: any = null;
  for (let i = quotes.length - 10; i >= Math.max(0, quotes.length - 300); i--) {
    const start = prices[i];
    if (start >= sma200[i] || quotes[i].close <= quotes[i].open) continue;
    let j = i + 1;
    while (j < quotes.length && quotes[j].close > quotes[j].open) j++;
    const gain = (prices[j - 1] - quotes[i].low) / quotes[i].low;
    if (gain >= 0.20 && (quotes.length - 1 - (j - 1)) <= 252) {
      rally = { origin: quotes[i].low, target: prices[j - 1], gain: gain * 100 };
      break;
    }
  }
  if (!rally) return { status: 'NEUTRAL', metric: 'No Rally' };
  const qualified = current <= rally.origin * 1.05 && current >= rally.origin * 0.95 && current < sma200[prices.length - 1];
  return { status: qualified ? 'QUALIFIED' : 'NEUTRAL', entry: rally.origin, target: rally.target, metric: `Gain: ${rally.gain.toFixed(1)}%` };
}

// --- STRATEGY 12: S&R BOX ---
function auditSR(quotes: any[]) {
  const window = 10;
  const pivots: {p: number, t: string}[] = [];
  for (let i = window; i < quotes.length - window; i++) {
    const lowSlice = quotes.slice(i - window, i + window + 1).map((q: any) => q.low);
    const highSlice = quotes.slice(i - window, i + window + 1).map((q: any) => q.high);
    if (quotes[i].low === Math.min(...lowSlice)) pivots.push({ p: quotes[i].low, t: 'S' });
    if (quotes[i].high === Math.max(...highSlice)) pivots.push({ p: quotes[i].high, t: 'R' });
  }
  const cluster = (t: string) => {
    const zones: {m: number, c: number}[] = [];
    pivots.filter(p => p.t === t).forEach(p => {
      let f = zones.find(z => Math.abs(p.p - z.m) / z.m <= 0.04);
      if (f) { f.m = (f.m * f.c + p.p) / (f.c + 1); f.c++; }
      else zones.push({ m: p.p, c: 1 });
    });
    return zones;
  };
  const sZones = cluster('S').filter(z => z.c >= 3);
  const rZones = cluster('R').filter(z => z.c >= 2);
  for (const s of sZones) {
    for (const r of rZones) {
      if ((r.m / s.m) - 1 >= 0.30 && Math.abs(quotes[quotes.length - 1].close - s.m) / s.m <= 0.07)
        return { status: 'QUALIFIED', entry: s.m, target: r.m, metric: `Gap: ${((r.m / s.m - 1) * 100).toFixed(1)}%` };
    }
  }
  return { status: 'NEUTRAL', metric: 'No Box' };
}

// --- MASTER AUDIT ---
async function runMasterAudit() {
  const baskets = { 'H-Super45': hSuper45, 'H-GOOD45': hGood45, 'H-Good200': hGood200 };
  console.log('🛡️ INSTITUTIONAL MASTER AUDIT: 400+ ASSETS\n');

  for (const [name, list] of Object.entries(baskets)) {
    console.log(`\n=== BASKET: ${name} ===`);
    console.log('| Symbol | CMP | Strategy | Status | Entry | Target | Logic Info | Audit Pass |');
    console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

    for (const sym of list) {
      const d = snapshot[`${sym}.NS`] || snapshot[sym];
      if (!d || !d.quotes) continue;
      const cmp = d.quotes[d.quotes.length - 1].close;
      const results = [
        { name: '67 ka Funda', ...audit67(d.quotes, d.screener) },
        { name: '20% ki rally', ...audit20(d.quotes) },
        { name: 'S&R Box', ...auditSR(d.quotes) }
      ];

      results.forEach(r => {
        const isQualified = r.status === 'QUALIFIED';
        const isRejected = r.status === 'REJECTED';
        const auditPass = (d.screener?.score || 0) >= 70 ? '🟢 YES' : '🔴 NO';
        
        // Show ALL qualified/rejected, and show everything for the smaller baskets for full audit
        if (isQualified || isRejected || list.length < 50) { 
           console.log(`| ${sym} | ${cmp.toFixed(1)} | ${r.name} | ${isQualified ? '🟢 QUALIFIED' : isRejected ? '🔴 REJECTED' : '🟡 NEUTRAL'} | ${r.entry ? r.entry.toFixed(1) : '-'} | ${r.target ? r.target.toFixed(1) : '-'} | ${r.metric || r.reason} | ${auditPass} |`);
        }
      });
    }
  }
}

runMasterAudit();
