import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  PieChart, 
  Target, 
  RefreshCw, 
  ChevronRight, 
  Activity,
  ArrowUpRight,
  Database,
  LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
const API_URL = getApiUrl();

const AlphaHubPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCapital, setTotalCapital] = useState<number>(200000);

  const fetchAlphaHub = async () => {
    if (!API_URL || API_URL.includes('missing-backend')) {
       setError("System Configuration Error: VITE_API_URL is missing or invalid in Vercel settings.");
       setLoading(false);
       return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('mb_token');
      const res = await fetch(`${API_URL}/api/backtest/alpha-40`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setData(data);
      } else {
        setError(data.error || 'Failed to sync Alpha Hub');
      }
    } catch (e) {
      setError('Connection failed. Please ensure backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlphaHub();
  }, []);

  // --- Pro Allocation Logic: 50-30-20 Weighted ---
  const calculateQuantity = (stock: any) => {
    if (!totalCapital || totalCapital < 200000) return 0;
    
    const capCr = (stock.marketCap || 0) / 10000000;
    let perStockBudget = 0;
    
    // Distribute total capital based on 50-30-20
    if (capCr >= 65000) perStockBudget = (totalCapital * 0.50) / 20; // 50% split among 20 Large Caps
    else if (capCr >= 20000) perStockBudget = (totalCapital * 0.30) / 12; // 30% split among 12 Mid Caps
    else perStockBudget = (totalCapital * 0.20) / 8; // 20% split among 8 Small Caps

    // Minimum Allocation Rule: ₹5,000
    if (perStockBudget < 5000) return 0;
    
    return Math.floor(perStockBudget / (stock.entryPrice || stock.currentPrice || 1));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center px-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
        <div className="space-y-2">
           <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Alpha-40 Core Initializing</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Auditing 500+ Stocks across 10-Strategy Matrix</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center space-y-6 flex flex-col items-center justify-center min-h-screen">
         <div className="bg-red-50 p-8 rounded-[3.5rem] inline-block border border-red-100 max-w-xl shadow-xl">
            <h2 className="text-red-600 font-black uppercase tracking-widest text-sm mb-4">Alpha Hub Connection Error</h2>
            <div className="space-y-4 text-left">
               <p className="text-red-500 text-xs font-bold leading-relaxed">{error}</p>
               <div className="bg-white/50 p-4 rounded-2xl border border-red-100 font-mono text-[9px] text-slate-600 break-all">
                  <p className="mb-1 font-black uppercase text-slate-400">Diagnostic Info:</p>
                  <p>Target API: {API_URL}</p>
                  <p>Client Host: {window.location.host}</p>
                  <p>Origin: {window.location.origin}</p>
               </div>
            </div>
         </div>
         <div className="flex items-center justify-center space-x-3">
            <button onClick={fetchAlphaHub} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-black">Retry Deployment</button>
            <button 
              onClick={() => {
                const val = prompt("Enter your Backend URL (e.g. http://192.168.1.10:3001)", API_URL);
                if (val) {
                  localStorage.setItem('mb_api_override', val);
                  window.location.reload();
                }
              }}
              className="px-6 py-4 bg-white border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all shadow-sm"
            >
              Fix Connectivity
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 lg:p-16 max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header with Capital Simulator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-slate-100 pb-12">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-slate-900">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                 <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">Strategic Hub</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Alpha-40</h1>
           <p className="text-sm md:text-lg text-slate-500 font-medium max-w-xl leading-relaxed">
             Top 40 institutional picks mapped to the 50-30-20 rule. Minimum ₹2L capital required for deployment.
           </p>
        </div>
        
        {/* Capital Simulator Input */}
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl space-y-5 min-w-[340px] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
           <div className="flex justify-between items-center text-slate-500 relative z-10">
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Investment Simulator</span>
              <Target className="h-4 w-4" />
           </div>
           <div className="space-y-3 relative z-10">
              <div className="relative">
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">₹</span>
                 <input 
                   type="number" 
                   value={totalCapital}
                   step={10000}
                   onChange={(e) => setTotalCapital(Number(e.target.value))}
                   onBlur={() => setTotalCapital(Math.max(200000, totalCapital))}
                   className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl pl-10 pr-6 py-5 text-2xl font-black text-white focus:border-white transition-all outline-none"
                   placeholder="Capital (Min 2L)"
                 />
              </div>
              <div className="flex justify-between px-2">
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Min Entry: ₹2,00,000</p>
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">50-30-20 Weightage Active</p>
              </div>
           </div>
        </div>
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all" />
            <div className="relative z-10 space-y-6">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Scale</span>
                  <Database className="h-4 w-4 text-slate-600" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-4xl font-black tracking-tighter">{data?.summary?.total || 0}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Qualified Stocks</p>
               </div>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Cap Distribution</span>
               <PieChart className="h-4 w-4" />
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-900 uppercase">Large-Mid-Small</span>
                  <span className="text-xs font-black text-slate-900">{data?.summary?.large || 0}-{data?.summary?.mid || 0}-{data?.summary?.small || 0}</span>
               </div>
               <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-50">
                  <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${((data?.summary?.large || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-slate-600 transition-all duration-1000" style={{ width: `${((data?.summary?.mid || 0) / (data?.summary?.total || 1)) * 100}%` }} />
                  <div className="h-full bg-slate-400 transition-all duration-1000" style={{ width: `${((data?.summary?.small || 0) / (data?.summary?.total || 1)) * 100}%` }} />
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Institutional 50-30-20 Model</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Sector Risk</span>
               <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-1">
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Verified</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&lt; 20% Exposure / Sector</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6 text-emerald-600">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Exp. Yield</span>
               <Activity className="h-4 w-4" />
            </div>
            <div className="space-y-1">
               <h3 className="text-3xl font-black tracking-tighter text-emerald-600">25-30%</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yearly Performance Band</p>
            </div>
         </div>
      </div>

      {/* Stock Grid: Grouped by Basket Tier */}
      {['BLUECHIP', 'HIGH_BETA', 'PROFIT'].map(basket => {
        const basketStocks = (data?.stocks || []).filter((s: any) => s.basketSource === basket);
        if (basketStocks.length === 0) return null;

        return (
          <div key={basket} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{basket.replace('_', ' ')} Tier</h2>
                <div className="h-px flex-1 bg-slate-100" />
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase">{basketStocks.length} Assets</span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {basketStocks.map((stock: any, i: number) => {
                  const qty = calculateQuantity(stock);
                  const allocation = qty * (stock.currentPrice || 0);

                  return (
                    <div key={stock.symbol} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:border-slate-300 transition-all group relative overflow-hidden flex flex-col justify-between">
                       <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all z-10">
                          <Link to={`/stock/${stock.symbol}`} className="text-slate-900"><ArrowUpRight className="h-5 w-5" /></Link>
                       </div>

                       <div className="space-y-6">
                          <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200">
                                {i + 1}
                             </div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{stock.symbol}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{stock.sector || 'Strategic Asset'}</span>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entry Level</span>
                                <p className="text-sm font-black text-slate-800">₹{stock.entryPrice?.toLocaleString() || '-'}</p>
                             </div>
                             <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Quantity</span>
                                <p className="text-sm font-black text-slate-900">{qty}</p>
                             </div>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deployment</span>
                                <span className="text-[10px] font-black text-slate-900">₹{allocation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                             </div>
                             <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-900 rounded-full" style={{ width: `${Math.min(100, (allocation/totalCapital)*400)}%` }} />
                             </div>
                          </div>
                       </div>

                       <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Expected ROI</span>
                             <span className="text-[11px] font-black text-emerald-600">+{stock.roi?.toFixed(1)}%</span>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Matrix Rank</span>
                             <span className="text-[11px] font-black text-slate-900 italic">R{stock.rank || '-'}</span>
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        );
      })}

      {/* Institutional Capital Summary Footer */}
      <div className="bg-slate-900 rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800 mt-12">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl -mr-32 -mt-32" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
               <h3 className="text-xl font-black uppercase tracking-widest italic text-white/40 leading-none">Aggregate Exposure</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em]">Cumulative Deployment Objective</p>
            </div>
            <div className="text-center md:text-right">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 italic">Total Model Objective</p>
               <h4 className="text-5xl md:text-7xl font-black tracking-tighter italic">₹{(totalCapital/100000).toFixed(1)}L</h4>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AlphaHubPage;
