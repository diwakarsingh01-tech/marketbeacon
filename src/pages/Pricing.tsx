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

const PricingPage: React.FC = () => {
  const [referralCode, setReferralCode] = useState('');

  const tiers = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      desc: 'Basic portfolio tracking for retail investors.',
      features: [
        'Real-time Watchlist',
        'Basic Fundamentals',
        '3 Active Trades Journal',
        'Community Support'
      ],
      button: 'Start for Free',
      color: 'bg-slate-100 text-slate-900',
      icon: Zap
    },
    {
      name: 'Pro',
      price: '₹999',
      period: 'per month',
      desc: 'Professional grade screening & strategy tools.',
      features: [
        'Everything in Free',
        'Institutional Screener Access',
        'Full Backtest Engine',
        'Unlimited Trade Journal',
        'ABCD Ladder Calculator'
      ],
      button: 'Upgrade to Pro',
      color: 'bg-blue-600 text-white shadow-xl shadow-blue-200',
      icon: ShieldCheck,
      featured: true
    },
    {
      name: 'Institutional',
      price: '₹4,999',
      period: 'per month',
      desc: 'Custom alphabets & deep historical audits.',
      features: [
        'Everything in Pro',
        'Custom Universe Baskets',
        'Advanced Sector Overrides',
        'Priority API Support',
        'Dual Deployment Assistance'
      ],
      button: 'Get Institutional',
      color: 'bg-slate-900 text-white',
      icon: Crown
    }
  ];

  const handleCheckout = (tierName: string) => {
    console.log(`Checking out for ${tierName} with referral ${referralCode}`);
    // Here we would integrate Stripe/Razorpay
    alert(`Checkout initiated for ${tierName} Tier. Integration with Payment Gateway pending configuration.`);
  };

  return (
    <div className="p-6 md:p-16 max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight uppercase italic">Choose Your Access</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Batch 9 Compliant Institutional Trading Terminals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <div key={tier.name} className={`relative rounded-[3rem] p-8 flex flex-col transition-all hover:scale-[1.02] ${tier.featured ? 'bg-white border-2 border-blue-600 shadow-2xl' : 'bg-white border border-slate-100'}`}>
              {tier.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-6">
                <div className={`p-3 rounded-2xl ${tier.featured ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">{tier.name}</h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-slate-900">{tier.price}</span>
                  <span className="text-slate-400 font-bold text-sm">/{tier.period}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed uppercase">{tier.desc}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-[12px] font-bold text-slate-600">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {tier.name !== 'Free' && (
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Referral Code"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-3 text-[11px] font-bold placeholder:text-slate-300 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                )}
                
                <button 
                  onClick={() => handleCheckout(tier.name)}
                  className={`w-full py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all ${tier.color}`}
                >
                  <span>{tier.button}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
        <div className="z-10 space-y-2">
          <h2 className="text-2xl font-black tracking-tight uppercase italic">Secure Institutional Billing</h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">PCI Compliant • Bank Grade Encryption • Instant Activation</p>
        </div>
        <div className="z-10 flex items-center space-x-6 grayscale opacity-50">
           <CreditCard className="h-8 w-8" />
           <div className="h-8 w-24 bg-white/10 rounded-lg" />
           <div className="h-8 w-24 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
