import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Share2,
  ArrowUpRight,
  Lock,
  Zap,
  Clock,
  Sparkles,
  BarChart3
} from 'lucide-react';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';
import { useAuth } from '../context/AuthContext';
import AiSuggestionPublicPanel from '../components/ai/AiSuggestionPublicPanel';
import UpgradeModal from '../components/modals/UpgradeModal';
import { Confetti } from '../components/ui/Confetti';
import { InfoTooltip } from '../components/ui/InfoTooltip';
import DataFreshnessBadge from '../components/ui/DataFreshnessBadge';
import { FUNDA_INFO_MAP } from '../data/fundaInfo';
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
      <div className="w-14 h-14 border-4 border-slate-100 border-t-[#00d09c] rounded-full animate-spin" />
      <p className="text-xs font-bold text-[#00d09c] uppercase tracking-[0.4em]">Fetching Audit Data</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="space-y-6">
        <h1 className="text-4xl font-black text-slate-900 italic tracking-tighter">STOCK NOT FOUND</h1>
        <p className="text-slate-400 text-sm">We couldn't find audit data for this symbol.</p>
        <Link to="/" className="inline-block px-10 py-4 bg-[#00d09c] text-white rounded-2xl font-bold uppercase text-xs hover:bg-[#00bda0] transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );

  const score = data.score.toFixed(0);
  const smartMoney = data.smartMoney.toFixed(1);
  const desc = `Get the institutional 100-point audit for ${symbol}. Audit Score: ${score}, Smart Money: ${smartMoney}%. Verified logic by MarketBeacon Pro.`;

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
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col overflow-y-auto">
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
      
      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-[#00d09c]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-50/60 blur-[150px] rounded-full" />
      </div>

      {/* Main Layout */}
      <main className="relative z-10 max-w-[1440px] w-full mx-auto px-6 py-6 flex flex-col flex-1">

        <div className="mb-4 shrink-0">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: `${symbol} Analysis` }
          ]} />
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
          
          {/* Left Column: Hero & AI Panel (45%) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Hero Section */}
            <div className="space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#00d09c]/10 rounded-full border border-[#00d09c]/20">
                  <span className="w-1.5 h-1.5 bg-[#00d09c] rounded-full" />
                  <span className="text-[10px] font-bold text-[#00d09c] uppercase tracking-wider">{data.basket} Node Audit</span>
                </div>
              </div>
              
              <div className="flex items-baseline gap-4 flex-wrap">
                 <h1 className="text-5xl lg:text-6xl font-black text-slate-900 italic tracking-tighter leading-none">{data.symbol}</h1>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Verified Institutional Deep-Node Analysis</p>
                 <div className="ml-auto flex items-center gap-2">
                   <Link
                     to={`/stock/${data.symbol}`}
                     className="px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-xl text-xs font-bold hover:bg-[#00d09c] hover:text-white transition-all flex items-center gap-1.5"
                     title="View Detailed Fundamentals"
                   >
                     <ArrowUpRight className="h-3 w-3" />
                     Detailed Fundamentals
                   </Link>
                   <Link
                     to={`/charts?symbol=${data.symbol}&return=/analysis/${data.symbol}`}
                     className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5"
                     title="Open in Charts Terminal"
                   >
                     <BarChart3 className="h-3 w-3" />
                     Terminal
                   </Link>
                   <button 
                     onClick={handleShare}
                     className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-[#00d09c] hover:border-[#00d09c]/30 transition-all flex items-center justify-center"
                     title="Share analysis"
                   >
                     <Share2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>

              {/* Stats Grid — 5 metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Audit Score */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">Audit Score <InfoTooltip entry={FUNDA_INFO_MAP.auditScore} size="sm" /></span>
                  <div className={`text-3xl font-black italic tracking-tighter mt-1 ${data.score >= 70 ? 'text-[#00d09c]' : 'text-rose-500'}`}>
                    {data.score}
                  </div>
                </div>

                {/* Smart Money / Holding */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">Holding <InfoTooltip entry={FUNDA_INFO_MAP.smartMoney} size="sm" /></span>
                  <div className="text-3xl font-black text-slate-800 italic tracking-tighter mt-1">{data.smartMoney?.toFixed(1)}%</div>
                </div>

                {/* Entry Level */}
                {data?.abcd?.d?.price > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Entry Level</span>
                    <div className="text-2xl font-black text-emerald-700 italic tracking-tighter mt-1">₹{Number(data.abcd.d.price).toLocaleString('en-IN')}</div>
                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Base / Support Zone</span>
                  </div>
                )}

                {/* Target Price */}
                {data?.abcd?.d?.price > 0 && data?.upside > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Target Price</span>
                    <div className="text-2xl font-black text-blue-700 italic tracking-tighter mt-1">
                      ₹{Math.round(data.abcd.d.price * (1 + data.upside / 100)).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[8px] font-bold text-blue-500 uppercase tracking-wider">Projection</span>
                  </div>
                )}

                {/* Expected Return */}
                {data?.upside > 0 && (
                  <div className="p-4 bg-[#00d09c]/5 border border-[#00d09c]/20 rounded-2xl">
                    <span className="text-[9px] font-bold text-[#00d09c] uppercase tracking-wider">Expected Return</span>
                    <div className="text-2xl font-black text-[#00d09c] italic tracking-tighter mt-1">+{data.upside}%</div>
                    <span className="text-[8px] font-bold text-[#00d09c]/70 uppercase tracking-wider">Institutional Target</span>
                  </div>
                )}
              </div>

              <DataFreshnessBadge lastUpdated={data?.lastUpdated} size="sm" className="mt-1" />
            </div>

            {/* AI Panel */}
            <div className="flex-1 min-h-0">
              <AiSuggestionPublicPanel symbol={symbol || ''} basket={data.basket} />
            </div>
          </div>

          {/* Right Column: Strategy Nodes, Related Assets (55%) */}
          <div className="lg:col-span-7 relative bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col">
            <div className={`p-8 space-y-8 ${!isProOrAbove ? 'filter blur-[8px] pointer-events-none select-none opacity-40' : ''}`}>
              
              {/* STRATEGY NODES */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Active Strategy <span className="text-[#00d09c]">Nodes.</span></h2>
                  <div className="flex items-center gap-2">
                    {data?.lastUpdated && (
                      <span className="text-[8px] text-slate-400 font-medium tracking-wider">
                        Data: {new Date(data.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">v12.0</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {data.strategies?.length > 0 ? (
                    data.strategies.map((strat: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white border border-[#00d09c]/20 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#00d09c]/10 rounded-xl flex items-center justify-center text-[#00d09c]">
                            <Zap className="w-5 h-5" />
                          </div>
                          <span className="text-md font-black text-slate-800 uppercase tracking-tighter italic">{strat.name}</span>
                        </div>
                        <span className="px-4 py-1 bg-[#00d09c] text-white text-[10px] font-bold rounded-lg italic tracking-wider">ACTIVE FLOOR</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-white border border-slate-100 rounded-2xl flex items-center justify-center flex-col space-y-3 text-center">
                      <Clock className="w-8 h-8 text-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monitoring for institutional activity...</p>
                    </div>
                  )}
                </div>
              </section>

              {/* FUNDAMENTALS PREVIEW (Public) */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Fundamental <span className="text-[#00d09c]">Check.</span></h2>
                  {data?.fundamentals && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {['peRatio', 'roce', 'returnOnEquity', 'debtToEquity'].filter(k => data.fundamentals[k] !== undefined && data.fundamentals[k] !== null).length} metrics
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[ 
                    { label: 'P/E Ratio', value: data?.fundamentals?.peRatio?.toFixed(1) || '—', infoKey: 'peRatio' as const, pass: !data?.fundamentals?.peRatio || Number(data.fundamentals.peRatio) < 70 },
                    { label: 'D/E Ratio', value: data?.fundamentals?.debtToEquity?.toFixed(2) || '—', infoKey: 'debtToEquity' as const, pass: !data?.fundamentals?.debtToEquity || Number(data.fundamentals.debtToEquity) < 0.5 },
                    { label: 'ROCE', value: data?.fundamentals?.roce ? `${Number(data.fundamentals.roce).toFixed(1)}%` : '—', infoKey: 'roce' as const, pass: !data?.fundamentals?.roce || Number(data.fundamentals.roce) > 12 },
                    { label: 'ROE', value: data?.fundamentals?.returnOnEquity ? `${Number(data.fundamentals.returnOnEquity).toFixed(1)}%` : '—', infoKey: 'roe' as const, pass: !data?.fundamentals?.returnOnEquity || Number(data.fundamentals.returnOnEquity) > 15 },
                    { label: 'Market Cap', value: data?.fundamentals?.marketCap ? `₹${(data.fundamentals.marketCap / 10000000).toFixed(0)} Cr` : '—', infoKey: 'marketCap' as const, pass: true },
                    { label: 'Promoters', value: data?.fundamentals?.promoterHolding ? `${data.fundamentals.promoterHolding.toFixed(1)}%` : '—', infoKey: 'promoterHolding' as const, pass: !data?.fundamentals?.promoterHolding || Number(data.fundamentals.promoterHolding) >= 40 },
                    { label: 'Net Profit', value: data?.fundamentals?.netProfit ? `₹${(Number(data.fundamentals.netProfit) / 10000000).toFixed(1)} Cr` : '—', infoKey: 'profitAth' as const, pass: true },
                    { label: 'Pledge %', value: data?.fundamentals?.pledgePct ? `${Number(data.fundamentals.pledgePct).toFixed(1)}%` : '—', infoKey: 'promoterPledge' as const, pass: !data?.fundamentals?.pledgePct || Number(data.fundamentals.pledgePct) < 5 },
                    { label: 'Smart Money', value: data?.smartMoney ? `${Number(data.smartMoney).toFixed(1)}%` : '—', infoKey: 'smartMoney' as const, pass: !data?.smartMoney || Number(data.smartMoney) >= 70 },
                  ].map((item, i) => (
                    <div key={i} className={`p-4 border rounded-2xl ${
                      item.pass ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-200'
                    }`}>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        {item.label}
                        {item.infoKey && FUNDA_INFO_MAP[item.infoKey] && (
                          <InfoTooltip entry={FUNDA_INFO_MAP[item.infoKey]} size="sm" />
                        )}
                        {item.pass ? (
                          <span className="text-emerald-500 ml-auto">✓</span>
                        ) : (
                          <span className="text-rose-400 ml-auto">✗</span>
                        )}
                      </span>
                      <p className={`text-base font-black italic tracking-tighter mt-0.5 ${
                        item.pass ? 'text-slate-800' : 'text-rose-600'
                      }`}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {data?.fundamentals && (
                  <Link
                    to={`/stock/${data.symbol}`}
                    className="block w-full py-4 bg-gradient-to-r from-[#00d09c] to-emerald-600 hover:from-[#00bda0] hover:to-emerald-500 text-white text-center rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-[#00d09c]/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                  >
                    View Detailed Fundamentals <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </section>

              {/* RELATED ASSETS */}
              <section className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 italic tracking-tighter">Related <span className="text-[#00d09c]">Assets.</span></h2>
                <div className="grid grid-cols-2 gap-4">
                  {["HDFCBANK", "INFY", "RELAXO", "TCS"].filter(s => s !== symbol).slice(0, 4).map((sym) => (
                    <Link 
                      key={sym} 
                      to={`/analysis/${sym}`}
                      className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-[#00d09c]/30 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-black text-slate-800 italic tracking-tighter group-hover:text-[#00d09c] transition-colors leading-none">{sym}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#00d09c] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Institutional Audit</div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Footer */}
              <footer className="pt-6 border-t border-slate-100 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed max-w-lg mx-auto italic">
                  MarketBeacon Pro is a quantitative research tool for educational purposes only.
                  We are NOT a SEBI-registered Investment Adviser.
                  Investments in securities market are subject to market risks.
                </p>
              </footer>
            </div>

            {/* Lock Overlay inside Right Column */}
            {!isProOrAbove && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[6px] p-6">
                <div className="bg-white text-slate-800 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
                   <div className="mx-auto w-12 h-12 bg-[#00d09c]/10 border border-[#00d09c]/20 rounded-full flex items-center justify-center text-[#00d09c]">
                      <Lock className="w-5 h-5" />
                   </div>
                   
                   <div className="space-y-1.5">
                       <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900 italic">PRO AUDIT LOCKED</h3>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                          Detailed strategy entry points, ABCD tranches, retest nodes and strategy execution levels for <span className="text-[#00d09c] font-bold">{symbol}</span> are locked.
                      </p>
                   </div>

                   <div className="space-y-3 pt-1">
                      {user ? (
                         <button 
                           onClick={() => setShowUpgrade(true)}
                            className="w-full py-3.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[#00d09c]/20 flex items-center justify-center gap-2"
                         >
                            <Sparkles className="w-4 h-4" /> Upgrade to Pro Execution
                         </button>
                      ) : (
                         <Link 
                           to="/login"
                            className="w-full py-3.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-[10px] hover:scale-[1.02] active:scale-95 transition-all text-center block shadow-md shadow-[#00d09c]/20"
                         >
                            Sign In to Unlock
                         </Link>
                      )}
                      
                      <Link 
                        to="/license-desk"
                        className="block text-[10px] font-bold text-slate-400 hover:text-[#00d09c] transition-colors uppercase tracking-wider"
                      >
                         Compare Plans & Pricing
                      </Link>
                   </div>

                   <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div className="bg-[#00d09c]/5 border border-[#00d09c]/20 rounded-xl p-3 text-center space-y-1">
                          <span className="text-[10px] font-black text-[#00d09c] uppercase tracking-wider block">🎁 Active Promotion Alert</span>
                          <p className="text-[9.5px] text-slate-500 leading-relaxed">
                             Redeem code <span className="text-slate-800 font-black">ALPHA7</span> to unlock 7-Day FREE Pro Access instantly.
                          </p>
                       </div>
                      
                      <div className="flex gap-2">
                         <input 
                           type="text" 
                           placeholder="Enter voucher (e.g. ALPHA7)..."
                           value={voucherCode}
                           onChange={(e) => setVoucherCode(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-[10px] text-slate-800 outline-none focus:border-[#00d09c] transition-colors"
                         />
                         <button
                           onClick={handleRedeemVoucher}
                           disabled={redeeming}
                            className="px-4 py-2.5 bg-[#00d09c] hover:bg-[#00bda0] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-[10px] font-bold transition-all"
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
                         className="text-[9px] text-[#00d09c] hover:text-[#00bda0] uppercase tracking-wider block mx-auto underline transition-colors"
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
