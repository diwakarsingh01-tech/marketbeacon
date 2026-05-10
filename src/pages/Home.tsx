import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Target, 
  Globe, 
  ChevronRight,
  ArrowRight,
  Trophy,
  Activity
} from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 md:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-2">
           <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Activity className="h-6 w-6" />
           </div>
           <span className="text-xl font-black tracking-tighter uppercase italic">MarketBeacon</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
           <a href="#features" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Features</a>
           <a href="#pricing" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Pricing</a>
           <Link to="/login" className="text-xs font-black uppercase tracking-widest text-slate-900 hover:text-blue-600 transition-colors">Login</Link>
           <Link to="/register" className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all">Start Free Trial</Link>
        </div>
        <div className="flex md:hidden items-center space-x-4">
           <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-slate-900">Login</Link>
           <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Join</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 md:pt-40 pb-20 px-6 md:px-10 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
         <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
               <ShieldCheck className="h-4 w-4 text-blue-600" />
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Institutional Grade Analytical Model</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
               Master the <span className="text-blue-600">Market Pulse</span> with AI.
            </h1>
            <p className="text-lg md:text-xl font-medium text-slate-500 max-w-lg leading-relaxed text-center lg:text-left mx-auto lg:mx-0">
               Advanced algorithmic screening, professional fundamentals, and Batch-9 engineering filters. Built for high-conviction retail investors.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:space-x-6">
               <Link to="/register" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-black transition-all group text-center text-center">
                  <span>Get Started Now</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
               </Link>
               <div className="flex -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256&h=256&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop"
                  ].map((url, i) => (
                    <img key={i} src={url} className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm" alt="User" />
                  ))}
                  <div className="h-10 px-3 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full border-2 border-white text-[10px] font-black italic">+2.4k users</div>
               </div>
            </div>
         </div>

         <div className="relative group perspective-1000 animate-in fade-in slide-in-from-right duration-1000">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative glass-card rounded-[3rem] p-4 bg-white/50 backdrop-blur-xl border border-white/20 shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700 overflow-hidden">
               {/* Dashboard Mockup UI - Replaced with a real-style preview */}
               <div className="bg-slate-900 rounded-[2.5rem] h-[550px] w-full p-2 flex flex-col overflow-hidden shadow-inner border border-slate-800">
                  <div className="bg-slate-800/50 p-4 flex items-center space-x-2 border-b border-slate-700/50">
                    <div className="flex space-x-1.5">
                      <div className="h-2 w-2 rounded-full bg-red-500/50" />
                      <div className="h-2 w-2 rounded-full bg-amber-500/50" />
                      <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="h-3 w-40 bg-slate-700/50 rounded-full mx-auto" />
                  </div>
                  <div className="flex-1 p-6 space-y-6 overflow-hidden">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 bg-slate-800/80 rounded-2xl border border-slate-700 p-4 space-y-3">
                        <div className="h-2 w-16 bg-slate-600 rounded-full" />
                        <div className="h-6 w-24 bg-blue-500/20 border border-blue-500/30 rounded-lg" />
                        <div className="h-8 w-full bg-slate-700/50 rounded-lg mt-auto" />
                      </div>
                      <div className="h-32 bg-slate-800/80 rounded-2xl border border-slate-700 p-4 space-y-3">
                        <div className="h-2 w-16 bg-slate-600 rounded-full" />
                        <div className="h-6 w-24 bg-emerald-500/20 border border-emerald-500/30 rounded-lg" />
                        <div className="h-8 w-full bg-slate-700/50 rounded-lg mt-auto" />
                      </div>
                    </div>
                    <div className="bg-slate-800/80 rounded-[2rem] border border-slate-700 p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-32 bg-slate-600 rounded-full" />
                        <div className="h-2 w-20 bg-slate-700 rounded-full" />
                      </div>
                      <div className="h-40 w-full relative">
                         {/* Fake Chart Lines */}
                         <div className="absolute inset-0 flex items-end space-x-1 opacity-50">
                            {[40, 70, 45, 90, 65, 80, 55, 95, 75, 85, 60, 100].map((h, i) => (
                              <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm" />
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-32 px-10 bg-slate-50 relative overflow-hidden">
         <div className="max-w-[1440px] mx-auto">
            <div className="text-center space-y-4 mb-20">
               <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em]">Core Infrastructure</h2>
               <h3 className="text-5xl font-black tracking-tight">The 4 Pillars of Success</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { title: 'Algorithmic Scanning', desc: '9+ Live strategies including Cup & Handle, SMA Support, and 67 ka Funda.', icon: Zap, color: 'text-amber-500 bg-amber-50' },
                 { title: 'Fundamental DNA', desc: 'Strict institutional filters (D/E < 0.2, ROE > 15%) aligned with PDF standards.', icon: Target, color: 'text-blue-500 bg-blue-50' },
                 { title: 'Universe Buckets', desc: 'Automated classification into Super 45, Good 45, and Good 200 lists.', icon: Trophy, color: 'text-emerald-500 bg-emerald-50' },
                 { title: 'Live Price Sync', desc: 'Real-time synchronization with NSE/BSE via professional institutional nodes.', icon: Globe, color: 'text-indigo-500 bg-indigo-50' }
               ].map((f, i) => (
                 <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group">
                    <div className={`p-4 w-fit rounded-2xl mb-6 ${f.color} group-hover:scale-110 transition-transform`}>
                       <f.icon className="h-8 w-8" />
                    </div>
                    <h4 className="text-xl font-black mb-4 tracking-tight">{f.title}</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{f.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Social Proof / Call to Action */}
      <section className="py-40 px-10 text-center">
         <div className="max-w-4xl mx-auto space-y-10">
            <h2 className="text-6xl font-black tracking-tighter">Ready to trade with <br/><span className="text-blue-600 italic underline underline-offset-8">Data, not Luck?</span></h2>
            <p className="text-lg font-bold text-slate-400 uppercase tracking-widest">No credit card required. Instant access to the terminal.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link to="/register" className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all">Start Your Free Journey</Link>
               <Link to="/login" className="w-full sm:w-auto px-12 py-6 bg-white text-slate-900 border-2 border-slate-100 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Member Login</Link>
            </div>
         </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-100 py-20 px-10">
         <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4">
               <div className="flex items-center space-x-2">
                  <div className="bg-slate-900 p-1.5 rounded-lg text-white">
                     <Activity className="h-4 w-4" />
                  </div>
                  <span className="text-lg font-black tracking-tighter uppercase italic">MarketBeacon</span>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Analytical Research Lab. All rights reserved.</p>
            </div>
            <div className="flex items-center space-x-10">
               <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Privacy</a>
               <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Terms</a>
               <a href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900">Contact</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default HomePage;
