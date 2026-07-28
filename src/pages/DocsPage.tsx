import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DocSidebar } from '../components/docs/DocSidebar';
import { BookOpen, ChevronRight, Menu, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const DOCS_CONTENT: Record<string, { title: string; content: string }> = {
  intro: {
    title: 'Introduction',
    content: `MarketBeacon Pro is an institutional-grade stock research platform built for serious traders who want to eliminate subjective decisions. 

Our core methodology is the **ABCD Averaging Framework** — a structured way to build positions across 4 tranches, each 10% apart, with laddered targets and hard invalidation stops.

Every strategy on this platform is a **quantitative rule set** that has been backtested, validated, and is continuously monitored. We do not give buy/sell recommendations — we give **actionable strategy alignments**.

### What you get

- **Institutional Audit Score** — 100-point fundamental check on every NSE stock
- **9 Quantitative Strategies** — from free (Bollinger, Envelope) to pro (SMA+BCD) to alpha (S&R, 67% Reset)
- **4 Baskets** — Elite, Quality, Growth, Fallen Value — each with its own universe of stocks
- **ABCD Tranche Levels** — entry, averaging, and target prices for every strategy signal
- **Chart Terminal** — professional-grade technical analysis workspace
- **BeaconAI** — natural language strategy assistant powered by Gemini

### Getting started

Start with the Quick Start Guide or jump straight into the Matrix Screener to find your first setup.`
  },
  quickstart: {
    title: 'Quick Start Guide',
    content: `## Get up and running in 5 minutes

### Step 1: Create an account

Click **Launch** on the homepage and sign in with Google. You'll be taken through a brief onboarding flow.

### Step 2: Visit the Screener

Navigate to the **Matrix Screener** from your Dashboard. This is the main universe scanning engine.

### Step 3: Select a strategy

Pick a strategy from the dropdown. Start with **Envelope Long** (free, available to all users) to see how it works.

### Step 4: Scan the universe

Click **Scan** or let the screener auto-run. Stocks that pass the strategy filters will appear in the **Passed** tab.

### Step 5: Analyze a stock

Click any stock to open its **Fundamental Audit** page. Here you'll see the scorecard, ABCD levels, and strategy alignment.

### Step 6: Take action

Based on the ABCD levels, plan your entry, averaging, and target points. Log your trade in the **Trade Journal**.`
  },
  'abc-framework': {
    title: 'ABCD Averaging Framework',
    content: `The ABCD Averaging Framework is the mathematical backbone of every strategy on MarketBeacon Pro.

### Core Concept

Instead of a single entry, we divide your capital into **4 equal tranches (ABCD)**:

- **A (25%)** — Initial entry at the signal price
- **B (25%)** — First average, 10% below A
- **C (25%)** — Second average, 10% below B (20% below A)
- **D (25%)** — Final average, 10% below C (30% below A)

### Target Structure

Each tranche has its own target:

- **A Target**: +10% from A entry
- **B Target**: +10% from B entry (breakeven on A+B)
- **C Target**: +10% from C entry (breakeven on A+B+C)
- **D Target**: Final exit target

### Invalidation

If price falls below the D-level invalidation point, **all positions are closed**. This limits maximum drawdown to ~30% on the averaged cost.

### Why ABCD works

- Removes emotional averaging (no "doubling down" randomly)
- Defined risk: you know your max loss before entering
- Scales into positions that go against you, not away from you`
  },
  'core-rules': {
    title: 'Core Selection Rules',
    content: `Every stock on MarketBeacon Pro must pass a set of **universal institutional filters** before it can be considered for any strategy.

### Market Cap Tiers

- **LARGE CAP** (>20,000 Cr) — Highly liquid, institutional-grade
- **MID CAP** (5,000 - 20,000 Cr) — Growth potential with adequate liquidity
- **SMALL CAP** (<5,000 Cr) — Higher risk, position-size constrained

### Fundamental Audit (100 Points)

| Parameter | Weight |
|-----------|--------|
| Sales Growth | 20 points |
| Profit Growth | 15 points |
| Debt-to-Equity | 15 points |
| Operating Margin | 10 points |
| ROE | 10 points |
| Promoter Holding | 10 points |
| FII/DII Activity | 10 points |
| Cash Flow | 10 points |

### Smart Money Threshold

A stock must show **FII/DII buying momentum** in the last 3 months. Minimum 0.5% increase in institutional holding.

### Debt-to-Equity Ceiling

D/E ratio must be below 3.0 for large caps, 2.0 for mid caps, and 1.5 for small caps.`
  },
  'risk-management': {
    title: 'Risk Management & Portfolio Allocation',
    content: `### The 50:30:20 Rule

- **50% of capital** — Core positions (3-4 highest conviction ideas)
- **30% of capital** — Swing positions (5-7 medium-conviction ideas)
- **20% of capital** — Exploratory / small-cap positions

### Position Sizing

Each position should be sized so that a full ABCD sequence (4 tranches) uses at most:
- **5% of capital** for Large Caps
- **3% of capital** for Mid Caps
- **1.5% of capital** for Small Caps

### Sector Cap

No more than **25% of portfolio** in any single sector.

### Invalidation Rules

Always set a stop loss at the D-level invalidation point before entering. A position that hits invalidation is closed immediately with no averaging.`
  },
  baskets: {
    title: 'Understanding Baskets',
    content: `Baskets are the **universe filters** that determine which stocks a strategy can evaluate.

### Elite Basket

The **top 40 Nifty stocks** by market cap and liquidity. Highest quality, lowest risk. Used by: S&R, 67% Reset, 20% Velocity, 52W High/Low.

### Quality Basket

**Fundamentally strong mid-cap stocks** with consistent earnings growth. Used by: SMA+BCD, RHS+ABCD, Cup & Handle.

### Growth Basket

**High-growth companies** across all market caps. Higher CAGR potential but higher risk. Used by: Most strategies.

### Fallen Value Basket

**Stocks trading below intrinsic value** with mean-reversion potential. Turnaround plays.

### Strategy-Basket Mapping

Each strategy is hard-coded to scan only the baskets it can evaluate. A strategy that works on Elite Basket won't necessarily trigger on a Growth Basket stock.`
  },
  strategies: {
    title: 'All Strategies',
    content: `MarketBeacon Pro offers **9 quantitative strategies** across 3 tiers.

### Free Strategies
- **Bollinger Band** — Mean reversion around 20-period bands
- **Envelope Long** — Pullback to support within envelope channel
- **Envelope Short** — Breakdown below envelope support

### Pro Strategies
- **SMA + BCD** — Moving average crossover with ABCD confirmation
- **52 Week High/Low** — Breakout or bounce from yearly extremes
- **Cup with Handle + ABCD** — Classic cup-and-handle pattern with ABCD averaging
- **Reverse Head & Shoulder + ABCD** — RHS pattern with ABCD tranches

### Alpha Strategies
- **Support & Resistance (S&R)** — Key level reaction trading
- **67% Institutional Reset** — Deep retracement of institutional move
- **20% Velocity Retest** — Quick 20% pullback to moving average`
  },
  'free-strategies': {
    title: 'Free Strategies',
    content: `### Bollinger Band (FREE)

**Concept:** Mean reversion when price touches the lower band.

**Entry:** Price closes below lower Bollinger Band (20,2)  
**A Target:** Middle Band  
**B Target:** Upper Band  
**Invalidation:** 5% below entry

### Envelope Long (FREE)

**Concept:** Buy pullbacks to the lower envelope boundary.

**Entry:** Price touches lower envelope (20-period, 2.5% deviation)  
**A Target:** Middle of envelope  
**B Target:** Upper envelope  
**Invalidation:** 3% below lower envelope

### Envelope Short (FREE)

**Concept:** Sell break of lower envelope support.

**Entry:** Price closes below lower envelope  
**A Target:** 3% below entry  
**B Target:** 5% below entry  
**Invalidation:** Return above lower envelope`
  },
  'pro-strategies': {
    title: 'Pro Strategies',
    content: `### SMA + BCD (PRO)

**Concept:** When price reverts to key SMA with BCD confirmation.

**Entry:** Price touches 50-SMA with bullish BCD divergence  
**A Target:** 10% above entry  
**B Target:** 20% above entry  
**Invalidation:** 8% below 50-SMA

### 52 Week High/Low (PRO)

**Concept:** Breakout above 52-week high or bounce from 52-week low.

**Entry:** Price breaks 52-week high with volume  
**A Target:** 10% above breakout  
**B Target:** 20% above breakout  
**Invalidation:** Back below 52-week high

### Cup with Handle + ABCD (PRO)

**Concept:** Classic cup-and-handle pattern with ABCD entry.

**Entry:** Breakout from handle resistance  
**A Target:** Cup depth projected  
**B Target:** 1.618x cup depth  
**Invalidation:** Below handle low`
  },
  'alpha-strategies': {
    title: 'Alpha Strategies',
    content: `### Support & Resistance (S&R) (ALPHA)

**Concept:** Trade reversals at key institutional S&R levels.

**Entry:** Price reverses from S&R level with confirmation  
**A Target:** Next S&R level  
**B Target:** 1.5x move to next level  
**Invalidation:** 2% beyond S&R level

### 67% Institutional Reset (ALPHA)

**Concept:** After a 67% move (institutional trend), trade the 67% retracement.

**Entry:** Price retraces 67% of the last impulse move  
**A Target:** 33% of retracement recovered  
**B Target:** 67% of retracement recovered  
**Invalidation:** New low beyond 100% retracement

### 20% Velocity Retest (ALPHA)

**Concept:** Quick 20% pullback within an uptrend, retesting key moving average.

**Entry:** Price pulls back 20% to 50-EMA in uptrend  
**A Target:** 10% above entry  
**B Target:** Full trend continuation  
**Invalidation:** Below 200-EMA`
  },
  screener: {
    title: 'Matrix Screener Guide',
    content: `The Matrix Screener is the main universe scanning engine.

### How it works

1. Select a **strategy** from the dropdown
2. Select a **basket** (universe filter)
3. Click **Scan** to run the strategy on every stock in the basket
4. Results appear in 3 tabs:
   - **Open** — Stocks currently in a valid entry zone
   - **Hold** — Stocks in open positions awaiting targets
   - **Fails** — Stocks that don't qualify

### Features

- **Bulk Export** — Download results as CSV
- **Bookmark** — Save stocks to your watchlist
- **Fundamental Audit** — Click any stock for deep analysis
- **Strategy Switcher** — Quick toggle between strategies`
  },
  'alpha-hub': {
    title: 'Alpha Hub Guide',
    content: `Alpha Hub is the **capital allocation engine**.

### Dashboard Overview

- **Total Allocation** — Your capital spread across baskets
- **Strategy Breakdown** — Which strategies are generating signals
- **Performance vs Nifty** — Compare your strategy returns to the benchmark

### Key Metrics

- **CAGR** — Compounded annual growth rate per strategy
- **Win Rate** — Percentage of profitable trades
- **Avg Holding Days** — Average trade duration
- **Max Drawdown** — Worst peak-to-trough decline`
  },
  charts: {
    title: 'Chart Terminal Guide',
    content: `The Chart Terminal is a professional-grade technical analysis workspace.

### Features

- **Multi-Timeframe** — View 1D, 1W, 1M charts side-by-side
- **ABCD Overlays** — Visual ABCD tranche levels on the chart
- **S&R Zones** — Automatic support and resistance detection
- **Strategy Signals** — See buy/sell signals from active strategies
- **Drawing Tools** — Trend lines, annotations, horizontal levels
- **Layout Persistence** — Save your workspace layout

### Indicator Panel

Access all 9 strategy indicators, volume profile, FII/DII overlay, and custom studies.`
  },
  'beacon-ai': {
    title: 'BeaconAI Assistant',
    content: `BeaconAI is a natural language strategy assistant powered by Gemini 2.0 Flash.

### What it can do

- **Analyze any NSE stock** — Get instant strategy alignment reports
- **Explain concepts** — Ask about ABCD, tranches, baskets, strategies
- **Compare stocks** — Which stock better fits a given strategy?
- **Explain strategy logic** — How does the Envelope Long strategy trigger?

### Usage

Just type your question in natural language. Examples:
- "Analyze RELIANCE for Hemant Jain swing trading"
- "What's the ABCD framework?"
- "Which strategies work on Growth Basket?"`
  },
  education: {
    title: 'Video Course',
    content: `Structured curriculum designed to take you from beginner to institutional trader.

### Course Modules

1. **Foundation** — Getting started, dashboard tour
2. **Free Tier** — Bollinger, Envelope strategies
3. **Pro Tier** — SMA+BCD, 52W, Cup & Handle
4. **Alpha Tier** — S&R, 67% Reset, 20% Velocity
5. **Lab** — Live examples, case studies
6. **Application** — Portfolio management, risk control`
  },
  'api-reference': {
    title: 'API Reference',
    content: `## API Reference

The MarketBeacon Pro API allows programmatic access to strategy analysis and stock data.

### Authentication

All API requests require a Bearer token in the Authorization header.

\`\`\`
Authorization: Bearer <your_token>
\`\`\`

### Endpoints

- \`GET /api/stock-fundamentals?symbol=RELIANCE\` — Get fundamental audit
- \`GET /api/public/analysis/RELIANCE\` — Get public analysis page data
- \`GET /api/backtest/audit?basket=Growth&strategy=ENVELOPE_LONG\` — Run strategy backtest

### Rate Limits

- Free: 10 requests/minute
- Pro: 60 requests/minute
- Alpha: 300 requests/minute`
  },
  glossary: {
    title: 'Glossary',
    content: `### ABCD Framework
A 4-tranche position building method where capital is split equally across four price levels.

### Basket
A universe of stocks grouped by market cap and quality characteristics.

### Tranche
One of the four equal capital allocations in the ABCD framework.

### Smart Money
Institutional investor activity, measured by FII/DII net buying.

### Audit Score
A 100-point fundamental health score based on 10 parameters.

### Invalidation Point
The price level at which a position is closed for a loss.

### CAGR
Compounded Annual Growth Rate — the mean annual growth rate.`
  },
  faq: {
    title: 'Frequently Asked Questions',
    content: `### Is MarketBeacon Pro a SEBI-registered advisor?
No. MarketBeacon Pro is an educational quantitative research tool. We provide strategy alignment reports, not buy/sell recommendations.

### How is the Audit Score calculated?
The 100-point score uses 10 parameters including sales growth, profit growth, D/E ratio, operating margin, ROE, promoter holding, FII activity, and cash flow.

### What is the difference between Free, Pro, and Alpha?
Free gives access to 3 basic strategies. Pro adds 4 advanced strategies. Alpha adds 2 institutional-grade strategies with full ABCD levels.

### How often is data updated?
Market data is updated daily after market close. Intraday data is available for Alpha users through the Chart Terminal.`
  },
  changelog: {
    title: 'Changelog',
    content: `### Version 18.5.0-PRO (Current)

- Added BeaconAI natural language assistant
- Updated Chart Terminal with ABCD overlays
- New DocSidebar for documentation navigation
- Fixed TOTP 2FA authentication
- Performance improvements to Matrix Screener

### Version 18.0.0

- Major UI overhaul with new dark theme
- Alpha Hub capital allocation engine
- 20% Velocity Retest strategy added
- Envelope Long/Short enhancements`
  }
};

const DocsPage: React.FC = () => {
  const { '*': splat } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Extract the doc page id from the route
  const pathParts = (splat || 'intro').split('/');
  const pageId = pathParts[1] || pathParts[0] || 'intro';
  
  const doc = DOCS_CONTENT[pageId] || DOCS_CONTENT['intro'];
  
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] font-sans flex flex-col">
      <SEO title={`${doc.title} — MarketBeacon Pro Docs`} description={`MarketBeacon Pro documentation: ${doc.title}`} />
      
      {/* Top Navigation */}
      <nav className="h-14 bg-[var(--bg-primary)]/70 backdrop-blur-xl border-b border-[var(--border-primary)] flex items-center justify-between px-4 shrink-0 z-[100]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-xl transition-all"
            aria-label="Open docs navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent-amber)] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
          <div className="w-px h-5 bg-[var(--border-primary)]" />
          <Link to="/docs/intro" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--accent-amber)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">Docs</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-tertiary)]">{doc.title}</span>
        </div>
      </nav>
      
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <DocSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-14 max-w-4xl">
          <div className="prose prose-sm prose-invert max-w-none">
            <h1 className="text-3xl font-black text-[var(--text-primary)] italic tracking-tighter mb-8">
              <span className="text-[var(--accent-amber)]">Docs</span> / {doc.title}
            </h1>
            <div className="text-sm leading-relaxed space-y-4 whitespace-pre-line">
              {doc.content.split('\n').map((line, i) => {
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-base font-bold text-[var(--text-primary)] mt-6 mb-2">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-lg font-bold text-[var(--text-primary)] mt-8 mb-3">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={i} className="font-bold text-[var(--text-primary)]">{line.replace(/\*\*/g, '')}</p>;
                }
                if (line.startsWith('- **')) {
                  const match = line.match(/- \*\*(.+?)\*\*[：:]?\s*(.*)/);
                  if (match) {
                    return (
                      <div key={i} className="flex gap-2 pl-4">
                        <span className="font-bold text-[var(--accent-amber)] shrink-0">{match[1]}</span>
                        <span className="text-[var(--text-secondary)]">{match[2]}</span>
                      </div>
                    );
                  }
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="text-[var(--text-secondary)] ml-4 list-disc">{line.replace('- ', '')}</li>;
                }
                if (/^\d+\.\s/.test(line)) {
                  return <li key={i} className="text-[var(--text-secondary)] ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
                }
                if (line.startsWith('|')) {
                  return null; // Skip table lines in basic render
                }
                if (line.trim() === '') {
                  return <div key={i} className="h-2" />;
                }
                if (line.startsWith('> ')) {
                  return <blockquote key={i} className="border-l-2 border-[var(--accent-amber)]/30 pl-4 italic text-[var(--text-tertiary)] my-2">{line.replace('> ', '')}</blockquote>;
                }
                if (line.startsWith('```')) {
                  return null; // Skip code fences
                }
                return <p key={i} className="text-[var(--text-secondary)]">{line}</p>;
              })}
            </div>
          </div>
          
          {/* Navigation Footer */}
          <div className="mt-16 pt-8 border-t border-[var(--border-primary)] flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <ChevronRight className="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DocsPage;
