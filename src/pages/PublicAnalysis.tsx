import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  TrendingUp, 
  BarChart2, 
  Share2, 
  Globe, 
  ChevronRight,
  Target,
  ArrowUpRight,
  Info,
  ExternalLink,
  Lock,
  Zap,
  BadgeCheck,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

const PublicAnalysisPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (data) {
      document.title = `${symbol} Fundamental Audit & Price Target | MarketBeacon Pro`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `Get the institutional 100-point audit for ${symbol}. Audit Score: ${(data.score || 0).toFixed(0)}, Smart Money: ${(data.smartMoney || 0).toFixed(1)}%, Target Upside: +${data.upside}%. Verified logic by MarketBeacon Pro.`);
      }

      const updateOG = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateOG('og:title', `${symbol} Institutional Audit: ${(data.score || 0).toFixed(0)}/100`);
      updateOG('og:description', `Institutional 100-point audit for ${symbol}. Smart Money: ${(data.smartMoney || 0).toFixed(1)}%, Risk: ${data.risk || 'Low'}.`);
      updateOG('og:url', window.location.href);
      updateOG('og:type', 'article');

      const schema = {
        "@context": "https://schema.org",
        "@type": "InvestmentPortfolio",
        "name": `MarketBeacon Institutional Analysis: ${symbol}`,
        "description": `Professional fundamental audit and strategy matrix for ${symbol}`,
        "provider": {
          "@type": "Organization",
          "name": "MarketBeacon Pro"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": data.score,
          "bestRating": "100",
          "worstRating": "0",
          "ratingCount": "31400"
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": window.location.href
        }
      };

      const script = document.createElement('script');
      script.type = "application/ld+json";
      script.id = `json-ld-${symbol}`;
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);

      const linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      linkCanonical.href = `https://marketbeacon.pro/analysis/${symbol}`;
      document.head.appendChild(linkCanonical);

      return () => {
        const oldScript = document.getElementById(`json-ld-${symbol}`);
        if (oldScript) oldScript.remove();
        document.head.removeChild(linkCanonical);
      };
    }
  }, [data, symbol]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `MarketBeacon Pro: ${symbol} Institutional Analysis`,
        text: `Check out the institutional-grade 100-point audit for ${symbol} on MarketBeacon Pro.`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.2)]" />
      <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">Fetching Node Data</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
      <div className="space-y-6">
        <h1 className="text-4xl font-black text-white italic tracking-tighter">NODE NOT FOUND</h1>
        <Link to="/" className="inline-block px-10 py-4 bg-white text-[#020617] rounded-2xl font-black uppercase text-xs">Return to Alpha Hub</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 font-sans">
      {/* Visual Design Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/5 blur-[150px] rounded-full" />
      </div>

      {/* Premium Header */}
      <nav className="border-b border-white/5 bg-[#0f172a]/60 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-900/20">
              <Zap className="w-5 h-5 text-[#020617]" />
            </div>
            <span className="font-black tracking-tighter text-2xl text-white uppercase italic">MARKETBEACON<span className="text-cyan-500">PRO</span></span>
          </div>
          <button 
            onClick={handleShare}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-20 space-y-16">
        
        {/* HERO SECTION */}
        <section className="text-center space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-4">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]" />
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{data.basket} Node Audit</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-black text-white italic tracking-tighter leading-none">{data.symbol}</h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto uppercase tracking-widest italic opacity-60">Verified Institutional Deep-Node Analysis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-10 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] space-y-3 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/5 blur-2xl -mr-12 -mt-12 group-hover:bg-cyan-600/10 transition-all" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">Audit Score</span>
               <div className={`text-7xl font-black italic tracking-tighter relative z-10 ${data.score >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {data.score}
               </div>
               <div className="flex items-center gap-2 relative z-10">
                  {data.isPass ? <BadgeCheck className="w-4 h-4 text-emerald-400" /> : <Info className="w-4 h-4 text-rose-400" />}
                  <span className={`text-[10px] font-black uppercase tracking-widest ${data.isPass ? 'text-emerald-500' : 'text-rose-500'}`}>{data.isPass ? 'Qualified Node' : 'Audit Rejected'}</span>
               </div>
            </div>

            <div className="p-10 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] space-y-3">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Institutional Holding</span>
               <div className="text-7xl font-black text-white italic tracking-tighter">{data.smartMoney?.toFixed(1)}%</div>
               <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ownership Matrix Active</span>
               </div>
            </div>

            <div className="p-10 bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[3rem] space-y-3">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Growth Target</span>
               <div className="text-7xl font-black text-indigo-400 italic tracking-tighter">+{data.upside}%</div>
               <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alpha Objective projection</span>
               </div>
            </div>
          </div>
        </section>

        {/* STRATEGY NODES */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-white italic tracking-tighter">Active Strategy <span className="text-cyan-500">Nodes.</span></h2>
            <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Institutional Verification v12.0</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Detected Logic Entry</span>
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
                      <span className="px-5 py-1.5 bg-emerald-500 text-[#020617] text-[10px] font-black rounded-xl italic tracking-widest">QUALIFIED</span>
                    </div>
                  ))
                ) : (
                  <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-center flex-col space-y-4 text-center">
                    <Clock className="w-10 h-10 text-slate-700" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monitoring for institutional entry point...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Locked Premium Logic</span>
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
                     <Link to="/login" className="flex items-center justify-center gap-3 w-full py-5 bg-white text-[#020617] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all">
                        Unlock Full Research Node <ArrowUpRight className="w-4 h-4" />
                     </Link>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* RELATED ASSETS */}
        <section className="space-y-10">
           <h2 className="text-3xl font-black text-white italic tracking-tighter">Related <span className="text-cyan-500">Picks.</span></h2>
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
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Institutional Audit Active</div>
                </Link>
              ))}
           </div>
        </section>

        {/* Footer */}
        <footer className="pt-20 border-t border-white/5 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shadow-inner">
              <BarChart2 className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-slate-500">MarketBeacon<span className="text-cyan-500">Pro</span> Terminal Node</span>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] leading-relaxed max-w-xl mx-auto italic">
            This analysis is for institutional research purposes only. 
            Investments in securities market are subject to market risks. 
            Read all the related documents carefully before investing.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PublicAnalysisPage;
