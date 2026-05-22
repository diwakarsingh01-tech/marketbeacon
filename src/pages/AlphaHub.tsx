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

const API_URL = import.meta.env.VITE_API_URL || (window.location.protocol === 'https:' ? 'https://' + window.location.host : 'http://localhost:3001');

const AlphaHubPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlphaHub = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('mb_token');
      const res = await fetch(`${API_URL}/api/backtest/alpha-40`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to sync Alpha Hub');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <div className="text-center space-y-2">
           <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Alpha-40 Syncing</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Auditing 500+ Stocks across 10 Strategies</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center space-y-6">
         <div className="bg-red-50 p-8 rounded-[3rem] inline-block border border-red-100 max-w-md">
            <h2 className="text-red-600 font-black uppercase tracking-widest text-sm mb-2">Alpha Hub Offline</h2>
            <p className="text-red-500 text-xs font-bold leading-relaxed">{error}</p>
         </div>
         <button onClick={fetchAlphaHub} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest block mx-auto">Retry Deployment</button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 lg:p-16 max-w-7xl mx-auto space-y-12 pb-32">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-100 pb-12">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-blue-600">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                 <LayoutGrid className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">Multi-Strategy Hub</span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Alpha-40 Segment</h1>
           <p className="text-sm md:text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
             A risk-weighted collection of the top 40 institutional opportunities, dynamically rebalanced using the 50-30-20 rule and 10-Strategy Matrix.
           </p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="bg-emerald-50 px-6 py-4 rounded-3xl border border-emerald-100 text-center">
              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Target ROI</p>
              <h4 className="text-2xl font-black text-emerald-700 tracking-tight leading-none">25-30%</h4>
           </div>
           <button onClick={fetchAlphaHub} className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm hover:scale-105 transition-all text-slate-400 hover:text-blue-600">
              <RefreshCw className="h-5 w-5" />
           </button>
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
                  <h3 className="text-4xl font-black tracking-tighter">{data.summary.total}</h3>
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
                  <span className="text-xs font-black text-slate-900">{data.summary.large}-{data.summary.mid}-{data.summary.small}</span>
               </div>
               <div className="h-2 w-full flex rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900" style={{ width: `${(data.summary.large/data.summary.total)*100}%` }} />
                  <div className="h-full bg-blue-600" style={{ width: `${(data.summary.mid/data.summary.total)*100}%` }} />
                  <div className="h-full bg-indigo-400" style={{ width: `${(data.summary.small/data.summary.total)*100}%` }} />
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Institutional 50-30-20 Rule</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Sector Risk</span>
               <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-1">
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Verified</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&lt; 20% Single Exposure</p>
            </div>
         </div>

         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center text-slate-400">
               <span className="text-[9px] font-black uppercase tracking-widest">Exp. Yield</span>
               <Activity className="h-4 w-4" />
            </div>
            <div className="space-y-1">
               <div className="flex items-baseline space-x-1">
                  <h3 className="text-3xl font-black text-blue-600 tracking-tighter">+{data.summary.avgRoi.toFixed(1)}%</h3>
                  <span className="text-[8px] font-black text-slate-400 uppercase">Avg</span>
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Potential Portfolio Lift</p>
            </div>
         </div>
      </div>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {data.stocks.map((stock: any, i: number) => (
           <div key={stock.symbol} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:border-blue-200 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                 <Link to={`/stock/${stock.symbol}`} className="text-blue-600"><ArrowUpRight className="h-5 w-5" /></Link>
              </div>
              
              <div className="space-y-6">
                 <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                       {i + 1}
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-slate-900 leading-none tracking-tight">{stock.symbol}</h4>
                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{stock.sector}</p>
                    </div>
                 </div>

                 <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Strategy</span>
                       <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-tight">{stock.strategy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Batch 9 Score</span>
                       <span className="text-[10px] font-black text-blue-600">{stock.score}/100</span>
                    </div>
                 </div>

                 <div className="flex justify-between items-end pt-2">
                    <div>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Buy Zone</p>
                       <p className="text-sm font-black text-slate-900 italic">₹{stock.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Target ROI</p>
                       <p className="text-sm font-black text-emerald-700">+{stock.roi.toFixed(1)}%</p>
                    </div>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 rounded-3xl p-8 border border-amber-100 flex items-start space-x-6">
         <ShieldCheck className="h-8 w-8 text-amber-600 shrink-0" />
         <div className="space-y-2">
            <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-[0.2em]">Alpha Hub Governance</h4>
            <p className="text-xs text-amber-800/80 font-bold leading-relaxed uppercase tracking-tight">
              THE ALPHA-40 SEGMENT IS AUTOMATICALLY REBALANCED BASED ON LIVE MARKET SNAPSHOTS. 
              REBALANCING FREQUENCY IS SET TO MONTHLY. THE 50-30-20 RULE IS MANDATORY AND CANNOT BE OVERRIDDEN.
              ALL RESEARCH IS FOR EDUCATIONAL PURPOSES ONLY.
            </p>
         </div>
      </div>
    </div>
  );
};

export default AlphaHubPage;
