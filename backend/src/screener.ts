import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateRHS, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda, calculateTwentyRallyRetest, checkInstitutionalMandates } from './strategies/index.js';
import { supabase } from './db.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

let snapshotCache: Record<string, any> = {};

export async function initSnapshotCache() {
  console.log('📦 Loading Market Snapshot from local market_snapshot.json...');
  const pathsToTry = [
    path.resolve(process.cwd(), 'market_snapshot.json'),
    path.resolve(process.cwd(), 'backend', 'market_snapshot.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../market_snapshot.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../market_snapshot.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../market_snapshot.json')
  ];
  let loaded = false;
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      console.log(`💾 Found market_snapshot.json at: ${p}`);
      try {
        const fileContent = fs.readFileSync(p, 'utf8');
        snapshotCache = JSON.parse(fileContent);
        console.log(`✅ Snapshot cache restored from local file (${Object.keys(snapshotCache).length} symbols)`);
        loaded = true;
      } catch (parseErr: any) {
        console.error(`❌ Failed to parse market_snapshot.json: ${parseErr.message}`);
      }
      break;
    }
  }
  // Patch peMedians fallback for stocks with missing data
  if (loaded && snapshotCache) {
    let patched = 0;
    for (const [sym, data] of Object.entries(snapshotCache)) {
      const screener = (data as any)?.screener;
      if (screener) {
        const med = screener.peMedians;
        if ((!med || (!med.pe3Y && !med.pe5Y)) && (screener.peRatio || 0) > 0) {
          if (!med) screener.peMedians = {};
          screener.peMedians.pe3Y = screener.peMedians.pe3Y || screener.peRatio;
          screener.peMedians.pe5Y = screener.peMedians.pe5Y || screener.peRatio;
          patched++;
        }
      }
    }
    if (patched > 0) console.log(`🔧 Patched peMedians for ${patched} symbols (fallback to current PE)`);
  }

  if (!loaded) {
    console.error('❌ market_snapshot.json not found in any searched paths');
    snapshotCache = {};
  }
}

export async function fetchScreenerData(symbol: string) {
  const cleanSymbol = symbol.split('.')[0]; 
  const urls = [
    `https://www.screener.in/company/${cleanSymbol}/consolidated/`,
    `https://www.screener.in/company/${cleanSymbol}/`
  ];
  
  let data: any = null;
  let lastError: any = null;
  
  for (const url of urls) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const delay = Math.random() * 2000 + 1000 + (attempt * 5000); // Increased delay
        await new Promise(resolve => setTimeout(resolve, delay));
        const response = await axios.get(url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.screener.in/'
          },
          timeout: 20000
        });
        data = response.data;
        break;
      } catch (e: any) {
        lastError = e;
        if (e.response?.status === 404) break;
        if (e.response?.status === 429) {
          console.warn(`🚨 [Screener] ${cleanSymbol} hit 429 (Rate Limit), attempt ${attempt + 1}. Backing off...`);
          await new Promise(resolve => setTimeout(resolve, 10000 * (attempt + 1))); // Extra backoff for 429
          continue;
        }
        if (attempt < 4) {
          console.warn(`⚠️ [Screener] ${cleanSymbol} attempt ${attempt + 1} failed (${e.message}), retrying...`);
        }
      }
    }
    if (data) break;
  }
  
  if (!data) {
    throw new Error(lastError?.message || 'Failed to fetch screener data');
  }

  try {
    const $ = cheerio.load(data);
    const getRatio = (name: string) => {
      const el = $(`#top-ratios li`).filter(function() {
        const label = $(this).find('.name').text().trim().toLowerCase();
        return label === name.toLowerCase() || label.includes(name.toLowerCase());
      });
      const valEl = el.find('.value');
      const numberEl = valEl.find('.number');
      const rawText = numberEl.length > 0 ? numberEl.text() : valEl.text();
      const val = rawText.trim().replace(/,/g, '').replace(/[₹%]/g, '');
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    const getAnnualTableData = (tableName: string, rowName: string) => {
      let section = $(`section#${tableName}`);
      if (section.length === 0) {
        section = $('section').filter(function() {
          const headerText = $(this).find('h2, h3').text().toLowerCase();
          return headerText.includes(tableName.replace('-', ' ')) || headerText.includes(tableName);
        });
      }
      const searchTerms = [rowName.toLowerCase()];
      if (rowName.toLowerCase() === 'sales') searchTerms.push('revenue', 'sales');
      if (rowName.toLowerCase() === 'net profit') searchTerms.push('net profit', 'profit after tax');

      const row = section.find(`tr`).filter(function() {
        const firstCol = $(this).find('td:first-child, th:first-child').text().trim().toLowerCase();
        return searchTerms.some(term => firstCol === term || firstCol.includes(term));
      });
      if (row.length === 0) return [];
      const values = row.find('td').map((i, el) => $(el).text().trim().replace(/,/g, '').replace(/[₹%]/g, '')).get();
      const parsed = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      return parsed;
    };
    const getShareholdingHistory = (label: string) => {
      let history: number[] = [];
      const tables = $('#shareholding table').length > 0 ? $('#shareholding table') : $('table');
      tables.each((_, table) => {
        $(table).find('tr').each((_, row) => {
          const cells = $(row).find('td, th');
          const firstCellText = $(cells[0]).text().trim().toLowerCase();
          if (firstCellText.startsWith(label.toLowerCase()) || firstCellText.includes(label.toLowerCase())) {
            for (let k = 1; k < cells.length; k++) {
              const val = $(cells[k]).text().trim().replace(/%/g, '');
              const parsed = parseFloat(val);
              if (!isNaN(parsed)) history.push(parsed);
            }
            return false;
          }
        });
        if (history.length > 0) return false;
      });
      return history.slice(-4); 
    };

    const currentPrice = getRatio('Current Price');
    const marketCap = (getRatio('Market Cap') || getRatio('MarketCap')) * 10000000;
    let industry = 'General Research';
    const peerSector = $('#peers p.sub a[title="Sector"]').first().text().trim();
    const peerBroadIndustry = $('#peers p.sub a[title="Broad Industry"]').first().text().trim();
    const peerIndustry = $('#peers p.sub a[title="Industry"]').first().text().trim();
    
    if (peerSector) {
      industry = peerSector;
    } else if (peerBroadIndustry) {
      industry = peerBroadIndustry;
    } else if (peerIndustry) {
      industry = peerIndustry;
    } else {
      const breadcrumbText = $('.company-ratios .breadcrumb').text().trim();
      if (breadcrumbText) {
        const parts = breadcrumbText.split('\n').map(p => p.trim()).filter(p => p && p !== '/' && p.length > 2);
        if (parts.length > 0) industry = parts[parts.length - 1];
      }
    }
    const promHistory = getShareholdingHistory('Promoter') || getShareholdingHistory('Promoters');
    const fiiHistory = getShareholdingHistory('FII') || getShareholdingHistory('Foreign');
    const diiHistory = getShareholdingHistory('DII') || getShareholdingHistory('Domestic');
    const shareholding = {
      promoter: promHistory.slice(-1)[0] || 0,
      fii: fiiHistory.slice(-1)[0] || 0,
      dii: diiHistory.slice(-1)[0] || 0,
      trends: { promoter: promHistory, fii: fiiHistory, dii: diiHistory }
    };
    const smartMoneyTotal = (shareholding.promoter || 0) + (shareholding.fii || 0) + (shareholding.dii || 0);
    const netProfits = getAnnualTableData('profit-loss', 'Net Profit');
    const sales = getAnnualTableData('profit-loss', 'Sales');
    const eps = getAnnualTableData('profit-loss', 'EPS');
    
    const athSales = sales.length > 0 ? Math.max(...sales) : 0;
    const athNetProfit = netProfits.length > 0 ? Math.max(...netProfits) : 0;
    const currentSales = sales.length > 0 ? sales[sales.length - 1] : 0;
    const currentNetProfit = netProfits.length > 0 ? netProfits[netProfits.length - 1] : 0;

    const currentEPS = eps.slice(-1)[0] || (netProfits.slice(-1)[0] / 10);
    const calculatedPE = currentEPS > 0 ? (currentPrice / currentEPS) : (getRatio('Stock P/E') || 45);

    const peMedians: any = {};
    // Try multiple selectors for Screener.in "Median P/E" data
    const ratioSelectors = ['#top-ratios li', '#ratios li', '.company-ratios li', '.flex-list li', 'ul li'];
    for (const sel of ratioSelectors) {
      $(sel).each((i, el) => {
        const text = $(el).text().toLowerCase().replace(/\s+/g, ' ');
        if (text.includes('median p/e') || text.includes('median pe') || text.includes('medianp/e') || text.includes('medianpe')) {
          const valEl = $(el).find('.value, .number, span.number');
          const raw = (valEl.length > 0 ? valEl.first().text() : $(el).text().replace(/[^0-9.]/g, '')).trim().replace(/,/g, '');
          const val = parseFloat(raw);
          if (!isNaN(val) && val > 0) {
            if (text.includes('3 year') || text.includes('3 yr') || text.includes('3y') || text.includes('3years') || text.includes('3 yrs')) peMedians.pe3Y = val;
            if (text.includes('5 year') || text.includes('5 yr') || text.includes('5y') || text.includes('5years') || text.includes('5 yrs')) peMedians.pe5Y = val;
          }
        }
      });
      if (peMedians.pe3Y || peMedians.pe5Y) break;
    }
    // Fallback: derive peMedians from current PE if scraping failed
    if (!peMedians.pe3Y && !peMedians.pe5Y && calculatedPE > 0) {
      peMedians.pe3Y = calculatedPE;
      peMedians.pe5Y = calculatedPE;
    }

    const borrowings = getAnnualTableData('balance-sheet', 'Borrowings');
    const shareCapital = getAnnualTableData('balance-sheet', 'Share Capital');
    const reserves = getAnnualTableData('balance-sheet', 'Reserves');
    const roe = getRatio('ROE') || (getAnnualTableData('ratios', 'ROE').slice(-1)[0]) || 0;
    const roce = getRatio('ROCE') || (getAnnualTableData('ratios', 'ROCE').slice(-1)[0]) || 0;
    const latestEquity = (shareCapital.slice(-1)[0] || 0) + (reserves.slice(-1)[0] || 0);
    const debtToEquity = latestEquity > 0 ? (borrowings.slice(-1)[0] / latestEquity) : 0;

    return {
      marketCap, peRatio: calculatedPE, peMedians, dividendYield: getRatio('Dividend Yield'),
      roce, returnOnEquity: roe, netDebtToEquity: debtToEquity, currentPrice, industry,
      smartMoneyTotal, shareholding, athSales, athNetProfit, currentSales, currentNetProfit,
      athEPS: eps.length > 0 ? Math.max(...eps) : 0, currentEPS
    };
  } catch (e: any) {
    console.error(`[SCRAPER ERROR] ${symbol}: ${e.message}`);
    return null;
  }
}

export async function runScreener() {
  console.log('🚀 [WEALTH-BASKET] Starting Dynamic Growth Audit (Cloud Mode)...');
  const results: string[] = [];
  const batchSize = 15;
  const hSuper45 = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];
  const hGood45 = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
  const exclusions = new Set(hSuper45.concat(hGood45));
  for (let i = 0; i < NIFTY_500.length; i += batchSize) {
    const batch = NIFTY_500.slice(i, i + batchSize);
    await Promise.all(batch.map(async (symbol) => {
      try {
        const summary: any = await yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] });
        const annualProfit = (summary.defaultKeyStatistics?.netIncomeToCommon / 10000000) || 0;
        const debtToEquity = ((summary.financialData?.debtToEquity || 0) as number) / 100;
        const marketCapCr = (summary.summaryDetail?.marketCap || 0) / 10000000;
        if (annualProfit > 50 && debtToEquity < 0.5 && marketCapCr > 500) {
          results.push(symbol.replace('.NS', ''));
        }
      } catch (e) { }
    }));
  }
  if (supabase) {
    await supabase.from('system_cache').upsert({ key: 'dynamic_growth_basket', data: results, updated_at: new Date().toISOString() });
  }
  console.log(`✅ [WEALTH-BASKET] Growth Basket Cloud Updated (${results.length} symbols)`);
  return results;
}

export async function updateMarketSnapshot(symbols: string[]) {
  if (!Array.isArray(symbols) || symbols.length === 0) return;
  console.log(`🚀 [SNAPSHOT] Refreshing ${symbols.length} symbols to Supabase...`);
  const batchSize = 3;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    await Promise.all(batch.map(async (baseSymbol) => {
      try {
        const symbol = baseSymbol.includes('.') ? baseSymbol : `${baseSymbol}.NS`;
        const period1 = new Date();
        period1.setFullYear(period1.getFullYear() - 20);
        const [history, quote, summary, screenerData] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] }).catch(() => null),
          fetchScreenerData(baseSymbol).catch((e) => { console.warn(`⚠️ Screener data unavailable for ${baseSymbol}: ${e.message}`); return null; })
        ]);
        if (!history || !history.quotes) throw new Error('No history');
        const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
        const marketCap = quote.marketCap || screenerData?.marketCap || 0;
        
        // GLOBAL HARD MANDATE AUDIT
        const audit = checkInstitutionalMandates(screenerData, baseSymbol);
        
        const rawStrategies = {
          'ENVELOPE_LONG': calculateEnvelope(quotes), 'ENVELOPE_SHORT': processShortEnvelope(quotes),
          'BOLLINGER': calculateBollingerBand(quotes), '52W_HIGH_LOW': calculate52WeekStrategy(quotes),
          'CUP_HANDLE_ABCD': calculateCupHandle(quotes), 'RHS_ABCD': calculateRHS(quotes),
          'SMA_BCD': calculateSMAStacking(quotes), 'SR_STRATEGY': calculateSRStrategy(quotes),
          'SIXTY_SEVEN_FUNDA': calculateSixtySevenFunda(quotes, screenerData), 'TWENTY_RALLY_RETEST': calculateTwentyRallyRetest(quotes)
        };

        // If audit fails, wipe strategy signals but keep data for "Monitor" or research
        const strategies: any = {};
        Object.entries(rawStrategies).forEach(([key, res]: [string, any]) => {
          if (!audit.passed && res?.isBuyZone) {
            strategies[key] = { isBuyZone: false, status: "REJECTED", reason: audit.reasons.join(', ') };
          } else {
            strategies[key] = res;
          }
        });

        const finalData = {
          quotes: quotes, // Full 5-year daily data from Yahoo Finance
          quote: {
            marketCap, regularMarketPrice: quote.regularMarketPrice || (quotes.length > 0 ? quotes[quotes.length - 1].close : 0),
            regularMarketChangePercent: quote.regularMarketChangePercent || 0,
            regularMarketTime: Math.floor(new Date(quote.regularMarketTime || Date.now()).getTime() / 1000),
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || Math.max(...quotes.slice(-252).map(q => q.high)),
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || Math.min(...quotes.slice(-252).map(q => q.low)),
            pe: summary?.summaryDetail?.trailingPE || screenerData?.peRatio || 0,
            roe: (summary?.defaultKeyStatistics?.returnOnEquity || 0) * 100 || screenerData?.returnOnEquity || 0,
            debtToEquity: summary?.financialData?.debtToEquity || screenerData?.netDebtToEquity || 0,
            shareholding: screenerData?.shareholding || null, beta: quote.beta
          },
          screener: screenerData, strategies, lastUpdated: new Date().toISOString()
        };
        if (supabase) {
          await supabase.from('market_data').upsert({ symbol: baseSymbol, data: finalData, updated_at: new Date().toISOString() });
        }
        snapshotCache[baseSymbol] = finalData;
      } catch (e: any) { console.error(`Snapshot failed for ${baseSymbol}: ${e.message}`); }
    }));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Persist snapshot to local file so data survives server restart
  try {
    const snapshotPath = path.resolve(process.cwd(), 'market_snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotCache, null, 2), 'utf-8');
    console.log(`💾 [SNAPSHOT] Persisted ${Object.keys(snapshotCache).length} symbols to disk.`);
  } catch (e: any) {
    console.error(`⚠️ [SNAPSHOT] Failed to persist snapshot to disk: ${e.message}`);
  }

  console.log(`💎 [SNAPSHOT] Success! Market data synced to Cloud.`);
}

export function initScreenerCron() {
  // Sunday 2:30 AM - Wealth basket dynamic growth audit (weekly)
  cron.schedule('30 2 * * 0', () => runScreener());

  // 6:00 PM IST - Full market snapshot update (after market close, low latency)
  cron.schedule('0 18 * * *', async () => {
    const elite = ['TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'ASIANPAINT', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 'BHARTIARTL', 'M&M', 'MARUTI', 'TMCV', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'ULTRACEMCO', 'NESTLEIND', 'BRITANNIA', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'ONGC', 'POWERGRID', 'COALINDIA', 'SHRIRAMFIN', 'APOLLOHOSP', 'PIDILITIND', 'HAVELLS', 'EICHERMOT', 'NIFTYBEES', 'BANKBEES'];
    const quality = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
    const growth = await getDynamicBasket();
    const all = elite.concat(quality, growth, ['^NSEI']);
    await updateMarketSnapshot(Array.from(new Set(all)));
  });

  // Alpha-40 institutional recalculation is scheduled in index.ts (8:30 PM IST)
  // to avoid circular dependency between screener.ts and worker.ts
}

export function getMarketSnapshot(): Record<string, any> { return snapshotCache; }
export async function getDynamicBasket(): Promise<string[]> {
  try {
    const pathsToTry = [
      path.resolve(process.cwd(), 'dynamic_basket.json'),
      path.resolve(process.cwd(), 'backend', 'dynamic_basket.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dynamic_basket.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dynamic_basket.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../dynamic_basket.json')
    ];
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        const fileContent = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (Array.isArray(parsed?.data)) {
          return parsed.data;
        }
      }
    }
  } catch (localErr: any) {
    console.warn(`⚠️ [Dynamic Basket] Local fallback failed: ${localErr.message}`);
  }

  // Final Institutional Fallback (Growth Basket Core Universe)
  const fallback = [
    "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS", "HINDUNILVR", "INFY", "SUNPHARMA", "MARUTI", "AXISBANK",
    "KOTAKBANK", "ITC", "ONGC", "ULTRACEMCO", "HCLTECH", "BEL", "COALINDIA", "HAL", "DMART", "NESTLEIND",
    "ASIANPAINT", "HINDZINC", "WIPRO", "EICHERMOT", "VBL", "DIVISLAB", "SOLARINDS", "IDEA", "CUMMINSIND", "BSE",
    "ABB", "PIDILITIND", "TRENT", "CGPOWER", "POLYCAB", "DLF", "BANKBARODA", "TMCV", "BHEL", "SIEMENS",
    "TECHM", "UNIONBANK", "HDFCLIFE", "BRITANNIA", "CANBK", "PNB", "JINDALSTEL", "BAJAJHLDNG", "INDIANB", "CIPLA",
    "GAIL", "BOSCHLTD", "HDFCAMC", "DRREDDY", "MARICO", "AMBUJACEM", "LUPIN", "GODREJCP", "MAZDOCK", "HEROMOTOCO",
    "INDHOTEL", "SHREECEM", "OFSS", "AUROPHARMA", "NMDC", "SRF", "PERSISTENT", "IDBI", "LAURUSLABS", "SUZLON",
    "DABUR", "FEDERALBNK", "YESBANK", "FORTIS", "NATIONALUM", "AUBANK", "HAVELLS", "MCX", "NAM-INDIA", "INDUSINDBK",
    "ICICIPRULI", "DIXON", "GICRE", "BIOCON", "BANKINDIA", "NAUKRI", "IOB", "SCHAEFFLER", "ALKEM", "PHOENIXLTD",
    "IDFCFIRSTB", "GLENMARK", "MAHABANK", "TIINDIA", "LINDEINDIA", "COFORGE", "OBEROIRLTY", "BERGEPAINT", "JSL", "MFSL",
    "THERMAX", "COLPAL", "COROMANDEL", "MRF", "KEI", "HINDCOPPER", "APLAPOLLO", "RADICO", "SUPREMEIND", "MPHASIS",
    "AIAENG", "VOLTAS", "IPCALAB", "BALKRISIND", "PIIND", "ASTRAL", "PETRONET", "COCHINSHIP", "KPRMILL", "AJANTPHARM",
    "GLAXO", "WELCORP", "NAVINFLUOR", "3MINDIA", "ENDURANCE", "GODFRYPHLP", "UBL", "JBCHEPHARM", "HSCL", "CONCOR",
    "LTTS", "EXIDEIND", "TATAINVEST", "BLUESTARCO", "UCOBANK", "WOCKPHARMA", "ESCORTS", "NBCC", "HFCL", "CRISIL",
    "CENTRALBK", "TIMKEN", "TATAELXSI", "LALPATHLAB", "CDSL", "APOLLOTYRE", "ACC", "NIACL", "MTARTECH", "IGL",
    "DEEPAKNTR", "KAYNES", "TRITURBINE", "RBLBANK", "GRINDWELL", "GMDCLTD", "GESHIP", "RAMCOCEM", "KPITTECH", "PFIZER",
    "SUNTV", "CARBORUNIV", "ATUL", "BAYERCROP", "ELGIEQUIP", "GRANULES", "CAMS", "CHAMBLFERT", "REDINGTON", "VTL",
    "EIHOTEL", "SUNDRMFAST", "CHENNPETRO", "SYNGENE", "KAJARIACER", "KANSAINER", "EMAMILTD", "J&KBANK", "FINCABLES", "NATCOPHARM",
    "JINDALSAW", "DCMSHRIRAM", "GSPL", "CAPLIPOINT", "AVANTIFEED", "INOXWIND", "BASF", "FINEORG", "BEML", "APLLTD",
    "SOBHA", "ZENTEC", "GRAPHITE", "KFINTECH", "VGUARD", "VINATIORGA", "ENGINERSIN", "EIDPARRY", "ECLERX", "TRIDENT",
    "SOUTHBANK", "ZENSARTECH", "IEX", "ZEEL", "MGL", "FINPIPE", "BBTC", "SHILPAMED", "HEG", "INTELLECT",
    "RAILTEL", "MMTC", "WHIRLPOOL", "RITES", "WABAG", "KTKBANK", "CYIENT", "NCC", "PCJEWELLER", "TIMETECHNO",
    "STARCEMENT", "MAHSEAMLES", "THYROCARE", "KRBL", "SHARDACROP", "SKFINDIA", "NESCO", "GPPL", "BIRLACORPN", "GNFC",
    "JYOTHYLAB", "SONATSOFTW", "SANOFI", "TTKPRESTIG", "BAJAJCON", "CERA", "SFL", "SPARC", "TANLA", "LATENTVIEW",
    "JKPAPER", "GSFC", "GALAXYSURF", "FDC", "NEWGEN", "MOIL", "ITDC", "PTC", "IFBIND", "ICRA",
    "JAMNAAUTO", "CARERATING", "MAPMYINDIA", "BLISSGVS", "GULFOILLUB", "JUSTDIAL", "THOMASCOOK", "RALLIS", "KSCL", "VSTIND",
    "SUNTECK", "ADVENZYMES", "GHCL", "LUXIND", "KNRCON", "DBCORP", "QUESS", "ASHOKA", "RELINFRA", "ROUTE",
    "BALMLAWRIE", "DCAL", "HERITGFOOD", "RAJESHEXPO", "TEAMLEASE", "JAICORPLTD", "HATHWAY", "NILKAMAL", "DELTACORP", "JAGRAN",
    "RUPA"
  ];
  console.log(`[BASKET] getDynamicBasket returning ${fallback.length} institutional fallback symbols.`);
  return fallback;
}

