import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Target, ShieldCheck, TrendingUp, Users, BarChart3, BookOpen } from 'lucide-react';
import BrandLogo from '../components/brand/BrandLogo';
import SEO from '../components/SEO';

const AboutPage: React.FC = () => {
  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  const values = [
    { icon: ShieldCheck, title: 'Transparency', desc: 'Every score, signal, and analysis is clearly explained. No black boxes.' },
    { icon: BarChart3, title: 'Data-Driven', desc: 'All models are built on publicly available market data and quantifiable metrics.' },
    { icon: TrendingUp, title: 'Continuous Innovation', desc: 'We update strategies regularly based on market regime changes.' },
    { icon: Users, title: 'Trader-First', desc: 'Built by traders, for traders. Tools that actually help decision-making.' },
    { icon: BookOpen, title: 'Education First', desc: 'We believe in empowering traders through knowledge, not hype.' },
    { icon: Target, title: 'Institutional Grade', desc: 'ABCD Tranche logic adapted from institutional desk methodologies.' },
  ];

  const team = [
    { name: 'Diwakar Singh', role: 'Founder & Lead Developer', initials: 'DS' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <SEO title="About MarketBeacon Pro" description="Learn about MarketBeacon Pro — India's institutional-grade stock research platform powered by ABCD Tranche logic and quantitative audit scores." />
      <nav className="border-b border-[var(--border-primary)]/60 px-6 md:px-10 py-5 flex items-center justify-between bg-[var(--bg-primary)]/80 sticky top-0 z-50 backdrop-blur-md">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo variant="dark" size={28} />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-[var(--text-muted)] hover:text-white uppercase tracking-widest transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Home
        </Link>
      </nav>

      <header className="py-16 px-6 md:px-10 max-w-[800px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
          <Target className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">Our Story</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-4">About MarketBeacon Pro</h1>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl mx-auto">
          We built MarketBeacon Pro because retail traders deserve institutional-grade tools. 
          Our ABCD Tranche Laddering + 100-point Audit Score system brings professional 
          desk methodologies to every Indian trader — at zero or minimal cost.
        </p>
      </header>

      <main className="px-6 md:px-10 max-w-[800px] mx-auto pb-20 space-y-16">

        {/* Mission */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-8">
          <h2 className="text-lg font-black text-white mb-4 tracking-tight">Our Mission</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            To democratize institutional-quality stock analysis for every Indian retail trader. 
            We believe that access to advanced analytical tools should not require a crores-worth 
            terminal subscription or a relationship with a wealth management desk.
          </p>
        </div>

        {/* Problem */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-8">
          <h2 className="text-lg font-black text-white mb-4 tracking-tight">The Problem We Solve</h2>
          <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
            <p>Most retail traders rely on tips, news, or basic charts. Institutional desks use multi-factor scoring, layered entry strategies, and risk-weighted allocation models.</p>
            <p>MarketBeacon Pro bridges this gap by providing:</p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span><strong className="text-slate-200">ABCD Tranche Logic</strong> — Multi-layered entry zones used by institutional desks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span><strong className="text-slate-200">100-Point Audit Score</strong> — Comprehensive stock health assessment on 12 proprietary strategies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span><strong className="text-slate-200">FII/DII Trend Analysis</strong> — Track institutional money flow in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span><strong className="text-slate-200">Alpha-40 Portfolio</strong> — Rules-based allocation engine for optimized stock selection</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-lg font-black text-white mb-6 tracking-tight text-center">Our Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-6 flex gap-4 items-start">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl shrink-0">
                  <v.icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white mb-1">{v.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-8">
          <h2 className="text-lg font-black text-white mb-6 tracking-tight">Team</h2>
          <div className="flex flex-wrap gap-6">
            {team.map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white">
                  {m.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{m.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: '31,402+', label: 'Active Traders' },
            { value: '100+', label: 'Stocks Covered' },
            { value: '12', label: 'Proprietary Strategies' },
          ].map((s, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-6 text-center">
              <p className="text-2xl font-black text-blue-400">{s.value}</p>
              <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-[1.5rem] p-8 text-center">
          <h2 className="text-lg font-black text-white mb-3">Ready to trade like institutions?</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Join 31,402+ traders using ABCD Tranche logic and institutional audit scores.</p>
          <Link to="/login" className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all">
            Launch Terminal Free
          </Link>
        </div>

      </main>

      <div className="border-t border-[var(--border-primary)] py-8 text-center">
        <Link to="/" className="text-[10px] font-black text-[var(--text-muted)] hover:text-blue-400 uppercase tracking-widest transition-colors">
          ← Back to MarketBeacon Pro
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
