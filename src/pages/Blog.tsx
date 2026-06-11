import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen, TrendingUp, ShieldCheck, BarChart2, ChevronRight } from 'lucide-react';
import BrandLogo from '../components/brand/BrandLogo';
import SiteFooter from '../components/layout/SiteFooter';
import SEO from '../components/SEO';

const ARTICLES = [
  {
    slug: 'abcd-tranche-laddering-guide',
    tag: 'Strategy',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    icon: TrendingUp,
    iconColor: 'text-blue-400',
    title: 'What is ABCD Tranche Laddering? A Beginner\'s Guide for Indian Traders',
    excerpt: 'Instead of putting all your capital at one price, ABCD Tranche Laddering splits your entry into 4 systematic tranches — the same method used by FII/DII desks to manage risk and maximize returns.',
    readTime: '6 min read',
    date: 'Jun 06, 2026',
    highlight: 'Most Read',
  },
  {
    slug: 'what-is-sebi-compliant-stock-screener',
    tag: 'Education',
    tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    icon: ShieldCheck,
    iconColor: 'text-emerald-400',
    title: 'What to Know Before Using a Stock Research Tool: A SEBI Framework Guide',
    excerpt: 'Many platforms claim to give buy/sell calls without SEBI registration. Learn the difference between advisory and research tools, and what to look for before using any stock research platform.',
    readTime: '5 min read',
    date: 'Jun 06, 2026',
    highlight: null,
  },
  {
    slug: 'how-to-trade-like-fii-dii-india',
    tag: 'Institutional',
    tagColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    icon: BarChart2,
    iconColor: 'text-amber-400',
    title: 'How to Trade Like FII/DII in India: The Institutional Strategy Explained',
    excerpt: 'FIIs and DIIs don\'t chase breakouts or news — they build positions systematically at value floors. This guide reveals the 3 core principles of institutional capital deployment and how retail traders can replicate it.',
    readTime: '8 min read',
    date: 'Jun 06, 2026',
    highlight: null,
  },
  {
    slug: 'institutional-audit-score-explained',
    tag: 'Deep Dive',
    tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    icon: BookOpen,
    iconColor: 'text-purple-400',
    title: 'The 100-Point Institutional Audit Score: How Stocks Are Graded',
    excerpt: 'Behind every Qualified, Neutral, or Rejected rating is a 100-point audit matrix. We break down each of the 12 fundamental and technical parameters that determine a stock\'s conviction score.',
    readTime: '7 min read',
    date: 'Jun 06, 2026',
    highlight: null,
  },
];

const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SEO title="Stock Market Research Blog" description="Learn institutional research methods, ABCD Tranche strategy, and market analysis. Educational content for Indian stock market investors." />
      {/* Navigation */}
      <nav className="border-b border-slate-800/60 px-6 md:px-10 py-5 flex items-center justify-between backdrop-blur-md bg-slate-950/80 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <BrandLogo variant="dark" size={28} />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors hidden md:block">
            ← Back to Home
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors"
          >
            Launch Terminal
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="py-20 px-6 md:px-10 max-w-[1100px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
          <BookOpen className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Knowledge Base</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-6 leading-none">
          Institutional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Insights.</span>
        </h1>
        <p className="text-slate-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Learn the strategies, systems, and logic behind institutional trading — explained simply for retail traders and advisors.
        </p>
      </header>

      {/* Featured Article */}
      <section className="px-6 md:px-10 max-w-[1100px] mx-auto mb-12">
        <Link
          to={`/blog/${ARTICLES[0].slug}`}
          className="group block bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-blue-500/20 rounded-[2.5rem] p-8 md:p-12 hover:border-blue-400/40 transition-all hover:-translate-y-1"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${ARTICLES[0].tagColor}`}>
                  {ARTICLES[0].tag}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                  ⭐ {ARTICLES[0].highlight}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight group-hover:text-blue-300 transition-colors">
                {ARTICLES[0].title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">{ARTICLES[0].excerpt}</p>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{ARTICLES[0].readTime}</span>
                <span>{ARTICLES[0].date}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-400 text-[11px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                Read Article <ArrowRight className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 space-y-4">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">ABCD Tranche Preview</p>
              {[
                { stage: 'A', pct: '25%', label: 'Base Price Floor', color: 'bg-blue-500' },
                { stage: 'B', pct: '50%', label: 'Pullback Accumulation', color: 'bg-blue-600' },
                { stage: 'C', pct: '85%', label: 'Value Floor Lock', color: 'bg-indigo-500' },
                { stage: 'D', pct: '100%', label: 'Breakout / Target', color: 'bg-emerald-500' },
              ].map(({ stage, pct, label, color }) => (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-300">Stage {stage} — {label}</span>
                    <span className="text-slate-500">{pct}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: pct }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Link>
      </section>

      {/* Article Grid */}
      <section className="px-6 md:px-10 max-w-[1100px] mx-auto pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ARTICLES.slice(1).map((article) => {
            const Icon = article.icon;
            return (
              <Link
                key={article.slug}
                to={`/blog/${article.slug}`}
                className="group bg-slate-900/50 border border-slate-800 rounded-[2rem] p-7 flex flex-col hover:border-slate-600 transition-all hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${article.tagColor}`}>
                    {article.tag}
                  </span>
                  <Icon className={`w-4 h-4 ${article.iconColor}`} />
                </div>
                <h2 className="text-base font-black text-white tracking-tight mb-3 leading-snug flex-1 group-hover:text-blue-300 transition-colors">
                  {article.title}
                </h2>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-5 line-clamp-3">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />{article.readTime}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-black text-blue-400 uppercase tracking-widest group-hover:gap-2 transition-all">
                    Read <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Strip */}
      <section className="border-t border-slate-800 py-16 px-6 text-center bg-slate-900/30">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Ready to Apply This?</p>
        <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter mb-6">Start Using the System. Free.</h3>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-blue-900/30"
        >
          Launch Terminal <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
};

export default BlogPage;
