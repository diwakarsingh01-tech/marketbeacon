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
import { Confetti } from '../components/ui/Confetti';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import { waLink } from '../lib/constants';
import { OrganizationSchema, BreadcrumbSchema } from '../components/StructuredData';

const API_URL = getApiUrl();

const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeemning] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'alpha'>('pro');
  const [showConfetti, setShowConfetti] = useState(false);

  React.useEffect(() => {
    const linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    linkCanonical.href = 'https://marketbeaconpro.com/pricing';
    document.head.appendChild(linkCanonical);
    return () => {
      document.head.removeChild(linkCanonical);
    };
  }, []);

  const handleRedeemVoucher = async () => {
    if (!voucherCode) return;
    setRedeemning(true);
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: voucherCode })
      });
      
      const data = await safeJsonParse(res);
      if (res.status === 401 || res.status === 403 || data?.error === 'Invalid token.' || data?.error === 'Access denied.') {
        localStorage.removeItem('mb_token');
        localStorage.removeItem('mb_user');
        window.location.href = '/login';
        return;
      }
      if (res.ok && !data.error) {
        setShowConfetti(true);
        setTimeout(() => {
          window.location.href = '/screener'; 
        }, 3000);
      } else {
        toast(data.error || "Voucher code not recognized");
      }
    } catch (e) {
      toast("Network timeout. Check your connection.");
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
    setSelectedTier(tierName.toLowerCase() as 'pro' | 'alpha');
    setShowUpgrade(true);
  };

  return (
    <main className="p-4 md:p-10 lg:p-16 max-w-7xl mx-auto space-y-8 md:space-y-12 pb-32 md:pb-16 font-sans min-h-screen overflow-y-auto">
      <SEO title="Pricing & License Desk" description="MarketBeacon Pro pricing plans — Free, Pro and Alpha tiers. Institutional stock research tools for every trader." />
      <OrganizationSchema />
      <BreadcrumbSchema items={[{ label: 'Home', href: '/' }, { label: 'Pricing', href: '/pricing' }]} />
      {showConfetti && <Confetti />}
      
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Access Tiers</h1>
          <p className="text-slate-500 font-bold uppercase tracking-wider text-xs md:text-xs">Select your institutional environment</p>
        </div>

        {/* 7-Day Trial Callout Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl max-w-3xl mx-auto relative overflow-hidden text-left">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 blur-[60px] -mr-32 -mt-32 pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center text-lg font-bold shrink-0 border border-white/20 shadow-md animate-pulse">
                7
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-white">Free 7-Day Trial — Try All Features</h4>
                <p className="text-xs md:text-xs font-bold text-blue-100 uppercase tracking-wider mt-1 leading-snug">
                  Redeem code <span className="underline font-bold text-white">ALPHA7</span> to unlock the complete Alpha Terminal & Strategy Matrix instantly.
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setVoucherCode('ALPHA7'); }}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 text-center"
            >
              Apply ALPHA7
            </button>
          </div>
        </div>


        {/* Pricing Toggle */}
        <div className="flex items-center justify-center space-x-4">
           <span className={`text-xs font-bold uppercase tracking-wider ${billingPeriod === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
           <button 
             onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
             className="w-14 h-7 bg-slate-100 rounded-full relative p-1 transition-all border border-slate-200"
           >
              <div className={`h-5 w-5 bg-blue-600 rounded-full transition-all shadow-md ${billingPeriod === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
           </button>
           <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${billingPeriod === 'yearly' ? 'text-blue-600' : 'text-slate-500'}`}>Yearly</span>
              <span className="bg-emerald-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">Save ~33%</span>
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
                <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs md:text-xs font-bold px-3 md:px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-lg shadow-blue-500/20">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-4 md:mb-6">
                <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${tier.featured ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                  <Icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 uppercase tracking-tight">{tier.name}</h3>
              </div>

              <div className="mb-4 md:mb-6">
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl md:text-4xl font-black text-slate-900">{currentPrice}</span>
                  <span className="text-slate-500 font-bold text-sm">/{tier.period}</span>
                </div>
                <p className="text-xs md:text-xs font-bold text-slate-500 mt-1 md:mt-2 leading-relaxed uppercase">{tier.desc}</p>
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
                        className="w-full bg-transparent pl-8 md:pl-10 pr-2 py-2 text-xs font-bold uppercase placeholder:text-slate-300 outline-none"
                      />
                    </div>
<button 
                    onClick={handleRedeemVoucher}
                    disabled={redeeming}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    {redeeming ? '...' : 'Apply'}
                  </button>
                  </div>
                )}
                
                <button 
                  onClick={() => handleCheckout(tier.name)}
                  className={`w-full py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-bold text-xs md:text-[12px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xl ${tier.color}`}
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
        <p className="text-xs md:text-xs text-center text-slate-500 font-bold uppercase tracking-wider">* Yearly plans are billed annually. Savings calculated against monthly rate.</p>
      )}

      {/* Corporate Promotional Banner */}
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800 w-full">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 blur-[100px] -mr-48 -mt-48" />
        <div className="max-w-2xl space-y-3 md:space-y-6 relative z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 text-blue-500">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.4em]">Enterprise Hub</span>
            </div>
            <h3 className="text-xl md:text-4xl font-bold tracking-tighter uppercase italic leading-tight text-white">Corporate Research</h3>
            <p className="text-xs md:text-lg text-slate-500 font-medium leading-relaxed">
              Zero-latency institutional nodes. Request a custom deployment for your fund.
            </p>
            <button 
              onClick={() => window.open(waLink('Hi Admin, I am interested in a Corporate Deployment for my fund.'), '_blank')}
              className="px-6 md:px-10 py-3 md:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl md:rounded-3xl text-xs font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center space-x-2 mx-auto md:mx-0 shadow-lg shadow-blue-500/20"
            >
              <span>Contact Admin Support</span>
              <ChevronRight className="h-4 w-4" />
            </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
        <div className="z-10 space-y-1 md:space-y-2 text-center md:text-left">
          <h2 className="text-lg md:text-2xl font-black tracking-tight uppercase italic leading-none">Secure Institutional Billing</h2>
          <p className="text-slate-400 font-bold text-[11px] md:text-xs uppercase tracking-[0.2em]">PCI Compliant • Bank Grade Encryption</p>
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
    </main>
  );
};

export default PricingPage;
