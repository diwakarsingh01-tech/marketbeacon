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
      aria-label="Who is MarketBeacon Pro for" className="py-20 px-6 md:px-10 border-y border-[var(--border-primary)]/60 bg-[var(--bg-secondary)]/20 relative overflow-hidden">
      {/* 3D Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-emerald-600/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto relative">
        <div className="text-center mb-14">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3">Kiske Liye Hai?</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)]">Aapki Category <span className="text-blue-400">Kaunsi Hai?</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Segment 1: Retail Trader */}
          <div className="group relative bg-[var(--bg-secondary)]/80 border border-[var(--border-secondary)] rounded-[2rem] p-8 hover:border-blue-500/60 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col backdrop-blur-sm">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl w-fit mb-6 group-hover:bg-blue-500/20 transition-colors">
              <TrendingUp className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
            </div>
            <div className="mb-2 text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] group-hover:text-blue-300 transition-colors">Retail Trader</div>
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter mb-3 group-hover:text-blue-100 transition-colors">Portfolio: ₹5L – ₹50L</h3>
            <p className="text-[var(--text-tertiary)] text-sm leading-relaxed flex-1 mb-6 group-hover:text-[var(--text-secondary)] transition-colors">
              "I never knew when to research entry vs wait for confirmation. — The ABCD Tranche system gives institutional clarity."
            </p>
            <div className="space-y-2 mb-8">
              {['100-Point Audit Score Free', 'ABCD Entry Zones', 'Live Screener Access'].map((f, index) => (
                <div key={f} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                  <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                  </div>
                  <span className="relative">
                    {f}
                    {index === 0 && (
                      <span className="absolute -top-1 -right-1 text-[6px] font-black text-emerald-500 uppercase tracking-wider">NEW</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/login" className="w-full py-3.5 bg-blue-600 text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 transition-all relative overflow-hidden group">
              <span className="relative z-10">Start Free Trial</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>
          </div>

          {/* Segment 2: Sub-broker / Advisor */}
          <div className="group relative bg-[var(--bg-secondary)]/60 border border-emerald-500/40 rounded-[2rem] p-8 hover:border-emerald-400/60 transition-all hover:-translate-y-1 flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-[var(--text-primary)] px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg">
              Most Popular
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl w-fit mb-6 mt-2 group-hover:bg-emerald-500/20 transition-colors">
              <Users className="h-6 w-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
            <div className="mb-2 text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] group-hover:text-emerald-300 transition-colors">Sub-broker / Advisor</div>
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter mb-3 group-hover:text-emerald-100 transition-colors">Client Portfolio Manager</h3>
            <p className="text-[var(--text-tertiary)] text-sm leading-relaxed flex-1 mb-6 group-hover:text-[var(--text-secondary)] transition-colors">
              "I need to justify every research note to clients. — The Audit Score helps me back every call with data."
            </p>
            <div className="space-y-2 mb-8">
              {['Audit Trail per Trade', 'Client-Ready Data Reports', 'Educational Research Framework'].map((f, index) => (
                <div key={f} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/30 transition-colors">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  </div>
                  <span className="relative">
                    {f}
                    {index === 1 && (
                      <span className="absolute -top-1 -right-1 text-[6px] font-black text-amber-500 uppercase tracking-wider">PRO</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/license-desk" className="w-full py-3.5 bg-emerald-600 text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25 transition-all relative overflow-hidden group">
              <span className="relative z-10">Get Pro Access</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>
          </div>

          {/* Segment 3: HNI / Family Office */}
          <div className="group relative bg-[var(--bg-secondary)]/60 border border-amber-500/30 rounded-[2rem] p-8 hover:border-amber-400/50 transition-all hover:-translate-y-1 flex flex-col">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl w-fit mb-6 group-hover:bg-amber-500/20 transition-colors">
              <BarChart2 className="h-6 w-6 text-amber-400 group-hover:text-amber-300 transition-colors" />
            </div>
            <div className="mb-2 text-[9px] font-black text-amber-400 uppercase tracking-[0.3em] group-hover:text-amber-300 transition-colors">HNI / Family Office</div>
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tighter mb-3 group-hover:text-amber-100 transition-colors">Portfolio: ₹50L+</h3>
            <p className="text-[var(--text-tertiary)] text-sm leading-relaxed flex-1 mb-6 group-hover:text-[var(--text-secondary)] transition-colors">
              "Risk management weak hai, capital protect nahi ho raha." — Tranche Laddering se capital systematic way mein deploy hota hai. No emotional decisions.
            </p>
            <div className="space-y-2 mb-8">
              {['Full Alpha Hub Access', 'Priority Alpha Strategy Triggers', 'Custom Enterprise Node'].map((f, index) => (
                <div key={f} className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 transition-colors">
                    <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                  </div>
                  <span className="relative">
                    {f}
                    {index === 2 && (
                      <span className="absolute -top-1 -right-1 text-[6px] font-black text-emerald-500 uppercase tracking-wider">EXCLUSIVE</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => window.open(waLink('Hi Admin, I am interested in Alpha Access for my HNI portfolio.'), '_blank')}
              className="w-full py-3.5 bg-amber-600/80 text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-500/25 transition-all relative overflow-hidden group"
            >
              <span className="relative z-10">Contact for Alpha</span>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ICPCards;
