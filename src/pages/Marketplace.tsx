import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, ShieldCheck, ChevronRight,
  Check, Gift, TrendingUp,
  Clock, Flame, Target, BarChart2,
  Crown, X, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { waLink } from '../lib/constants';

const API_URL = getApiUrl();

// ── Micro-components ──────────────────────────────────────────────────────────

const Badge = ({ children, color = 'emerald' }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
};

const TrustStat = ({ value, label, icon: Icon }: { value: string; label: string; icon: React.ComponentType<any> }) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.03 }}
    className="flex items-center gap-3 border border-slate-100 bg-white rounded-2xl px-4 py-3 shadow-sm"
  >
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-[#00d09c]/20 bg-[#00d09c]/10">
      <Icon className="h-4 w-4 text-[#00d09c]" />
    </div>
    <div className="text-left">
      <div className="text-lg font-black text-slate-900 tracking-tighter leading-none">{value}</div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 leading-tight">{label}</div>
    </div>
  </motion.div>
);

const FeatureRow = ({ feature, included }: { feature: string; included: boolean }) => (
  <div className={`flex items-center space-x-3 py-2.5 border-b border-slate-50 ${included ? '' : 'opacity-40'}`}>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${included ? 'bg-emerald-50 text-[#00d09c]' : 'bg-slate-50 text-slate-400'}`}>
      {included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
    </div>
    <span className="text-xs font-bold text-slate-600 tracking-tight leading-snug">{feature}</span>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const MembershipPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'alpha'>('alpha');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [voucherStatus, setVoucherStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [voucherMsg, setVoucherMsg] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const userTier = user?.tier || 'free';
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
    ['Live Screener (Passed Audit / Observation / Rejected)', true,  true,  true ],
    ['Wealth Desk — Portfolio Tracker',                true,  true,  true ],
    ['Trade Journal & Ledger',                         true,  true,  true ],
    ['Bollinger Band Strategy',                        true,  true,  true ],
    ['Envelope Long / Short Strategy',                 true,  true,  true ],
    ['ABCD Ladder Pattern',                            false, true,  true ],
    ['Structural Pivot Breakouts',                     false, true,  true ],
    ['52-Week High-Low Scanner',                       false, true,  true ],
    ['SMA + BCD Strategy',                             false, true,  true ],
    ['Cup with Handle + ABCD',                         false, true,  true ],
    ['Velocity Retest — Deep Demand (20%)',            false, false, true ],
    ['67% Deep Recovery Audit',                        false, false, true ],
    ['Support & Resistance Core Logic',                false, false, true ],
    ['Priority Alpha Strategy Triggers',               false, false, true ],
    ['Institutional Reset Strategy',                   false, false, true ],
    ['Alpha Hub — All Baskets Unlocked',               false, false, true ],
  ];

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;
    setRedeeming(true);
    setVoucherStatus('idle');
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() })
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        setVoucherStatus('success');
        setVoucherMsg(`✅ ${data.tier?.toUpperCase()} access activated for 7 days!`);
        setShowConfetti(true);
        setTimeout(() => window.location.reload(), 3500);
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
    <div className="bg-[#f8fafc] font-sans min-h-screen overflow-y-auto pb-24 text-slate-800">
      {showConfetti && <Confetti />}

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-white px-4 md:px-12 pt-8 pb-10 border-b border-slate-100">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-[#00d09c]/5 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-[#00d09c]/3 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Go Back button */}
          <div className="flex justify-start mb-6">
            <button 
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/alpha-hub');
                }
              }} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Top row: badge + headline */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00d09c]/10 border border-[#00d09c]/20 rounded-full mb-3">
              <Flame className="h-3 w-3 text-[#00d09c] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00d09c]">Access Licenses — License Desk</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none text-slate-900">
              Unlock Your{' '}
              <span className="text-[#00d09c]">
                Trading Edge
              </span>
            </h1>
            <p className="mt-3 text-slate-500 text-xs md:text-sm font-semibold max-w-lg mx-auto leading-relaxed uppercase tracking-wider">
              Institutional-grade research tools for educational purposes. Audit Scores + ABCD Tranche Zones. Not investment advice.
            </p>
          </motion.div>

          {/* Trust Stats — horizontal row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <TrustStat value="336+" label="Tracked Symbols" icon={BarChart2} />
            <TrustStat value="10" label="Proven Strategies" icon={Target} />
            <TrustStat value="10" label="Strategy Models" icon={TrendingUp} />
            <TrustStat value="15 min" label="Access Activation" icon={Clock} />
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-12 py-12">

        {/* ── CURRENT TIER BANNER ── */}
        {userTier !== 'free' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between bg-[#00d09c] text-white px-6 py-4 rounded-2xl shadow-md shadow-[#00d09c]/15"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Active License</p>
                <p className="text-xs text-emerald-100 uppercase tracking-wider font-semibold mt-0.5">
                  {userTier.toUpperCase()} Tier — All features unlocked for your plan
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-white/20 rounded-xl text-caption border border-white/20">
              Active ✓
            </div>
          </motion.div>
        )}

        {/* ── BILLING TOGGLE ── */}
        <div className="flex flex-col items-center space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billing Period</p>
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1">
            {(['monthly', 'yearly'] as const).map(period => (
              <button
                key={period}
                onClick={() => setBilling(period)}
                className={`relative px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  billing === period
                    ? 'bg-[#00d09c] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {period}
                {period === 'yearly' && (
                  <span className="absolute -top-2.5 -right-1 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                    -33%
                  </span>
                )}
              </button>
            ))}
          </div>
          {billing === 'yearly' && (
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider animate-in fade-in">
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
              <Badge color="emerald">Free</Badge>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">Institutional<br/>Free</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Start exploring without commitment</p>
            </div>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">₹0</span>
              <span className="text-slate-550 text-xs font-bold uppercase tracking-wider">/ forever</span>
            </div>
            <div className="flex-1 space-y-0 mb-6">
              {allFeatures.slice(0, 6).map(([label, free]) => (
                <FeatureRow key={label as string} feature={label as string} included={!!free} />
              ))}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-3 italic">+ {allFeatures.length - 6} more features locked</p>
            </div>
            <div className={`w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider text-center border-2 ${
              userTier === 'free'
                ? 'border-slate-800 bg-slate-800 text-white'
                : 'border-slate-100 text-slate-400 cursor-default'
            }`}>
              {userTier === 'free' ? '✓ Current Plan' : 'Downgrade Not Available'}
            </div>
          </motion.div>

          {/* PRO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`bg-white border-2 rounded-3xl p-7 flex flex-col shadow-sm transition-all ${
              isActive('pro') && userTier !== 'alpha' ? 'border-[#00d09c] shadow-lg shadow-[#00d09c]/10' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
            }`}
          >
            <div className="space-y-1 mb-6">
              <div className="flex items-center justify-between">
                <Badge color="emerald"><Zap className="h-2.5 w-2.5 text-[#00d09c]" /> Pro</Badge>
                {isActive('pro') && userTier === 'pro' && (
                  <span className="text-[10px] font-bold text-[#00d09c] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">Pro<br/>Execution</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Structural patterns &amp; all strategies</p>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">₹{priceMonthly('pro')}</span>
              <span className="text-slate-550 text-xs font-bold uppercase tracking-wider">/mo</span>
            </div>
            {billing === 'yearly' && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">Billed ₹{prices.pro.yearly}/yr</p>
            )}
            <div className="flex-1 space-y-0 mb-6 mt-4">
              {allFeatures.slice(0, 12).map(([label, , pro]) => (
                <FeatureRow key={label as string} feature={label as string} included={!!pro} />
              ))}
            </div>
            {isActive('pro') && userTier !== 'alpha' ? (
              <div className="w-full py-3.5 bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider text-center">
                ✓ Active License
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade('pro')}
                className="w-full py-3.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-[#00d09c]/15 flex items-center justify-center gap-2 transition-all"
              >
                Unlock Pro <ChevronRight className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </motion.div>

          {/* ALPHA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className={`relative bg-white border-2 rounded-3xl p-7 flex flex-col transition-all overflow-hidden ${
              isActive('alpha') ? 'border-[#00d09c] shadow-lg shadow-[#00d09c]/15' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
            }`}
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00d09c]/5 blur-[80px] -mr-24 -mt-24 pointer-events-none" />
            {/* Choice badge */}
            <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-[#00d09c] text-white px-5 py-1.5 rounded-b-2xl text-[9px] font-bold uppercase tracking-wider shadow-md whitespace-nowrap">
              ⭐ Institutional Choice
            </div>

            <div className="space-y-1 mb-6 mt-3 relative z-10">
              <div className="flex items-center justify-between">
                <Badge color="amber"><Crown className="h-2.5 w-2.5 text-amber-500" /> Alpha</Badge>
                {isActive('alpha') && (
                  <span className="text-[10px] font-bold text-[#00d09c] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Active</span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-2">Alpha<br/>Priority</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Full institutional terminal access</p>
            </div>

            <div className="flex items-baseline gap-1 mb-1 relative z-10">
              <span className="text-5xl font-black text-slate-900 tracking-tighter">₹{priceMonthly('alpha')}</span>
              <span className="text-slate-550 text-xs font-bold uppercase tracking-wider">/mo</span>
            </div>
            {billing === 'yearly' && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">Billed ₹{prices.alpha.yearly}/yr</p>
            )}

            <div className="flex-1 space-y-0 mb-6 mt-4 relative z-10">
              {allFeatures.map(([label, , , alpha]) => (
                <FeatureRow key={label as string} feature={label as string} included={!!alpha} />
              ))}
            </div>

            {isActive('alpha') ? (
              <div className="w-full py-3.5 bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-wider text-center relative z-10">
                ✓ Active License
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade('alpha')}
                className="w-full py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-[#00d09c]/15 flex items-center justify-center gap-2 relative z-10 transition-all"
              >
                <Zap className="h-4 w-4 animate-bounce" />
                Unlock Alpha Access
              </motion.button>
            )}
          </motion.div>
        </div>

        {/* ── FEATURE COMPARISON TABLE ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Full Feature Comparison</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Every strategy unlocked per tier</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-4 text-left text-caption text-slate-500 uppercase tracking-wider">Feature</th>
                  <th className="px-6 py-4 text-center text-caption text-slate-500 uppercase tracking-wider">Free</th>
                  <th className="px-6 py-4 text-center text-caption text-[#00d09c] uppercase tracking-wider bg-emerald-50/20">Pro</th>
                  <th className="px-6 py-4 text-center text-caption text-[#00d09c] uppercase tracking-wider bg-emerald-50/20">Alpha</th>
                </tr>
              </thead>
              <tbody>
                {allFeatures.map(([label, free, pro, alpha]) => (
                  <tr key={label as string} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-3 text-xs font-bold text-slate-700">{label as string}</td>
                    <td className="px-6 py-3 text-center">
                      {free
                        ? <Check className="h-4 w-4 text-[#00d09c] mx-auto" />
                        : <X className="h-3.5 w-3.5 text-slate-200 mx-auto" />}
                    </td>
                    <td className="px-6 py-3 text-center bg-emerald-50/10">
                      {pro
                        ? <Check className="h-4 w-4 text-[#00d09c] mx-auto" />
                        : <X className="h-3.5 w-3.5 text-slate-200 mx-auto" />}
                    </td>
                    <td className="px-6 py-3 text-center bg-emerald-50/10">
                      {alpha
                        ? <Check className="h-4 w-4 text-[#00d09c] mx-auto" />
                        : <X className="h-3.5 w-3.5 text-slate-200 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── VOUCHER SECTION ── */}
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-6">
          {/* Promo Banner for ALPHA7 */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00d09c] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">7</div>
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-emerald-950 tracking-wider">Free 7-Day Alpha Trial Offer</p>
                <p className="text-[8.5px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5 leading-snug">Unlock all premium strategies and the Alpha Hub instantly with code <span className="underline font-bold text-[#00d09c]">ALPHA7</span></p>
              </div>
            </div>
            <button 
              onClick={() => { setVoucherCode('ALPHA7'); setVoucherStatus('idle'); }}
              className="w-full sm:w-auto px-4 py-2 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-caption active:scale-95 transition-all shrink-0 text-center shadow-sm"
            >
              Apply ALPHA7
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-4 border-t border-slate-50">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#00d09c]" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Have a Voucher Code?</span>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Redeem for instant trial access — no payment needed</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className={`flex items-center bg-slate-50 border-2 rounded-2xl px-4 py-2.5 gap-3 flex-1 md:w-72 transition-all ${
                voucherStatus === 'success' ? 'border-emerald-400' : voucherStatus === 'error' ? 'border-rose-400' : 'border-slate-200 focus-within:border-[#00d09c]'
              }`}>
                <Gift className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="ENTER VOUCHER CODE"
                  value={voucherCode}
                  onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherStatus('idle'); }}
                  className="bg-transparent text-caption outline-none flex-1 placeholder-slate-300 text-slate-900"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRedeemVoucher}
                disabled={redeeming || !voucherCode.trim()}
                className="px-6 py-2.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl text-xs font-bold uppercase tracking-wider disabled:opacity-40 transition-all shadow-md shadow-[#00d09c]/15"
              >
                {redeeming ? '...' : 'Apply'}
              </motion.button>
            </div>
          </div>

          {/* Status Message */}
          <AnimatePresence>
            {voucherStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-wider ${
                  voucherStatus === 'success' ? 'bg-emerald-50 text-[#00d09c]' : 'bg-rose-50 text-rose-500'
                }`}
              >
                {voucherMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── WHATSAPP SUPPORT ── */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="text-left space-y-1">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Need Custom Activation or Assistance?</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Chat directly with the desk to activate offline or corporate access</p>
          </div>
          <a
            href={waLink('Hi Admin, I am on the License Desk page and want assistance with activation.')}
            target="_blank" rel="noreferrer"
            className="w-full md:w-auto px-6 py-3 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-caption text-center shadow-md shadow-[#00d09c]/15 active:scale-95 transition-all whitespace-nowrap"
          >
            Chat with Support (WhatsApp)
          </a>
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

export default MembershipPage;
