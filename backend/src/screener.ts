import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateRHS, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda, calculateTwentyRallyRetest } from './strategies/index.js';
import { supabase } from './db.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

let snapshotCache: Record<string, any> = {};

export async function initSnapshotCache() {
  try {
    console.log('📦 Loading Market Snapshot from Supabase...');
    const { data, error } = await supabase.from('market_data').select('*');
    if (error) throw error;
    
    snapshotCache = {};
    data?.forEach(row => {
      snapshotCache[row.symbol] = row.data;
    });
    
    console.log(`✅ Snapshot cache loaded from Cloud (${data?.length} symbols)`);
  } catch (e: any) {
    console.error('❌ Failed to load snapshot cache from Supabase:', e.message);
    snapshotCache = {};
  }
}

export async function fetchScreenerData(symbol: string) {
  try {
    const cleanSymbol = symbol.split('.')[0]; 
    const url = `https://www.screener.in/company/${cleanSymbol}/consolidated/`;
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 10000
    });
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
      if (rowName.toLowerCase() === 'sales') searchTerms.push('revenue', 'interest');

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
      const shSection = $('#shareholding');
      const tables = shSection.length > 0 ? shSection.find('table') : $('table');
      
      tables.each((_, table) => {
        $(table).find('tr').each((_, row) => {
          const cells = $(row).find('td, th');
          const firstCellText = $(cells[0]).text().replace(/\s+/g, ' ').trim().toLowerCase();
          const targetLabel = label.toLowerCase();

          if (firstCellText.startsWith(targetLabel) || firstCellText.includes(targetLabel)) {
            for (let k = 1; k < cells.length; k++) {
              const val = $(cells[k]).text().trim().replace(/%/g, '');
              const parsed = parseFloat(val);
              if (!isNaN(parsed)) {
                history.push(parsed);
              }
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
    
    // Improved Industry Extraction
    let industry = 'General Research';
    const breadcrumbText = $('.company-ratios .breadcrumb').text().trim();
    if (breadcrumbText) {
      const parts = breadcrumbText.split('\n').map(p => p.trim()).filter(p => p && p !== '/' && p.length > 2);
      if (parts.length > 0) {
        industry = parts[parts.length - 1];
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
    const eps = getAnnualTableData('profit-loss', 'EPS');
    
    const currentEPS = eps.slice(-1)[0] || (netProfits.slice(-1)[0] / 10);
    const calculatedPE = currentEPS > 0 ? (currentPrice / currentEPS) : (getRatio('Stock P/E') || 45);

    const borrowings = getAnnualTableData('balance-sheet', 'Borrowings');
    const shareCapital = getAnnualTableData('balance-sheet', 'Share Capital');
    const reserves = getAnnualTableData('balance-sheet', 'Reserves');

    const roe = getRatio('ROE') || (getAnnualTableData('ratios', 'ROE').slice(-1)[0]) || 0;
    const roce = getRatio('ROCE') || (getAnnualTableData('ratios', 'ROCE').slice(-1)[0]) || 0;
    const latestEquity = (shareCapital.slice(-1)[0] || 0) + (reserves.slice(-1)[0] || 0);
    const debtToEquity = latestEquity > 0 ? (borrowings.slice(-1)[0] / latestEquity) : 0;

    return {
      marketCap,
      peRatio: calculatedPE,
      dividendYield: getRatio('Dividend Yield'),
      roce,
      returnOnEquity: roe,
      netDebtToEquity: debtToEquity,
      currentPrice,
      industry,
      smartMoneyTotal,
      shareholding
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
        const cleanSymbol = symbol.replace('.NS', '');
        if (exclusions.has(cleanSymbol)) return; 

        const summary: any = await yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] });
        const annualProfit = (summary.defaultKeyStatistics?.netIncomeToCommon / 10000000) || 0;
        const debtToEquity = ((summary.financialData?.debtToEquity || 0) as number) / 100;
        const marketCapCr = (summary.summaryDetail?.marketCap || 0) / 10000000;
        
        if (annualProfit > 50 && debtToEquity < 0.5 && marketCapCr > 500) {
          results.push(symbol.replace('.NS', ''));
        }
      } catch (e) { }
    }));
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  await supabase.from('system_cache').upsert({
    key: 'dynamic_growth_basket',
    data: results,
    updated_at: new Date().toISOString()
  });

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
        period1.setFullYear(period1.getFullYear() - 5);
        
        const [history, quote, summary, screenerData] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] }).catch(() => null),
          fetchScreenerData(baseSymbol)
        ]);

        if (!history || !history.quotes) throw new Error('No history');

        const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
        const marketCap = quote.marketCap || screenerData?.marketCap || 0;
        
        const strategies = {
          'ENVELOPE_LONG': calculateEnvelope(quotes),
          'ENVELOPE_SHORT': processShortEnvelope(quotes),
          'BOLLINGER': calculateBollingerBand(quotes),
          '52W_HIGH_LOW': calculate52WeekStrategy(quotes),
          'CUP_HANDLE_CORRECTION': calculateCupHandle(quotes),
          'RHS_CORRECTION': calculateRHS(quotes),
          'SMA_ABCD': calculateSMAStacking(quotes),
          'SR_STRATEGY': calculateSRStrategy(quotes),
          'SIXTY_SEVEN_FUNDA': calculateSixtySevenFunda(quotes, screenerData),
          'TWENTY_RALLY_RETEST': calculateTwentyRallyRetest(quotes)
        };

        const finalData = {
          quotes: quotes.slice(-600), 
          quote: {
            marketCap,
            regularMarketPrice: quote.regularMarketPrice || (quotes.length > 0 ? quotes[quotes.length - 1].close : 0),
            regularMarketChangePercent: quote.regularMarketChangePercent || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || Math.max(...quotes.slice(-252).map(q => q.high)),
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || Math.min(...quotes.slice(-252).map(q => q.low)),
            pe: summary?.summaryDetail?.trailingPE || screenerData?.peRatio || 0,
            roe: (summary?.defaultKeyStatistics?.returnOnEquity || 0) * 100 || screenerData?.returnOnEquity || 0,
            debtToEquity: summary?.financialData?.debtToEquity || screenerData?.netDebtToEquity || 0,
            shareholding: screenerData?.shareholding || null
          },
          screener: screenerData,
          strategies,
          lastUpdated: new Date().toISOString()
        };

        await supabase.from('market_data').upsert({
          symbol: baseSymbol,
          data: finalData,
          updated_at: new Date().toISOString()
        });

        snapshotCache[baseSymbol] = finalData;

      } catch (e: any) { console.error(`Snapshot failed for ${baseSymbol}: ${e.message}`); }
    }));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log(`💎 [SNAPSHOT] Success! Market data synced to Cloud.`);
}

export function initScreenerCron() {
  cron.schedule('30 2 * * *', () => runScreener());
  cron.schedule('0 11 * * *', async () => {
    const elite = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];
    const quality = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
    const growth = await getDynamicBasket();
    const all = elite.concat(quality, growth, ['^NSEI']);
    await updateMarketSnapshot(Array.from(new Set(all)));
  });
}

export function getMarketSnapshot(): Record<string, any> { return snapshotCache; }
export async function getDynamicBasket(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('system_cache').select('data').eq('key', 'dynamic_growth_basket').single();
    if (!error && data && Array.isArray(data.data)) return data.data;
  } catch (e) { }
  return []; 
}
