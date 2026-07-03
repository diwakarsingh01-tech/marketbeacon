import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, TrendingUp, ShieldCheck, ChevronRight,
  Layers, BarChart3, Calendar, AlertTriangle, Zap,
  LayoutGrid, Briefcase, BookMarked, Store,
  LineChart, Activity, RefreshCw,
  FileText, Search, Eye, Compass
} from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';

// ─────────────────────────────────────────────────────────────────────────────
// DATA: STRATEGIES (exact names from the platform)
// ─────────────────────────────────────────────────────────────────────────────

const strategies = [
  {
    id: 'core_rules',
    name: 'Core Selection Rules',
    subtitle: 'Universal Institutional Filter',
    tier: 'all',
    icon: ShieldCheck,
    color: 'emerald',
    category: 'Foundation',
    tagline: 'Every stock must clear these gates before any strategy applies.',
    sections: [
      {
        heading: 'Market Cap Classification',
        body: 'Large Cap ≥ ₹45,000 Cr · Mid Cap ≥ ₹15,000 Cr · Small Cap < ₹15,000 Cr. Portfolio allocation: Large 50% · Mid 30% · Small 20%.'
      },
      {
        heading: 'Fundamental Audit (Min 70/100)',
        body: 'D/E Ratio ≤ 0.2 (BFSI exempt). Pledged Shares < 2%. PE Ratio ≤ Industry Median. Consistent revenue & profit growth verified TTM.'
      },
      {
        heading: 'Research Window Rule',
        body: 'Move capped at 2% from reference — price must be at or near the research level. Drawdowns allowed up to -30% with ABCD averaging.'
      },
      {
        heading: 'Sector Hardening',
        body: 'Maximum 20% portfolio exposure to any single sector. Prevents concentration risk.'
      },
      {
        heading: 'ABCD Tranche Averaging',
        body: 'A → First tranche. B → -10%. C → -20%. D → -30%. Each tranche equal weight. Full allocation at D.'
      }
    ],
    guardrail: 'Never skip the fundamental audit. A low-priced stock with weak fundamentals is a trap, not an opportunity.'
  },
  {
    id: 'sr_strategy',
    name: 'Support & Resistance Strategy (S&R)',
    subtitle: 'Price Action at Key Zones',
    tier: 'alpha',
    icon: Activity,
    color: 'blue',
    category: 'Alpha Strategy',
    tagline: 'Identify proven support zones where price has historically reversed. Demand zone, supply zone.',
    sections: [
      {
        heading: 'Research Logic',
        body: 'Price revisits a historically validated support zone (multi-touch confirmation). Research on the 2nd or 3rd retest of the level.'
      },
      {
        heading: 'Model Objective',
        body: 'Objective is the next identified resistance zone. Minimum projected move: 20% from entry.'
      },
      {
        heading: 'Qualification',
        body: 'Support zone must have at least 2 prior clean bounces. Price must not have broken the zone by more than 2% on any prior touch.'
      },
      {
        heading: 'Risk Management',
        body: 'Risk guard placed 3–5% below the support zone. If price closes below the zone, trade is invalidated.'
      }
    ],
    guardrail: 'A support zone that breaks decisively becomes resistance. Never average into a broken support.'
  },
  {
    id: 'institutional_reset',
    name: 'Institutional Reset (67%)',
    subtitle: 'Deep Recovery from All-Time High',
    tier: 'alpha',
    icon: RefreshCw,
    color: 'amber',
    category: 'Alpha Strategy',
    tagline: 'Stocks that have corrected 67%+ from their ATH with intact fundamentals offer asymmetric risk-reward.',
    sections: [
      {
        heading: 'Research Trigger',
        body: 'Drawdown ≥ 66% from All-Time High. Fundamental score must still be ≥ 70/100. Institutional holding > 75%.'
      },
      {
        heading: 'Model Objective',
        body: 'Recovery to previous ATH. This typically represents a 200%+ recovery opportunity from the reset zone.'
      },
      {
        heading: 'Validation Checks',
        body: 'Revenue must not have declined > 20% TTM. Pledging < 2%. D/E still ≤ 0.2. No ongoing litigation or governance issue.'
      },
      {
        heading: 'Timeframe',
        body: 'Medium to long-term hold. ATH recovery cycles typically take 12–36 months. ABCD averaging applied if price falls further.'
      }
    ],
    guardrail: 'A 67% drawdown does not guarantee recovery. Fundamentals must remain intact — this is non-negotiable.'
  },
  {
    id: 'velocity_retest',
    name: 'Velocity Retest (20%)',
    subtitle: 'High-Momentum Retest Research',
    tier: 'alpha',
    icon: Zap,
    color: 'indigo',
    category: 'Alpha Strategy',
    tagline: 'Stocks that rallied 20%+ from a base, then pulled back to retest the rally origin — offering a precision re-test.',
    sections: [
      {
        heading: 'Setup Identification',
        body: 'Stock rallied ≥ 20% from a base (Rally Start Low) within 12 months. Price now retests the Rally Start Low within the same 12-month window.'
      },
      {
        heading: 'Research Condition',
        body: 'Research valid only if the original rally started below the 200 DMA (deep demand confirmation). Retest within 5% of Rally Start Low.'
      },
      {
        heading: 'Model Objective',
        body: 'Previous rally peak price. This recreates the full prior move from the origin — typically 20–50% upside.'
      },
      {
        heading: 'Invalidation',
        body: 'If price closes more than 8% below Rally Start Low, the setup is cancelled. Rally was likely a dead-cat bounce.'
      }
    ],
    guardrail: 'Never enter a Velocity Retest if the original rally started above the 200 DMA. The safety line is mandatory.'
  },
  {
    id: 'sma_bcd',
    name: 'SMA + BCD',
    subtitle: 'Moving Average Convergence + ABCD Pattern',
    tier: 'pro',
    icon: LineChart,
    color: 'purple',
    category: 'Pro Strategy',
    tagline: 'When price stacks below all key moving averages (bearish stacking) and forms an ABCD base — the reversal setup is complete.',
    sections: [
      {
        heading: 'SMA Bearish Stacking',
        body: 'Price < SMA 20 < SMA 50 < SMA 200. This alignment confirms maximum short-term pessimism — the ideal accumulation condition.'
      },
      {
        heading: 'BCD Averaging Integration',
        body: 'B → Level at SMA 20. C → Level at SMA 50. D → Level at SMA 200. Equal weight each tranche.'
      },
      {
        heading: 'Model Objective',
        body: 'Full structural reversal back above SMA 20. Minimum 15% historical move. Model objective is prior resistance.'
      },
      {
        heading: 'Confirmation',
        body: 'Requires fundamental audit score ≥ 70. Volume must expand at the D-level reference to confirm institutional accumulation.'
      }
    ],
    guardrail: 'Bearish stacking without fundamental support is a falling knife. Always confirm fundamentals first.'
  },
  {
    id: 'rhs_abcd',
    name: 'Reverse Head & Shoulder + ABCD',
    subtitle: 'Classic Reversal Pattern with ABCD Averaging',
    tier: 'pro',
    icon: TrendingUp,
    color: 'cyan',
    category: 'Pro Strategy',
    tagline: 'The Reverse H&S pattern signals the end of a downtrend. ABCD averaging at the right shoulder gives optimal risk-reward.',
    sections: [
      {
        heading: 'Pattern Structure',
        body: 'Left Shoulder → Head (new low) → Right Shoulder (higher low than head). Structural symmetry must be > 90%.'
      },
      {
        heading: 'Neckline Breakout',
        body: 'Confirmed breakout above the neckline (connecting left & right shoulder peaks) with expanding volume.'
      },
      {
        heading: 'ABCD at Right Shoulder',
        body: 'A → Start of right shoulder. B/C/D → If shoulder deepens, average down. Research at neckline retest post-breakout is ideal.'
      },
      {
        heading: 'Model Objective',
        body: 'Pattern height added to neckline breakout point. Typically 25–40% move from optimal level.'
      }
    ],
    guardrail: 'Pattern fails if right shoulder goes lower than the head. Close immediately if this happens post-entry.'
  },
  {
    id: 'cup_handle',
    name: 'Cup with Handle + ABCD',
    subtitle: 'Rounded Base Breakout',
    tier: 'pro',
    icon: Target,
    color: 'orange',
    category: 'Pro Strategy',
    tagline: 'Rounded cup base followed by a tight handle consolidation. Breakout above handle resistance initiates the markup phase.',
    sections: [
      {
        heading: 'Cup Formation',
        body: 'U-shaped price base (not V-shaped). Duration: 3–12 months. Cup lips must be within 5% price variance of each other.'
      },
      {
        heading: 'Handle Structure',
        body: 'Tight consolidation in upper 30% of cup depth. Handle depth ≤ 15% from cup lip. Low-volume drift is ideal.'
      },
      {
        heading: 'ABCD Level Optimisation',
        body: 'A → Handle entry. B/C/D → If handle dips below midpoint, average into the base. Ideal level = handle breakout point.'
      },
      {
        heading: 'Model Objective',
        body: 'Cup depth added to breakout point. E.g., if cup base was ₹100 and lip ₹140 — objective is ₹140 + ₹40 = ₹180.'
      }
    ],
    guardrail: 'A V-shaped recovery is not a cup — skip it. Only smooth, gradual U-shaped bases qualify.'
  },
  {
    id: '52w_high_low',
    name: '52-Week High Low',
    subtitle: 'Annual Statistical Range System',
    tier: 'pro',
    icon: Calendar,
    color: 'rose',
    category: 'Pro Strategy',
    tagline: 'Mean reversion from annual price extremes. Elite bluechips frequently rebound from 52-week lows.',
    sections: [
      {
        heading: 'Research at 52-Week Low',
        body: 'Price touches or falls within 3% of the 52-week statistical low. Fundamental integrity must be verified (score ≥ 70).'
      },
      {
        heading: 'Model Objective',
        body: '52-week statistical high. Represents the full annual range recovery — typically 30–80% move.'
      },
      {
        heading: 'Stock Qualification',
        body: 'Large or Mid Cap only. Consistent dividend history preferred. No governance or pledging red flags.'
      },
      {
        heading: 'ABCD Application',
        body: 'A → At 52-week low. B/C/D → If price continues declining, average at -8%, -16%, -24% below the annual low.'
      }
    ],
    guardrail: 'New 52-week lows in a fundamentally deteriorating business are traps. Audit financials first — always.'
  },
  {
    id: 'bollinger',
    name: 'Bollinger Band',
    subtitle: 'Statistical Volatility Channel',
    tier: 'free',
    icon: BarChart3,
    color: 'emerald',
    category: 'Free Strategy',
    tagline: 'Mean reversion model using statistical volatility bands. Price at the lower band with low volatility = research indication.',
    sections: [
      {
        heading: 'Lower Band Research',
        body: 'Price touches or closes at the lower Bollinger Band (2 standard deviations below 20-period MA). Low Band Width preferred.'
      },
      {
        heading: 'Band Width Squeeze',
        body: 'Low volatility squeeze (narrow bands) before research confirms the setup. Expansion after squeeze drives the move.'
      },
      {
        heading: 'Model Objective',
        body: 'Upper Bollinger Band. Typically 8–15% move depending on the band width at entry.'
      },
      {
        heading: 'Risk Control',
        body: 'Stop loss: Close below lower band by > 1%. If price walks the lower band for 3+ sessions, close and reassess.'
      }
    ],
    guardrail: 'In a strong downtrend, price can "walk" the lower band for weeks. Always wait for the squeeze confirmation.'
  },
  {
    id: 'envelope_long',
    name: 'Envelope Long',
    subtitle: 'Institutional Demand Zone (Lower Band)',
    tier: 'free',
    icon: Layers,
    color: 'blue',
    category: 'Free Strategy',
    tagline: 'Identifies statistical lower deviation from a moving average — marking institutional demand zones for long entries.',
    sections: [
      {
        heading: 'Research Indication',
        body: 'Price touches or closes near the lower envelope boundary (typically 10–15% deviation below MA). Confirms institutional demand zone.'
      },
      {
        heading: 'Model Objective',
        body: 'Upper envelope boundary — the mathematical recovery to the mean and beyond. Typically 20–25% upside.'
      },
      {
        heading: 'ABCD Averaging',
        body: 'A → Lower envelope touch. B/C/D → If price falls further, ladder entries at equal intervals toward the extreme lower band.'
      },
      {
        heading: 'Timeframe',
        body: 'Weekly chart preferred for envelope calculation. Reliable on large caps with high institutional participation.'
      }
    ],
    guardrail: 'Never enter an envelope long in a stock undergoing fundamental deterioration. The envelope does not protect against bad businesses.'
  },
  {
    id: 'envelope_short',
    name: 'Envelope Short',
    subtitle: 'Momentum Continuation (Upper Band)',
    tier: 'free',
    icon: TrendingUp,
    color: 'violet',
    category: 'Free Strategy',
    tagline: 'Participation model for stocks in strong uptrends. Entry near the secondary regression line (EMA 200) during pullbacks.',
    sections: [
      {
        heading: 'Research Indication',
        body: 'Price pulls back to the EMA 200 or secondary regression line in a confirmed uptrend (higher highs and higher lows structure).'
      },
      {
        heading: 'Model Objective',
        body: '+14% recovery move from reference. Objective is the upper envelope boundary — the momentum continuation zone.'
      },
      {
        heading: 'Stock Criteria',
        body: 'High-momentum names with strong institutional interest. Stock should rarely revisit deep discount zones. Relative strength > market.'
      },
      {
        heading: 'Risk Control',
        body: 'Stop loss: Close below EMA 200. If the uptrend structure breaks (lower low formation), close immediately.'
      }
    ],
    guardrail: 'This is a momentum continuation strategy, not a reversal play. Only use in confirmed uptrends.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA: WEBSITE TOUR
// ─────────────────────────────────────────────────────────────────────────────

const tourSections = [
  {
    id: 'alpha_hub',
    name: 'Alpha Hub',
    path: '/alpha-hub',
    icon: LayoutGrid,
    color: 'blue',
    description: 'Your main command center. Shows live market snapshot, top audited stocks across all strategies, real-time indices, and your portfolio overview at a glance.',
    features: [
      'Live market indices (NIFTY, SENSEX, BANK NIFTY)',
      'Top audited stocks with audit scores',
      'Strategy-wise distribution across baskets',
      'Portfolio P&L quick summary',
      'Recent trigger activity feed'
    ]
  },
  {
    id: 'screener',
    name: 'Matrix Screener',
    path: '/screener',
    icon: Search,
    color: 'indigo',
    description: 'The core strategy matrix engine. Real-time scanning across all 336+ tracked stocks filtered by strategy. Tabs show Passed Audit (meets parameters), Observation (watching), and Audit Fails (failed checks).',
    features: [
      'Passed Audit tab: Stocks meeting audit parameters now',
      'Observation tab: Stocks in observation — not currently triggering',
      'Audit Fails tab: Stocks that failed the audit checks',
      'Filter by Active Universe (Growth / Quality / Elite Basket)',
      'Switch strategy via Model Matrix dropdown',
      'Export Audit as CSV for offline analysis',
      'Click any stock → Full Fundamentals page'
    ]
  },
  {
    id: 'wealth_desk',
    name: 'Wealth Desk',
    path: '/portfolio',
    icon: Briefcase,
    color: 'emerald',
    description: 'Your personal portfolio tracker. Upload holdings from your broker, track real-time P&L, see cap architecture, and manage individual positions.',
    features: [
      'Upload New Details — import broker CSV (merge or overwrite)',
      'Remove Old Details — clear the entire ledger',
      'Add manually — symbol, qty, price',
      'Live CMP pulled automatically for each holding',
      'P&L, Invested Value, Valuation calculated in real time',
      'Cap Architecture breakdown (Large / Mid / Small %)',
      'Edit quantity or price inline in the table'
    ]
  },
  {
    id: 'trade_journal',
    name: 'Trade Journal',
    path: '/trades',
    icon: BookMarked,
    color: 'amber',
    description: 'A verified trade ledger. Log every research note with model, level, notes. Close notes to record outcome. Re-open if needed. Full CSV import/export.',
    features: [
      'Log open notes with price, date, model, objective',
      'Close a note → records price and outcome automatically',
      'Re-open closed trades if exit was premature',
      'Bulk import trades via CSV template download',
      'Delete individual or bulk trades',
      'Filter by Open / Closed segment',
      'Export all trades as CSV for tax/review'
    ]
  },
  {
    id: 'stock_page',
    name: 'Stock Fundamentals',
    path: '/stock/:symbol',
    icon: FileText,
    color: 'purple',
    description: 'Deep-dive into any stock. Full institutional audit — financials, ABCD ladder status, DFH%, sector, market cap, scoring breakdown. Click any stock in the screener to access.',
    features: [
      'Institutional audit score (0–100) with breakdown',
      'Current model classification for this stock',
      'ABCD tranche status and next levels',
      'DFH% (Distance from High) — how far from ATH',
      'Sector, market cap, and fundamental ratios',
      'Links to Screener.in and NSE for deeper research'
    ]
  },
  {
    id: 'marketplace',
    name: 'Access Licenses',
    path: '/license-desk',
    icon: Store,
    color: 'rose',
    description: 'Upgrade your access tier. Free gives you basic strategies. Pro unlocks structural patterns and ABCD. Alpha gives full institutional access including the 3 premium strategies.',
    features: [
      'Free — Bollinger Band, Envelope Long/Short, basic screener',
      'Pro — All Free + ABCD patterns, 52W, SMA+BCD, RHS, Cup & Handle',
      'Alpha — All Pro + S&R, Institutional Reset (67%), Velocity Retest (20%)',
      'Pay via UPI QR — submit UTR for 15-min activation',
      'Redeem Voucher for trial access',
      'Contact Admin for Corporate / Fund deployment'
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR MAP
// ─────────────────────────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; badgeText: string; dot: string }> = {
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',   border: 'border-blue-500/20',   badge: 'bg-blue-600',    badgeText: 'text-white',      dot: 'bg-blue-500' },
  indigo:  { bg: 'bg-indigo-500/10',  text: 'text-indigo-400', border: 'border-indigo-500/20', badge: 'bg-indigo-600',  badgeText: 'text-white',      dot: 'bg-indigo-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400',border: 'border-emerald-500/20',badge: 'bg-emerald-600', badgeText: 'text-white',      dot: 'bg-emerald-500' },
  amber:   { bg: 'bg-amber-500/100/10',   text: 'text-amber-400',  border: 'border-amber-500/20',  badge: 'bg-amber-500/100',   badgeText: 'text-white',      dot: 'bg-amber-500/100' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400', border: 'border-purple-500/20', badge: 'bg-purple-600',  badgeText: 'text-white',      dot: 'bg-purple-500' },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',   border: 'border-cyan-500/20',   badge: 'bg-cyan-600',    badgeText: 'text-white',      dot: 'bg-cyan-500' },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-400', border: 'border-orange-500/20', badge: 'bg-orange-500',  badgeText: 'text-white',      dot: 'bg-orange-500' },
  rose:    { bg: 'bg-rose-500/10',    text: 'text-rose-400',   border: 'border-rose-500/20',   badge: 'bg-rose-600',    badgeText: 'text-white',      dot: 'bg-rose-500' },
  violet:  { bg: 'bg-violet-500/10',  text: 'text-violet-400', border: 'border-violet-500/20', badge: 'bg-violet-600',  badgeText: 'text-white',      dot: 'bg-violet-500' },
};

const tierBadge: Record<string, { label: string; cls: string }> = {
  all:   { label: 'All Tiers', cls: 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]' },
  free:  { label: 'Free',      cls: 'bg-emerald-500/10 text-emerald-400' },
  pro:   { label: 'Pro',       cls: 'bg-blue-500/10 text-blue-400' },
  alpha: { label: 'Alpha',     cls: 'bg-indigo-500/10 text-indigo-400' },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const EducationPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<'strategies' | 'tour'>('strategies');
  const [activeStrategy, setActiveStrategy] = useState('core_rules');
  const [activeTour, setActiveTour] = useState('alpha_hub');

  React.useEffect(() => {
    const linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    linkCanonical.href = 'https://marketbeaconpro.com/education';
    document.head.appendChild(linkCanonical);
    return () => { document.head.removeChild(linkCanonical); };
  }, []);

  const activeStrat = strategies.find(s => s.id === activeStrategy)!;
  const activeTourItem = tourSections.find(t => t.id === activeTour)!;

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans overflow-y-auto pb-20">
      <div className="px-4 md:px-8 lg:px-10 py-6 md:py-10 max-w-7xl mx-auto space-y-8">

        <Breadcrumbs items={[
          { label: 'Resources', href: '/' },
          { label: 'Education Center' }
        ]} />

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-primary)] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shrink-0">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-none">
                Education Center
              </h1>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1">
                Strategy Guides · Platform Tour · Institutional Knowledge
              </p>
            </div>
          </div>

          {/* Main tab switcher */}
          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-1 shadow-sm gap-1 w-fit">
            <button
              onClick={() => setMainTab('strategies')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-caption transition-all ${
                mainTab === 'strategies' ? 'bg-blue-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Strategy Guides
            </button>
            <button
              onClick={() => setMainTab('tour')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-caption transition-all ${
                mainTab === 'tour' ? 'bg-blue-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Website Tour
            </button>
          </div>
        </div>

        {/* ── STRATEGY GUIDES ── */}
        <AnimatePresence mode="wait">
          {mainTab === 'strategies' && (
            <motion.div
              key="strategies"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar */}
              <div className="lg:col-span-4 space-y-2">
                {strategies.map(s => {
                  const c = colorMap[s.color] || colorMap.blue;
                  const isActive = activeStrategy === s.id;
                  const tb = tierBadge[s.tier];
                  return (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveStrategy(s.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        isActive
                          ? `bg-[var(--bg-secondary)] border-2 ${c.border} shadow-lg`
                          : 'bg-[var(--bg-primary)]/60 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? c.bg : 'bg-[var(--bg-tertiary)]'}`}>
                          <s.icon className={`h-4 w-4 ${isActive ? c.text : 'text-[var(--text-tertiary)]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-caption px-2 py-0.5 rounded-full ${tb.cls}`}>
                              {tb.label}
                            </span>
                          </div>
                          <p className={`text-xs font-bold uppercase tracking-tight mt-0.5 truncate ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {s.name}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 ml-2 transition-all ${isActive ? `${c.text} translate-x-0.5` : 'text-[var(--text-tertiary)]'}`} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Content Panel */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStrategy}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--bg-secondary)] rounded-3xl shadow-xl border border-[var(--border-primary)] overflow-hidden"
                  >
                    {/* Card header */}
                    {(() => {
                      const c = colorMap[activeStrat.color] || colorMap.blue;
                      const tb = tierBadge[activeStrat.tier];
                      return (
                        <>
                          <div className={`px-8 py-6 border-b border-[var(--border-primary)] ${c.bg}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-caption px-2.5 py-1 rounded-full ${tb.cls}`}>
                                    {tb.label}
                                  </span>
                                  <span className="text-caption px-2.5 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full">
                                    {activeStrat.category}
                                  </span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-tight mt-2">
                                  {activeStrat.name}
                                </h2>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{activeStrat.subtitle}</p>
                              </div>
                              <div className={`p-3 rounded-2xl ${c.bg} border ${c.border} shrink-0`}>
                                <activeStrat.icon className={`h-7 w-7 ${c.text}`} />
                              </div>
                            </div>
                            {/* Tagline */}
                            <p className={`mt-4 text-sm font-bold ${c.text} italic leading-relaxed border-l-4 ${c.border} pl-4`}>
                              "{activeStrat.tagline}"
                            </p>
                          </div>

                          {/* Sections */}
                          <div className="p-8 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(activeStrat?.sections || []).map((sec, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                  className="bg-[var(--bg-secondary)] rounded-2xl p-5 border border-[var(--border-primary)] space-y-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{sec.heading}</h4>
                                  </div>
                                  <p className="text-[12px] font-bold text-[var(--text-secondary)] leading-relaxed">{sec.body}</p>
                                </motion.div>
                              ))}
                            </div>

                            {/* Guardrail */}
                            <div className="flex items-start gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Institutional Guardrail</p>
                                <p className="text-[12px] font-bold text-amber-300 leading-relaxed">{activeStrat.guardrail}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── WEBSITE TOUR ── */}
          {mainTab === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar */}
              <div className="lg:col-span-4 space-y-2">
                {tourSections.map(t => {
                  const c = colorMap[t.color] || colorMap.blue;
                  const isActive = activeTour === t.id;
                  return (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTour(t.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        isActive
                          ? `bg-[var(--bg-secondary)] border-2 ${c.border} shadow-lg`
                          : 'bg-[var(--bg-primary)]/60 border border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 ${isActive ? c.bg : 'bg-[var(--bg-tertiary)]'}`}>
                          <t.icon className={`h-4 w-4 ${isActive ? c.text : 'text-[var(--text-tertiary)]'}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t.path}</p>
                          <p className={`text-xs font-bold uppercase tracking-tight ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {t.name}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 shrink-0 ml-2 transition-all ${isActive ? `${c.text} translate-x-0.5` : 'text-[var(--text-tertiary)]'}`} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Tour Content */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTour}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--bg-secondary)] rounded-3xl shadow-xl border border-[var(--border-primary)] overflow-hidden"
                  >
                    {(() => {
                      const c = colorMap[activeTourItem.color] || colorMap.blue;
                      return (
                        <>
                          <div className={`px-8 py-6 border-b border-[var(--border-primary)] ${c.bg}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-caption text-[var(--text-muted)]">{activeTourItem.path}</span>
                                <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-none">
                                  {activeTourItem.name}
                                </h2>
                              </div>
                              <div className={`p-3 rounded-2xl ${c.bg} border ${c.border} shrink-0`}>
                                <activeTourItem.icon className={`h-7 w-7 ${c.text}`} />
                              </div>
                            </div>
                            <p className={`mt-4 text-sm font-bold text-[var(--text-secondary)] leading-relaxed border-l-4 ${c.border} pl-4`}>
                              {activeTourItem.description}
                            </p>
                          </div>

                          <div className="p-8 space-y-3">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Eye className="h-3 w-3" /> What You Can Do Here
                            </p>
                            {(activeTourItem?.features || []).map((feature, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                                className="flex items-start gap-3 p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors"
                              >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${c.bg} border ${c.border}`}>
                                  <span className={`text-xs font-bold ${c.text}`}>{String(i + 1).padStart(2, '0')}</span>
                                </div>
                                <p className="text-xs font-bold text-[var(--text-secondary)] leading-snug">{feature}</p>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default EducationPage;
