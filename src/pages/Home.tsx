import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Zap, 
  Target, 
  Globe, 
  ArrowRight,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  { name: 'Jan', alpha: 4000, nifty: 2400 },
  { name: 'Feb', alpha: 3000, nifty: 1398 },
  { name: 'Mar', alpha: 5000, nifty: 3800 },
  { name: 'Apr', alpha: 7780, nifty: 3908 },
  { name: 'May', alpha: 8890, nifty: 4800 },
  { name: 'Jun', alpha: 12390, nifty: 5800 },
];

const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = "MarketBeacon Pro | Institutional Trading Terminal";
    const metaDescription = document.createElement('meta');
    metaDescription.name = "description";
    metaDescription.content = "Join 30,000+ traders using MarketBeacon Pro. Professional institutional-grade stock research powered by 12 proprietary models and Batch-9 fundamental audit.";
    document.head.appendChild(metaDescription);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
           <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Activity className="h-6 w-6" />
           </div>
           <span className="text-xl font-black tracking-tighter uppercase italic">MarketBeacon<span className="text-blue-500">Pro</span></span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
           <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">31,402 Active Traders</span>
           </div>
           <Link to="/login" className="px-6 py-2.5 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Launch Terminal</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-48 pb-32 px-6 md:px-10 max-w-[1440px] mx-auto text-center relative">
        {/* Animated Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-950/50 backdrop-blur-sm rounded-full border border-blue-900 mb-10">
           <ShieldCheck className="h-4 w-4 text-blue-400" />
           <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">v11.6 Institutional Growth Matrix</span>
        </div>
        
        <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter leading-[0.85] text-white mb-10 drop-shadow-2xl">
           TRADE LIKE <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-400">SMART MONEY.</span>
        </h1>
        
        <p className="text-xl md:text-2xl font-medium text-slate-400 max-w-3xl mx-auto leading-relaxed mb-16 px-4">
           The same proprietary 100-point audits and mathematical models used by institutional desks, now accessible to you.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link to="/login" className="w-full md:w-auto inline-flex items-center px-12 py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-blue-500 hover:scale-105 transition-all shadow-2xl shadow-blue-900/40">
             Get Instant Access
          </Link>
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-950 bg-slate-800 overflow-hidden shadow-xl">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="User" />
              </div>
            ))}
            <div className="w-12 h-12 rounded-full border-4 border-slate-950 bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
              +30K
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof (Bento Grid) */}
      <section id="proof" className="py-24 px-6 md:px-10 border-y border-slate-800 bg-slate-900/30">
         <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-4">Proven Institutional Results</h2>
               <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Real-time Performance Verification</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { title: 'Portfolio Growth', val: '+42.8%', desc: 'Avg. growth per Alpha signal', col: 'md:col-span-2' },
                    { title: 'Audit Accuracy', val: '99.4%', desc: 'Batch-9 Validation Rate', col: 'md:col-span-1' },
                    { title: 'Alpha Gain', val: '1.8x', desc: 'Vs Nifty 50 Benchmark', col: 'md:col-span-1' },
                    { title: 'Smart Money Filter', val: '70%+', desc: 'Institutional Hard Reject Rule', col: 'md:col-span-1' },
                    { title: 'Trusted By', val: '31K+', desc: 'Retail & Institutional Traders', col: 'md:col-span-3' },
                ].map((item, i) => (
                    <div key={i} className={`bg-slate-900/80 backdrop-blur-sm p-10 rounded-[2.5rem] border border-slate-800 hover:border-blue-500/50 transition-all group ${item.col}`}>
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 group-hover:text-blue-400 transition-colors">{item.title}</div>
                        <div className="text-5xl font-black text-white mb-3 tracking-tighter">{item.val}</div>
                        <div className="text-sm text-slate-500 font-medium">{item.desc}</div>
                    </div>
                ))}
            </div>
         </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 px-6 text-center">
         <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 p-1 rounded-[3.5rem] shadow-2xl">
            <div className="bg-slate-950 rounded-[3.4rem] px-10 py-20 flex flex-col items-center">
               <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 px-4">Ready to stop guessing?</h3>
               <p className="text-slate-400 font-medium text-lg mb-12 max-w-xl">Join the 31,402 traders who have upgraded their strategy with MarketBeacon Pro.</p>
               <Link to="/login" className="px-16 py-6 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-lg hover:scale-105 transition-all">
                  Launch Terminal Now
               </Link>
            </div>
         </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 w-full p-4 md:hidden bg-slate-950 border-t border-slate-800 z-50">
        <Link to="/login" className="w-full flex items-center justify-center py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl">
           Start Your Trial
        </Link>
      </div>

    </div>
  );
};

export default HomePage;
