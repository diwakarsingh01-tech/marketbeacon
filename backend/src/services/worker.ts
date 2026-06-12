import { getMarketSnapshot, getDynamicBasket } from '../screener.js';
import { validateBatch9 } from './fundamentalAudit.js';
import { runStrategyAnalysis } from './strategyService.js';
import { STRATEGIES, BASKETS, MANUAL_SECTOR_MAP } from '../index.js';
import { supabase } from '../db.js';
import { notifyAllUsers } from './notificationService.js';
import { sendSignalNotification } from './telegramNotifier.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let localAlpha40Cache: any = null;

const pathsToTry = [
  path.resolve(process.cwd(), 'alpha_40_results.json'),
  path.resolve(process.cwd(), 'backend', 'alpha_40_results.json'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../alpha_40_results.json'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../alpha_40_results.json'),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../alpha_40_results.json')
];

let CACHE_FILE_PATH = pathsToTry[0];
for (const p of pathsToTry) {
  if (fs.existsSync(p)) {
    CACHE_FILE_PATH = p;
    break;
  }
}

try {
  if (fs.existsSync(CACHE_FILE_PATH)) {
    const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
    localAlpha40Cache = JSON.parse(raw);
    console.log(`💾 [Alpha-40 Cache] Loaded initial cache from disk path: ${CACHE_FILE_PATH}`);
  } else {
    console.warn(`⚠️ [Alpha-40 Cache] Cache file not found on startup in any paths.`);
  }
} catch (e: any) {
  console.error('⚠️ [Alpha-40 Cache] Failed to load initial cache from disk:', e.message);
}

const STRATEGY_BASKET_MAP: Record<string, string[]> = {
  'ENVELOPE_LONG': ['Elite Basket'], 'ENVELOPE_SHORT': ['Elite Basket'], 'BOLLINGER': ['Elite Basket'],
  'CUP_HANDLE_ABCD': ['Elite Basket', 'Quality Basket'], 'RHS_ABCD': ['Elite Basket', 'Quality Basket'],
  'SMA_BCD': ['Elite Basket', 'Quality Basket'], '52W_HIGH_LOW': ['Elite Basket'],
  'TWENTY_RALLY_RETEST': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'SIXTY_SEVEN_FUNDA': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
  'SR_STRATEGY': ['Elite Basket', 'Quality Basket', 'Growth Basket']
};

export async function precalculateAlpha40() {
  console.log('👷 [WORKER] Pre-calculating Alpha-40 Snapshots (Cloud Mode)...');
  try {
    const snapshot = getMarketSnapshot();
    const dynamicWealth = await getDynamicBasket();
    const currentWealth = (Array.isArray(dynamicWealth) && dynamicWealth.length > 0) ? dynamicWealth : [];

    const processBasket = async (basketName: string, symbols: string[]) => {
      const active: any[] = [];
      const closed: any[] = [];
      
      for (const sym of symbols) {
        try {
          const snap = snapshot[sym];
          if (!snap || !snap.quotes?.length) continue;
          
          const audit = await validateBatch9(sym, snap, basketName);
          if (!audit || !audit?.isPass) continue;

          const marketCap = snap.quote.marketCap || 1;
          const capCr = marketCap / 10000000;
          const capType = capCr >= 45000 ? 'LARGE' : (capCr >= 15000 ? 'MID' : 'SMALL');
          const last = snap.quotes[snap.quotes.length - 1];

          // 1. Closed simulation (historical data)
          let peak = 0;
          let inDrawdown = false;
          let simEntry = 0;
          let simEntryDate = '';
          
          for (let i = 0; i < snap.quotes.length - 10; i++) {
            const q = snap.quotes[i];
            if (q.high > peak) peak = q.high;
            if (!inDrawdown && q.close <= peak * 0.75) {
              inDrawdown = true;
              simEntry = q.close;
              simEntryDate = new Date(q.date).toISOString();
            }
            if (inDrawdown && q.high >= simEntry * 1.30) {
              const exitDate = new Date(q.date);
              const days = Math.round((exitDate.getTime() - new Date(simEntryDate).getTime()) / (1000*3600*24));
              if (days > 10 && days < 500) {
                closed.push({
                  symbol: sym,
                  entryTime: simEntryDate,
                  exitDate: exitDate.toISOString(),
                  days,
                  roi: ((q.high / simEntry) - 1) * 100,
                  score: audit.score
                });
              }
              inDrawdown = false;
              peak = q.high;
            }
          }

          // 2. Active Signals Analysis (Multi-Strategy Selection)
          const validSignals: any[] = [];
          for (const stratId of Object.keys(STRATEGY_BASKET_MAP)) {
            if (!STRATEGY_BASKET_MAP[stratId]?.includes(basketName)) continue;
            
            const sd: any = runStrategyAnalysis(stratId, snap, marketCap, basketName);
            if (!sd || !sd?.isBuyZone) continue;

            const entry = sd?.entryPrice || last?.close;
            const target = sd?.target || (entry * 1.3);
            const isMovingUp = last?.close >= entry;
            const priceDeviation = Math.abs(((last?.close / entry) - 1) * 100);
            
            // Loosened for Alpha Hub: Allow up to 20% move from entry (Institutional Action Zone)
            if (isMovingUp && priceDeviation > 20.0) continue; 
            else if (!isMovingUp && priceDeviation > 30.0) continue;

            // Sector-aware D/E mandate check
            const de = snap.screener?.netDebtToEquity || 0;
            const sectorName = (MANUAL_SECTOR_MAP[sym] || snap.screener?.industry || 'General').trim();
            const isFinance = ['Banking', 'Finance', 'Banking ETF', 'NBFC', 'Financial Services', 'Asset Management', 'Exchange/Depository', 'Financial Infrastructure'].includes(sectorName)
              || sectorName.toLowerCase().includes('finance') || sectorName.toLowerCase().includes('nbfc');
            const isCapIntensive = ['EPC/Infra', 'Automobile', 'Infrastructure', 'Power', 'Steel', 'Telecom', 'Cement', 'Metal', 'Engineering', 'Industrial/Power', 'Utilities'].includes(sectorName)
              || ['LT', 'BHARTIARTL', 'M&M', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'POWERGRID', 'TMCV'].includes(sym)
              || sectorName.toLowerCase().includes('infra') || sectorName.toLowerCase().includes('steel') || sectorName.toLowerCase().includes('telecom') || sectorName.toLowerCase().includes('auto');
            const debtLimit = isFinance ? 8.0 : (isCapIntensive ? 2.0 : 1.0);
            if (de > debtLimit) continue;

            let entryTime = sd?.triggerDate;
            if (!entryTime && snap.quotes.length > 0) {
              entryTime = new Date(snap.quotes[0].date).toISOString().split('T')[0];
            }

            validSignals.push({ 
              symbol: sym, 
              stockName: sym,
              strategy: STRATEGIES.find(s=>s.id===stratId)?.name || stratId, 
              tranche: sd?.tranche || 'A',
              basketSource: basketName, 
              capType, 
              sector: sectorName,
              currentPrice: last.close, 
              entryPrice: entry, 
              entryTime,
              target, 
              roi: ((target / entry) - 1) * 100, 
              score: audit.score, 
              smartMoney: audit.smartMoneyTotal 
            });

            // 📢 UNIVERSAL AUTOMATED NOTIFICATION: ALL BASKETS & STRATEGIES
            if (sd?.status === 'QUALIFIED') {
               const stratName = STRATEGIES.find(s => s.id === stratId)?.name || stratId;
               const title = `🚨 ${basketName}: ${sym}`;
               const message = `${sym} has triggered for ${stratName} (Tranche ${sd.tranche || 'A'}). Objective: ${Math.round(target)}.`;
               notifyAllUsers(title, message, 'audit');
               // Send detailed signal to Telegram DM
               sendSignalNotification(sym, stratName, basketName, entry, target, sd?.tranche || 'A').catch(() => {});
            }
          }

          if (validSignals.length > 0) {
            // Logic: Highest ROI strategy wins for this stock
            const bestSignal = validSignals.sort((a, b) => b.roi - a.roi)[0];
            active.push({
               ...bestSignal,
               signalCount: validSignals.length // Track how many strategies triggered
            });
          }
        } catch (e) { }
      }
      return { active, closed };
    };

    const bc = await processBasket('Elite Basket', BASKETS['Elite Basket']);
    const hb = await processBasket('Quality Basket', BASKETS['Quality Basket']);
    const wb = await processBasket('Growth Basket', currentWealth);

    // DEDUPLICATE: Ensure a symbol only appears once across all baskets
    const dedupeMap = new Map<string, any>();
    [...(bc.active || []), ...(hb.active || []), ...(wb.active || [])].forEach(s => {
      if (!dedupeMap.has(s.symbol) || s.score > dedupeMap.get(s.symbol).score) {
        dedupeMap.set(s.symbol, s);
      }
    });

    const allActive = Array.from(dedupeMap.values());
    const allClosed = [...(bc.closed || []), ...(hb.closed || []), ...(wb.closed || [])];

    // --- INSTITUTIONAL ALLOCATION ENGINE ---
    const selectWithRules = (candidates: any[], targetCount: number, existingSectors: Record<string, number>) => {
      const selected: any[] = [];
      
      // SORTING LOGIC: Multi-Signal Priority -> Latest Date -> High ROI
      const sorted = candidates.sort((a, b) => {
        // 1. Multi-signal stocks first
        if ((b.signalCount > 1) !== (a.signalCount > 1)) {
          return b.signalCount > 1 ? 1 : -1;
        }
        // 2. Latest Trigger Date next
        const dateB = new Date(b.entryTime || 0).getTime();
        const dateA = new Date(a.entryTime || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        
        // 3. Highest ROI fallback
        return b.roi - a.roi;
      });

      for (const s of sorted) {
        if (selected.length >= targetCount) break;
        const sector = s.sector || 'General';
        const sectorCount = existingSectors[sector] || 0;
        if (sectorCount < 8) {
          selected.push(s);
          existingSectors[sector] = sectorCount + 1;
        }
      }
      return selected;
    };

    const sectorUsage: Record<string, number> = {};
    const finalLarge = selectWithRules(allActive.filter(s => s.capType === 'LARGE'), 20, sectorUsage);
    const finalMid = selectWithRules(allActive.filter(s => s.capType === 'MID'), 12, sectorUsage);
    const finalSmall = selectWithRules(allActive.filter(s => s.capType === 'SMALL'), 8, sectorUsage);
    const finalActive = [...finalLarge, ...finalMid, ...finalSmall];

    const results = {
      active: finalActive,
      closed: allClosed,
      capStats: { LARGE: finalLarge.length, MID: finalMid.length, SMALL: finalSmall.length },
      sectorStats: sectorUsage,
      updatedAt: new Date().toISOString()
    };

    // Update local cache
    localAlpha40Cache = results;
    try {
      fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(results, null, 2), 'utf-8');
      console.log('💾 [Alpha-40 Cache] Saved calculated cache to disk.');
    } catch (e: any) {
      console.error('⚠️ [Alpha-40 Cache] Failed to write cache to disk:', e.message);
    }

    // Save to Supabase system_cache (skip if Supabase not configured)
    if (supabase) {
      await supabase.from('system_cache').upsert({
        key: 'alpha_40_results',
        data: results,
        updated_at: new Date().toISOString()
      });
    }

    console.log(`✅ [WORKER] Alpha-40 Cloud Cache Updated. Mix: ${finalLarge.length}L / ${finalMid.length}M / ${finalSmall.length}S`);
  } catch (e: any) {
    console.error('❌ [WORKER] Alpha-40 Pre-calculation Failed:', e.message);
  }
}

export async function getAlpha40Cache() {
  // Return in-memory cache directly for ultra-fast, timeout-proof response
  if (localAlpha40Cache) {
    return localAlpha40Cache;
  }
  
  // Try loading from resolved disk path
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const raw = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
      localAlpha40Cache = JSON.parse(raw);
      console.log(`💾 [Alpha-40 Cache] Loaded cache from disk in getAlpha40Cache: ${CACHE_FILE_PATH}`);
      return localAlpha40Cache;
    }
  } catch (err: any) {
    console.warn(`⚠️ [Alpha-40 Cache] Failed to load cache from disk fallback: ${err.message}`);
  }

  console.warn('⚠️ [Alpha-40 Cache] No cache found in memory or on disk.');
  return null;
}
