import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TradeTable from '../components/tables/TradeTable';
import StrategyGuide from '../components/StrategyGuide';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { ChevronRight, Target, ShieldCheck, RefreshCw, TrendingUp, Wallet, BookOpen, X, Lock, ShieldAlert, Check, Zap, Globe, Activity, Database, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import BrokerHub from '../components/modals/BrokerHub';
import LegalModal from '../components/modals/LegalModal';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

interface DashboardPageProps {
  defaultTab?: 'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral';
}

const DashboardPage: React.FC<DashboardPageProps> = ({ defaultTab = 'open' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshAuth } = useAuth();
  const searchParams = new URLSearchParams(location.search);
  const strategyId = searchParams.get('strategy') || 'ENVELOPE_LONG';
  
  const currentStrategy = STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0];
  
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBasket, setActiveBasket] = useState<string>(currentStrategy.baskets[0]);
  const [activeTab, setActiveTab] = useState<'open' | 'hold' | 'watchlist' | 'portfolio' | 'rejected' | 'neutral'>(defaultTab);
  const [showGuide, setShowGuide] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBrokerHub, setShowBrokerHub] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'alpha'>('pro');

  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockATHs, setStockATHs] = useState<Record<string, number>>({});
  const [stockCaps, setStockCaps] = useState<Record<string, number>>({});
  const [stockSectors, setStockSectors] = useState<Record<string, string>>({});
  const [userWatchlist, setUserWatchlist] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (currentStrategy && !currentStrategy.baskets.includes(activeBasket as any)) {
      setActiveBasket(currentStrategy.baskets[0]);
    }
  }, [strategyId, currentStrategy]);

  const fetchTrades = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/trades`, { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await safeJsonParse(res);
      if (res.ok && !d.error) setTrades(d || []);
    } catch (e) { console.error('Fetch Trades Error:', e); }
  }, []);

  const fetchWatchlist = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, { headers: { 'Authorization': `Bearer ${token}` } });
      const d = await safeJsonParse(response);
      if (response.ok && !d.error) setUserWatchlist(d || []);
    } catch (e) { console.error('Watchlist Error:', e); }
  }, []);

  const handleToggleWatchlist = async (symbol: string) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    const isAdding = !userWatchlist.find(s => s.symbol === symbol);
    try {
      const response = await fetch(`${API_URL}/api/watchlist${isAdding ? '' : `/${symbol}`}`, {
        method: isAdding ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: isAdding ? JSON.stringify({ symbol }) : undefined
      });
      if (response.ok) fetchWatchlist();
    } catch (e) { console.error('Toggle Error:', e); }
  };

  const handleUpdateHolding = async (symbol: string, quantity: number, buy_price: number) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${symbol}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity, buy_price })
      });
      if (response.ok) fetchWatchlist();
    } catch (e) { console.error('Update Error:', e); }
  };

  const handleImportHoldings = async (holdings: any[]) => {
    const token = localStorage.getItem('mb_token');
    if (!token) return;
    setIsRefreshing(true);
    try {
      for (const item of holdings) {
        await fetch(`${API_URL}/api/watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ symbol: item.symbol })
        });
        await fetch(`${API_URL}/api/watchlist/${item.symbol}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ quantity: item.quantity, buy_price: item.buyPrice })
        });
      }
      alert(`Imported ${holdings.length} holdings.`);
      fetchWatchlist();
    } catch (e) { alert("Import failed."); }
    finally { setIsRefreshing(false); }
  };

  useEffect(() => {
    fetchWatchlist();
    fetchTrades();
  }, [fetchWatchlist, fetchTrades]);

  const fetchStockPrices = async (symbols: string[]) => {
    if (!symbols || symbols.length === 0) return;
    const chunkSize = 50;
    const priceMap: Record<string, number> = { ...stockPrices };
    const athMap: Record<string, number> = { ...stockATHs };
    const capMap: Record<string, number> = { ...stockCaps };
    const sectorMap: Record<string, string> = { ...stockSectors };

    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      try {
        const response = await fetch(`${API_URL}/api/stock-prices?symbols=${chunk.join(',')}`);
        const d = await safeJsonParse(response);
        if (response.ok && Array.isArray(d)) {
          d.forEach((p: any) => { 
            if (p.price) priceMap[p.symbol] = p.price; 
            if (p.ath) athMap[p.symbol] = p.ath;
            if (p.marketCap) capMap[p.symbol] = p.marketCap;
            if (p.sector) sectorMap[p.symbol] = p.sector;
          });
        }
      } catch (e) { console.error('Price Sync Error:', e); }
    }
    setStockPrices(priceMap);
    setStockATHs(athMap);
    setStockCaps(capMap);
    setStockSectors(sectorMap);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/backtest/envelope?basket=${activeBasket}&strategy=${strategyId}`);
      const d = await safeJsonParse(response);
      if (response.ok && !d.error) {
          setData(d);
          const portfolioSymbols = [...(userWatchlist || []).map(w => w.symbol), ...(trades || []).map(t => t.symbol)];
          const symbolsToFetch = Array.from(new Set([...(d.allStocks?.map((s: any) => s.symbol) || []), ...portfolioSymbols]));
          fetchStockPrices(symbolsToFetch);
      } else {
          setError(d.error || `Data Sync Failed`);
      }
    } catch (e) { setError('Connection Error'); }
    finally { setTimeout(() => setIsRefreshing(false), 300); }
  }, [activeBasket, strategyId, userWatchlist, trades]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getTradesForTab = useCallback(() => {
    if (!data || !data.allStocks) return [];
    if (activeTab === 'portfolio') {
      const combinedMap: Record<string, { quantity: number, buy_price: number }> = {};
      (userWatchlist || []).forEach(w => { combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 }; });
      (trades || []).filter(t => t.status === 'OPEN').forEach(t => {
        if (combinedMap[t.symbol]) {
          const ex = combinedMap[t.symbol];
          const nQty = ex.quantity + (t.quantity || 0);
          if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (t.entry_price * t.quantity)) / nQty; ex.quantity = nQty; }
        } else { combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 }; }
      });
      return Object.keys(combinedMap).map(symbol => {
        const base = data.allStocks.find((s: any) => s.symbol === symbol) || { symbol, marketCap: stockCaps[symbol] || 0, sector: stockSectors[symbol] || 'Manual', currentPrice: stockPrices[symbol] || 0 };
        return { ...base, ...combinedMap[symbol] };
      }).filter(s => s.quantity > 0);
    }
    if (activeTab === 'watchlist') return data.allStocks;
    if (activeTab === 'rejected') return data.rejected || [];
    return data[activeTab] || [];
  }, [data, userWatchlist, activeTab, trades, stockPrices, stockCaps, stockSectors]);

  const portfolioSummary = useMemo(() => {
    if (!userWatchlist.length && !trades.length) return { totalInvested: 0, totalCurrent: 0, totalPnL: 0, realizedGain: 0, capBreakdown: { large: 0, mid: 0, small: 0 }, sectorBreakdown: {} };
    let totalInv = 0, totalCur = 0;
    const capInv = { large: 0, mid: 0, small: 0 };
    const combinedMap: Record<string, { quantity: number, buy_price: number }> = {};
    userWatchlist.forEach(w => { combinedMap[w.symbol] = { quantity: w.quantity || 0, buy_price: w.buy_price || 0 }; });
    trades.filter(t => t.status === 'OPEN').forEach(t => {
      if (combinedMap[t.symbol]) {
        const ex = combinedMap[t.symbol];
        const nQty = ex.quantity + (t.quantity || 0);
        if (nQty > 0) { ex.buy_price = ((ex.buy_price * ex.quantity) + (t.entry_price * t.quantity)) / nQty; ex.quantity = nQty; }
      } else { combinedMap[t.symbol] = { quantity: t.quantity || 0, buy_price: t.entry_price || 0 }; }
    });
    Object.entries(combinedMap).forEach(([symbol, h]) => {
      const inv = h.quantity * h.buy_price;
      if (inv > 0) {
        totalInv += inv;
        totalCur += h.quantity * (stockPrices[symbol] || h.buy_price);
        const capCr = (stockCaps[symbol] || 0) / 10000000;
        if (capCr >= 65000) capInv.large += inv;
        else if (capCr >= 20000) capInv.mid += inv;
        else capInv.small += inv;
      }
    });
    return { 
      totalInvested: totalInv, totalCurrent: totalCur, totalPnL: totalCur - totalInv,
      realizedGain: trades.filter(t => t.status === 'CLOSED').reduce((a, t) => a + (((t.exit_price || 0) - (t.entry_price || 0)) * (t.quantity || 0)), 0),
      capBreakdown: {
        large: totalInv > 0 ? (capInv.large / totalInv) * 100 : 0,
        mid: totalInv > 0 ? (capInv.mid / totalInv) * 100 : 0,
        small: totalInv > 0 ? (capInv.small / totalInv) * 100 : 0
      }
    };
  }, [userWatchlist, trades, stockPrices, stockCaps]);

  return (
    <div className="flex-1 flex flex-col py-6 md:py-8 px-4 md:px-10 space-y-6 bg-[#f8fafc] overflow-y-auto">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-100 pb-8 gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{activeTab === 'portfolio' ? 'Portfolio' : 'Screener'}</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{currentStrategy.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeTab === 'portfolio' && <button onClick={() => setShowBrokerHub(true)} className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center space-x-2"><Globe className="h-4 w-4" /><span>Connect Broker</span></button>}
          <select value={strategyId} onChange={(e) => navigate(`?strategy=${e.target.value}`)} className="bg-white border border-slate-100 rounded-2xl px-6 py-3.5 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer">
            {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => fetchData(true)} className={`p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`}><RefreshCw className="h-4 w-4" /></button>
        </div>
      </div>

      {activeTab === 'portfolio' && portfolioSummary.totalInvested > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Invested</span>
             <h3 className="text-2xl font-black mt-2">₹{portfolioSummary.totalInvested.toLocaleString()}</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current</span>
             <h3 className="text-2xl font-black text-slate-900 mt-2">₹{portfolioSummary.totalCurrent.toLocaleString()}</h3>
          </div>
          <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total P&L</span>
             <h3 className={`text-2xl font-black mt-2 ${portfolioSummary.totalPnL >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Math.abs(portfolioSummary.totalPnL).toLocaleString()}</h3>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cap Mix (50-30-20)</span>
            <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-50">
               <div className="h-full bg-slate-900" style={{ width: `${portfolioSummary.capBreakdown.large}%` }} />
               <div className="h-full bg-slate-600" style={{ width: `${portfolioSummary.capBreakdown.mid}%` }} />
               <div className="h-full bg-slate-400" style={{ width: `${portfolioSummary.capBreakdown.small}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
               <span>L: {portfolioSummary.capBreakdown.large.toFixed(0)}%</span>
               <span>M: {portfolioSummary.capBreakdown.mid.toFixed(0)}%</span>
               <span>S: {portfolioSummary.capBreakdown.small.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 w-fit overflow-x-auto no-scrollbar">
         {[
           { id: 'open', label: 'Qualified', count: data?.open?.length || 0 },
           { id: 'hold', label: 'Watchlist', count: userWatchlist?.length || 0 },
           { id: 'portfolio', label: 'Portfolio', count: getTradesForTab().length },
           { id: 'rejected', label: 'Rejected', count: data?.rejected?.length || 0 }
         ].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab.label} ({tab.count})
           </button>
         ))}
      </div>

      <section className="flex-1 min-h-0">
        {error ? (
          <div className="bg-white rounded-[2.5rem] h-64 border border-slate-100 flex flex-col items-center justify-center space-y-4">
            <p className="text-sm font-black text-red-500 uppercase tracking-widest">{error}</p>
            <button onClick={() => { localStorage.removeItem('mb_api_override'); window.location.reload(); }} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Reset Node</button>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden h-full">
             <div className="flex-1 overflow-auto custom-scrollbar">
                <TradeTable 
                  trades={getTradesForTab()} 
                  livePrices={stockPrices} 
                  athData={stockATHs}
                  capData={stockCaps}
                  userWatchlist={(userWatchlist || []).map(w => w.symbol)}
                  onToggleWatchlist={handleToggleWatchlist}
                  onUpdateHolding={handleUpdateHolding}
                  activeTab={activeTab}
                  strategyId={strategyId}
                />
             </div>
          </div>
        )}
      </section>

      <BrokerHub isOpen={showBrokerHub} onClose={() => setShowBrokerHub(false)} onImportComplete={handleImportHoldings} />
    </div>
  );
};
export default DashboardPage;
