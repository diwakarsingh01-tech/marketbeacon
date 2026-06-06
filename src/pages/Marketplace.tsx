import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ShieldCheck, Lock, Unlock, ChevronRight, Activity,
  Check, Shield, Gift, ArrowUpRight, Star, TrendingUp,
  Users, Clock, Flame, Target, BarChart2, BookOpen,
  PieChart, AlertCircle, Sparkles, Crown, Bolt, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

// ── Micro-components ──────────────────────────────────────────────────────────

const Badge = ({ children, color = 'blue' }: any) => {
  const colors: any = {
    blue: 'bg-blue-600/10 text-blue-600 border-blue-600/20',
    amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    emerald: 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20',
    rose: 'bg-rose-600/10 text-rose-600 border-rose-600/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${colors[color]}`}>
      {children}
    </span>
  );
};

const TrustStat = ({ value, label, icon: Icon }: any) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.03 }}
    className="flex items-center gap-3 border border-white/10 backdrop-blur-sm rounded-2xl px-4 py-3"
    style={{ background: 'rgba(255,255,255,0.06)' }}
  >
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-blue-400/20" style={{ background: 'rgba(59,130,246,0.15)' }}>
      <Icon className="h-4 w-4 text-blue-400" />
    </div>
    <div className="text-left">
      <div className="text-lg font-black text-white tracking-tighter leading-none">{value}</div>
      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-tight">{label}</div>
    </div>
  </motion.div>
);

const FeatureRow = ({ feature, included }: { feature: string; included: boolean }) => (
  <div className={`flex items-center space-x-3 py-2.5 border-b border-slate-50 ${included ? '' : 'opacity-40'}`}>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${included ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
      {included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
    </div>
    <span className="text-[10px] font-bold text-slate-700 tracking-tight leading-snug">{feature}</span>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const MembershipPage: React.FC = () => {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'alpha'>('alpha');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [voucherStatus, setVoucherStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [voucherMsg, setVoucherMsg] = useState('');

  const userTier = (user as any)?.tier || 'free';
  const isActive = (tier: string) => {
    if (userTier === 'alpha') return true;
    if (userTier === 'pro' && tier !== 'alpha') return true;
    return userTier === tier;
  };

  const prices = {
    pro:   { monthly: 99,   yearly: 799  },
    alpha: { monthly: 199,  yearly: 1599 },
  };

  const allFeatures = [
    // label, free, pro, alpha
    ['Live Screener (Qualified / Neutral / Rejected)', true,  true,  true ],
    ['Wealth Desk — Portfolio Tracker',                true,  true,  true ],
    ['Trade Journal & Ledger',                         true,  true,  true ],
    ['Bollinger Band Strategy',                        true,  true,  true ],
    ['Envelope Long / Short Strategy',                 true,  true,  true ],
    ['ABCD Ladder Pattern',                            false, true,  true ],
    ['Structural Pivot Breakouts',                     false, true,  true ],
    ['Dynamic Reversal Matrix',                        false, true,  true ],
    ['52-Week High-Low Scanner',                       false, true,  true ],
    ['SMA + BCD Strategy',                             false, true,  true ],
    ['RHS + ABCD Pattern',                             false, true,  true ],
    ['Cup with Handle + ABCD',                         false, true,  true ],
    ['Velocity Retest — Deep Demand (20%)',            false, false, true ],
    ['67% Deep Recovery Audit',                        false, false, true ],
    ['Support & Resistance Core Logic',                false, false, true ],
    ['Priority Alpha Signals',                         false, false, true ],
    ['Institutional Reset Strategy',                   false, false, true ],
    ['Alpha Hub — All Baskets Unlocked',               false, false, true ],
  ];

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    setVoucherStatus('idle');
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() })
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setVoucherStatus('success');
        setVoucherMsg(`✅ ${data.tier?.toUpperCase()} access activated for 7 days!`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setVoucherStatus('error');
        setVoucherMsg(data.error || 'Invalid voucher code.');
      }
    } catch {
      setVoucherStatus('error');
      setVoucherMsg('Network error. Try again.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleUpgrade = (tier: 'pro' | 'alpha') => {
    setSelectedTier(tier);
    setShowUpgrade(true);
  };

  const priceMonthly = (tier: 'pro' | 'alpha') =>
    billing === 'yearly'
      ? Math.round(prices[tier].yearly / 12)
      : prices[tier].monthly;

  return (
    <div className="bg-[#f8fafc] font-sans min-h-screen overflow-y-auto pb-24">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-slate-950 px-4 md:px-12 pt-8 pb-8 text-white">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-blue-600/15 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-indigo-600/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Top row: badge + headline */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full mb-3">
              <Flame className="h-3 w-3 text-blue-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-300">Access Licenses — MarketBeacon Pro</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none text-white">
              Unlock Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Trading Edge
              </span>
            </h1>
            <p className="mt-2 text-slate-400 text-xs md:text-sm font-medium max-w-lg mx-auto leading-relaxed">
              India's institutional-grade research terminal. Stop guessing. Start with data-backed conviction.
            </p>
          </motion.div>

          {/* Trust Stats — horizontal row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <TrustStat value="336+" label="Tracked Symbols" icon={BarChart2} />
            <TrustStat value="10+" label="Proven Strategies" icon={Target} />
            <TrustStat value="42%" label="Alpha CAGR" icon={TrendingUp} />
            <TrustStat value="15 min" label="Access Activation" icon={Clock} />
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-12 py-12">

        {/* ── CURRENT TIER BANNER ── */}
        {userTier !== 'free' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-600/20"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">Active License</p>
                <p className="text-[9px] text-emerald-200 uppercase tracking-widest font-bold mt-0.5">
                  {userTier.toUpperCase()} Tier — All features unlocked for your plan
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/20">
              Active ✓
            </div>
          </motion.div>
        )}

        {/* ── BILLING TOGGLE ── */}
        <div className="flex flex-col items-center space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing Period</p>
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1">
            {(['monthly', 'yearly'] as const).map(period => (
              <button
                key={period}
                onClick={() => setBilling(period)}
                className={`relative px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  billing === period
                    ? 'bg-slate-900 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {period}
                {period === 'yearly' && (
                  <span className="absolute -top-2.5 -right-1 bg-emerald-500 text-white text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase">
                    -33%
                  </span>
                )}
              </button>
            ))}
          </div>
          {billing === 'yearly' && (
            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest animate-in fade-in">
              🎉 You save ₹{((prices.pro.monthly * 12) - prices.pro.yearly)} on Pro &amp; ₹{((prices.alpha.monthly * 12) - prices.alpha.yearly)} on Alpha
            </p>
          )}
        </div>

        {/* ── PRICING CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* FREE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white border border-slate-100 rounded-3xl p-7 flex flex-col shadow-sm"
          >
            <div className="space-y-1 mb-6">
              <Badge color="blue">Free</Badge>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">Institutional<br/>Free</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Start exploring without commitment</p>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">₹0</span>
              <span className="text-slate-400 text-xs font-bold">/ forever</span>
            </div>
            <div className="flex-1 space-y-0 mb-6">
              {allFeatures.slice(0, 6).map(([label, free]) => (
                <FeatureRow key={label as string} feature={label as string} included={!!free} />
              ))}
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest pt-2 pl-1 italic">+ {allFeatures.length - 6} more features locked</p>
            </div>
            <div className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border-2 ${
              userTier === 'free'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 text-slate-400 cursor-default'
            }`}>
              {userTier === 'free' ? '✓ Your Current Plan' : 'Downgrade Not Available'}
            </div>
          </motion.div>

          {/* PRO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`bg-white border-2 rounded-3xl p-7 flex flex-col shadow-sm transition-all ${
              isActive('pro') && userTier !== 'alpha' ? 'border-blue-600 shadow-blue-100 shadow-xl' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="space-y-1 mb-6">
              <div className="flex items-center justify-between">
                <Badge color="blue"><Zap className="h-2.5 w-2.5" /> Pro</Badge>
                {isActive('pro') && userTier === 'pro' && (
                  <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">Pro<br/>Execution</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Structural patterns &amp; all strategies</p>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">₹{priceMonthly('pro')}</span>
              <span className="text-slate-400 text-xs font-bold">/mo</span>
            </div>
            {billing === 'yearly' && (
              <p className="text-[9px] text-slate-400 font-bold mb-5">Billed ₹{prices.pro.yearly}/yr</p>
            )}
            <div className="flex-1 space-y-0 mb-6 mt-4">
              {allFeatures.slice(0, 12).map(([label, , pro]) => (
                <FeatureRow key={label as string} feature={label as string} included={!!pro} />
              ))}
            </div>
            {isActive('pro') && userTier !== 'alpha' ? (
              <div className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
                ✓ Active License
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade('pro')}
                className="w-full py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
              >
                Unlock Pro <ChevronRight className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </motion.div>

          {/* ALPHA — HERO CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="relative bg-slate-950 border-2 border-slate-800 rounded-3xl p-7 flex flex-col shadow-2xl shadow-slate-900/30 overflow-hidden"
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 blur-[80px] -mr-24 -mt-24 pointer-events-none" />
            {/* Most Popular badge */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-1.5 rounded-b-2xl text-[8px] font-black uppercase tracking-widest shadow-xl whitespace-nowrap">
              ⭐ Institutional Choice
            </div>

            <div className="space-y-1 mb-6 mt-3 relative z-10">
              <div className="flex items-center justify-between">
                <Badge color="amber"><Crown className="h-2.5 w-2.5" /> Alpha</Badge>
                {isActive('alpha') && (
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Active</span>
                )}
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic mt-2">Alpha<br/>Priority</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Full institutional terminal access</p>
            </div>

            <div className="flex items-baseline gap-1 mb-1 relative z-10">
              <span className="text-5xl font-black text-white tracking-tighter">₹{priceMonthly('alpha')}</span>
              <span className="text-slate-500 text-xs font-bold">/mo</span>
            </div>
            {billing === 'yearly' && (
              <p className="text-[9px] text-slate-500 font-bold mb-5">Billed ₹{prices.alpha.yearly}/yr</p>
            )}

            <div className="flex-1 space-y-0 mb-6 mt-4 relative z-10">
              {allFeatures.map(([label, , , alpha]) => (
                <div key={label as string} className={`flex items-center space-x-3 py-2 border-b border-white/5 ${!alpha ? 'opacity-30' : ''}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${alpha ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                    {alpha ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 tracking-tight leading-snug">{label as string}</span>
                </div>
              ))}
            </div>

            {isActive('alpha') ? (
              <div className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center relative z-10">
                ✓ Active License
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade('alpha')}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 relative z-10 hover:opacity-90 transition-opacity"
              >
                <Zap className="h-4 w-4" />
                Unlock Alpha Access
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* ── FEATURE COMPARISON TABLE ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Full Feature Comparison</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Every strategy unlocked per tier</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Feature</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Free</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/30">Pro</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50/30">Alpha</th>
                </tr>
              </thead>
              <tbody>
                {allFeatures.map(([label, free, pro, alpha]) => (
                  <tr key={label as string} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-3 text-[10px] font-bold text-slate-700">{label as string}</td>
                    <td className="px-6 py-3 text-center">
                      {free
                        ? <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                        : <X className="h-3.5 w-3.5 text-slate-200 mx-auto" />}
                    </td>
                    <td className="px-6 py-3 text-center bg-blue-50/20">
                      {pro
                        ? <Check className="h-4 w-4 text-blue-500 mx-auto" />
                        : <X className="h-3.5 w-3.5 text-slate-200 mx-auto" />}
                    </td>
                    <td className="px-6 py-3 text-center bg-indigo-50/20">
                      {alpha
                        ? <Check className="h-4 w-4 text-indigo-500 mx-auto" />
                        : <X className="h-3.5 w-3.5 text-slate-200 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── VOUCHER SECTION ── */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-indigo-500" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Have a Voucher Code?</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Redeem for instant trial access — no payment needed</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`flex items-center bg-slate-50 border-2 rounded-2xl px-4 py-2.5 gap-3 flex-1 md:w-72 transition-all ${
                voucherStatus === 'success' ? 'border-emerald-400' : voucherStatus === 'error' ? 'border-rose-400' : 'border-slate-200 focus-within:border-blue-500'
              }`}>
                <Gift className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="ENTER VOUCHER CODE"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherStatus('idle'); }}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none flex-1 placeholder-slate-300 text-slate-900"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRedeemVoucher}
                disabled={redeeming || !voucherCode.trim()}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-all hover:bg-black"
              >
                {redeeming ? '...' : 'Apply'}
              </motion.button>
            </div>
          </div>
          <AnimatePresence>
            {voucherMsg && (
              <motion.p
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={`mt-4 text-[10px] font-black uppercase tracking-widest ${voucherStatus === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {voucherMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">How Activation Works</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Simple 3-step process. Live within 15 minutes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', icon: Target, title: 'Choose Your Plan', desc: 'Select Pro or Alpha. Pick monthly or yearly billing.' },
              { step: '02', icon: Zap, title: 'Pay via UPI', desc: 'Scan QR code. Pay the fixed amount. Copy the 12-digit UTR.' },
              { step: '03', icon: ShieldCheck, title: 'Access Activated', desc: 'Submit your UTR. Admin verifies & activates within 15 min.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <motion.div key={step} whileHover={{ y: -3 }} className="bg-white rounded-3xl border border-slate-100 p-7 shadow-sm flex flex-col items-start space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black text-slate-100 tracking-tighter leading-none">{step}</span>
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{title}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── CTA BANNER ── */}
        <div className="relative bg-slate-950 rounded-3xl p-10 md:p-14 text-white overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-80 h-80 bg-blue-600/15 blur-[100px] rounded-full -ml-20 -mt-20" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full -mr-20 -mb-20" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start text-blue-400">
                <Shield className="h-4 w-4" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em]">Corporate / Fund Access</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Need a Custom<br/>Deployment?</h3>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Multiple seats, API access, or fund-level reporting? Contact us for an enterprise node.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={() => window.open('https://wa.me/917056633633?text=Hi%20Admin,%20I%20am%20interested%20in%20a%20Corporate%20Deployment%20for%20my%20fund.', '_blank')}
              className="shrink-0 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-colors flex items-center gap-3"
            >
              <span>Contact Admin on WhatsApp</span>
              <ArrowUpRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[8px] text-slate-400 font-black uppercase tracking-widest pb-4">
          MarketBeacon Terminal v14.0 · Institutional Hub · AES-256 Encrypted · India's Research OS
        </p>
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
