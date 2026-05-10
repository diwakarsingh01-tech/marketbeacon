import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Trophy, 
  Activity,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MarketplacePage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        const res = await fetch(`${API_URL}/api/marketplace`);
        if (res.ok) {
          const data = await res.json();
          setItems(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 md:py-8 px-4 md:px-10 space-y-6 md:space-y-8 overflow-y-auto font-sans bg-[#f8fafc]">
      
      {/* 1. Marketplace Hero */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 border-b border-slate-200 pb-10">
        <div className="space-y-2 text-center lg:text-left">
           <div className="flex items-center space-x-2 px-3 py-1 bg-blue-600/10 w-fit rounded-lg border border-blue-600/20 mb-3 mx-auto lg:mx-0">
              <Store className="h-3 w-3 text-blue-600" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Alpha Store</span>
           </div>
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Marketplace</h1>
           <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Premium Institutional Strategies & Curated Baskets</p>
        </div>

        <div className="flex items-center space-x-4 bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm w-full lg:w-auto justify-center">
           <div className="flex flex-col items-center px-4 md:px-6 border-r border-slate-100">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Active Node</span>
              <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-tighter flex items-center">
                 <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                 Global
              </span>
           </div>
           <div className="flex flex-col items-center px-4 md:px-6">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Subscription</span>
              <span className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-tighter italic">Enterprise Pro</span>
           </div>
        </div>
      </div>

      {/* 2. Strategy Catalog */}
      <div className="space-y-6">
         <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Algorithm Terminal</span>
         </h2>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden flex flex-col">
                 <div className="p-8 space-y-6 flex-1">
                    <div className="flex items-start justify-between">
                       <div className="space-y-1">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${item.type === 'STRATEGY' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                             {item.type}
                          </span>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">{item.name}</h3>
                       </div>
                       <div className={`p-3 rounded-2xl ${item.isUnlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                          {item.isUnlocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                       </div>
                    </div>

                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                       {item.desc}
                    </p>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Hist. CAGR</span>
                          <span className="text-sm font-black text-slate-900">{item.cagr}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Win Rate</span>
                          <span className="text-sm font-black text-emerald-600">{item.winRate}</span>
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk</span>
                          <span className="text-sm font-black text-slate-900">{item.risk}</span>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 px-8 flex items-center justify-between group-hover:bg-slate-900 transition-all duration-500">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-slate-400 uppercase group-hover:text-slate-500">Pricing Tier</span>
                       <span className="text-lg font-black text-slate-900 group-hover:text-white transition-colors">{item.price}</span>
                    </div>
                    {item.isUnlocked ? (
                       <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center space-x-2">
                          <span>Active Access</span>
                          <ChevronRight className="h-3 w-3" />
                       </button>
                    ) : (
                       <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 group-hover:bg-blue-600 group-hover:border-transparent transition-all flex items-center space-x-2">
                          <span>Unlock Now</span>
                          <ChevronRight className="h-3 w-3" />
                       </button>
                    )}
                 </div>
              </div>
            ))}
         </div>
      </div>

      {/* 3. Promotional Banner */}
      <div className="bg-blue-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
         <Activity className="absolute right-[-20px] bottom-[-20px] h-64 w-64 opacity-10" />
         <div className="max-w-2xl space-y-6 relative z-10">
            <h3 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">Need a Custom Strategy?</h3>
            <p className="text-blue-100 font-medium text-lg leading-relaxed">
               Work with our institutional quant team to build and backtest your own proprietary algorithm. High-precision logic, zero-latency execution.
            </p>
            <button className="px-10 py-5 bg-white text-blue-600 rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center space-x-3">
               <span>Contact Enterprise Hub</span>
               <ArrowUpRight className="h-4 w-4" />
            </button>
         </div>
      </div>

      <footer className="py-8 border-t border-slate-200 opacity-40 flex items-center justify-between shrink-0">
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MarketBeacon Terminal v4.8 • Enterprise Alpha Storefront</p>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Alpha Node Encryption: AES-256-STORE</p>
      </footer>
    </div>
  );
};

export default MarketplacePage;
