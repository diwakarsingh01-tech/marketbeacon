import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from '../components/layout/TopNav';
import TradeTable from '../components/tables/TradeTable';
import { generateEnvelopeData } from '../data/mockData';
import { BASKETS, STRATEGIES } from '../data/stocks';
import { ChevronRight, Target, ShieldCheck, RefreshCw } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const strategyId = searchParams.get('strategy') || 'ENVELOPE_LONG';
  
  const currentStrategy = STRATEGIES.find(s => s.id === strategyId) || STRATEGIES[0];
  
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeBasket, setActiveBasket] = useState<string>(currentStrategy.baskets[0]);
  const [activeTab, setActiveTab] = useState<'open' | 'closed' | 'hold' | 'watchlist'>('open');
  const [stockPrices, setStockPrices] = useState<Record<string, number>>({});
  const [stockATHs, setStockATHs] = useState<Record<string, number>>({});
  const [stockCaps, setStockCaps] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentStrategy.baskets.includes(activeBasket as any)) {
      setActiveBasket(currentStrategy.baskets[0]);
    }
  }, [strategyId, currentStrategy]);
  
  const fetchStockPrices = async (symbols: string[]) => {
    if (symbols.length === 0) return;
    try {
      const response = await fetch(`http://127.0.0.1:3001/api/stock-prices?symbols=${symbols.join(',')}`);
      if (response.ok) {
        const prices = await response.json();
        const priceMap: Record<string, number> = {};
        const athMap: Record<string, number> = {};
        const capMap: Record<string, number> = {};
        prices.forEach((p: any) => { 
          if (p.price) priceMap[p.symbol] = p.price; 
          if (p.ath) athMap[p.symbol] = p.ath;
          if (p.marketCap) capMap[p.symbol] = p.marketCap;
        });
        setStockPrices(priceMap);
        setStockATHs(athMap);
        setStockCaps(capMap);
      }
    } catch (e) { console.error('Price Sync Error:', e); }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<string>('CLOSED');

  const fetchData = useCallback(async (manual = false) => {
    if (manual && marketStatus === 'CLOSED') {
      alert("⚠️ Refresh Restricted: Indian Markets are currently Offline. Manual sync is disabled to optimize data quota.");
      return;
    }

    setData(null); 
    setError(null);
    setIsRefreshing(true);
    const isEnvelopeLong = strategyId === 'ENVELOPE_LONG';
    const isEnvelopeShort = strategyId === 'ENVELOPE_SHORT';
    const isEnvelopeKnox = strategyId === 'ENVELOPE_KNOX';
    
    try {
      const indicesRes = await fetch('http://127.0.0.1:3001/api/market-indices');
      if (indicesRes.ok) {
        const indicesData = await indicesRes.json();
        setMarketStatus(indicesData.status);
      }

      if (isEnvelopeLong || isEnvelopeShort || isEnvelopeKnox) {
        const type = isEnvelopeLong ? 'LONG' : isEnvelopeShort ? 'SHORT' : 'KNOX';
        const response = await fetch(`http://127.0.0.1:3001/api/backtest/envelope?basket=${activeBasket}&type=${type}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
          fetchStockPrices(BASKETS[activeBasket as keyof typeof BASKETS] || []);
        } else {
          throw new Error('Backend responded with an error');
        }
      } else {
        const result = generateEnvelopeData(strategyId);
        setData({ open: result.trades, closed: [], hold: [], allStocks: [], stats: result.stats });
        fetchStockPrices(BASKETS[activeBasket as keyof typeof BASKETS] || []);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setError('Connection Timeout: High traffic or backend offline. Please try refreshing again in a few seconds.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [strategyId, activeBasket, marketStatus]);

  useEffect(() => {
    fetchData();
  }, [strategyId, activeBasket]);

  const getWatchlistTrades = () => {
    if (!data?.allStocks?.length) {
      return (BASKETS[activeBasket as keyof typeof BASKETS] || []).map(symbol => ({
        id: symbol, symbol, entryTime: '-', basket: activeBasket, status: 'NO_TRADE',
        entryPrice: 0, currentPrice: stockPrices[symbol] || 0, marketCap: stockCaps[symbol] || 0, roi: 0
      }));
    }
    return data.allStocks.map((s: any) => ({ 
      ...s, 
      id: s.symbol, 
      entryTime: '-', 
      basket: activeBasket, 
      status: s.status,
      marketCap: s.marketCap || stockCaps[s.symbol] || 0
    }));
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <TopNav />
      
      <div className="bg-amber-50 border-b border-amber-100 py-1.5 overflow-hidden whitespace-nowrap relative">
        <div className="flex animate-marquee">
          <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest px-4">
            Education & Analysis Purpose Only (Not SEBI Registered) • The data shown below are mathematical observations based on historical algorithms • These are NOT "Buy/Sell" signals or "Tips" • Investment in the stock market is subject to market risks • We are not SEBI-registered advisors • All levels shown (Targets/Gaps) are for algorithmic backtesting analysis only •
          </p>
          <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest px-4">
            Education & Analysis Purpose Only (Not SEBI Registered) • The data shown below are mathematical observations based on historical algorithms • These are NOT "Buy/Sell" signals or "Tips" • Investment in the stock market is subject to market risks • We are not SEBI-registered advisors • All levels shown (Targets/Gaps) are for algorithmic backtesting analysis only •
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <main className="max-w-[1440px] mx-auto py-8 px-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/20 pb-8 gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/10 w-fit rounded-lg border border-blue-500/20 mb-2">
              <Target className="h-3 w-3 text-blue-600" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.1em]">Analytical Research Lab</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{currentStrategy.name}</h1>
            <p className="text-xs font-bold text-slate-500/70 uppercase tracking-wide">Backtesting algorithm on {activeBasket.replace('_', ' ')} basket</p>
          </div>

          <div className="flex items-end space-x-3">
            <div className="flex flex-col space-y-2 items-end">
              <div className="flex items-center space-x-2 px-3 py-1 bg-white/40 rounded-lg border border-white/60">
                <span className={`h-1.5 w-1.5 rounded-full ${marketStatus === 'LIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Data Status: {marketStatus}
                </span>
              </div>
              <div className="relative group">
                <select 
                  value={strategyId}
                  onChange={(e) => navigate(`?strategy=${e.target.value}`)}
                  className="appearance-none glass-input border-white/60 rounded-2xl pl-4 pr-10 py-3.5 text-xs font-black uppercase tracking-[0.05em] focus:ring-2 focus:ring-blue-500/50 shadow-sm cursor-pointer hover:border-white transition-all min-w-[240px]"
                >
                  {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name} (Model)</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none rotate-90" />
              </div>
            </div>
            
            <button 
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className={`p-4 rounded-2xl border border-white/60 bg-white/40 shadow-sm hover:bg-white/60 transition-all ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'} ${marketStatus === 'CLOSED' ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={marketStatus === 'CLOSED' ? "Data Sync Restricted (Market Offline)" : "Refresh Analytical Data"}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-white/30 p-1.5 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
            {currentStrategy.baskets.map((basketKey) => (
              <button
                key={basketKey}
                onClick={() => setActiveBasket(basketKey)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeBasket === basketKey ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/10 ring-1 ring-white/50' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {basketKey.replace('_', ' ')} Universe
              </button>
            ))}
          </div>

          <div className="flex bg-white/30 p-1.5 rounded-2xl border border-white/50 backdrop-blur-sm">
            {(['open', 'closed', 'hold', 'watchlist'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-lg ring-1 ring-white/50' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'open' ? 'Identified Patterns' : tab === 'closed' ? 'Historical Data' : tab === 'hold' ? 'Active Observations' : 'Universe Watchlist'}
              </button>
            ))}
          </div>
        </div>

        <section className="min-h-[500px]">
          {error ? (
            <div className="glass-card rounded-[2.5rem] h-[400px] flex flex-col items-center justify-center space-y-4 p-10 text-center">
              <div className="text-red-500 font-black text-2xl mb-2">⚠️ Data Sync Issue</div>
              <p className="text-sm font-bold text-red-800/70 max-w-md">{error}</p>
              <button 
                onClick={() => fetchData(true)}
                className="mt-4 px-8 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
              >
                Retry Analytics
              </button>
            </div>
          ) : data ? (
            <div className="glass-card rounded-[2.5rem] p-1 overflow-hidden">
              <TradeTable 
                trades={activeTab === 'watchlist' ? getWatchlistTrades() : (data[activeTab] || [])} 
                livePrices={stockPrices} 
                athData={stockATHs}
                capData={stockCaps}
                isWatchlist={activeTab === 'watchlist'}
              />
            </div>
          ) : (
            <div className="glass-card rounded-[2.5rem] h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Processing Mathematical Chunks...</p>
            </div>
          )}
        </section>

        <footer className="pt-8 pb-12 flex items-center justify-between border-t border-white/20">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 rounded-lg border border-green-500/20">
            <ShieldCheck className="h-3 w-3 text-green-600" />
            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Mathematical Model Verification Active</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MarketBeacon Analytical Tool • Non-Advisory</p>
        </footer>
      </main>
    </div>
  );
};

export default DashboardPage;
