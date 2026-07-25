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
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <SEO title="About MarketBeacon Pro" description="Learn about MarketBeacon Pro — India's institutional-grade stock research platform powered by ABCD Tranche logic and quantitative audit scores." />
      <nav className="border-b border-slate-100 px-6 md:px-10 py-5 flex items-center justify-between bg-white/95 sticky top-0 z-50 backdrop-blur-md shadow-sm">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo variant="light" size={28} />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Home
        </Link>
      </nav>

      <header className="py-16 px-6 md:px-10 max-w-[800px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d09c]/10 border border-[#00d09c]/20 rounded-full mb-6">
          <Target className="h-3.5 w-3.5 text-[#00d09c]" />
          <span className="text-xs font-bold text-[#00d09c] uppercase tracking-[0.3em]">Our Story</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-4">About MarketBeacon Pro</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
          We built MarketBeacon Pro because retail traders deserve institutional-grade tools. 
          Our ABCD Tranche Laddering + 100-point Audit Score system brings professional 
          desk methodologies to every Indian trader — at zero or minimal cost.
        </p>
      </header>

      <main className="px-6 md:px-10 max-w-[800px] mx-auto pb-20 space-y-16">

        {/* Mission */}
        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Our Mission</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            To democratize institutional-quality stock analysis for every Indian retail trader. 
            We believe that access to advanced analytical tools should not require a crores-worth 
            terminal subscription or a relationship with a wealth management desk.
          </p>
        </div>

        {/* Problem */}
        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">The Problem We Solve</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>Most retail traders rely on tips, news, or basic charts. Institutional desks use multi-factor scoring, layered entry strategies, and risk-weighted allocation models.</p>
            <p>MarketBeacon Pro bridges this gap by providing:</p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-[#00d09c] mt-0.5">→</span>
                <span><strong className="text-slate-800 font-bold">ABCD Tranche Logic</strong> — Multi-layered entry zones used by institutional desks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00d09c] mt-0.5">→</span>
                <span><strong className="text-slate-800 font-bold">100-Point Audit Score</strong> — Comprehensive stock health assessment on 12 proprietary strategies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00d09c] mt-0.5">→</span>
                <span><strong className="text-slate-800 font-bold">FII/DII Trend Analysis</strong> — Track institutional money flow in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00d09c] mt-0.5">→</span>
                <span><strong className="text-slate-800 font-bold">Alpha-40 Portfolio</strong> — Rules-based allocation engine for optimized stock selection</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Values */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight text-center">Our Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 flex gap-4 items-start">
                <div className="p-2.5 bg-[#00d09c]/10 border border-[#00d09c]/20 rounded-xl shrink-0">
                  <v.icon className="h-4 w-4 text-[#00d09c]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{v.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Team</h2>
          <div className="flex flex-wrap gap-6">
            {team.map((m, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00d09c] to-[#00bda0] flex items-center justify-center text-sm font-bold text-white shadow-sm">
                  {m.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{m.role}</p>
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
            <div key={i} className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-6 text-center">
              <p className="text-2xl font-black text-[#00d09c]">{s.value}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Ready to trade like institutions?</h2>
          <p className="text-sm text-slate-500 mb-6">Join 31,402+ traders using ABCD Tranche logic and institutional audit scores.</p>
          <Link to="/login" className="inline-block px-10 py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-[#00d09c]/15">
            Launch Terminal Free
          </Link>
        </div>

      </main>

      <div className="border-t border-slate-100 py-8 text-center bg-slate-50">
        <Link to="/" className="text-xs font-bold text-slate-400 hover:text-[#00d09c] uppercase tracking-wider transition-colors">
          ← Back to MarketBeacon Pro
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
