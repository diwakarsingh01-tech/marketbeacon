import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, BarChart3, BookOpen, Brain, Compass,
  GraduationCap, Home, Play, Settings, TrendingUp, Target,
  Wallet, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getApiUrl } from '../lib/api-utils';
import { useTour } from '../context/TourContext';

const API_URL = getApiUrl();

interface GuideStep {
  id: string;
  title: string;
  description: string;
  menuPath: string;
  icon: any;
  action: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'screener',
    title: 'Discover Stocks',
    menuPath: 'SCREENER – STOCK SCREENER',
    icon: Compass,
    action: 'Filter by sector, market cap, price, volume',
    description: 'Use the Stock Screener to find stocks that match your thesis. Apply filters for sector, market capitalization, price range, and volume to build an initial watchlist.'
  },
  {
    id: 'alpha-hub',
    title: 'Analyze with Institutional Signals',
    menuPath: 'ALPHA HUB – MAIN TERMINAL',
    icon: Target,
    action: 'Review signals, strategy feedback, and scores',
    description: 'Return to Alpha Hub to see institutional strategy signals and validation on your shortlisted names. Each stock gets a strategy score and signal type.'
  },
  {
    id: 'charts',
    title: 'Technical Charting',
    menuPath: 'CHART TERMINAL – TECHNICAL CHARTING',
    icon: BarChart3,
    action: 'Open chart, check trend and support/resistance',
    description: 'For any stock in your watchlist, open the Chart Terminal to view technical set-ups. Check trend direction, key support/resistance levels, and candlestick patterns.'
  },
  {
    id: 'manager',
    title: 'Build Your Portfolio',
    menuPath: 'MANAGER – WEALTH TRACKING',
    icon: Wallet,
    action: 'Add stocks, allocate capital, set positions',
    description: 'Convert your shortlisted stocks into a structured portfolio. Add each stock, allocate capital per position, and track current value.'
  },
  {
    id: 'journal',
    title: 'Document Every Trade',
    menuPath: 'JOURNAL – TRADE LEDGER',
    icon: BookOpen,
    action: 'Record buy/sell, quantity, price, and reasoning',
    description: 'Go to the Trade Ledger to record every trade and decision. Note buy or sell, quantity, price, and your reasoning. This becomes your institutional-grade trade diary.'
  },
  {
    id: 'course',
    title: 'Learn the Framework',
    menuPath: 'EDUCATION – VIDEO COURSE',
    icon: GraduationCap,
    action: 'Watch core modules on risk, allocation, and filtration',
    description: 'If new to institutional strategy, watch the core video modules that explain how the console thinks about risk, allocation, and filtration.'
  },
  {
    id: 'ai',
    title: 'Use AI Strategy Assistance',
    menuPath: 'BEACONAI – STRATEGY AI',
    icon: Brain,
    action: 'Ask specific questions like evaluate portfolio or suggest filters',
    description: 'When ready for AI support, open the Strategy AI assistant and ask specific questions like "help me evaluate this portfolio" or "suggest filters for swing trading mid-cap stocks."'
  },
  {
    id: 'settings',
    title: 'Manage Subscription & Settings',
    menuPath: 'ACCOUNT – LICENSE DESK – SUBSCRIPTION',
    icon: Settings,
    action: 'Access plans, profile, and tutorials',
    description: 'Under Account, use License Desk to manage your access and plans. Use Settings for profile updates. Visit Help for tutorials and platform guidance.'
  },
];

const GuidePage: React.FC = () => {
  const { startTour } = useTour();
  const [loading, setLoading] = useState(true);
  const [apiGuide, setApiGuide] = useState<GuideStep[] | null>(null);

  // Fetch guide content from backend dynamically ("all with us")
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const res = await fetch(`${API_URL}/api/guide`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.steps && Array.isArray(data.steps)) {
            setApiGuide(data.steps);
          }
        }
      } catch (e) {
        // API unavailable — use hardcoded fallback content
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, []);

  const steps = apiGuide || GUIDE_STEPS;

  return (
    <>
      <SEO
        title="Guide — MarketBeacon Pro"
        description="Step-by-step instructions on how to use MarketBeacon Pro for discovering stocks, building portfolios, and tracking performance."
        url="/guide"
      />

      <div className="min-h-screen bg-[#020617] text-[var(--text-primary)]">

        {/* ── Top Bar ── */}
        <div className="border-b border-[var(--border-primary)] bg-[#0a0f1e]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2">
                <Home className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Home</span>
              </Link>
              <span className="text-[var(--text-muted)]">/</span>
              <span className="text-xs font-bold text-[var(--accent-amber)] uppercase tracking-wider">Guide</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => startTour(0)} className="text-xs font-bold text-[var(--accent-amber)] hover:text-[var(--signal-buy)] uppercase tracking-wider flex items-center gap-1.5">
                <Play className="h-3 w-3" /> Start Interactive Tour
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

          {/* ── Hero ── */}
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 rounded-2xl flex items-center justify-center mx-auto">
              <Compass className="h-8 w-8 text-[var(--accent-amber)]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              How to Use <span className="text-[var(--accent-amber)]">MarketBeacon Pro</span>
            </h1>
            <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
              A complete step-by-step guide for going from stock idea to managed portfolio. 
              Free for all users — no subscription required.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Free for All</span>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">No Auth Required</span>
              <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Interactive Tour</span>
            </div>
          </div>

          {/* ── Interactive Tour CTA ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[var(--accent-amber)]/10 to-emerald-500/10 border border-[var(--accent-amber)]/30 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-amber)]/20 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-[var(--accent-amber)]" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[var(--accent-amber)]">Interactive Investment Tour</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Walk through the platform page-by-page with Next & Back navigation</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Click "Start Tour" below and we'll guide you through each page of MarketBeacon Pro — from Alpha Hub to Screener, Charts, Portfolio, Journal, and Education. The tour navigates you automatically with clear instructions at every step.
            </p>
            <button
              onClick={() => startTour(0)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/80 text-[#020617] rounded-xl font-bold uppercase tracking-wider text-xs transition-colors active:scale-95"
            >
              <Play className="h-4 w-4" />
              Start Investment Tour
            </button>
          </motion.div>

          {/* ── Static Steps ── */}
          <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-wider">Workflow</h2>

            {loading ? (
              <div className="text-center py-8 text-sm text-[var(--text-muted)]">Loading guide...</div>
            ) : (
              <div className="grid gap-4">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3 hover:border-[var(--accent-amber)]/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 rounded-lg flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-[var(--accent-amber)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Step {idx + 1}</span>
                          </div>
                          <h3 className="text-sm font-black text-[var(--text-primary)] mb-1">{step.title}</h3>
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{step.description}</p>
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold bg-[var(--accent-amber)]/10 text-[var(--accent-amber)] px-2 py-0.5 rounded-full border border-[var(--accent-amber)]/20">
                              {step.menuPath}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {step.action}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Quick Reference Cards ── */}
          <div className="space-y-6 pt-4">
            <h2 className="text-xl font-black uppercase tracking-wider">Quick Reference</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[var(--signal-buy)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--signal-buy)]">Find Opportunities</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-[var(--accent-amber)] mt-0.5 shrink-0" /> Use the Stock Screener to filter by fundamentals</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-[var(--accent-amber)] mt-0.5 shrink-0" /> Apply sector, market cap, and volume filters</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-[var(--accent-amber)] mt-0.5 shrink-0" /> Bookmark candidates to your watchlist</li>
                </ul>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Analyze & Validate</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" /> Alpha Hub shows institutional strategy signals</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" /> Chart Terminal provides technical setup analysis</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-blue-400 mt-0.5 shrink-0" /> Check support/resistance and trend direction</li>
                </ul>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Build & Execute</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-purple-400 mt-0.5 shrink-0" /> Manager tracks positions and portfolio value</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-purple-400 mt-0.5 shrink-0" /> Set position size and capital allocation</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-purple-400 mt-0.5 shrink-0" /> Journal records every trade with reasoning</li>
                </ul>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Learn & Improve</span>
                </div>
                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> Video Course explains the institutional framework</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> Strategy AI gives on-demand analysis help</li>
                  <li className="flex items-start gap-2"><ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" /> License Desk manages your subscription & plans</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-[var(--border-primary)] pt-6 mt-8">
            <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed max-w-lg mx-auto">
              MarketBeacon Pro is an educational and mathematical analysis platform. It does not provide investment advice, stock recommendations, or financial guidance. All strategies and models are for informational purposes only. Users are solely responsible for their investment decisions. Consult a registered financial adviser before making any financial commitments.
            </p>
          </div>

        </div>
      </div>
    </>
  );
};

export default GuidePage;