import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, BookOpen, ShieldCheck, Award, Compass, Search,
  BarChart3, Layers, Target, TrendingUp, Brain, GraduationCap,
  Code2, ExternalLink, ArrowRight, ChevronRight
} from 'lucide-react';

export const IntroPage: React.FC = () => {
  return (
    <div className="prose prose-invert max-w-none">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent-amber)]/5 via-[var(--bg-primary)] to-emerald-500/5 border border-[var(--border-primary)] p-8 md:p-12 lg:p-16 mb-12">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }} />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            v18.5.0-PRO — Latest
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            MarketBeacon Pro
            <br />
            <span className="bg-gradient-to-r from-[var(--accent-amber)] to-emerald-400 bg-clip-text text-transparent">
              Documentation
            </span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed mb-8 max-w-2xl">
            Build institutional-grade portfolios with mathematical precision. 
            Complete guides for the ABCD Framework, 9 strategies, and platform mastery.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/docs/quickstart"
              className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/90 text-[#020617] font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-[var(--accent-amber)]/25"
            >
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/docs/abc-framework"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-semibold rounded-xl transition-all"
            >
              <BookOpen className="h-4 w-4" />
              ABCD Framework
            </Link>
            <a
              href="https://marketbeaconpro.com/app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-3.5 bg-transparent hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] font-semibold rounded-xl transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              Launch App
            </a>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Start Here</h2>
            <p className="text-[var(--text-secondary)] mt-1">Choose your entry point based on experience level</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: GraduationCap,
              color: 'emerald',
              title: 'New to MarketBeacon?',
              description: 'Start with the fundamentals. Learn the ABCD framework, core rules, and how to navigate the platform.',
              cta: 'Beginner Path',
              href: '/docs/beginner-path',
              items: ['ABCD Framework', 'Core Selection Rules', 'Risk Management', 'Platform Tour'],
            },
            {
              icon: Zap,
              color: 'blue',
              title: 'Know the Basics?',
              description: 'Jump straight to strategies. Compare all 9 strategies, see entry/exit rules, and find your edge.',
              cta: 'Strategy Library',
              href: '/docs/strategies',
              items: ['Free Strategies', 'Pro Strategies', 'Alpha Strategies', 'Comparison Table'],
            },
            {
              icon: Code2,
              color: 'purple',
              title: 'Building Something?',
              description: 'API reference, webhooks, data schemas, and integration guides for developers.',
              cta: 'API Reference',
              href: '/docs/api-reference',
              items: ['REST API', 'Webhooks', 'Data Schemas', 'Rate Limits'],
            },
          ].map((card, i) => (
            <Link
              key={i}
              to={card.href}
              className="group relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-[var(--accent-amber)]/50 hover:shadow-xl hover:shadow-[var(--accent-amber)]/5 transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-${card.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative flex flex-col h-full">
                <div className={`w-12 h-12 rounded-xl bg-${card.color}-500/10 border border-${card.color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className={`h-6 w-6 text-${card.color}-400`} />
                </div>
                <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{card.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6 flex-1">{card.description}</p>
                <ul className="space-y-2 mb-6">
                  {card.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="inline-flex items-center gap-2 font-semibold text-[var(--accent-amber)] group-hover:gap-3 transition-all">
                  {card.cta}
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Full Documentation Index */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-8">Complete Documentation</h2>
        
        <div className="space-y-8">
          {DOC_SECTIONS.map((section) => (
            <div key={section.id} className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]/50 rounded-2xl overflow-hidden">
              <div className="p-6 md:p-8 border-b border-[var(--border-primary)]/50 bg-[var(--bg-primary)]/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 text-[var(--accent-amber)] text-sm font-semibold mb-3">
                      {section.badge}
                    </div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)]">{section.title}</h3>
                    <p className="text-[var(--text-secondary)] mt-1 max-w-2xl">{section.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.pages.map((page) => (
                    <Link
                      key={page.slug}
                      to={page.slug}
                      className="group flex items-start gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]/50 hover:border-[var(--accent-amber)]/30 hover:bg-[var(--bg-secondary)]/50 transition-all duration-200"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${section.color}`}>
                        <page.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-amber)] transition-colors">
                          {page.title}
                        </h4>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1 line-clamp-2">{page.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {page.difficulty && (
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                              page.difficulty === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' :
                              page.difficulty === 'intermediate' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {page.difficulty}
                            </span>
                          )}
                          {page.updated && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                              Updated {page.updated}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-amber)] transition-colors shrink-0 mt-1" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-[var(--accent-amber)]/10 to-emerald-500/10 border border-[var(--accent-amber)]/20 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-4">Ready to dive deeper?</h2>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
          Join 10,000+ investors using institutional frameworks. Start your free trial or explore the platform.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://marketbeaconpro.com/app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-[var(--accent-amber)] text-[#020617] font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Launch Platform Free
          </a>
          <Link
            to="/docs/beginner-path"
            className="px-6 py-3 border border-[var(--border-primary)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--bg-tertiary)] transition-all"
          >
            Follow Guided Path
          </Link>
        </div>
      </section>
    </div>
  );
};

// Documentation sections data
const DOC_SECTIONS = [
  {
    id: 'foundation',
    badge: 'Foundation',
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    title: 'ABCD Framework & Core Rules',
    description: 'The mathematical backbone of every strategy. Master these before anything else.',
    pages: [
      { slug: '/docs/abc-framework', icon: Layers, title: 'ABCD Averaging Framework', description: 'Tranche-based position building with 10% gap rule, laddered targets, and platform integration.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/core-selection-rules', icon: ShieldCheck, title: 'Core Selection Rules', description: 'Universal institutional filters: market cap tiers, fundamental audit, smart money threshold, D/E limits.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/risk-management', icon: Target, title: 'Risk Management & Allocation', description: '50:30:20 rule, portfolio sizing, sector caps, tranche sizing, invalidation points.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/baskets', icon: Search, title: 'Understanding Baskets', description: 'Elite (Super 45), Quality (Good 45), Growth (dynamic), Fallen Value — which universe for which strategy.', difficulty: 'beginner', updated: 'Jul 2026' },
    ],
  },
  {
    id: 'free-strategies',
    badge: 'Free Tier',
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    title: 'Free Strategies',
    description: 'Available to all users. Statistical mean reversion and institutional demand zones.',
    pages: [
      { slug: '/docs/bollinger', icon: BarChart3, title: 'Bollinger Band Strategy', description: 'Lower band touch + squeeze confirmation + fundamental gate. Mean reversion at statistical extreme.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/envelope-long', icon: Layers, title: 'Envelope Long', description: 'Weekly lower envelope = institutional demand zone. Elite/Quality basket only. 20-25% typical recovery.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/envelope-short', icon: TrendingUp, title: 'Envelope Short (Pullback)', description: 'EMA 200 pullback in confirmed uptrend. Tighter 5% averaging. Momentum continuation play.', difficulty: 'intermediate', updated: 'Jul 2026' },
    ],
  },
  {
    id: 'pro-strategies',
    badge: 'Pro Tier',
    color: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    title: 'Pro Strategies',
    description: 'Structural patterns with ABCD integration. Requires Pro subscription.',
    pages: [
      { slug: '/docs/sma-bcd', icon: BarChart3, title: 'SMA + BCD (Stacking Reversal)', description: 'Bearish SMA stack (20<50<200). Enter at B (SMA 50), not A. Structural reversal from max pessimism.', difficulty: 'intermediate', updated: 'Jul 2026' },
      { slug: '/docs/52w-high-low', icon: Compass, title: '52-Week High/Low', description: 'Annual range statistical system. Elite/Mid caps within 3% of 52W low. Target = 52W high.', difficulty: 'intermediate', updated: 'Jul 2026' },
      { slug: '/docs/cup-handle', icon: Target, title: 'Cup with Handle + ABCD', description: 'U-shaped base 3-12 months, tight handle ≤15%. Breakout target = cup depth added to lip.', difficulty: 'advanced', updated: 'Jul 2026' },
    ],
  },
  {
    id: 'alpha-strategies',
    badge: 'Alpha Tier',
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    title: 'Alpha Strategies',
    description: 'Institutional-grade setups. Deep value, velocity retest, and price action at key zones.',
    pages: [
      { slug: '/docs/support-resistance', icon: BarChart3, title: 'Support & Resistance (S&R)', description: 'Historically validated zones. 2nd/3rd retest entry. Broken support becomes resistance.', difficulty: 'advanced', updated: 'Jul 2026' },
      { slug: '/docs/institutional-reset', icon: Award, title: 'Institutional Reset (67%)', description: '67%+ drawdown from ATH with intact fundamentals. Sales/profit near ATH. 200%+ recovery potential.', difficulty: 'advanced', updated: 'Jul 2026' },
      { slug: '/docs/velocity-retest', icon: Zap, title: 'Velocity Retest (20%)', description: '20%+ rally from deep base (<200 DMA), then retest origin. Front-loaded ABCD (40/30/20/10).', difficulty: 'advanced', updated: 'Jul 2026' },
    ],
  },
  {
    id: 'platform',
    badge: 'Platform Mastery',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    title: 'Platform Mastery',
    description: 'Deep guides for every tool. Screen, analyze, chart, allocate, and journal like a pro.',
    pages: [
      { slug: '/docs/screener', icon: Search, title: 'Matrix Screener', description: 'Universe selection, strategy dropdown, Passed/Observation/Fail tabs, CSV export, bookmarking.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/alpha-hub', icon: Compass, title: 'Alpha Hub', description: 'Capital allocation engine, basket distribution, strategy breakdown, performance vs Nifty, redemption calc.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/charts', icon: BarChart3, title: 'Chart Terminal', description: 'Multi-timeframe, ABCD overlays, S&R zones, strategy signals, drawing tools, layout persistence.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/beacon-ai', icon: Brain, title: 'BeaconAI Assistant', description: 'Natural language portfolio analysis, strategy evaluation, filter suggestions, risk audits.', difficulty: 'intermediate', updated: 'Jul 2026' },
      { slug: '/docs/manager', icon: Layers, title: 'Portfolio Manager', description: 'Position tracking, P&L, allocation vs target, tranche status, journal integration.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/journal', icon: BookOpen, title: 'Trade Journal', description: 'Institutional-grade ledger. Reasoning tags, emotion tracking, performance analytics.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/education', icon: GraduationCap, title: 'Video Course', description: 'Structured curriculum: Foundation → Free → Pro → Alpha → Lab → Live Application.', difficulty: 'beginner', updated: 'Jul 2026' },
    ],
  },
  {
    id: 'reference',
    badge: 'Reference',
    color: 'bg-slate-500/10 border-slate-500/20 text-slate-400',
    title: 'Reference & Resources',
    description: 'Glossary, methodology, data sources, FAQ, and developer resources.',
    pages: [
      { slug: '/docs/glossary', icon: BookOpen, title: 'Glossary', description: 'Definitions for every term: ABCD, tranche, smart money, basket, invalidation, CAGR, Sharpe, etc.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/methodology', icon: Code2, title: 'Calculation Methodology', description: 'Exact formulas for audit scores, ABCD levels, envelope bands, SMA stacking, drawdown calc.', difficulty: 'advanced', updated: 'Jul 2026' },
      { slug: '/docs/data-sources', icon: Search, title: 'Data Sources & Quality', description: 'NSE/BSE feeds, fundamentals sourcing, update frequency, survivorship bias handling.', difficulty: 'intermediate', updated: 'Jul 2026' },
      { slug: '/docs/api-reference', icon: Code2, title: 'API Reference', description: 'REST endpoints, authentication, webhooks, rate limits, SDKs, example integrations.', difficulty: 'advanced', updated: 'Jul 2026' },
      { slug: '/docs/faq', icon: Search, title: 'Frequently Asked Questions', description: 'Billing, subscriptions, strategy access, data delays, troubleshooting common issues.', difficulty: 'beginner', updated: 'Jul 2026' },
      { slug: '/docs/changelog', icon: ExternalLink, title: 'Changelog', description: 'Version history, new features, bug fixes, strategy additions, platform updates.', difficulty: 'beginner', updated: 'Jul 2026' },
    ],
  },
];

export default IntroPage;