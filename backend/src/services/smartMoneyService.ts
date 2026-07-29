import { getMarketSnapshot } from '../screener.js';
import { getDB } from '../db.js';

// ── Inline sector map (avoids dependency on refactored config/constants) ──
const MANUAL_SECTOR_MAP: Record<string, string> = {
  'HDFCBANK': 'Banking', 'ICICIBANK': 'Banking', 'SBIN': 'Banking', 'AXISBANK': 'Banking', 'KOTAKBANK': 'Banking',
  'RELIANCE': 'Energy/Conglomerate', 'TCS': 'IT Services', 'INFY': 'IT Services', 'HCLTECH': 'IT Services', 'WIPRO': 'IT Services',
  'BAJFINANCE': 'NBFC', 'BAJAJFINSV': 'NBFC', 'SHRIRAMFIN': 'NBFC',
  'SUNPHARMA': 'Pharma', 'DRREDDY': 'Pharma', 'CIPLA': 'Pharma', 'DIVISLAB': 'Pharma',
  'MARUTI': 'Automobile', 'M&M': 'Automobile', 'TATAMOTORS': 'Automobile',
  'ULTRACEMCO': 'Cement', 'AMBUJACEM': 'Cement', 'ACC': 'Cement',
  'NTPC': 'Power', 'POWERGRID': 'Power', 'ONGC': 'Oil & Gas',
  'ASIANPAINT': 'Paints', 'BERGEPAINT': 'Paints', 'PIDILITIND': 'Adhesives',
  'HINDUNILVR': 'FMCG', 'ITC': 'FMCG', 'NESTLEIND': 'FMCG', 'BRITANNIA': 'FMCG', 'MARICO': 'FMCG', 'DABUR': 'FMCG',
  'TITAN': 'Jewellery/Watches', 'BHARTIARTL': 'Telecom',
  'L&T': 'EPC/Infra', 'LT': 'EPC/Infra', 'ADANIPORTS': 'Infrastructure', 'ADANIENT': 'Conglomerate',
  'JSWSTEEL': 'Steel', 'TATASTEEL': 'Steel', 'COALINDIA': 'Mining',
  'APOLLOHOSP': 'Healthcare', 'NIFTYBEES': 'Index ETF', 'BANKBEES': 'Banking ETF',
};

// ── Quarter helpers ─────────────────────────────────────────────────────────

export function getCurrentQuarterLabel(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

export function getPreviousQuarterLabel(current: string, offset: number): string {
  const match = current.match(/^Q(\d) (\d{4})$/);
  if (!match) return current;
  let q = parseInt(match[1]);
  let y = parseInt(match[2]);
  for (let i = 0; i < offset; i++) {
    q--;
    if (q < 1) { q = 4; y--; }
  }
  return `Q${q} ${y}`;
}

// ── Core capture ────────────────────────────────────────────────────────────

export async function captureShareholdingSnapshot(): Promise<number> {
  const db = getDB();
  const cache = getMarketSnapshot();
  const quarter = getCurrentQuarterLabel();
  let inserted = 0;

  for (const [symbol, snap] of Object.entries(cache)) {
    const screenerData = snap?.screener;
    const sh = snap?.quote?.shareholding || screenerData?.shareholding;
    if (!sh || typeof sh.promoter !== 'number') continue;

    try {
      await db.run(
        `INSERT OR IGNORE INTO shareholding_history
         (symbol, quarter, promoter_pct, fii_pct, dii_pct, public_pct, pledge_pct)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          symbol,
          quarter,
          Math.round((sh.promoter || 0) * 100) / 100,
          Math.round((sh.fii || 0) * 100) / 100,
          Math.round((sh.dii || 0) * 100) / 100,
          Math.round((sh.public || 0) * 100) / 100,
          Math.round((sh.pledged || 0) * 100) / 100,
        ]
      );
      inserted++;
    } catch (e: any) {
      console.warn(`[SmartMoney] DB error for ${symbol}: ${e.message}`);
    }
  }

  return inserted;
}

// ── Backfill from trends arrays ─────────────────────────────────────────────

export async function backfillFromTrends(): Promise<number> {
  const db = getDB();
  const cache = getMarketSnapshot();
  const currentQuarter = getCurrentQuarterLabel();
  let inserted = 0;

  for (const [symbol, snap] of Object.entries(cache)) {
    const screenerData = snap?.screener;
    const sh = snap?.quote?.shareholding || screenerData?.shareholding;
    if (!sh?.trends) continue;

    const trends = sh.trends;
    const maxLen = Math.max(
      trends.promoter?.length || 0,
      trends.fii?.length || 0,
      trends.dii?.length || 0
    );
    if (maxLen === 0) continue;

    for (let i = 0; i < maxLen; i++) {
      const quarter = getPreviousQuarterLabel(currentQuarter, maxLen - 1 - i);
      const promoterVal = trends.promoter?.[i];
      const fiiVal = trends.fii?.[i];
      const diiVal = trends.dii?.[i];
      if (promoterVal == null && fiiVal == null && diiVal == null) continue;

      try {
        await db.run(
          `INSERT OR IGNORE INTO shareholding_history
           (symbol, quarter, promoter_pct, fii_pct, dii_pct)
           VALUES (?, ?, ?, ?, ?)`,
          [
            symbol,
            quarter,
            promoterVal != null ? Math.round(promoterVal * 100) / 100 : 0,
            fiiVal != null ? Math.round(fiiVal * 100) / 100 : 0,
            diiVal != null ? Math.round(diiVal * 100) / 100 : 0,
          ]
        );
        inserted++;
      } catch (e: any) {
        // ignore duplicate key errors silently
      }
    }
  }

  return inserted;
}

// ── Query helpers ───────────────────────────────────────────────────────────

export async function getShareholdingHistory(
  symbol: string
): Promise<{ quarter: string; promoter: number; fii: number; dii: number }[]> {
  const db = getDB();
  const rows = await db.all(
    'SELECT quarter, promoter_pct, fii_pct, dii_pct FROM shareholding_history WHERE symbol = ? ORDER BY quarter ASC',
    [symbol.toUpperCase()]
  );
  return rows.map((r: any) => ({
    quarter: r.quarter,
    promoter: r.promoter_pct || 0,
    fii: r.fii_pct || 0,
    dii: r.dii_pct || 0,
  }));
}

export async function getTopMovers(
  limit: number = 10
): Promise<{ symbol: string; quarter: string; sector: string; fiiChange: number; diiChange: number; promoterChange: number; currentFII: number; currentDII: number; currentPromoter: number }[]> {
  const db = getDB();
  const quarters = await db.all(
    'SELECT DISTINCT quarter FROM shareholding_history ORDER BY quarter DESC LIMIT 2'
  );
  if (quarters.length < 2) return [];
  const [latestQ, prevQ] = [quarters[0].quarter, quarters[1].quarter];

  const rows = await db.all(
    `SELECT
       curr.symbol,
       curr.fii_pct as cur_fii,
       curr.dii_pct as cur_dii,
       curr.promoter_pct as cur_promoter,
       prev.fii_pct as prev_fii,
       prev.dii_pct as prev_dii,
       prev.promoter_pct as prev_promoter
     FROM shareholding_history curr
     JOIN shareholding_history prev ON curr.symbol = prev.symbol
       AND prev.quarter = ?
     WHERE curr.quarter = ?
       AND (curr.fii_pct IS NOT NULL OR curr.dii_pct IS NOT NULL)
     ORDER BY (COALESCE(curr.fii_pct,0) - COALESCE(prev.fii_pct,0)) DESC`,
    [prevQ, latestQ]
  );

  return rows.slice(0, limit).map((r: any) => ({
    symbol: r.symbol,
    quarter: latestQ,
    sector: MANUAL_SECTOR_MAP[r.symbol] || 'Unknown',
    fiiChange: Math.round(((r.cur_fii || 0) - (r.prev_fii || 0)) * 100) / 100,
    diiChange: Math.round(((r.cur_dii || 0) - (r.prev_dii || 0)) * 100) / 100,
    promoterChange: Math.round(((r.cur_promoter || 0) - (r.prev_promoter || 0)) * 100) / 100,
    currentFII: Math.round((r.cur_fii || 0) * 100) / 100,
    currentDII: Math.round((r.cur_dii || 0) * 100) / 100,
    currentPromoter: Math.round((r.cur_promoter || 0) * 100) / 100,
  }));
}

export async function getSectorSummary(): Promise<{ sector: string; avgFII: number; avgDII: number; avgPromoter: number; stockCount: number }[]> {
  const db = getDB();
  const latestQ = await db.all(
    'SELECT DISTINCT quarter FROM shareholding_history ORDER BY quarter DESC LIMIT 1'
  );
  if (latestQ.length === 0) return [];

  const rows = await db.all(
    `SELECT symbol, fii_pct, dii_pct, promoter_pct FROM shareholding_history WHERE quarter = ?`,
    [latestQ[0].quarter]
  );

  const sectorMap = new Map<string, { fiiTotal: number; diiTotal: number; promoterTotal: number; count: number }>();

  for (const r of rows) {
    const sector = MANUAL_SECTOR_MAP[r.symbol] || 'Other';
    const entry = sectorMap.get(sector) || { fiiTotal: 0, diiTotal: 0, promoterTotal: 0, count: 0 };
    entry.fiiTotal += r.fii_pct || 0;
    entry.diiTotal += r.dii_pct || 0;
    entry.promoterTotal += r.promoter_pct || 0;
    entry.count++;
    sectorMap.set(sector, entry);
  }

  return Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      avgFII: Math.round((data.fiiTotal / data.count) * 100) / 100,
      avgDII: Math.round((data.diiTotal / data.count) * 100) / 100,
      avgPromoter: Math.round((data.promoterTotal / data.count) * 100) / 100,
      stockCount: data.count,
    }))
    .sort((a, b) => b.avgFII - a.avgFII);
}
