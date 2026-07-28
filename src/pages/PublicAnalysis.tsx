import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BrandLogo from '../components/brand/BrandLogo';
import { 
  Share2, 
  ArrowUpRight,
  Lock,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { useAuth } from '../context/AuthContext';
import AiSuggestionPublicPanel from '../components/ai/AiSuggestionPublicPanel';
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
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
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
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 font-sans flex flex-col overflow-hidden animate-fade-in">
      <SEO title={`${symbol} Fundamental Audit`} description={desc} url={`/analysis/${symbol}`} image={`https://marketbeaconpro.com/api/og/${symbol}`} />
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
      <nav className="border-b border-white/5 bg-[#0f172a]/60 backdrop-blur-xl shrink-0 z-50 px-6 py-4">
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

      {/* Main Single Page Layout Container */}
      <main className="relative z-10 max-w-[1440px] w-full mx-auto px-6 py-6 lg:h-[calc(100vh-80px)] flex flex-col justify-between overflow-hidden flex-1">
        <div className="mb-4 shrink-0">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: `${symbol} Analysis` }
          ]} />
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 overflow-hidden min-h-0">
          
          {/* Left Column: Hero & AI Panel (45%) */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6 overflow-y-auto pr-2 min-h-0 h-full">
            {/* COMPACT HERO SECTION */}
            <div className="space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]" />
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{data.basketName || data.basket} Node Audit</span>
                </div>
              </div>
              
              <div className="flex items-baseline gap-4 flex-wrap">
                <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter leading-none">{data.symbol}</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-60">Verified Institutional Deep-Node Analysis</p>
              </div>

              {/* 3 Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-[#0f172a]/40 border border-white/5 rounded-2xl relative overflow-hidden group">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Audit Score</span>
                  <div className={`text-3xl font-black italic tracking-tighter mt-1 ${data.score >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {data.score}
                  </div>
                </div>

                <div className="p-4 bg-[#0f172a]/40 border border-white/5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Holding</span>
                  <div className="text-3xl font-black text-white italic tracking-tighter mt-1">{data.smartMoney?.toFixed(1)}%</div>
                </div>

                <div className="p-4 bg-[#0f172a]/40 border border-white/5 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Target</span>
                  <div className="text-3xl font-black text-indigo-400 italic tracking-tighter mt-1">+{data.upside}%</div>
                </div>
              </div>
            </div>

            {/* AI PANEL (Fits comfortably in height) */}
            <div className="flex-1 min-h-0">
              <AiSuggestionPublicPanel symbol={symbol || ''} />
            </div>
          </div>

          {/* Right Column: Strategy Nodes, Related Assets, Footer (55%) */}
          <div className="lg:col-span-7 relative bg-[#0a0f1d]/50 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-full min-h-0">
            <div className={`flex-1 overflow-y-auto p-8 space-y-8 transition-all duration-300 min-h-0 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
              
              {/* STRATEGY NODES */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter">Active Strategy <span className="text-cyan-500">Nodes.</span></h2>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">v12.0</span>
                </div>

                <div className="space-y-3">
                  {data.strategies?.length > 0 ? (
                    data.strategies.map((strat: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-cyan-600/5 border border-cyan-500/20 rounded-2xl shadow-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                            <Zap className="w-5 h-5" />
                          </div>
                          <span className="text-md font-black text-white uppercase tracking-tighter italic">{strat.name}</span>
                        </div>
                        <span className="px-4 py-1 bg-emerald-500 text-[#020617] text-[10px] font-bold rounded-lg italic tracking-wider">ACTIVE FLOOR</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center justify-center flex-col space-y-3 text-center">
                      <Clock className="w-8 h-8 text-slate-700" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monitoring for institutional activity...</p>
                    </div>
                  )}
                </div>
              </section>

              {/* RELATED ASSETS */}
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-white italic tracking-tighter">Related <span className="text-cyan-500">Assets.</span></h2>
                <div className="grid grid-cols-2 gap-4">
                  {["HDFCBANK", "INFY", "RELAXO", "TCS"].filter(s => s !== symbol).slice(0, 4).map((sym) => (
                    <Link 
                      key={sym} 
                      to={`/analysis/${sym}`}
                      className="p-5 bg-[#0f172a]/20 border border-white/5 rounded-2xl hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-black text-white italic tracking-tighter group-hover:text-cyan-400 transition-colors leading-none">{sym}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-700 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Institutional Audit</div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <footer className="pt-6 border-t border-white/5 text-center">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider leading-relaxed max-w-lg mx-auto italic opacity-75">
                  MarketBeacon Pro is a quantitative research tool for educational purposes only.
                  We are NOT a SEBI-registered Investment Adviser.
                  Investments in securities market are subject to market risks.
                </p>
              </footer>
            </div>

            {/* Lock Overlay inside Right Column */}
            {!isProOrAbove && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020617]/55 backdrop-blur-[6px] p-6">
                <div className="bg-[#0f172a]/95 text-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-white/5 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                   <div className="mx-auto w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center justify-center text-cyan-400 animate-pulse">
                      <Lock className="w-5 h-5" />
                   </div>
                   
                   <div className="space-y-1.5">
                       <h3 className="text-lg font-bold uppercase tracking-tight text-white italic">PRO AUDIT LOCKED</h3>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                          Detailed strategy entry points, ABCD tranches, retest nodes and buy/sell execution levels for <span className="text-cyan-400 font-bold">{symbol}</span> are locked.
                      </p>
                   </div>

                   <div className="space-y-3 pt-1">
                      {user ? (
                         <button 
                           onClick={() => setShowUpgrade(true)}
                            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                         >
                            <Sparkles className="w-4 h-4 text-slate-950" /> Upgrade to Pro Execution
                         </button>
                      ) : (
                         <Link 
                           to="/login"
                            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 rounded-xl font-bold uppercase tracking-wider text-[10px] hover:scale-[1.02] active:scale-95 transition-all text-center block shadow-lg shadow-cyan-500/20"
                         >
                            Sign In to Unlock
                         </Link>
                      )}
                      
                      <Link 
                        to="/license-desk"
                        className="block text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider"
                      >
                         Compare Plans & Pricing
                      </Link>
                   </div>

                   <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center space-y-1">
                          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block">🎁 Active Promotion Alert</span>
                          <p className="text-[9.5px] text-slate-450 leading-relaxed">
                             Redeem code <span className="text-white font-black">ALPHA7</span> to unlock 7-Day FREE Pro Access instantly.
                          </p>
                       </div>
                      
                      <div className="flex gap-2">
                         <input 
                           type="text" 
                           placeholder="Enter voucher (e.g. ALPHA7)..."
                           value={voucherCode}
                           onChange={(e) => setVoucherCode(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-[10px] text-white outline-none focus:border-cyan-500"
                         />
                         <button
                           onClick={handleRedeemVoucher}
                           disabled={redeeming}
                            className="px-4 py-2.5 bg-gradient-to-r from-white to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-950 disabled:bg-slate-800 disabled:text-slate-650 rounded-xl text-[10px] transition-all"
                         >
                           {redeeming ? 'Apply...' : 'Apply'}
                         </button>
                      </div>

                      {voucherError && (
                         <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">{voucherError}</p>
                      )}

                      <button 
                         type="button"
                         onClick={() => {
                            setVoucherCode('ALPHA7');
                            setVoucherError(null);
                         }}
                         className="text-[9px] text-cyan-400 hover:text-cyan-300 uppercase tracking-wider block mx-auto underline transition-colors"
                      >
                         Quick Apply: ALPHA7 (7-Day Trial)
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
