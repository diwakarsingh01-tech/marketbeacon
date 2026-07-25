import { useState, useEffect, useCallback } from 'react';
import type { Location, NavigateFunction } from 'react-router-dom';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import type { AuditData, WatchlistItem, TradeRecord } from '../types';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for fetching and managing dashboard data
 */
export function useDashboardData(
  activeBasket: string,
  strategyId: string
) {
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (_forceRefresh = false) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(
        `${getApiUrl()}/api/backtest/audit?basket=${encodeURIComponent(activeBasket)}&strategy=${encodeURIComponent(strategyId)}`,
        { credentials: 'include' }
      );
      const d = await safeJsonParse(response);

      if (response.status === 403 && d.requiredTier) {
        // Handled by parent component
        return;
      }

      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
        return;
      }

      if (response.ok && !d.error) {
        console.log(`[Dashboard] Fetched ${d.allStocks?.length || 0} nodes for basket: ${activeBasket}`);
        setData(d);
      } else {
        setError(d.error || 'Data Sync Failed');
      }
    } catch (e) {
      setError('Connection Error');
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }, [activeBasket, strategyId]);

  return { data, error, isRefreshing, fetchData, setError };
}

/**
 * Hook for managing portfolio/watchlist/trades
 */
export function usePortfolio() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockATHs, setStockATHs] = useState<Record<string, number>>({});
  const [stockCaps, setStockCaps] = useState<Record<string, number>>({});
  const [stockSectors, setStockSectors] = useState<Record<string, string>>({});

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/trades`, { credentials: 'include' });
      const d = await res.json();
      if (res.ok && !d?.error) setTrades(d || []);
    } catch (e) { console.error('Fetch Trades Error:', e); }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/watchlist`, { credentials: 'include' });
      const d = await res.json();
      if (res.ok && !d?.error) setWatchlist(d || []);
    } catch (e) { console.error('Watchlist Error:', e); }
  }, []);

  const fetchStockPrices = useCallback(async (symbols: string[]) => {
    if (!symbols?.length) return;
    const priceMap: Record<string, number> = {};
    const athMap: Record<string, number> = {};
    const capMap: Record<string, number> = {};
    const sectorMap: Record<string, string> = {};

    for (let i = 0; i < symbols.length; i += 50) {
      const chunk = symbols.slice(i, i + 50);
      try {
        const res = await fetch(`${getApiUrl()}/api/stock-prices?symbols=${chunk.join(',')}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          data.forEach((p: any) => {
            if (p.price) priceMap[p.symbol] = p.price;
            if (p.ath) athMap[p.symbol] = p.ath;
            if (p.marketCap) capMap[p.symbol] = p.marketCap;
            if (p.sector) sectorMap[p.symbol] = p.sector;
          });
        }
      } catch (e) { console.error('Price Sync Error:', e); }
    }
    // Use functional updates to avoid stale closures
    setStockPrices(prev => ({ ...prev, ...priceMap }));
    setStockATHs(prev => ({ ...prev, ...athMap }));
    setStockCaps(prev => ({ ...prev, ...capMap }));
    setStockSectors(prev => ({ ...prev, ...sectorMap }));
  }, []);

  const handleToggleWatchlist = useCallback(async (symbol: string, currentWatchlist: WatchlistItem[]) => {
    const isAdding = !currentWatchlist.find(s => s.symbol === symbol);
    try {
      const res = await fetch(`${getApiUrl()}/api/watchlist${isAdding ? '' : `/${symbol}`}`, {
        method: isAdding ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: isAdding ? JSON.stringify({ symbol }) : undefined,
      });
      if (res.ok) fetchWatchlist();
    } catch (e) { console.error('Toggle Error:', e); }
  }, [fetchWatchlist]);

  const handleUpdateHolding = useCallback(async (symbol: string, quantity: number, buyPrice: number) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/watchlist/${symbol}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity, buy_price: buyPrice }),
      });
      if (res.ok) fetchWatchlist();
    } catch (e) { console.error('Update Error:', e); }
  }, [fetchWatchlist]);

  return {
    trades,
    setTrades,
    watchlist,
    setWatchlist,
    stockPrices,
    stockATHs,
    stockCaps,
    stockSectors,
    fetchTrades,
    fetchWatchlist,
    fetchStockPrices,
    handleToggleWatchlist,
    handleUpdateHolding,
  };
}

/**
 * Hook for managing active tab/basket/strategy state from URL
 */
export function useDashboardRouter(location: Location, navigate: NavigateFunction, defaultTab: string) {
  const [activeTab, setActiveTab] = useState(() => {
    const paramTab = new URLSearchParams(location.search).get('tab') as any;
    const validTabs = ['open', 'hold', 'watchlist', 'portfolio', 'rejected', 'neutral'];
    return (paramTab && validTabs.includes(paramTab)) ? paramTab : defaultTab;
  });

  const [activeBasket, setActiveBasket] = useState(() => {
    return new URLSearchParams(location.search).get('basket') || 'Elite Basket';
  });

  const [strategyId, setStrategyId] = useState(() => {
    return new URLSearchParams(location.search).get('strategy') || 'ENVELOPE_LONG';
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paramTab = params.get('tab') as any;
    const validTabs = ['open', 'hold', 'watchlist', 'portfolio', 'rejected', 'neutral'];
    if (paramTab && validTabs.includes(paramTab)) setActiveTab(paramTab);
  }, [location.search, defaultTab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paramBasket = params.get('basket');
    if (paramBasket) setActiveBasket(paramBasket);
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paramStrategy = params.get('strategy');
    if (paramStrategy) setStrategyId(paramStrategy);
  }, [location.search]);

  const handleSetActiveTab = useCallback((tab: string) => {
    setActiveTab(tab as any);
  }, []);

  const handleBasketChange = useCallback((newBasket: string) => {
    setActiveBasket(newBasket);
    navigate(`?basket=${newBasket}&strategy=ENVELOPE_LONG`);
  }, [navigate]);

  const handleStrategyChange = useCallback((newStrategy: string) => {
    navigate(`?strategy=${newStrategy}`);
  }, [navigate]);

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    activeBasket,
    setActiveBasket: handleBasketChange,
    strategyId,
    setStrategyId: handleStrategyChange,
  };
}

export { getApiUrl } from '../lib/api-utils';