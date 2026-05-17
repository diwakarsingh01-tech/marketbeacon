import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Activity,
  Sparkles,
  ArrowUpRight,
  Gift,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'alpha'>('pro');

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

  const handleUnlock = (tier: 'pro' | 'alpha') => {
    setSelectedTier(tier);
    setShowUpgrade(true);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 py-6 md:py-8 px-4 md:px-10 space-y-6 md:space-y-8 overflow-y-auto font-sans bg-[#f8fafc]">
      
      {/* 1. Marketplace Hero */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 border-b border-slate-200 pb-10">
        <div className="space-y-2 text-center lg:text-left">
           <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-600/10 w-fit rounded-lg border border-indigo-600/20 mb-3 mx-auto lg:mx-0">
              <Sparkles className="h-3 w-3 text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Membership Hub</span>
           </div>
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Institutional Access</h1>
           <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Premium Yearly Plans & Enterprise Research License</p>
        </div>

        <div className="flex items-center space-x-4 bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm w-full lg:w-auto justify-center">
           <div className="flex flex-col items-center px-4 md:px-6 border-r border-slate-100">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Your Status</span>
              <span className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-tighter flex items-center">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                 {(user as any)?.tier || 'Free'}
              </span>
           </div>
           <div className="flex flex-col items-center px-4 md:px-6">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Validity</span>
              <span className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-tighter italic">
                 {(user as any)?.daysRemaining !== null ? `${(user as any).daysRemaining} Days` : 'Lifetime Free'}
              </span>
           </div>
        </div>
      </div>

      {/* 2. Membership Catalog */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center space-x-2">
               <Calendar className="h-4 w-4 text-blue-600" />
               <span>Yearly Research Licenses</span>
            </h2>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest animate-bounce">Limited Saver Offer 33% Off</span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {items.map((item) => {
              const isUserTierActive = (user as any)?.tier === item.tier || (user as any)?.tier === 'alpha';
              return (
                <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden flex flex-col relative">
                   <div className="p-8 space-y-6 flex-1">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                               <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${item.tier === 'alpha' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'}`}>
                                  {item.type}
                               </span>
                               <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Special Yearly Pricing</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">{item.name}</h3>
                         </div>
                         <div className={`p-3 rounded-2xl ${isUserTierActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                            {isUserTierActive ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                         </div>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                         {item.desc}
                      </p>

                      <div className="space-y-3">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Included Research Modules</span>
                         <div className="grid grid-cols-1 gap-2">
                            {(item.tier === 'alpha' ? [
                               'Velocity Retest Strategy',
                               'Deep Recovery Audit (67%)',
                               'Supply-Demand Core Logic',
                               'Alpha Pulse Notifications',
                               'Full Institutional Gating'
                            ] : [
                               'Structural Pivot Patterns',
                               'Dynamic Reversal Matrix',
                               'Annual Range Matrix',
                               'Quantum Stacking Engine',
                               'Standard Portfolio Audit'
                            ]).map((feature, idx) => (
                               <div key={idx} className="flex items-center space-x-2">
                                  <Check className="h-3 w-3 text-blue-500" />
                                  <span className="text-[11px] font-bold text-slate-600">{feature}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50 text-center">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Model Perf.</span>
                            <span className="text-sm font-black text-slate-900">{item.cagr}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</span>
                            <span className="text-sm font-black text-emerald-600">{item.winRate}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Profile</span>
                            <span className="text-sm font-black text-slate-900">{item.risk}</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-50 p-6 px-8 flex items-center justify-between group-hover:bg-slate-900 transition-all duration-500">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-400 uppercase group-hover:text-slate-500">Annual License</span>
                         <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-black text-slate-900 group-hover:text-white transition-colors">{item.price}</span>
                            <span className="text-[10px] font-bold text-slate-400 line-through group-hover:text-slate-600">₹{item.tier === 'alpha' ? '2388' : '1188'}</span>
                         </div>
                      </div>
                      {isUserTierActive ? (
                         <div className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center space-x-2">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Plan Active</span>
                         </div>
                      ) : (
                         <button 
                           onClick={() => handleUnlock(item.tier)}
                           className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center space-x-2"
                         >
                            <span>Subscribe Now</span>
                            <ChevronRight className="h-3 w-3" />
                         </button>
                      )}
                   </div>
                </div>
              );
            })}
         </div>
      </div>

      {/* 3. Promotional Banner */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
         <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 blur-[100px] -mr-48 -mt-48" />
         <Activity className="absolute right-[-20px] bottom-[-20px] h-64 w-64 opacity-5" />
         <div className="max-w-2xl space-y-6 relative z-10">
            <div className="flex items-center space-x-2 text-blue-500">
               <Store className="h-5 w-5" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">Enterprise Hub</span>
            </div>
            <h3 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">Corporate Research License</h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
               Deploy MarketBeacon locally on your corporate network or request proprietary backtesting for your specific quants. High-precision logic, zero-latency execution.
            </p>
            <button className="px-10 py-5 bg-blue-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center space-x-3">
               <span>Contact Admin Support</span>
               <ArrowUpRight className="h-4 w-4" />
            </button>
         </div>
      </div>

      <footer className="py-8 border-t border-slate-200 opacity-40 flex items-center justify-between shrink-0">
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MarketBeacon Terminal v4.8 • Institutional Membership Hub</p>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Alpha Node Encryption: AES-256-LICENSE</p>
      </footer>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        requiredTier={selectedTier}
        userEmail={user?.email}
      />
    </div>
  );
};

export default MarketplacePage;
