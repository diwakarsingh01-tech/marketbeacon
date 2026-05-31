import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import BrandLogo from '../components/brand/BrandLogo';
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
  ExternalLink
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const PublicAnalysisPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stock-fundamentals?symbol=${symbol}`);
        const d = await res.json();
        if (res.ok) setData(d);
      } catch (e) {
        console.error('Failed to fetch analysis:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [symbol]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `MarketBeacon Pro: ${symbol} Institutional Analysis`,
        text: `Check out the institutional-grade fundamental analysis for ${symbol} on MarketBeacon Pro.`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Analysis Not Found</h1>
        <p className="text-slate-500 mb-6">The requested institutional audit for {symbol} is currently unavailable.</p>
        <Link to="/" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">Return Home</Link>
      </div>
    </div>
  );

  const score = data.score || 0;
  const isPass = data.isPass;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header / Brand Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/">
            <BrandLogo variant="light" size={32} />
          </Link>
          <button 
            onClick={handleShare}
            className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Report</span>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Stock Title */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Institutional Report</span>
                    <Globe className="w-3 h-3 text-slate-300" />
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{symbol}</h1>
                  <p className="text-slate-500 font-medium">{data.industry}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900">₹{data.price.toLocaleString()}</div>
                  <div className={`text-sm font-bold flex items-center justify-end ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Quick Ratios */}
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">PE Ratio</p>
                  <p className="text-lg font-black text-slate-900">{data.peRatio.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ROE</p>
                  <p className="text-lg font-black text-slate-900">{data.roe?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">D/E Ratio</p>
                  <p className="text-lg font-black text-slate-900">{data.debtToEquity.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Strategy Logic */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Strategy Matrix Audit</h3>
              </div>

              <div className="space-y-4">
                {Object.entries(data.strategies || {}).map(([name, strat]: [string, any]) => (
                  <div key={name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-700">{name.replace(/_/g, ' ')}</span>
                    <div className="flex items-center space-x-3">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${strat?.isBuyZone ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                        {strat?.isBuyZone ? 'Qualified' : 'Neutral'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Score */}
          <div className="space-y-8">
            <div className={`rounded-[2.5rem] p-8 text-white shadow-xl ${isPass ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-900 shadow-slate-200'}`}>
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Audit Score</p>
                <div className="text-7xl font-black tracking-tighter">{score}</div>
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full backdrop-blur-md">
                   {isPass ? <ShieldCheck className="w-4 h-4 mr-2" /> : <Info className="w-4 h-4 mr-2" />}
                   <span className="text-xs font-bold uppercase tracking-widest">{isPass ? 'Institutional Pass' : 'Audit Rejected'}</span>
                </div>
              </div>
              <p className="mt-8 text-sm font-medium opacity-70 text-center leading-relaxed">
                This score is based on the 100-point Batch 10 Institutional Audit framework, checking for Debt, Promoters, and Sales Growth.
              </p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center">
               <h4 className="text-lg font-black text-slate-900 mb-4">Master the Matrix?</h4>
               <p className="text-slate-500 text-sm font-medium mb-6">Join 30,000 traders using institutional data to catch high-probability setups.</p>
               <Link to="/login" className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform">
                 Get Full Access
                 <ArrowUpRight className="inline w-4 h-4 ml-2" />
               </Link>
            </div>
          </div>

        </div>
      </main>

      <footer className="max-w-4xl mx-auto p-12 text-center border-t border-slate-200">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">MarketBeacon Pro &copy; 2026</p>
         <div className="flex items-center justify-center space-x-6">
           <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors"><ExternalLink className="w-4 h-4" /></a>
         </div>
      </footer>
    </div>
  );
};

export default PublicAnalysisPage;
