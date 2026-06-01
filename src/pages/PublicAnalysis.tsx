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
  Lock
} from 'lucide-react';

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
      // 1. Dynamic Meta Hardening
      document.title = `${symbol} Fundamental Audit & Price Target | MarketBeacon Pro`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `Get the institutional 100-point audit for ${symbol}. Audit Score: ${(data.score || 0).toFixed(0)}, Smart Money: ${(data.smartMoney || 0).toFixed(1)}%, Target Upside: +${data.upside}%. Verified logic by MarketBeacon Pro.`);
      }

      // Pillar #3: Dynamic OpenGraph (Viral Hardening)
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

      // 2. JSON-LD Structured Data (Rich Snippets)
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

      // Pillar #1: Canonical Hardening
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-black text-white mb-4">Stock Not Found</h1>
        <Link to="/" className="text-blue-400 hover:underline">Return to Terminal</Link>
      </div>
    </div>
  );

  const scoreColor = data.score >= 80 ? 'text-emerald-400' : data.score >= 60 ? 'text-blue-400' : 'text-amber-400';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      {/* Premium Header */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter text-xl text-white">MARKETBEACON<span className="text-blue-500">PRO</span></span>
          </div>
          <button 
            onClick={handleShare}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <Share2 className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20 uppercase tracking-widest">Institutional Audit</span>
              <span className="text-slate-500 text-xs font-medium">Updated: {new Date().toLocaleDateString()}</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tight mb-4">
              {symbol}<span className="text-slate-600">.NS</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              Proprietary 100-point fundamental audit and strategy matrix analysis for institutional grade execution.
            </p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
            <div className={`text-7xl font-black mb-2 ${scoreColor}`}>
              {(data.score || 0).toFixed(0)}
            </div>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Audit Score</div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-8">
              <div 
                className={`h-full transition-all duration-1000 ${data.score >= 80 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                style={{ width: `${(data.score || 0).toFixed(0)}%` }} 
              />
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <span>Verified Institutional Logic</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Market Cap', value: `₹${(data.marketCap / 10000000).toFixed(0)} Cr`, icon: Globe },
            { label: 'Smart Money', value: `${(data.smartMoney || 0).toFixed(1)}%`, icon: TrendingUp },
            { label: 'Target Upside', value: `+${data.upside}%`, icon: Target },
            { label: 'Risk Profile', value: data.risk || 'Low', icon: ShieldCheck },
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <item.icon className="w-5 h-5 text-blue-500 mb-4" />
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{item.label}</div>
              <div className="text-xl font-black text-white">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Strategy Matrix Section (Teaser) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-1 px-1 mb-12">
          <div className="bg-slate-950 rounded-[22px] p-8 lg:p-12 overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-6">Strategy Matrix Analysis</h2>
              <div className="space-y-4 mb-10">
                {data.strategies?.map((strat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="font-bold text-slate-300">{strat.name}</span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-black rounded-md border border-emerald-500/20">QUALIFIED</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-xl blur-[2px]">
                  <span className="font-bold text-slate-500">Momentum Ceiling (Step-Back)</span>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-bold">LOCKED</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-black rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  Unlock Full Report <ArrowUpRight className="w-5 h-5" />
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-black rounded-xl border border-slate-800 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Join 30,000+ Traders
                </Link>
              </div>
            </div>
            
            {/* Abstract Background Element */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />
          </div>
        </div>

        {/* Pillar #2: Internal Link Matrix (Related Picks) */}
        <div className="mb-24">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white tracking-tight">Related Institutional Picks</h2>
              <Link to="/" className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">View All Audits</Link>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["HDFCBANK", "INFY", "RELAXO", "TCS"].filter(s => s !== symbol).slice(0, 4).map((sym) => (
                <Link 
                  key={sym} 
                  to={`/analysis/${sym}`}
                  className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-black text-white italic tracking-tighter group-hover:text-blue-400">{sym}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-500" />
                  </div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">View 100-Point Audit</div>
                </Link>
              ))}
           </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 pt-12 pb-24 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
              <BarChart2 className="w-3 h-3 text-slate-400" />
            </div>
            <span className="font-black tracking-tighter text-sm text-slate-500">MARKETBEACON<span className="text-slate-700">PRO</span></span>
          </div>
          <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
            MarketBeacon Pro is an institutional grade research terminal. 
            Investments in securities market are subject to market risks. 
            Read all the related documents carefully before investing.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PublicAnalysisPage;
