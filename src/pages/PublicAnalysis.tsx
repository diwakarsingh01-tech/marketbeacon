import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BrandLogo from '../components/brand/BrandLogo';
import { 
  Share2, 
  Globe, 
  Target,
  ArrowUpRight,
  Info,
  Lock,
  Zap,
  BadgeCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import { RATING_COUNT } from '../lib/constants';
import { OrganizationSchema, BreadcrumbSchema } from '../components/StructuredData';
import Breadcrumbs from '../components/ui/Breadcrumbs';

const API_URL = getApiUrl();

const PublicAnalysisPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const isProOrAbove = user?.tier === 'pro' || user?.tier === 'alpha';

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;
    if (!user) {
      setVoucherError('Please log in first to redeem a voucher code.');
      return;
    }
    setRedeeming(true);
    setVoucherError(null);
    const token = localStorage.getItem('mb_token');
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() })
      });
      const result = await safeJsonParse(res);
      if (res.ok && !result.error) {
        setShowConfetti(true);
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setVoucherError(result.error || 'Invalid voucher code.');
      }
    } catch (e) {
      setVoucherError('Network error. Please try again.');
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/analysis/${symbol}`);
        const d = await safeJsonParse(res);
        if (res.ok && !d.error) setData(d);
      } catch (e) {
        console.error('Failed to fetch analysis:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [symbol]);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.2)]" />
      <p className="text-xs font-bold text-cyan-400 uppercase tracking-[0.4em]">Fetching Node Data</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
      <div className="space-y-6">
        <h1 className="text-4xl font-black text-white italic tracking-tighter">NODE NOT FOUND</h1>
        <Link to="/" className="inline-block px-10 py-4 bg-white text-[#020617] rounded-2xl font-bold uppercase text-xs">Return to Alpha Hub</Link>
      </div>
    </div>
  );

  const score = data.score.toFixed(0);
  const smartMoney = data.smartMoney.toFixed(1);
  const desc = `Get the institutional 100-point audit for ${symbol}. Audit Score: ${score}, Smart Money: ${smartMoney}%, Model Projection: +${data.upside}%. Verified logic by MarketBeacon Pro.`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `MarketBeacon Pro: ${symbol} Institutional Analysis`,
        text: `Check out the institutional-grade 100-point audit for ${symbol} on MarketBeacon Pro.`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 font-sans">
      <SEO title={`${symbol} Fundamental Audit`} description={`Research analysis for ${symbol} — Audit Score, peer comparison & key metrics.`} url={`/analysis/${symbol}`} image={`https://marketbeaconpro.com/api/og/${symbol}`} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'InvestmentPortfolio',
          name: `MarketBeacon Institutional Analysis: ${symbol}`,
          description: `Professional fundamental audit and strategy matrix for ${symbol}`,
          provider: { '@type': 'Organization', name: 'MarketBeacon Pro' },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: data.score, bestRating: '100', worstRating: '0', ratingCount: RATING_COUNT },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `https://marketbeaconpro.com/analysis/${symbol}` },
        })}</script>
      </Helmet>
      <OrganizationSchema />
      <BreadcrumbSchema items={[
        { label: 'Home', href: '/' },
        { label: `${symbol} Analysis`, href: `/analysis/${symbol}` }
      ]} />
      {/* Visual Design Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/5 blur-[150px] rounded-full" />
      </div>

      {/* Premium Header */}
      <nav className="border-b border-white/5 bg-[#0f172a]/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center transition-all hover:opacity-90 active:scale-95">
            <BrandLogo variant="dark" size={28} />
          </Link>
          <button 
            onClick={handleShare}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-20 space-y-16">
        <div className="mb-6">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: `${symbol} Analysis` }
          ]} />
        </div>
        <div className={`space-y-16 transition-all duration-300 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
          
          {/* HERO SECTION */}
        <section className="text-center space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-4">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]" />
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{data.basket} Node Audit</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter leading-none">{data.symbol}</h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto uppercase tracking-widest italic opacity-60">Verified Institutional Deep-Node Analysis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-10 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] space-y-3 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/5 blur-2xl -mr-12 -mt-12 group-hover:bg-cyan-600/10 transition-all" />
               <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] relative z-10">Audit Score</span>
               <div className={`text-7xl font-black italic tracking-tighter relative z-10 ${data.score >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {data.score}
               </div>
                <div className="flex items-center gap-2 relative z-10">
                   {data.isPass ? <BadgeCheck className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-rose-400" />}
                   <span className={`text-caption ${data.isPass ? 'text-emerald-500' : 'text-rose-500'}`}>{data.isPass ? 'Passed Audit' : 'Audit Failed'}</span>
                </div>
            </div>

            <div className="p-10 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] space-y-3">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Institutional Holding</span>
               <div className="text-7xl font-black text-white italic tracking-tighter">{data.smartMoney?.toFixed(1)}%</div>
               <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ownership Matrix Active</span>
               </div>
            </div>

            <div className="p-10 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] space-y-3">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Growth Objective</span>
               <div className="text-7xl font-black text-indigo-400 italic tracking-tighter">+{data.upside}%</div>
               <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alpha Objective projection</span>
               </div>
            </div>
          </div>
        </section>

        {/* STRATEGY NODES */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-white italic tracking-tighter">Active Strategy <span className="text-cyan-500">Nodes.</span></h2>
            <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block" />
            <span className="text-caption text-slate-500 uppercase tracking-[0.3em]">Institutional Verification v12.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-2">Logic Zone</span>
              <div className="space-y-4">
                {data.strategies?.length > 0 ? (
                  data.strategies.map((strat: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-8 bg-cyan-600/5 border border-cyan-500/20 rounded-[2rem] shadow-xl group hover:bg-cyan-600/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 shadow-inner">
                          <Zap className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-black text-white uppercase tracking-tighter italic">{strat.name}</span>
                      </div>
                      <span className="px-5 py-1.5 bg-emerald-500 text-[#020617] text-xs font-bold rounded-xl italic tracking-wider">ACTIVE FLOOR</span>
                    </div>
                  ))
                ) : (
                  <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center flex-col space-y-4 text-center">
                    <Clock className="w-10 h-10 text-slate-700" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monitoring for institutional activity...</p>
                  </div>
                )}
              </div>
            </div>

            {!isProOrAbove && (
            <div className="space-y-4">
               <span className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-2">Locked Premium Logic</span>
               <div className="p-8 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#020617]/40 backdrop-blur-[2px] z-10" />
                  <div className="relative z-20 space-y-8">
                     <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-slate-500 uppercase tracking-tighter italic">Deep Recovery Matrix</span>
                        <Lock className="w-5 h-5 text-slate-600" />
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-slate-500 uppercase tracking-tighter italic">Velocity Retest Node</span>
                        <Lock className="w-5 h-5 text-slate-600" />
                     </div>
                      <Link to="/login" className="flex items-center justify-center gap-3 w-full py-5 bg-gradient-to-r from-white to-slate-100 text-[#020617] rounded-2xl text-caption hover:scale-[1.02] transition-all shadow-lg shadow-white/20">
                        Unlock Full Research Node <ArrowUpRight className="w-4 h-4" />
                     </Link>
                  </div>
               </div>
            </div>
            )}
          </div>
        </section>

        {/* RELATED ASSETS */}
        <section className="space-y-10">
           <h2 className="text-3xl font-black text-white italic tracking-tighter">Related <span className="text-cyan-500">Assets.</span></h2>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {["HDFCBANK", "INFY", "RELAXO", "TCS"].filter(s => s !== symbol).slice(0, 4).map((sym) => (
                <Link 
                  key={sym} 
                  to={`/analysis/${sym}`}
                  className="p-8 bg-[#0f172a]/40 border border-white/5 rounded-[2.5rem] hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all group shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-black text-white italic tracking-tighter group-hover:text-cyan-400 transition-colors leading-none">{sym}</span>
                    <ArrowUpRight className="w-5 h-5 text-slate-700 group-hover:text-cyan-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institutional Audit Active</div>
                </Link>
              ))}
           </div>
        </section>

        {/* Footer */}
        <footer className="pt-20 border-t border-white/5 text-center">
          <div className="mb-8 flex justify-center">
            <BrandLogo variant="dark" size={24} />
          </div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] leading-relaxed max-w-xl mx-auto italic">
            MarketBeacon Pro is a quantitative research tool for educational purposes only.
            We are NOT a SEBI-registered Investment Adviser or Research Analyst.
            Audit scores, strategy signals, and ABCD zones are pre-coded mathematical models.
            Nothing on this page constitutes personalised investment advice.
            Investments in securities market are subject to market risks.
            Read all related documents carefully before investing. Consult a SEBI-registered advisor.
          </p>
        </footer>
        </div>

        {/* Lock Overlay */}
        {!isProOrAbove && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020617]/50 backdrop-blur-[4px] p-6 rounded-3xl">
            <div className="bg-[#0f172a]/95 text-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-white/5 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
               <div className="mx-auto w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 animate-pulse">
                  <Lock className="w-6 h-6" />
               </div>
               
               <div className="space-y-2">
                   <h3 className="text-xl font-bold uppercase tracking-tight text-white italic">PRO ANALYSIS LOCKED</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Detailed institutional stock reports, full fundamental scores, holding structures, and active strategy triggers for <span className="text-cyan-400 font-bold">{symbol}</span> are locked.
                  </p>
               </div>

               <div className="space-y-3 pt-2">
                  {user ? (
                     <button 
                       onClick={() => setShowUpgrade(true)}
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                     >
                        <Sparkles className="w-4 h-4 text-slate-950" /> Upgrade to Pro Execution
                     </button>
                  ) : (
                     <Link 
                       to="/login"
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 rounded-xl font-bold uppercase tracking-wider text-xs hover:scale-[1.02] active:scale-95 transition-all text-center block shadow-lg shadow-cyan-500/20"
                     >
                        Sign In to Unlock
                     </Link>
                  )}
                  
                  <Link 
                    to="/license-desk"
                    className="block text-xs font-bold text-slate-450 hover:text-white transition-colors uppercase tracking-wider"
                  >
                     Compare Plans & Pricing
                  </Link>
               </div>

               <div className="border-t border-white/5 pt-6 space-y-4">
                  <div className="space-y-1">
                     <span className="text-caption text-slate-500 uppercase tracking-wider block">Have a Coupon or Voucher Code?</span>
                     <p className="text-xs text-slate-500">Redeem code for a 7-day free trial of all premium features.</p>
                  </div>
                  
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="Enter voucher (e.g. ALPHA7)..."
                       value={voucherCode}
                       onChange={(e) => setVoucherCode(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 px-4 py-3 rounded-xl text-caption text-white outline-none focus:border-cyan-500"
                     />
                     <button
                       onClick={handleRedeemVoucher}
                       disabled={redeeming}
                        className="px-5 py-3 bg-gradient-to-r from-white to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-950 disabled:bg-slate-800 disabled:text-slate-650 rounded-xl text-caption transition-all shadow-lg shadow-white/20"
                     >
                       {redeeming ? 'Applying...' : 'Apply'}
                     </button>
                  </div>

                  {voucherError && (
                     <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">{voucherError}</p>
                  )}

                  <button 
                     type="button"
                     onClick={() => {
                        setVoucherCode('ALPHA7');
                        setVoucherError(null);
                     }}
                     className="text-caption text-cyan-400 hover:text-cyan-300 uppercase tracking-wider block mx-auto underline transition-colors"
                  >
                     Quick Apply: ALPHA7 (7-Day Free Trial)
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        requiredTier="pro" 
        userEmail={user?.email} 
      />
      {showConfetti && <Confetti />}

    </div>
  );
};

export default PublicAnalysisPage;
