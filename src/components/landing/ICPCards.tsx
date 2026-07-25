import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, BarChart2, ShieldCheck } from 'lucide-react';
import { waLink } from '../../lib/constants';
import { motion } from 'framer-motion';

const ICPCards: React.FC = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      aria-label="Who is MarketBeacon Pro for" className="py-20 px-6 md:px-10 border-y border-slate-100 bg-white relative overflow-hidden">
       
       <div className="max-w-[1200px] mx-auto relative">
         <div className="text-center mb-14">
           <p className="text-xs font-bold text-[#00d09c] uppercase tracking-[0.4em] mb-3">Kiske Liye Hai?</p>
           <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-800">Aapki Category <span className="text-[#00d09c]">Kaunsi Hai?</span></h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/* Segment 1: Retail Trader */}
            <div className="card group relative p-8 hover:border-[#00d09c]/60 transition-all hover:-translate-y-2 flex flex-col h-full bg-white overflow-hidden">
              <div className="p-3 bg-emerald-50 border border-[#00d09c]/20 rounded-2xl w-fit mb-6 transition-colors flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-[#00d09c]" />
              </div>
              <div className="mb-2 text-xs font-bold text-[#00d09c] uppercase tracking-[0.3em]">Retail Trader</div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tighter mb-3">Portfolio: ₹5L – ₹50L</h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6 break-words">
                "I never knew when to research entry vs wait for confirmation. — The ABCD Tranche system gives institutional clarity."
              </p>
              <div className="space-y-2 mb-8 flex-1 min-h-[120px]">
               {['100-Point Audit Score Free', 'ABCD Entry Zones', 'Live Screener Access'].map((f, index) => (
                 <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                   <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-2.5 h-2.5 text-[#00d09c]" />
                   </div>
                   <span className="relative">
                     {f}
                     {index === 0 && (
                       <span className="absolute -top-1 -right-1 text-xs font-bold text-emerald-500 uppercase tracking-wider">NEW</span>
                     )}
                   </span>
                 </div>
               ))}
             </div>
             <Link to="/login" className="w-full py-3.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-caption text-center transition-all shadow-md shadow-[#00d09c]/15">
               Start Free Trial
             </Link>
           </div>

{/* Segment 2: Sub-broker / Advisor */}
            <div className="card group relative p-8 hover:border-[#00d09c]/60 transition-all hover:-translate-y-2 flex flex-col h-full bg-white overflow-hidden">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00d09c] text-white px-4 py-1 rounded-full text-caption whitespace-nowrap shadow-md flex-shrink-0">
                Most Popular
              </div>
              <div className="p-3 bg-emerald-50 border border-[#00d09c]/20 rounded-2xl w-fit mb-6 mt-2 transition-colors flex-shrink-0">
                <Users className="h-6 w-6 text-[#00d09c]" />
              </div>
              <div className="mb-2 text-xs font-bold text-[#00d09c] uppercase tracking-[0.3em]">Sub-broker / Advisor</div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tighter mb-3">Client Portfolio Manager</h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6 break-words">
                "I need to justify every research note to clients. — The Audit Score helps me back every call with data."
              </p>
              <div className="space-y-2 mb-8 flex-1 min-h-[120px]">
               {['Audit Trail per Trade', 'Client-Ready Data Reports', 'Educational Research Framework'].map((f, index) => (
                 <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                   <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-2.5 h-2.5 text-[#00d09c]" />
                   </div>
                   <span className="relative">
                     {f}
                     {index === 1 && (
                       <span className="absolute -top-1 -right-1 text-xs font-bold text-amber-500 uppercase tracking-wider">PRO</span>
                     )}
                   </span>
                 </div>
               ))}
             </div>
             <Link to="/license-desk" className="w-full py-3.5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-caption text-center transition-all shadow-md shadow-[#00d09c]/15">
               Get Pro Access
             </Link>
           </div>

{/* Segment 3: HNI / Family Office */}
            <div className="card group relative p-8 hover:border-amber-400/50 transition-all hover:-translate-y-2 flex flex-col h-full bg-white overflow-hidden">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl w-fit mb-6 transition-colors flex-shrink-0">
                <BarChart2 className="h-6 w-6 text-amber-500" />
              </div>
              <div className="mb-2 text-xs font-bold text-amber-500 uppercase tracking-[0.3em]">HNI / Family Office</div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tighter mb-3">Portfolio: ₹50L+</h3>
              <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6 break-words">
                "Risk management weak hai, capital protect nahi ho raha." — Tranche Laddering se capital systematic way mein deploy hota hai. No emotional decisions.
              </p>
              <div className="space-y-2 mb-8 flex-1 min-h-[120px]">
               {['Full Alpha Hub Access', 'Priority Alpha Strategy Triggers', 'Custom Enterprise Node'].map((f, index) => (
                 <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                   <div className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-2.5 h-2.5 text-amber-500" />
                   </div>
                   <span className="relative">
                     {f}
                     {index === 2 && (
                       <span className="absolute -top-1 -right-1 text-xs font-bold text-emerald-500 uppercase tracking-wider">EXCLUSIVE</span>
                     )}
                   </span>
                 </div>
               ))}
             </div>
             <button
               onClick={() => window.open(waLink('Hi Admin, I am interested in Alpha Access for my HNI portfolio.'), '_blank')}
               className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-caption text-center transition-all shadow-md active:scale-95"
             >
               Contact for Alpha
             </button>
           </div>
         </div>
       </div>
     </motion.section>
  );
};

export default ICPCards;
