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
  Shield,
  Gift
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
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeemning] = useState(false);

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

  const handleRedeemVoucher = async () => {
    if (!voucherCode) return;
    setRedeemning(true);
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: voucherCode })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Voucher Applied! Access Level: ${data.tier.toUpperCase()} for 7 Days.`);
        window.location.reload(); 
      } else {
        const err = await res.json();
        alert(err.error || "Voucher code not recognized");
      }
    } catch (e) {
      alert("Network timeout.");
    } finally {
      setRedeemning(false);
    }
  };

  const handleUnlock = (tier: 'pro' | 'alpha') => {
    setSelectedTier(tier);
    setShowUpgrade(true);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-screen bg-[#f8fafc]">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-[#f8fafc] font-sans min-h-screen pb-32 md:pb-20 overflow-y-auto">
      <div className="px-4 md:px-10 py-6 md:py-10 space-y-8 md:space-y-12">
        
        {/* 1. Header with Toggle */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 border-b border-slate-200 pb-8">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 px-2.5 py-1 bg-indigo-600/10 w-fit rounded-lg border border-indigo-600/20 mb-2 mx-auto">
                <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none">Institutional Membership Hub</span>
            </div>
            <h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Access Licenses</h1>
            <p className="text-[9px] md:text-sm font-bold text-slate-400 uppercase tracking-widest">Select your algorithmic environment</p>
          </div>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-[10px] font-black uppercase tracking-widest ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
            <button 
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 bg-white rounded-full relative p-1 transition-all border border-slate-200 shadow-inner"
            >
                <div className={`h-4 w-4 bg-blue-600 rounded-full transition-all shadow-md ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${billingPeriod === 'yearly' ? 'text-blue-600' : 'text-slate-400'}`}>Yearly</span>
                <span className="bg-emerald-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Save ~33%</span>
            </div>
          </div>
        </div>

        {/* 2. Membership Catalog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 max-w-6xl mx-auto w-full">
          {items.map((item) => {
            const isUserTierActive = (user as any)?.tier === item.tier || (user as any)?.tier === 'alpha';
            const isAlpha = item.tier === 'alpha';
            
            // Fixed Price Logic
            let displayPrice = item.tier === 'pro' ? '₹99' : '₹199';
            if (billingPeriod === 'yearly') {
               displayPrice = item.tier === 'pro' ? '₹799' : '₹1,599';
            }
            
            return (
              <div key={item.id} className={`bg-white rounded-[2rem] border-2 shadow-sm transition-all duration-500 flex flex-col relative h-auto ${isAlpha ? 'border-slate-900 shadow-xl' : 'border-slate-100'}`}>
                  {isAlpha && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest z-20 border-2 border-white shadow-xl whitespace-nowrap">
                        Institutional Choice
                    </div>
                  )}
                  
                  <div className="p-5 md:p-10 space-y-6 flex-grow">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${isAlpha ? 'bg-slate-900 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg'}`}>
                              {item.tier} Setup
                          </span>
                          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic mt-2 leading-none">{item.name}</h3>
                        </div>
                        <div className={`p-3 md:p-4 rounded-xl shadow-inner ${isUserTierActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                          {isUserTierActive ? <Unlock className="h-5 w-5 md:h-6 md:w-6" /> : <Lock className="h-5 w-5 md:h-6 md:w-6" />}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2.5">
                          {(isAlpha ? [
                              'Velocity Retest (Deep Demand)',
                              '67% Deep Recovery Audit',
                              'Supply-Demand Resistance Logic',
                              'Real-Time Alpha Notifications',
                              'Priority Institutional Nodes'
                          ] : [
                              'Structural Pivot (Breakouts)',
                              'Dynamic Reversal Matrix',
                              'Annual Range Statistics',
                              'Quantum Stacking Averages',
                              'Standard Portfolio Mix Audit'
                          ]).map((feature, idx) => (
                              <div key={idx} className="flex items-center space-x-3">
                                <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${isUserTierActive ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <Check className="h-2.5 w-2.5" />
                                </div>
                                <span className="text-[10px] md:text-xs font-black text-slate-700 tracking-tight leading-none">{feature}</span>
                              </div>
                          ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 md:gap-2 py-4 md:py-6 px-3 md:px-4 bg-slate-50 rounded-2xl text-center shadow-inner mt-4">
                        <div className="flex flex-col">
                          <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">CAGR</span>
                          <span className="text-[10px] md:text-sm font-black text-slate-900">{item.cagr}</span>
                        </div>
                        <div className="flex flex-col border-x border-slate-200">
                          <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Win Rate</span>
                          <span className="text-[10px] md:text-sm font-black text-emerald-600">{item.winRate}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Risk</span>
                          <span className="text-[10px] md:text-sm font-black text-slate-900">{item.risk}</span>
                        </div>
                    </div>
                  </div>

                  <div className={`p-5 md:p-8 flex flex-col space-y-4 rounded-b-[2rem] border-t border-slate-100 transition-all duration-500 ${isUserTierActive ? 'bg-emerald-600 border-emerald-500' : 'bg-white group-hover:bg-slate-50'}`}>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className={`text-[7px] font-black uppercase truncate ${isUserTierActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                             {billingPeriod === 'monthly' ? 'Monthly Access' : 'Yearly Access'}
                          </span>
                          <div className="flex items-baseline space-x-1">
                              <span className={`text-xl md:text-3xl font-black ${isUserTierActive ? 'text-white' : 'text-slate-900'}`}>{displayPrice}</span>
                              <span className={`text-[9px] font-bold ${isUserTierActive ? 'text-emerald-200' : 'text-slate-400'}`}>/{billingPeriod === 'monthly' ? 'mo' : 'yr'}*</span>
                          </div>
                        </div>
                        
                        {isUserTierActive ? (
                          <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center space-x-1.5 border border-white/20 shadow-lg">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Active</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleUnlock(item.tier)}
                            className={`px-6 md:px-8 py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center space-x-2 shrink-0 ${isAlpha ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                          >
                              <span>Deploy</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                    </div>
                    
                    {!isUserTierActive && item.tier !== 'free' && (
                      <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-xl border border-slate-200 focus-within:border-blue-600 transition-all">
                          <Gift className="h-3 w-3 text-slate-400 ml-1.5" />
                          <input 
                            type="text" 
                            placeholder="Voucher"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            className="flex-1 bg-transparent text-[9px] font-black uppercase outline-none px-1.5"
                          />
                          <button onClick={handleRedeemVoucher} disabled={redeeming} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50">
                            {redeeming ? '...' : 'Apply'}
                          </button>
                      </div>
                    )}
                  </div>
              </div>
            );
          })}
        </div>

        {/* 3. Promotional Banner */}
        <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800 max-w-6xl mx-auto w-full">
          <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 blur-[100px] -mr-48 -mt-48" />
          <Activity className="absolute right-[-20px] bottom-[-20px] h-32 w-32 md:h-64 md:w-64 opacity-5" />
          <div className="max-w-2xl space-y-3 md:space-y-6 relative z-10">
              <div className="flex items-center space-x-2 text-blue-500">
                <Shield className="h-4 w-4 md:h-5 md:w-5" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">Enterprise Hub</span>
              </div>
              <h3 className="text-xl md:text-4xl font-black tracking-tighter uppercase italic leading-tight text-white">Corporate Research</h3>
              <p className="text-[10px] md:text-lg text-slate-400 font-medium leading-relaxed">
                Zero-latency institutional nodes. Request a custom deployment for your fund.
              </p>
              <button className="px-6 md:px-10 py-3 md:py-5 bg-blue-600 text-white rounded-xl md:rounded-3xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center space-x-2">
                <span>Contact Admin Support</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
          </div>
        </div>

        <footer className="py-8 border-t border-slate-200 opacity-40 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center">MarketBeacon Terminal v3.5 • Institutional Hub</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Alpha Node Encryption: AES-256-LICENSE</p>
        </footer>
      </div>

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
