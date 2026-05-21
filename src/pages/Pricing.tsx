import React, { useState } from 'react';
import { 
  Check, 
  Zap, 
  ShieldCheck, 
  Crown, 
  CreditCard,
  ChevronRight,
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';

const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeemning] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'alpha'>('pro');

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
        window.location.href = '/screener'; 
      } else {
        const err = await res.json();
        alert(err.error || "Voucher code not recognized");
      }
    } catch (e) {
      alert("Network timeout. Check your connection.");
    } finally {
      setRedeemning(false);
    }
  };

  const tiers = [
    {
      name: 'Free',
      price: { monthly: '₹0', yearly: '₹0' },
      period: 'forever',
      desc: 'Institutional baseline for all students.',
      features: [
        'Real-time Watchlist',
        'Basic Fundamentals',
        '3 Active Trades Journal',
        'Community Access'
      ],
      button: 'Continue Free',
      color: 'bg-slate-100 text-slate-900',
      icon: Zap
    },
    {
      name: 'Pro',
      price: { monthly: '₹99', yearly: '₹799' },
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      desc: 'The complete Batch 9 auditing suite.',
      features: [
        'Everything in Free',
        '12-Strategy Matrix Access',
        'Unified Portfolio Mix',
        'Unlimited Ledger Records',
        'ABCD Ladder Tool'
      ],
      button: billingPeriod === 'monthly' ? 'Upgrade to Pro' : 'Billed Yearly',
      color: 'bg-blue-600 text-white shadow-xl shadow-blue-200',
      icon: ShieldCheck,
      featured: true
    },
    {
      name: 'Alpha',
      price: { monthly: '₹199', yearly: '₹1599' },
      period: billingPeriod === 'monthly' ? 'per month' : 'per year',
      desc: 'Deep historical data & priority nodes.',
      features: [
        'Everything in Pro',
        'Custom Universe Baskets',
        'Priority Technical Support',
        'Alpha Strategy Overrides',
        'Multi-Device Sync'
      ],
      button: 'Get Alpha Access',
      color: 'bg-slate-900 text-white',
      icon: Crown
    }
  ];

  const handleCheckout = (tierName: string) => {
    if (tierName === 'Free') {
       window.location.href = '/screener';
       return;
    }
    setSelectedTier(tierName.toLowerCase() as any);
    setShowUpgrade(true);
  };

  return (
    <div className="p-4 md:p-10 lg:p-16 max-w-7xl mx-auto space-y-8 md:space-y-12 pb-32 md:pb-16 font-sans min-h-screen overflow-y-auto">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Access Tiers</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-xs">Select your institutional environment</p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex items-center justify-center space-x-4">
           <span className={`text-[10px] font-black uppercase tracking-widest ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
           <button 
             onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
             className="w-14 h-7 bg-slate-100 rounded-full relative p-1 transition-all border border-slate-200"
           >
              <div className={`h-5 w-5 bg-blue-600 rounded-full transition-all shadow-md ${billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
           </button>
           <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${billingPeriod === 'yearly' ? 'text-blue-600' : 'text-slate-400'}`}>Yearly</span>
              <span className="bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">Save ~33%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const currentPrice = billingPeriod === 'monthly' ? tier.price.monthly : tier.price.yearly;
          return (
            <div key={tier.name} className={`relative rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 flex flex-col transition-all md:hover:scale-[1.02] ${tier.featured ? 'bg-white border-2 border-blue-600 shadow-2xl z-10' : 'bg-white border border-slate-100'}`}>
              {tier.featured && (
                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] md:text-[10px] font-black px-3 md:px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${tier.featured ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">{tier.name}</h3>
              </div>

              <div className="mb-4 md:mb-6">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl md:text-4xl font-black text-slate-900">{currentPrice}</span>
                  <span className="text-slate-400 font-bold text-xs md:text-sm">/{tier.period}</span>
                </div>
                <p className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-1 md:mt-2 leading-relaxed uppercase">{tier.desc}</p>
              </div>

              <div className="space-y-3 md:space-y-4 mb-6 md:mb-10">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-50 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 md:h-3 md:w-3 text-emerald-600" />
                    </div>
                    <span className="text-[11px] md:text-[12px] font-bold text-slate-600 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mt-auto">
                {tier.name !== 'Free' && (
                  <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 group focus-within:border-blue-600 transition-all">
                    <div className="relative flex-1">
                      <Gift className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Voucher"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="w-full bg-transparent pl-8 md:pl-10 pr-2 py-2 text-[10px] md:text-[11px] font-black uppercase placeholder:text-slate-300 outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleRedeemVoucher}
                      disabled={redeeming}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                      {redeeming ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={() => handleCheckout(tier.name)}
                  className={`w-full py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-[12px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xl ${tier.color}`}
                >
                  <span>{tier.button}</span>
                  <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {billingPeriod === 'yearly' && (
        <p className="text-[8px] md:text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">* Yearly plans are billed annually. Savings calculated against monthly rate.</p>
      )}

      <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
        <div className="z-10 space-y-1 md:space-y-2 text-center md:text-left">
          <h2 className="text-lg md:text-2xl font-black tracking-tight uppercase italic leading-none">Secure Institutional Billing</h2>
          <p className="text-slate-400 font-bold text-[7px] md:text-xs uppercase tracking-[0.2em]">PCI Compliant • Bank Grade Encryption</p>
        </div>
        <div className="z-10 flex items-center space-x-3 md:space-x-6 grayscale opacity-50">
           <CreditCard className="h-6 w-6 md:h-8 md:w-8" />
           <div className="h-5 md:h-8 w-16 md:w-24 bg-white/10 rounded-lg" />
           <div className="h-5 md:h-8 w-16 md:w-24 bg-white/10 rounded-lg" />
        </div>
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

export default PricingPage;
