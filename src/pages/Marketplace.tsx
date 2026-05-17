import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Activity,
  Sparkles,
  ArrowUpRight,
  Check,
  Calendar,
  Clock,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const MembershipPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'alpha'>('pro');

  useEffect(() => {
    const fetchMembership = async () => {
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
    fetchMembership();
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
    <div className="flex-1 flex flex-col min-h-0 py-6 md:py-8 px-4 md:px-10 space-y-6 md:space-y-8 overflow-y-auto font-sans bg-[#f8fafc] no-scrollbar">
      
      {/* 1. Membership Hero with Marketing Gimmicks */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 border-b border-slate-200 pb-10">
        <div className="space-y-2 text-center lg:text-left">
           <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-600/10 w-fit rounded-lg border border-indigo-600/20 mb-3 mx-auto lg:mx-0">
              <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Institutional Membership Hub</span>
           </div>
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Upgrade Your Edge</h1>
           <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Join the top 1% of quantitative researchers. Limited licenses available.</p>
        </div>

        <div className="flex items-center space-x-4 bg-white p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm w-full lg:w-auto justify-center">
           <div className="flex flex-col items-center px-4 md:px-6 border-r border-slate-100">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center italic text-blue-600">Institutional Demand</span>
              <span className="text-[10px] md:text-xs font-black text-rose-500 uppercase tracking-tighter flex items-center">
                 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mr-2 animate-ping" />
                 High (94%)
              </span>
           </div>
           <div className="flex flex-col items-center px-4 md:px-6">
              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Your Status</span>
              <span className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-tighter italic">
                 {(user as any)?.tier || 'Free Restricted'}
              </span>
           </div>
        </div>
      </div>

      {/* 2. Membership Catalog */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center space-x-2">
               <Calendar className="h-4 w-4 text-blue-600" />
               <span>Annual Quant Research Licenses</span>
            </h2>
            <div className="flex items-center space-x-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full shadow-sm">
               <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Early Bird: 33% Lifetime Savings</span>
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {items.map((item) => {
              const isUserTierActive = (user as any)?.tier === item.tier || (user as any)?.tier === 'alpha';
              const isAlpha = item.tier === 'alpha';
              return (
                <div key={item.id} className={`bg-white rounded-[2.5rem] border-2 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col relative ${isAlpha ? 'border-slate-900 scale-[1.02] shadow-indigo-100' : 'border-slate-100'}`}>
                   {isAlpha && (
                      <div className="absolute top-0 right-10 transform -translate-y-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest z-10 border-4 border-white shadow-xl">
                         Institutional Choice
                      </div>
                   )}
                   
                   <div className="p-8 md:p-10 space-y-8 flex-1">
                      <div className="flex items-start justify-between">
                         <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                               <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${isAlpha ? 'bg-slate-900 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg'}`}>
                                  {item.tier} Access
                               </span>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mt-4">{item.name}</h3>
                         </div>
                         <div className={`p-4 rounded-2xl shadow-inner ${isUserTierActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                            {isUserTierActive ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                         </div>
                      </div>

                      <p className="text-sm text-slate-500 leading-relaxed font-bold italic border-l-4 border-slate-100 pl-4">
                         "{item.desc}"
                      </p>

                      <div className="space-y-4">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Advanced Logic Included</span>
                         <div className="grid grid-cols-1 gap-3">
                            {(isAlpha ? [
                               'Velocity Retest Strategy (Deep Demand)',
                               '67% Deep Recovery Audit (Value Cycle)',
                               'Supply-Demand Core Resistance Logic',
                               'Alpha Pulse Real-Time Notifications',
                               'Priority Institutional Data Streams'
                            ] : [
                               'Structural Pivot Patterns (Breakouts)',
                               'Dynamic Reversal Matrix (Trend Change)',
                               'Annual Range Statistical Matrix',
                               'Quantum Stacking Moving Averages',
                               'Standard Portfolio Allocation Audit'
                            ]).map((feature, idx) => (
                               <div key={idx} className="flex items-center space-x-3 group/item">
                                  <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-colors ${isUserTierActive ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white'}`}>
                                     <Check className="h-3 w-3" />
                                  </div>
                                  <span className="text-xs font-black text-slate-700 tracking-tight">{feature}</span>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-6 px-4 bg-slate-50 rounded-3xl text-center shadow-inner">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Algorithmic CAGR</span>
                            <span className="text-sm font-black text-slate-900">{item.cagr}</span>
                         </div>
                         <div className="flex flex-col border-x border-slate-200">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</span>
                            <span className="text-sm font-black text-emerald-600">{item.winRate}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk Profile</span>
                            <span className="text-sm font-black text-slate-900">{item.risk}</span>
                         </div>
                      </div>
                   </div>

                   <div className={`p-8 flex flex-col space-y-4 transition-all duration-500 ${isUserTierActive ? 'bg-emerald-600' : 'bg-slate-50 group-hover:bg-slate-900'}`}>
                      <div className="flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className={`text-[8px] font-black uppercase ${isUserTierActive ? 'text-emerald-100' : 'text-slate-400 group-hover:text-slate-500'}`}>Full 12-Month Research License</span>
                            <div className="flex items-baseline space-x-2">
                               <span className={`text-3xl font-black transition-colors ${isUserTierActive ? 'text-white' : 'text-slate-900 group-hover:text-white'}`}>{item.price}</span>
                               <span className={`text-xs font-bold line-through ${isUserTierActive ? 'text-emerald-300' : 'text-slate-400 group-hover:text-slate-600'}`}>₹{isAlpha ? '2388' : '1188'}</span>
                            </div>
                         </div>
                         
                         {isUserTierActive ? (
                            <div className="flex flex-col items-end">
                               <div className="px-5 py-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 border border-white/20 shadow-xl">
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>Active Access</span>
                               </div>
                               <span className="text-[8px] font-bold text-white/60 mt-1 uppercase">Valid for {(user as any).daysRemaining || 365} Days</span>
                            </div>
                         ) : (
                            <button 
                              onClick={() => handleUnlock(item.tier)}
                              className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center space-x-3 ${isAlpha ? 'bg-white text-slate-900 shadow-indigo-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                            >
                               <span>Deploy Now</span>
                               <ChevronRight className="h-4 w-4" />
                            </button>
                         )}
                      </div>
                      {!isUserTierActive && (
                         <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Clock className="h-3 w-3 text-slate-500" />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Price increases in 4h 12m</span>
                         </div>
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
               <Shield className="h-5 w-5" />
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

export default MembershipPage;
