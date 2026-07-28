import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, TrendingUp, ShieldCheck, ChevronRight,
  Layers, BarChart3, Calendar, Zap,
  LayoutGrid, Briefcase, BookMarked, Store,
  LineChart, Activity, RefreshCw,
  FileText, Search, Eye, Compass,
  GraduationCap, PlayCircle, ArrowRight,
  PieChart, Database,
  Award, Lightbulb, MousePointerClick, CheckCircle2
} from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';

// ─────────────────────────────────────────────────────────────────────────────
// DATA: COURSE MODULES & LESSONS
// ─────────────────────────────────────────────────────────────────────────────

interface LessonStep {
  step: string;
  heading: string;
  body: string;
}

interface Lesson {
  id: string;
  name: string;
  subtitle: string;
  tier: string;
  icon: any;
  color: string;
  moduleId: string;
  tagline: string;
  steps: LessonStep[];
  coachNote: string;
  tryIt: { label: string; path: string } | null;
}

interface Module {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  icon: any;
  lessons: Lesson[];
}

const courseModules: Module[] = [
  // ─── MODULE 0: FOUNDATION ───
  {
    id: 'foundation',
    number: '0',
    name: 'Foundation',
    subtitle: 'Core Rules & Frameworks',
    icon: ShieldCheck,
    lessons: [
      {
        id: 'abcd_framework',
        name: 'ABCD Averaging Framework',
        subtitle: 'The Core Position-Building System',
        tier: 'all',
        icon: Layers,
        color: 'emerald',
        moduleId: 'foundation',
        tagline: 'Institutions never buy all at once. ABCD is how you build a position across market volatility — systematically.',
        steps: [
          { step: 'What It Is', heading: 'Tranche-Based Position Building', body: 'ABCD is not a technical pattern — it is an averaging framework. You divide your intended position into 4 tranches (A, B, C, D) and deploy them as the price moves in your favour (down for value, up for momentum). The goal is to achieve a blended average price that survives market noise.' },
          { step: 'The 10% Rule', heading: 'Each Tranche Is ~10% Apart', body: 'A = first technical entry (trigger level). B = deploy at ~10% below A. C = deploy at ~10% below B. D = deploy at ~10% below C. This gives you 4 entry points spaced ~10% apart. The exact gap is calculated from the strategy\'s anchor price — usually the trigger level or a moving average.' },
          { step: 'Tranche Allocation', heading: 'Equal Weight Per Tranche', body: 'Each tranche gets roughly equal capital allocation. If your total position size is ₹1,00,000: A = ₹25,000, B = ₹25,000, C = ₹25,000, D = ₹25,000 (or 25% each). This ensures no single tranche skews your average. Some strategies modify this (e.g. SMA+BCD uses SMA levels instead of fixed percentages).' },
          { step: 'Laddered Targets', heading: 'Staggered Profit Booking', body: 'Targets follow the reverse ladder: D\'s target → C\'s entry price. C\'s target → B\'s entry price. B\'s target → A\'s entry price. A\'s target → the strategy\'s main target (from technical pattern). This creates a natural pyramid where the first tranche runs the farthest and the last tranche exits first.' },
          { step: 'Platform Integration', heading: 'How It\'s Displayed on MarketBeacon', body: 'On the Charts Terminal and Public Analysis page, ABCD levels are shown as price zones with labels (A/B/C/D). The "gap" percentage shows the distance between tranches. When you open a stock, the ABCD levels are pre-calculated based on the primary active strategy. Pro and Alpha users see these levels in real-time.' }
        ],
        coachNote: 'ABCD is your insurance against imperfect entry. You will never catch the exact bottom — and you don\'t need to. ABCD lets you build a position while the market does what markets do: fluctuate. The framework works because it assumes you are wrong at A, and prepares you for it.',
        tryIt: { label: 'View ABCD on Charts', path: '/charts?symbol=NIFTY' }
      },
      {
        id: 'core_selection',
        name: 'Core Selection Rules',
        subtitle: 'Universal Institutional Filter',
        tier: 'all',
        icon: ShieldCheck,
        color: 'blue',
        moduleId: 'foundation',
        tagline: 'Every stock must clear these gates before any strategy applies. This is the minimum standard.',
        steps: [
          { step: 'Market Cap Classification', heading: 'Size Determines Behaviour', body: 'Large Cap ≥ ₹45,000 Cr — stable, institutional-heavy, lower volatility. Mid Cap ≥ ₹15,000 Cr — growth-phase, moderate volatility. Small Cap < ₹15,000 Cr — high-risk, high-reward. Portfolio allocation follows the 50:30:20 rule (Large:Mid:Small). The platform automatically classifies every stock into its cap tier.' },
          { step: 'Fundamental Audit', heading: 'Minimum 60/100 to Qualify', body: 'D/E ratio ≤ 0.5 (non-financial). Banking/NBFC get relaxed thresholds up to 7.0. Capital-intensive sectors (infra, auto, power) up to 1.5. Promoter pledge ≤ 5%. ROE ≥ 15%. ROCE ≥ 15%. PE must be ≤ median PE of 3-year and 5-year history. Sales and net profit must be near all-time high. The Matrix Screener shows the complete audit score breakdown for every stock.' },
          { step: 'Smart Money Rule', heading: 'Institutional + Promoter Holding > 50%', body: 'Combined FII + DII + Promoter holding must exceed 50% (our hard rejection threshold). Ideally, this should be > 70% for strong institutional conviction. Low public float is preferred. The platform displays Smart Money % on every stock page and in the Screener.' },
          { step: 'D/E Hard Rejection', heading: 'Debt is a Deal-Breaker', body: 'For general companies: D/E > 0.5 = hard reject. Score degrades gradually from 0.2 (ideal) to 0.5 (reject). For capital-intensive sectors (auto, power, infra, steel, realty, telecom, aviation): reject > 1.5. For Banking/NBFC/financials: reject > 7.0. The system automatically detects the sector and applies the correct threshold.' },
          { step: 'Sector & Concentration Limits', heading: 'Don\'t Put All Eggs in One Sector', body: 'No single sector should exceed 20% of your portfolio. The Alpha Hub enforces a maximum of 8 stocks per sector in the allocation engine. Single-stock max allocation: Large cap 5%, Mid cap 3%, Small cap 2% of total capital.' }
        ],
        coachNote: 'The Core Rules exist to protect you from the one thing that destroys portfolios: permanent capital loss. A stock that fails these filters might still go up — but if it does, it\'s speculation, not investing. Know the difference.',
        tryIt: { label: 'Open Matrix Screener', path: '/screener' }
      },
      {
        id: 'risk_management',
        name: 'Risk Management & Portfolio Allocation',
        subtitle: 'Protect Capital First',
        tier: 'all',
        icon: PieChart,
        color: 'amber',
        moduleId: 'foundation',
        tagline: 'The goal is not to maximize returns — it is to maximize risk-adjusted returns. Capital preservation always comes first.',
        steps: [
          { step: 'The 50:30:20 Rule', heading: 'Allocation by Market Cap', body: 'Large Cap = 50% of total portfolio (max 5% per stock). Mid Cap = 30% of portfolio (max 3% per stock). Small Cap = 20% of portfolio (max 2% per stock). This ensures that your largest allocation is in the most stable companies. The Alpha Hub automatically allocates 20 Large + 12 Mid + 8 Small = 40 stocks to meet this ratio.' },
          { step: 'Portfolio Size', heading: 'Minimum 40, Maximum 60 Stocks', body: 'Below 40 stocks, you are under-diversified — a single failure hurts too much. Above 60 stocks, you are over-diversified — winners don\'t move the needle. The Alpha-40 engine targets exactly 40 stocks as the optimal balance.' },
          { step: 'Sector Cap', heading: 'No Sector > 20% of Portfolio', body: 'Maximum 8 stocks per sector (in a 40-stock portfolio, 8 stocks = 20%). This prevents sector concentration risk. If a sector has too many qualifying stocks, only the strongest 8 are selected based on signal strength and entry timing.' },
          { step: 'Tranche Position Sizing', heading: 'You Don\'t Go All-In at Once', body: 'Each ABCD tranche gets 25% of the intended position size. If the stock is ₹100 and your allocation is 5 stocks: A = 1.25 shares at ₹100, B = 1.25 shares at ₹90, C = 1.25 shares at ₹81, D = 1.25 shares at ₹73. Your blended average = ~₹86, which is 14% below the first entry.' },
          { step: 'Invalidation & Stop Loss', heading: 'Know When to Exit', body: 'Every strategy has an invalidation point: a price level where the thesis breaks. For ABCD, if price drops below D and keeps falling, the strategy is invalidated. Do not add a 5th tranche. Close the position and accept the loss. Small losses are the cost of doing business.' }
        ],
        coachNote: 'Risk management is not about avoiding losses — it\'s about ensuring no single loss destroys your account. If you can survive a 30% portfolio drawdown without panic, your risk management is correct. If not, reduce position sizes.',
        tryIt: { label: 'Explore Alpha Hub Allocation', path: '/alpha-hub' }
      },
      {
        id: 'baskets',
        name: 'Understanding Baskets',
        subtitle: 'Elite, Quality & Growth Explained',
        tier: 'all',
        icon: Database,
        color: 'purple',
        moduleId: 'foundation',
        tagline: 'Baskets are curated stock lists. Elite = strongest fundamentals. Quality = growth-oriented. Growth = dynamic filter-based.',
        steps: [
          { step: 'Elite Basket (Super 45)', heading: 'Strongest Fundamentals, 15+ Year Vintage', body: 'Elite Basket = H Super 45. ~40 stocks. Minimum 15 years of business vintage. Debt-free or very low debt (net D/E < 0.2). Net profit > ₹200 Cr. Market leaders in their sectors with pricing power. Healthy revenue and profit CAGR. These are the "hold forever" quality names. Suitable for conservative strategies.' },
          { step: 'Quality Basket (Good 45)', heading: 'High-Growth, Mid & Small Cap Focus', body: 'Quality Basket = H Good 45. ~40 stocks. Medium and small-cap focus. Strong fundamentals but with higher growth orientation. Not as established as Elite but higher growth potential. Suitable for growth-oriented and momentum strategies.' },
          { step: 'Growth Basket', heading: 'Dynamic Filter-Based Universe', body: 'Growth Basket is not a fixed list — it is generated by a scanner filter. Rules (user-confirmed): D/E < 0.5, ROCE ≥ 15%, ROE ≥ 15%, promoter pledge < 2%, net profit > ₹50 Cr, market cap > ₹500 Cr. YoY revenue and profit growth ≥ 20%. PE ≤ 60. Smart money ≥ 60%. The basket is refreshed periodically from the full market scan.' },
          { step: 'How Baskets Map to Strategies', heading: 'Not All Strategies Apply to All Baskets', body: 'Free strategies (Bollinger, Envelope) → Elite + Quality. Pro strategies (SMA+BCD, 52W, Cup & Handle) → Elite + Quality. Alpha strategies (S&R, 67% Reset, 20% Retest) → Elite + Quality + Growth + Fallen Value. The Matrix Screener lets you filter by basket to see which stocks qualify in each universe.' },
          { step: 'Using Baskets in Your Workflow', heading: 'Start with the Right Universe', body: 'New investors: Start with Elite Basket — lowest risk, highest quality. Intermediate: Add Quality Basket for higher growth exposure. Advanced: Use Growth Basket for alpha strategies (67% Reset, 20% Retest). The platform shows which basket a stock belongs to on the Public Analysis page and in the Screener.' }
        ],
        coachNote: 'Think of baskets as your first filter. Instead of scanning 5000+ stocks, you scan 40–80 high-probability names. This is the institutional edge — you don\'t need to look everywhere, you need to look in the right places.',
        tryIt: { label: 'View Baskets in Screener', path: '/screener' }
      }
    ]
  },

  // ─── MODULE 1: FREE STRATEGIES ───
  {
    id: 'free_strategies',
    number: '1',
    name: 'Free Strategies',
    subtitle: 'Building Your Foundation',
    icon: BookOpen,
    lessons: [
      {
        id: 'bollinger',
        name: 'Bollinger Band',
        subtitle: 'Mean Reversion at Statistical Extreme',
        tier: 'free',
        icon: BarChart3,
        color: 'emerald',
        moduleId: 'free_strategies',
        tagline: 'Price touches the lower band at low volatility = potential reversal zone. Statistical mean reversion at work.',
        steps: [
          { step: 'What It Finds', heading: 'Stocks at Statistical Extreme', body: 'The Bollinger Band strategy identifies stocks that have reached the lower statistical boundary (2 standard deviations below the 20-period moving average). At this level, price is statistically "cheap" relative to its recent history — and tends to revert toward the mean.' },
          { step: 'Step 1: Research Trigger', heading: 'Lower Band Touch + Low Volatility', body: 'Price must touch or close at the lower Bollinger Band. The Band Width indicator should be narrow (squeeze) — low volatility before the move confirms energy is building. Wide bands during a touch suggest the downtrend is still strong.' },
          { step: 'Step 2: Qualification Check', heading: 'Fundamentals Must Support the Bounce', body: 'Audit score ≥ 60/100. Stock must be in Elite or Quality Basket. Smart Money > 50%. D/E must pass sector-specific thresholds. A stock at the lower band with bad fundamentals is a value trap, not an opportunity.' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'A = Trigger, B/C/D = Averaging', body: 'A = Lower band touch price. B = A − 10%. C = B − 10%. D = C − 10%. Deploy 25% capital at each level. If price reverses at A without hitting B, you only deploy one tranche — that\'s fine. Let the market decide how much of your plan executes.' },
          { step: 'Step 4: Target & Exit', heading: 'Upper Band Is the Objective', body: 'Primary target = Upper Bollinger Band. Typical move: 8–15% from lower band entry. Trail your stop as price moves toward the upper band. If price reaches the upper band with expanding volume, book partial profits on the A tranche and let the rest ride.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'Don\'t Fight a Strong Downtrend', body: 'Stop loss: Close below lower band by > 1%. If price "walks the lower band" for 3+ consecutive sessions, the trend is stronger than the statistical pull — exit and wait for a clean base formation.' }
        ],
        coachNote: 'The lower band is not a buy signal — it\'s a research indication. Always wait for the squeeze and check fundamentals before acting. In a strong downtrend, price can walk the lower band for weeks. Patience is part of the strategy.',
        tryIt: { label: 'Open Charts Terminal', path: '/charts?symbol=NIFTY' }
      },
      {
        id: 'envelope_long',
        name: 'Envelope Long',
        subtitle: 'Institutional Demand Zone',
        tier: 'free',
        icon: Layers,
        color: 'blue',
        moduleId: 'free_strategies',
        tagline: 'The lower envelope boundary marks where institutional buyers historically step in. You follow their lead.',
        steps: [
          { step: 'What It Finds', heading: 'Stocks at Institutional Demand Zone', body: 'The Envelope Long strategy identifies stocks trading at the lower envelope boundary (typically 10–15% deviation below a moving average). This zone historically attracts institutional buying — it\'s where smart money adds to positions.' },
          { step: 'Step 1: Research Trigger', heading: 'Price Touches Lower Envelope', body: 'Price must touch or close near the lower envelope boundary on the weekly chart. The weekly timeframe filters out daily noise and shows genuine institutional demand. Large caps with high institutional participation give the most reliable signals.' },
          { step: 'Step 2: Qualification Check', heading: 'Elite or Quality Basket Only', body: 'Stock must be in Elite or Quality Basket (reliable demand zone only works for fundamentally strong names). Audit score ≥ 60. Smart Money > 50%. Ensure D/E is within sector thresholds. Institutional stocks rarely hit the lower envelope without a strong reason.' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'A = Lower Envelope, Stagger Down', body: 'A = Lower envelope touch price. B = A − 10%. C = B − 10%. D = C − 10%. On the weekly chart, these levels may stay open for weeks — that\'s expected. Set limit orders at each level and wait.' },
          { step: 'Step 4: Target & Exit', heading: 'Upper Envelope Is the Full Recovery', body: 'Primary target = Upper envelope boundary. Typical recovery: 20–25% from the lower envelope. Book 50% at upper envelope, trail the rest with a 10% trailing stop. If price breaks above the upper envelope, the trend is accelerating — let the remaining position run.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'Fundamental Deterioration Cancels All', body: 'Stop loss: Close 3% below the lower envelope. If the stock reports weak quarterly results while you\'re holding, exit immediately regardless of price. The envelope strategy works only when fundamentals are intact.' }
        ],
        coachNote: 'The envelope is not a support line — it\'s a statistical demand zone. If price blows through the lower envelope, it means the institutional buyers are gone. Follow the smart money, not the price target.',
        tryIt: { label: 'View Envelope on Charts', path: '/charts?symbol=NIFTY' }
      },
      {
        id: 'envelope_short',
        name: 'Envelope Short',
        subtitle: 'Momentum Continuation on Pullback',
        tier: 'free',
        icon: TrendingUp,
        color: 'violet',
        moduleId: 'free_strategies',
        tagline: 'Strong stocks rarely revisit deep discounts. Buy the pullback to the EMA 200 in a confirmed uptrend.',
        steps: [
          { step: 'What It Finds', heading: 'Strong Stocks Pulling Back to Support', body: 'The Envelope Short strategy (despite its name, it\'s a long strategy) identifies stocks in strong uptrends that pull back to their EMA 200 or secondary regression line. This is the "buy the dip" strategy — but only for stocks with proven institutional momentum.' },
          { step: 'Step 1: Research Trigger', heading: 'Pullback to EMA 200 in Uptrend', body: 'Price must pull back to the EMA 200 from a position above it. The broader structure must show higher highs and higher lows (confirmed uptrend). If the stock is making lower highs, it\'s not an uptrend — skip it.' },
          { step: 'Step 2: Qualification Check', heading: 'High-Momentum Names Only', body: 'Relative strength must outperform the broader market (Nifty 50). Institutional interest confirmed by rising FII/DII holdings over 4+ quarters. Stock should rarely trade near 52-week lows — that\'s a different strategy. Suitable for Elite and Quality Basket stocks.' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'A = EMA 200 Touch, Tight Averaging', body: 'Unlike other strategies, Envelope Short uses tighter averaging because pullbacks in strong stocks are usually shallow. A = EMA 200 touch. B = A − 5%. C = B − 5%. D = C − 5%. If the stock falls 15% below EMA 200, the uptrend thesis is in danger.' },
          { step: 'Step 4: Target & Exit', heading: '+14% Recovery to Upper Envelope', body: 'Target = +14% from entry. The average recovery from EMA 200 pullback in strong stocks is 14%. Book full profits at target. If price breaks to a new high, you can re-enter on the next pullback — don\'t chase.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'The Uptrend Structure Must Hold', body: 'Stop loss: Close below EMA 200. If the stock forms a lower low (breaks the uptrend structure), close immediately. This strategy only works while the trend is your friend — when the trend breaks, you leave.' }
        ],
        coachNote: 'Envelope Short sounds like a short-selling strategy but it\'s not. It\'s a momentum-buying strategy on pullbacks. The name comes from the "short side of the envelope" — buying near the lower boundary during an uptrend. Confusing name, simple logic: buy strong stocks when they dip.',
        tryIt: { label: 'View on Charts Terminal', path: '/charts?symbol=NIFTY' }
      }
    ]
  },

  // ─── MODULE 2: PRO STRATEGIES ───
  {
    id: 'pro_strategies',
    number: '2',
    name: 'Pro Strategies',
    subtitle: 'Structural Patterns & ABCD Integration',
    icon: Award,
    lessons: [
      {
        id: 'sma_bcd',
        name: 'SMA + BCD',
        subtitle: 'Bearish Stacking Reversal',
        tier: 'pro',
        icon: LineChart,
        color: 'purple',
        moduleId: 'pro_strategies',
        tagline: 'When price is below all key moving averages (20 < 50 < 200), maximum pessimism sets the stage for reversal.',
        steps: [
          { step: 'What It Finds', heading: 'Stacks Where Price Is Below All SMAs', body: 'SMA+BCD identifies stocks where price is trading below the 20, 50, and 200-day SMAs in bearish alignment (20 < 50 < 200). This "stacked" condition represents maximum short-term pessimism — historically, these are accumulation zones for institutional capital.' },
          { step: 'Step 1: Research Trigger', heading: 'Bearish SMA Stack + Price at 200 DMA', body: 'Condition: Price < SMA 20 < SMA 50 < SMA 200. When price reaches the 200 DMA (D-level) and shows signs of stabilization (doji, hammer, or volume spike), the reversal setup is forming. Note: you do NOT buy at A (the SMA 20). You wait for B, C, or D.' },
          { step: 'Step 2: Qualification Check', heading: 'Fundamentals Before Pattern', body: 'Audit score ≥ 60. The stock must be in Elite or Quality Basket. Volume confirmation required at the D-level reference. If the stock has poor fundamentals, the SMA stack is a falling knife — not an opportunity. Wait for at least one green weekly close above the 20 DMA as initial confirmation.' },
          { step: 'Step 3: BCD Entry Levels (No A)', heading: 'First Buy at B, Not A', body: 'Unlike other strategies, SMA+BCD prefers to start at B (SMA 50 level). A is the signal, not the entry. B = SMA 50 level (~10% below A). C = SMA 100 level (~10% below B). D = SMA 200 level (~10% below C). Equal weight each tranche. If price never reaches B, the reversal was too shallow — skip it.' },
          { step: 'Step 4: Target & Exit', heading: 'Full Structural Reversal Back Above SMA 20', body: 'Primary target = reclaiming SMA 20 (the A level). From D-level (200 DMA), this is typically a 15–30% move. Book 50% at SMA 20. Let the remaining position run toward the next resistance level. If price breaks above 200 DMA with volume, the trend may be reversing.' },
          { step: 'Step 5: Risk & Invalidation', heading: '200 DMA Breakdown = Game Over', body: 'Stop loss: Close 3% below the 200 DMA (D-level). If the 200 DMA is sloping downward and price breaks below it, the bearish trend is accelerating — exit. SMA+BCD works in basing markets, not in crash scenarios.' }
        ],
        coachNote: 'The key insight of SMA+BCD is that you start at B, not A. The first signal (A) is often a dead-cat bounce. By waiting for BCD levels anchored to actual moving averages, you buy where institutions historically accumulate, not where retail traders panic.',
        tryIt: { label: 'View SMA Stacking on Charts', path: '/charts?symbol=NIFTY' }
      },
      {
        id: '52w_high_low',
        name: '52-Week High Low',
        subtitle: 'Annual Range Statistical System',
        tier: 'pro',
        icon: Calendar,
        color: 'rose',
        moduleId: 'pro_strategies',
        tagline: 'Elite bluechips frequently rebound from 52-week lows. The annual range provides a statistically reliable entry zone.',
        steps: [
          { step: 'What It Finds', heading: 'Stocks at Annual Statistical Low', body: 'The 52-week high/low strategy identifies stocks trading at or near their 52-week low — the cheapest they\'ve been in a year. For fundamentally strong Elite and Quality stocks, the 52-week low has historically been a reliable accumulation zone.' },
          { step: 'Step 1: Research Trigger', heading: 'Price Within 3% of 52-Week Low', body: 'Price must touch or trade within 3% of the 52-week low. The stock should be Large or Mid Cap only (small caps can stay at 52-week lows for years). Consistent dividend history is preferred — it shows management confidence.' },
          { step: 'Step 2: Qualification Check', heading: 'Fundamentals Must Be Intact', body: 'Audit score ≥ 60. Stock must be in Elite or Quality Basket. D/E must pass sector thresholds. Promoter pledge ≤ 5%. No governance red flags. A stock at its 52-week low with deteriorating fundamentals is a value trap — it can keep making new lows.' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'A = 52-Week Low, Wider Averaging', body: 'A = 52-week low price. B = A − 8%. C = B − 8%. D = C − 8%. Note the tighter 8% gap (not 10%). This is because 52-week lows have more concentrated institutional support. If the stock falls 24%+ below its annual low, the thesis is likely broken.' },
          { step: 'Step 4: Target & Exit', heading: '52-Week High Recovery', body: 'Primary target = 52-week high. The average recovery from 52-week low to 52-week high in Elite stocks is 30–80%. Book 50% at the 52-week high. Trail the rest with a 15% trailing stop. Some stocks will break to new all-time highs — let winners run.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'Don\'t Catch a Falling Knife', body: 'Stop loss: Close 5% below the 52-week low. If the stock sets a new 52-week low every month for 3+ consecutive months, the downtrend is structural, not cyclical — exit. Fresh 52-week lows in weak markets should be respected, not bought.' }
        ],
        coachNote: 'The 52-week low strategy is often confused with "buying the dip." It is not. You are buying Elite stocks at a statistically verified discount within their annual range. If the stock was at ₹1000 and is now at ₹600 with same earnings — that\'s a 52-week low worth investigating.',
        tryIt: { label: 'Scan 52W Stocks', path: '/screener' }
      },
      {
        id: 'cup_handle',
        name: 'Cup with Handle + ABCD',
        subtitle: 'Rounded Base Breakout',
        tier: 'pro',
        icon: Target,
        color: 'orange',
        moduleId: 'pro_strategies',
        tagline: 'A rounded, U-shaped base followed by tight handle consolidation. The breakout above handle resistance starts the markup phase.',
        steps: [
          { step: 'What It Finds', heading: 'Stocks Forming a Rounded Base', body: 'The Cup with Handle pattern identifies stocks that have formed a U-shaped (not V-shaped) base over 3–12 months, followed by a tight consolidation near the cup\'s lip (the handle). This is the classic William O\'Neil pattern adapted for Indian markets with ABCD averaging.' },
          { step: 'Step 1: Research Trigger', heading: 'Cup Lip + Handle Consolidation', body: 'The cup must be U-shaped (smooth, gradual decline and recovery). V-shaped bases are emotional rebounds, not institutional accumulation. Handle forms in the upper 30% of the cup. Handle depth ≤ 15% from cup lip. Low-volume drift in the handle is ideal — it shows selling pressure has dried up.' },
          { step: 'Step 2: Qualification Check', heading: 'Quality & Elite Stocks Only', body: 'Stock must be in Elite or Quality Basket. Audit score ≥ 60. The cup formation should take at least 3 months — overnight bases are not valid. Cup lips should be within 5% price variance of each other (showing the stock respected that resistance level multiple times).' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'A = Handle Entry, Average on Deepening', body: 'A = Handle entry point (near cup lip). B = A − 10% (if handle deepens). C = B − 10%. D = C − 10%. The ideal entry is the handle breakout point (above handle resistance). If the handle doesn\'t break out, wait for the next attempt.' },
          { step: 'Step 4: Target & Exit', heading: 'Cup Depth Added to Breakout Point', body: 'Target = Cup lip + Cup depth. If cup base was ₹100 and cup lip was ₹140: cup depth = ₹40, target = ₹140 + ₹40 = ₹180. This is a ~28% move from the lip. Book 50% at target. Let remaining position run with a 25% trailing stop — cups that work often produce multi-year breakouts.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'Handle Must Hold Above Cup Midpoint', body: 'Stop loss: If handle falls below the cup\'s midpoint, the pattern is invalidated. A handle that goes too deep means the consolidation failed and selling pressure returned. Also invalidate if the cup was actually V-shaped (rapid decline and recovery with no base).' }
        ],
        coachNote: 'The Cup with Handle is the closest thing to a "sure bet" in technical analysis — but only 30% of cups actually work. The other 70% fail. That\'s why you always use ABCD averaging and never go all-in at the breakout point. The handle tests your patience before it rewards you.',
        tryIt: { label: 'Scan Cup Patterns', path: '/screener' }
      }
    ]
  },

  // ─── MODULE 3: ALPHA STRATEGIES ───
  {
    id: 'alpha_strategies',
    number: '3',
    name: 'Alpha Strategies',
    subtitle: 'Institutional-Grade Setups',
    icon: Award,
    lessons: [
      {
        id: 'sr_strategy',
        name: 'Support & Resistance (S&R)',
        subtitle: 'Price Action at Key Zones',
        tier: 'alpha',
        icon: Activity,
        color: 'blue',
        moduleId: 'alpha_strategies',
        tagline: 'Identify proven support zones where price has historically reversed. These are the battle lines between buyers and sellers.',
        steps: [
          { step: 'What It Finds', heading: 'Historically Validated Price Zones', body: 'S&R identifies price levels where the stock has reversed multiple times in the past. These zones represent genuine supply-demand imbalance points. At support, buyers have historically stepped in. At resistance, sellers have historically capped price.' },
          { step: 'Step 1: Research Trigger', heading: '2nd or 3rd Retest of Support', body: 'The first touch of a support zone is often a fake-out. Research on the 2nd or 3rd retest. The zone must have at least 2 prior clean bounces. Price should not have broken the zone by more than 2% on any prior touch.' },
          { step: 'Step 2: Qualification Check', heading: 'Not Every Level Is Valid', body: 'Stock must pass the fundamental audit (score ≥ 60). The support zone should be validated on multiple timeframes (weekly + daily). Breaks of support by > 2% invalidate the zone. A true support zone creates higher lows over time.' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'A = Support Zone Entry', body: 'A = Support zone entry (calculated from the anchor level). B = A − 10%. C = B − 10%. D = C − 10%. The ABCD levels are calculated from the support ceiling using the calculateABCDLevels utility. If the support is at ₹500: A = ₹500, B = ₹450, C = ₹405, D = ₹365.' },
          { step: 'Step 4: Target & Exit', heading: 'Next Resistance Zone Is the Target', body: 'Target = Next identified resistance zone. Minimum projected move: 20% from entry. Book 50% at the resistance zone. If price breaks through resistance with volume, it becomes support — let the remaining position run.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'A Broken Support Becomes Resistance', body: 'Stop loss: 3–5% below the support zone. If price closes below the support zone by > 3%, it is broken. A broken support zone becomes resistance on any future bounce. Do not average into a broken support — you\'re fighting the market.' }
        ],
        coachNote: 'The most important S&R lesson: when support breaks, it becomes resistance. If you ignored the stop loss and price bounces back to the old support, that bounce is your exit — not your re-entry. Levels flip like a switch.',
        tryIt: { label: 'View S&R on Charts', path: '/charts?symbol=NIFTY' }
      },
      {
        id: 'institutional_reset',
        name: 'Institutional Reset (67%)',
        subtitle: 'Deep Recovery from All-Time High',
        tier: 'alpha',
        icon: RefreshCw,
        color: 'amber',
        moduleId: 'alpha_strategies',
        tagline: 'Good companies sometimes fall 67%+ from ATH due to external factors. When the problems are resolved, the recovery can be 200%+.',
        steps: [
          { step: 'What It Finds', heading: 'Companies That Fell 67%+ with Intact Fundamentals', body: 'The 67% strategy looks for fundamentally strong companies that have fallen 67% or more from their all-time high. The reasons could be external: government policy, macro environment, war, sector rotation, or temporary business issues. The key is that the company itself is still strong.' },
          { step: 'Step 1: Research Trigger', heading: 'Stock Down 67%+ from ATH', body: 'Drawdown from all-time high must be ≥ 67%. Sales TTM must be near or above all-time high (within ±5%). Net profit TTM must be near or above all-time high (within ±5%). Open-market research: what allegations or problems existed, and are they resolved now? The stock should be in Growth or Fallen Value Basket.' },
          { step: 'Step 2: Qualification Check', heading: 'Fundamentals Are Non-Negotiable', body: 'Audit score ≥ 60. D/E must pass sector thresholds. Promoter pledge ≤ 5%. Smart Money > 50%. No ongoing litigation or governance issue. The company should be in a position to resume its growth trajectory once the external headwind passes. Revenue should not have declined > 20% TTM.' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'Wide Averaging for Deep Value', body: 'A = Current price (trigger). B = A − 10%. C = B − 10%. D = C − 10%. Given the stock has already fallen 67%, the ABCD levels are wider to account for continued volatility. The full position gets deployed across all 4 tranches. Target allocation: 25% per tranche.' },
          { step: 'Step 4: Target & Exit', heading: 'First 67% Return, Then 100%', body: 'Primary target: +67% return within 1 year. If 67% is not reached within 1 year, the target moves to +100% (no hard timeline). Exit strategy: Book 50% at 67% gain. Let the rest run toward ATH recovery. The full ATH recovery can represent 200%+ from the entry zone.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'Not Every Fallen Stock Recovers', body: 'Stop loss: If the company reports a fundamental deterioration (sales decline > 20%, profit turns to loss, debt spikes), exit regardless of price. Time stop: If the stock shows no recovery signs within 18 months, reassess the thesis. A 67% drawdown does not guarantee a recovery.' }
        ],
        coachNote: 'The 67% strategy is the most profitable AND the most dangerous strategy in this framework. It works because nobody wants to buy these stocks — that\'s exactly when you should. But it only works if your fundamental assessment is correct. One wrong assessment can cost you 67% more. Do your homework twice.',
        tryIt: { label: 'Screen 67% Candidates', path: '/screener' }
      },
      {
        id: 'velocity_retest',
        name: 'Velocity Retest (20%)',
        subtitle: 'High-Momentum Pullback Research',
        tier: 'alpha',
        icon: Zap,
        color: 'indigo',
        moduleId: 'alpha_strategies',
        tagline: 'Stocks that rallied 20%+ from a deep base, then pulled back to retest the origin — precision re-test of demand.',
        steps: [
          { step: 'What It Finds', heading: 'Stocks That Rallied Hard and Came Back to Test', body: 'The Velocity Retest strategy identifies stocks that had a strong 20%+ rally from a deep base (starting below the 200 DMA), and have now pulled back to retest the rally\'s origin point. This is a "second chance" to get in at the same level as the smart money that bought the original rally.' },
          { step: 'Step 1: Research Trigger', heading: '20%+ Rally from Below 200 DMA', body: 'Stock must have rallied ≥ 20% from a base (Rally Start Low) within the last 12 months. The original rally must have started BELOW the 200 DMA (this confirms deep demand). Now price is retesting the Rally Start Low within the same 12-month window. Retest within 5% of the Rally Start Low.' },
          { step: 'Step 2: Qualification Check', heading: 'The Original Thesis Must Hold', body: 'Audit score ≥ 60. The reason for the original rally must still be valid (no fundamental deterioration). The pullback should be on declining volume (institutional selling is absent). If the pullback is on expanding volume, it\'s distribution, not a retest.' },
          { step: 'Step 3: ABCD Entry Levels', heading: 'A = Rally Start Low Retest', body: 'A = Rally Start Low price. B = A − 10%. C = B − 10%. D = C − 10%. Since this is a retest of an established base, averaging is tighter. Deploy 40% at A, 30% at B, 20% at C, 10% at D (front-loaded). The first tranche carries more conviction because the base has already proven itself once.' },
          { step: 'Step 4: Target & Exit', heading: 'Previous Rally Peak = Target', body: 'Target = Previous rally peak price (the high of the 20%+ move). Average move from origin to peak: 20–50%. Book 50% at the previous peak. If price breaks out to a new high, the retest confirmed the base — let the remaining position run with a 20% trailing stop.' },
          { step: 'Step 5: Risk & Invalidation', heading: 'If 8% Below Start, It Failed', body: 'Stop loss: If price closes more than 8% below the Rally Start Low, the retest has failed. The original rally was likely a dead-cat bounce or a bear market rally. Exit fully. Do not add more — a failed retest often leads to new lows.' }
        ],
        coachNote: 'The Velocity Retest is my favourite strategy because it gives you a second chance. You missed the first 20% rally? Fine — you get to buy at the same level as the people who caught it. But if the retest fails, get out. A failed retest is the market telling you the original rally was a trap.',
        tryIt: { label: 'Screen Retest Setups', path: '/screener' }
      }
    ]
  },

  // ─── MODULE 4: STRATEGY LAB ───
  {
    id: 'strategy_lab',
    number: '4',
    name: 'Strategy Lab',
    subtitle: 'Build Your Own Strategies',
    icon: Lightbulb,
    lessons: [
      {
        id: 'anatomy_of_strategy',
        name: 'Anatomy of a Strategy',
        subtitle: 'The Coach\'s Framework for Building Any Strategy',
        tier: 'all',
        icon: Compass,
        color: 'emerald',
        moduleId: 'strategy_lab',
        tagline: 'Every strategy in this framework follows the same blueprint. Learn the blueprint, and you can build your own.',
        steps: [
          { step: 'The 5-Block Framework', heading: 'Every Strategy Has 5 Blocks', body: 'Block 1: Market Condition — what market phase does this strategy work in? (trending, mean-reverting, bearish, bullish). Block 2: Research Trigger — the exact price/indicator condition that puts a stock on radar. Block 3: Qualification Filter — fundamental gates (audit score, D/E, smart money) that separate real setups from traps. Block 4: ABCD Entry — how price is mapped to tranches and where you start buying. Block 5: Exit & Risk — target, invalidation point, and stop-loss logic.' },
          { step: 'Block 1: Market Condition', heading: 'Know When to Use It', body: 'A strategy without a market condition is gambling. Before defining anything else, answer: Does this strategy work in uptrends, downtrends, or sideways markets? Is it for large caps (stable, institutional) or small caps (volatile, high reward)? Is the overall market in a bullish phase (use momentum strategies) or bearish (use deep value/67% strategies)? The market condition determines 80% of a strategy\'s success rate.' },
          { step: 'Block 2: Research Trigger', heading: 'Define the Exact Signal', body: 'The trigger is what puts a stock on your radar. Examples from our library: Bollinger = price touches lower band. SMA+BCD = bearish SMA stack. 67% Reset = stock fell 67%+ from ATH. A good trigger has 3 properties: (1) It is OBJECTIVE — a computer can check it without judgment. (2) It is REPEATABLE — it happens often enough to build a track record. (3) It has a LOGICAL THESIS — you can explain why this condition creates opportunity.' },
          { step: 'Block 3: Qualification', heading: 'The Gate That Separates Signal from Noise', body: 'Every trigger produces false signals. The qualification gate filters them out. Our framework uses: Fundamental Audit (score ≥ 60), D/E within sector thresholds, Smart Money > 50% (ideally > 70%), PE ≤ 3Y/5Y median, Sales/Profit near ATH. You can add your own gates: minimum dividend yield, consistent profit growth for 5 years, low share price volatility. The stricter the gate, the fewer but higher-quality candidates.' },
          { step: 'Block 4: ABCD Entry Design', heading: 'Map Price to Tranches', body: 'Once a stock clears the trigger AND qualification gates, assign ABCD: A = the trigger price. B = A − gap% (typically 8–10%). C = B − gap%. D = C − gap%. The gap depends on the strategy: conservative strategies (52W low) use 8% gaps. Aggressive strategies (67% Reset) use 10% gaps. Momentum pullbacks (Envelope Short) use 5% gaps. Decide: do you start buying at A or B? (SMA+BCD skips A and starts at B.)' },
          { step: 'Block 5: Exit & Risk', heading: 'Define Target, Stop, and Invalidation', body: 'Every entry must have a corresponding exit plan: TARGET — where do you take profit? (upper band, resistance zone, cup-lip + depth). STOP — where do you cut the loss? (3% below support, 5% below 52W low). INVALIDATION — what fundamental event cancels everything? (bad quarterly results, debt spike, promoter pledge increase). TIME STOP — if the thesis doesn\'t play out in X months, close it. A strategy without an exit plan is not a strategy — it\'s a hope.' }
        ],
        coachNote: 'This 5-block framework is how I built every strategy in this course. Start with a market observation → define the trigger → add qualification gates → design ABCD entry → set exit rules. Do this 100 times, fail 90 times, and you\'ll have 10 profitable strategies. That\'s a better ratio than most hedge funds.',
        tryIt: { label: 'Apply This Framework in Screener', path: '/screener' }
      },
      {
        id: 'build_custom_strategy',
        name: 'Build Your First Strategy',
        subtitle: 'Create a Custom Pullback Strategy Step by Step',
        tier: 'all',
        icon: Zap,
        color: 'blue',
        moduleId: 'strategy_lab',
        tagline: 'Let\'s build a real strategy from scratch using the 5-block framework. We\'ll create a "3-Day Pullback to SMA 50" strategy together.',
        steps: [
          { step: 'Step 1: Define Market Condition', heading: 'Bullish Trend, Pullback to SMA 50', body: 'Market condition: Uptrend (Nifty 50 above 200 DMA). Timeframe: Daily chart. Target universe: Elite + Quality baskets. The thesis: In a confirmed uptrend, fundamentally strong stocks that pull back to their SMA 50 (50-day moving average) tend to find institutional support and resume the uptrend.' },
          { step: 'Step 2: Set the Trigger Rule', heading: 'Price Closes Within 1% of SMA 50 After 3-Day Fall', body: 'Trigger conditions (all must be true): (1) Stock is in an uptrend — price above SMA 200. (2) Price has fallen for 3 consecutive days. (3) On day 3, price closes within 1% of the SMA 50. (4) Volume on day 3 is at least 30% lower than the 20-day average (selling drying up). This trigger is now coded as a filter rule in your strategy engine.' },
          { step: 'Step 3: Add Qualification Gates', heading: 'Let Fundamentals Confirm', body: 'Qualification rules (inspired by the coach\'s framework): Audit score ≥ 65 (stricter than the 60 minimum for pullbacks). D/E ≤ 0.3 for non-financial (stricter than 0.5). Smart Money ≥ 60%. PE ≤ 3Y median. Sales TTM must be within 10% of ATH. These gates ensure only fundamentally strong stocks in uptrends qualify for the pullback strategy.' },
          { step: 'Step 4: Design ABCD Entry', heading: 'A = SMA 50, Start at B', body: 'A = SMA 50 price (trigger level). B = A − 5% (tighter gap for uptrend pullback). C = B − 5%. D = C − 5%. Since this is an uptrend strategy, we expect shallow pullbacks — wider gaps would miss the move. Allocation: 40% at B (front-loaded conviction), 30% at C, 30% at D. If price reverses at A without hitting B, deploy only 40% — that\'s fine.' },
          { step: 'Step 5: Set Exit Rules', heading: 'Target = SMA 20, Stop = SMA 200', body: 'Target: +8–12% from A (SMA 50 back to SMA 20 in an uptrend). Book 50% at target, trail the rest with 8% trailing stop. Stop loss: close below SMA 200 by > 2% — the uptrend is broken. Invalidation: if the stock reports weak quarterly results while in the trade, exit immediately. Time stop: if the stock stays below SMA 50 for 20+ trading days, the pullback failed.' }
        ],
        coachNote: 'Congratulations — you just built your own strategy! The "3-Day Pullback to SMA 50" is now a rules-based strategy you can test, refine, and eventually code into your screener. The best strategies come from observing the market and asking "what if?" — not from copying someone else\'s playbook. Now go build the next one.',
        tryIt: { label: 'Test Your Strategy on Charts', path: '/charts?symbol=NIFTY' }
      }
    ]
  },

  // ─── MODULE 5: LIVE APPLICATION ───
  {
    id: 'live_application',
    number: '5',
    name: 'Live Application',
    subtitle: 'Using the Platform Daily',
    icon: Compass,
    lessons: [
      {
        id: 'using_screener',
        name: 'Using the Matrix Screener',
        subtitle: 'From Filters to Qualified Stocks',
        tier: 'all',
        icon: Search,
        color: 'indigo',
        moduleId: 'live_application',
        tagline: 'The Screener is where theory meets practice. Every strategy runs here in real-time.',
        steps: [
          { step: 'What It Does', heading: 'Live Strategy Scanning Engine', body: 'The Matrix Screener scans all stocks in the selected universe (Elite, Quality, Growth) and runs every strategy against each stock\'s current data. It shows 3 tabs: Passed Audit (meets all qualification criteria), Observation (nearly qualifying), and Audit Fails (failed checks). This is your daily scan tool.' },
          { step: 'How to Use: Step 1', heading: 'Choose Your Universe', body: 'Top of the Screener: select Growth Basket (for alpha strategies like 67% and 20% Retest), Quality Basket (for Pro strategies), or Elite Basket (for conservative plays). The universe determines which stocks are scanned and which strategies apply.' },
          { step: 'How to Use: Step 2', heading: 'Select a Strategy', body: 'Use the Model Matrix dropdown to choose a strategy: Bollinger, Envelope, SMA+BCD, 52W, Cup & Handle, S&R, 67% Institutional Reset, or 20% Velocity Retest. The Screener will show only stocks that trigger that strategy and pass the audit.' },
          { step: 'How to Use: Step 3', heading: 'Review the Results', body: 'Passed Audit = stocks that triggered the strategy AND passed all fundamental checks. Observation = stocks that triggered but are on watch (one parameter off). Audit Fails = stocks that did not pass. Click any stock to open its full fundamentals page for deeper analysis.' },
          { step: 'How to Use: Step 4', heading: 'Export and Track', body: 'Use the Export Audit CSV button to download the screened list for offline analysis. The Audit Fails tab is as important as Passed Audit — it shows you what the market is rejecting and why. Bookmark stocks from Observation that might qualify next week.' }
        ],
        coachNote: 'The Screener is your daily starting point. Open it every morning. Scan through Passed Audit for your strategies. Check Observation for stocks getting close. Look at Audit Fails to understand what the market is rejecting. This 5-minute routine keeps you ahead of 90% of retail investors.',
        tryIt: { label: 'Open Matrix Screener', path: '/screener' }
      },
      {
        id: 'alpha_hub_guide',
        name: 'Reading the Alpha Hub',
        subtitle: 'Portfolio Construction & Monitoring',
        tier: 'all',
        icon: LayoutGrid,
        color: 'blue',
        moduleId: 'live_application',
        tagline: 'Your command center. Everything you need to monitor and manage your strategy-driven portfolio.',
        steps: [
          { step: 'What It Does', heading: 'Live Portfolio Dashboard', body: 'Alpha Hub shows the live Alpha-40 portfolio: 40 stocks selected across all strategies. It displays market indices, strategy distribution, basket breakdown, and performance tracking. Enter your investment amount to see the allocation in rupees across all 40 stocks.' },
          { step: 'How to Use: Step 1', heading: 'Enter Your Investment Amount', body: 'At the top of Alpha Hub, enter your total capital. The engine allocates across stocks using the risk management rules: Large cap 5% max, Mid cap 3% max, Small cap 2% max. The allocation respects sector caps (8 stocks max per sector) and ABCD tranching.' },
          { step: 'How to Use: Step 2', heading: 'Review Basket Distribution', body: 'The Stability Shield (Large cap) shows your foundation holdings. Growth Engine (Mid cap) shows expansion plays. Alpha Accelerator (Small cap) shows high-risk/reward positions. The suggestedPct shows the target allocation per basket based on stock count. The actual percentage depends on your capital.' },
          { step: 'How to Use: Step 3', heading: 'Track Performance', body: 'The chart shows Portfolio Value vs Nifty 50 over time. Use the year selector to view 3Y, 5Y, 10Y, or 20Y performance. The CAGR comparison shows how the strategy portfolio stacks against the index. Redemption amount shows projected portfolio value at target.' },
          { step: 'How to Use: Step 4', heading: 'Manage Positions', body: 'The Active Positions table shows all 40 stocks with their current price, entry level, ABCD status, sector, and signal information. Use the filter tabs at the bottom to view by grade (A/B/C/D) or status. The Last Updated timestamp shows how fresh the data is.' }
        ],
        coachNote: 'Alpha Hub is not a recommendation engine. It\'s a transparency tool. It shows you exactly what the strategy engine is doing — which stocks qualify, how much to allocate, and why. Your job is to use this information with your own judgment. The machine builds the list; you make the decisions.',
        tryIt: { label: 'Open Alpha Hub', path: '/alpha-hub' }
      },
      {
        id: 'trade_journal_guide',
        name: 'Trade Journal',
        subtitle: 'Document Every Decision',
        tier: 'all',
        icon: BookMarked,
        color: 'amber',
        moduleId: 'live_application',
        tagline: 'If you didn\'t journal it, you didn\'t learn from it. The journal is how you improve over time.',
        steps: [
          { step: 'What It Does', heading: 'Verified Trade Ledger', body: 'The Trade Journal is a complete record of every research note and trade. Log entries with symbol, strategy, price, ABCD level, target, and notes. Close notes to record actual exit price and outcome. Re-open notes if the exit was premature. The journal is your personal performance audit trail.' },
          { step: 'How to Use: Step 1', heading: 'Log a New Research Note', body: 'Open the Trade Journal. Click "Add New Note". Select the stock, strategy (from the dropdown), entry type (A/B/C/D), entry price, target price, and risk level. Add your research notes explaining why this setup qualifies. Be specific — vague notes help nobody.' },
          { step: 'How to Use: Step 2', heading: 'Track ABCD Tranche Execution', body: 'If the stock triggers B, C, or D after your A entry, log each tranche as a separate note linked to the same symbol. The journal lets you see your full position building across tranches. This is essential for understanding your average cost and total exposure.' },
          { step: 'How to Use: Step 3', heading: 'Closing and Reviewing', body: 'When a trade reaches its target or gets stopped out, mark it as Closed. The system records the exit price and calculates profit/loss automatically. Review your closed trades weekly — what worked, what didn\'t, and why. The Closed tab shows your complete trading history.' },
          { step: 'How to Use: Step 4', heading: 'Bulk Import/Export', body: 'Use the CSV template to bulk import historical trades. Export all trades as CSV for tax reporting or offline analysis. The import feature supports both merge (add to existing) and overwrite (replace all) modes.' }
        ],
        coachNote: 'Your trade journal is not for the tax department — it\'s for you. Every trade you take should teach you something. If you look back at 10 closed trades and can\'t identify a pattern in your mistakes, you\'re not reviewing your journal properly.',
        tryIt: { label: 'Open Trade Journal', path: '/trades' }
      },
      {
        id: 'full_walkthrough',
        name: 'Full Walkthrough',
        subtitle: 'Screen → Audit → Strategy → Trade',
        tier: 'all',
        icon: PlayCircle,
        color: 'emerald',
        moduleId: 'live_application',
        tagline: 'From opening the platform to placing a research note — here\'s the complete workflow in 30 minutes.',
        steps: [
          { step: 'Step 1: Morning Scan', heading: 'Open Screener, Select Universe', body: 'Start your day at /screener. Select "Growth Basket" for alpha strategies. Check the Passed Audit tab. Look for stocks triggering the 67% Institutional Reset or 20% Velocity Retest. Note any new additions since yesterday. (5 minutes)' },
          { step: 'Step 2: Deep Dive', heading: 'Inspect a Qualified Stock', body: 'Click any stock in Passed Audit. The fundamentals page opens. Check: Audit Score ≥ 60? D/E within sector limits? Smart Money > 50%? PE below 3Y median? ABCD levels visible? Note: the ABCD levels are pre-calculated based on the triggering strategy. (5 minutes)' },
          { step: 'Step 3: Verify on Charts', heading: 'Open Charts Terminal', body: 'Click "Open in Charts Terminal" from the fundamentals page. Verify: Is the strategy trigger visible on the chart? Are the ABCD levels at logical price zones? Check volume confirmation. If the chart confirms your thesis, proceed. (5 minutes)' },
          { step: 'Step 4: Check Alpha Hub', heading: 'See Portfolio Context', body: 'Check if this stock is already in the Alpha-40 portfolio. If yes, review its allocation. If not, check why — it may not have been the best risk-adjusted pick. The Alpha Hub shows the full institutional allocation engine\'s output. (5 minutes)' },
          { step: 'Step 5: Journal the Decision', heading: 'Log Your Research Note', body: 'Open the Trade Journal. Create a new note: symbol, strategy, ABCD level, entry price, target, invalidation point. Write down your specific thesis: "Stock fell 67% from ATH, sales at ATH, profit at ATH, promoter pledge 0%, D/E 0.1. External issue resolved." Now you have a record. (5 minutes)' },
          { step: 'Step 6: Set Alerts & Monitor', heading: 'Watch for Tranche Triggers', body: 'Set price alerts at B, C, and D levels. If price triggers a lower tranche, log it in the journal. Review your open notes on Alpha Hub weekly. If a stock appears in Audit Fails (fundamental deterioration), close the note and exit the position. (5 minutes)' }
        ],
        coachNote: 'The entire workflow takes 30 minutes once you\'re familiar with the platform. The key is consistency — do this every day, even when there are no trades. The days with no trades are the days you learn the most about patience. Markets reward those who wait for the right setup.',
        tryIt: { label: 'Start the Workflow', path: '/screener' }
      }
    ]
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
      'Top audited stocks with audit scores and ABCD levels',
      'Strategy-wise distribution across baskets',
      'Portfolio allocation engine — enter capital, get a 40-stock portfolio',
      'Performance chart vs Nifty 50 (3Y to 20Y)'
    ]
  },
  {
    id: 'screener',
    name: 'Matrix Screener',
    path: '/screener',
    icon: Search,
    color: 'indigo',
    description: 'The core strategy matrix engine. Real-time scanning across all tracked stocks filtered by strategy. Tabs show Passed Audit, Observation, and Audit Fails.',
    features: [
      'Passed Audit tab — stocks meeting audit parameters now',
      'Observation tab — stocks in observation, not currently triggering',
      'Audit Fails tab — stocks that failed the audit checks',
      'Filter by Active Universe (Growth / Quality / Elite Basket)',
      'Switch strategy via Model Matrix dropdown (all 10 strategies)',
      'Export Audit as CSV for offline analysis',
      'Click any stock → Full Fundamentals page with ABCD levels'
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
      'Upload CSV from broker (merge or overwrite)',
      'Add manually — symbol, qty, price, strategy',
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
    description: 'A verified trade ledger. Log every research note with model, level, and notes. Close notes to record outcome. Re-open if needed. Full CSV import/export.',
    features: [
      'Log open notes with price, date, model, ABCD level, objective',
      'Close a note → records exit price and outcome automatically',
      'Re-open closed trades if exit was premature',
      'Bulk import trades via CSV template download',
      'Filter by Open / Closed segment',
      'Export all trades as CSV'
    ]
  },
  {
    id: 'stock_page',
    name: 'Stock Fundamentals',
    path: '/stock/:symbol',
    icon: FileText,
    color: 'purple',
    description: 'Deep-dive into any stock. Full institutional audit — financials, ABCD ladder, DFH%, sector, market cap, scoring breakdown, and PE median comparison.',
    features: [
      'Institutional audit score (0–100) with breakdown',
      'PE vs 3Y/5Y median PE comparison',
      'ABCD tranche status and next levels',
      'D/E ratio with sector-specific thresholds',
      'Smart Money % (FII + DII + Promoter)',
      'Sales and Profit vs All-Time High comparison',
      'Links to Screener.in and NSE for deeper research'
    ]
  },
  {
    id: 'marketplace',
    name: 'Access Licenses',
    path: '/license-desk',
    icon: Store,
    color: 'rose',
    description: 'Upgrade your access tier. Free gives basic strategies. Pro unlocks structural patterns. Alpha gives full institutional access including the 3 premium strategies.',
    features: [
      'Free — Bollinger Band, Envelope Long/Short, basic screener',
      'Pro — All Free + SMA+BCD, 52W High/Low, Cup & Handle',
      'Alpha — All Pro + S&R, Institutional Reset (67%), Velocity Retest (20%)',
      'All tiers access to Education Center and ABCD framework',
      'Pay via UPI QR — submit UTR for 15-min activation',
      'Redeem Voucher for trial access'
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
  amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',  border: 'border-amber-500/20',  badge: 'bg-amber-600',   badgeText: 'text-white',      dot: 'bg-amber-500' },
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
  const [mainTab, setMainTab] = useState<'course' | 'tour'>('course');
  const [activeModule, setActiveModule] = useState('foundation');
  const [activeLesson, setActiveLesson] = useState('abcd_framework');
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    foundation: true, free_strategies: false, pro_strategies: false,
    alpha_strategies: false, live_application: false
  });
  const [activeTour, setActiveTour] = useState('alpha_hub');

  // Flatten all lessons for navigation
  const allLessons = courseModules.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id })));
  const currentLessonIndex = allLessons.findIndex(l => l.id === activeLesson);

  const totalLessons = allLessons.length;
  const completedCount = completedLessons.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleComplete = (lessonId: string) => {
    setCompletedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const goToLesson = (lessonId: string, moduleId: string) => {
    setActiveModule(moduleId);
    setActiveLesson(lessonId);
    setExpandedModules(prev => ({ ...prev, [moduleId]: true }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    linkCanonical.href = 'https://marketbeaconpro.com/education';
    document.head.appendChild(linkCanonical);
    return () => { document.head.removeChild(linkCanonical); };
  }, []);

  // Derive current module + lesson
  const currentModule = courseModules.find(m => m.id === activeModule) || courseModules[0];
  const currentLesson = currentModule.lessons.find(l => l.id === activeLesson) || currentModule.lessons[0];
  const currentTourItem = tourSections.find(t => t.id === activeTour)!;

  const handleLessonClick = (moduleId: string, lessonId: string) => {
    goToLesson(lessonId, moduleId);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  return (
    <div className="bg-[var(--bg-primary)] min-h-screen font-sans overflow-y-auto pb-24 md:pb-0">
      <div className="px-4 md:px-8 lg:px-10 py-6 md:py-10 max-w-7xl mx-auto space-y-8">

        <Breadcrumbs items={[
          { label: 'Resources', href: '/' },
          { label: 'Education Center' }
        ]} />

        {/* ── COURSE PROGRESS BAR ── */}
        {mainTab === 'course' && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Course Progress</span>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">{completedCount}/{totalLessons} lessons</span>
              </div>
              <span className="text-xs font-bold text-[#00d09c]">{progressPct}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#00d09c] to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-primary)] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shrink-0">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-none">
                Course Curriculum
              </h1>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] mt-1">
                {courseModules.length} Modules · {courseModules.reduce((sum, m) => sum + m.lessons.length, 0)} Lessons · Institutional Framework
              </p>
            </div>
          </div>

          <div className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-1 shadow-sm gap-1 w-fit">
            <button
              onClick={() => setMainTab('course')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-caption transition-all ${
                mainTab === 'course' ? 'bg-blue-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Course
            </button>
            <button
              onClick={() => setMainTab('tour')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-caption transition-all ${
                mainTab === 'tour' ? 'bg-blue-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Platform Tour
            </button>
          </div>
        </div>

        {/* ── COURSE TAB ── */}
        <AnimatePresence mode="wait">
          {mainTab === 'course' && (
            <motion.div
              key="course"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar — Modules & Lessons */}
              <div className="lg:col-span-4 space-y-2" data-tour="edu-modules">
                {courseModules.map(mod => {
                  const isActiveMod = activeModule === mod.id;
                  const isExpanded = expandedModules[mod.id] ?? (mod.id === 'foundation');
                  const ModIcon = mod.icon;
                  return (
                    <div key={mod.id} className="space-y-1">
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                            <ModIcon className="h-4 w-4 text-blue-400" />
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Module {mod.number}</span>
                            <p className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">{mod.name}</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 text-[var(--text-tertiary)] transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="ml-4 space-y-0.5 border-l-2 border-[var(--border-primary)] pl-2">
                          {mod.lessons.map(lesson => {
                            const isActive = activeLesson === lesson.id && isActiveMod;
                            const c = colorMap[lesson.color] || colorMap.blue;
                            const tb = tierBadge[lesson.tier];
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(mod.id, lesson.id)}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                                  isActive 
                                    ? `bg-[var(--bg-secondary)] border ${c.border}` 
                                    : 'hover:bg-[var(--bg-secondary)]/60 border border-transparent'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isActive ? c.bg : 'bg-[var(--bg-tertiary)]'}`}>
                                  <span className={`text-[9px] font-black ${isActive ? c.text : 'text-[var(--text-tertiary)]'}`}>{mod.number}.{mod.lessons.indexOf(lesson) + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-bold truncate ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                    {lesson.name}
                                  </p>
                                  <p className="text-[9px] text-[var(--text-muted)] truncate">{lesson.subtitle}</p>
                                </div>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${tb.cls} shrink-0`}>{tb.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Content Panel */}
              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeLesson}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--bg-secondary)] rounded-3xl shadow-xl border border-[var(--border-primary)] overflow-hidden"
                  >
                    {(() => {
                      const c = colorMap[currentLesson.color] || colorMap.blue;
                      const tb = tierBadge[currentLesson.tier];
                      const currentMod = courseModules.find(m => m.id === activeModule) || courseModules[0];
                      const lessonIndex = currentMod.lessons.indexOf(currentLesson);
                      return (
                        <>
                          {/* Header */}
                          <div className={`px-8 py-6 border-b border-[var(--border-primary)] ${c.bg}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    Module {currentMod.number}: {currentMod.name}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">/</span>
                                  <span className={`text-caption px-2.5 py-0.5 rounded-full ${tb.cls}`}>{tb.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-black text-[var(--text-muted)] opacity-30">{currentMod.number}.{lessonIndex + 1}</span>
                                  <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-tight">
                                    {currentLesson.name}
                                  </h2>
                                </div>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{currentLesson.subtitle}</p>
                              </div>
                              <div className={`p-3 rounded-2xl ${c.bg} border ${c.border} shrink-0`}>
                                <currentLesson.icon className={`h-7 w-7 ${c.text}`} />
                              </div>
                            </div>
                            {/* Tagline */}
                            <p className={`mt-4 text-sm font-bold ${c.text} italic leading-relaxed border-l-4 ${c.border} pl-4`}>
                              "{currentLesson.tagline}"
                            </p>
                          </div>

                          {/* Steps */}
                          <div className="p-8 space-y-5">
                            <div className="space-y-4">
                              {currentLesson.steps.map((sec, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                  className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] overflow-hidden"
                                >
                                  <div className="flex items-start gap-4 p-5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.bg} border ${c.border}`}>
                                      <span className={`text-xs font-black ${c.text}`}>{i + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{sec.step}</span>
                                        <div className={`h-px flex-1 bg-gradient-to-r ${c.border} from-transparent to-transparent opacity-30`} />
                                      </div>
                                      <h4 className="text-sm font-black text-[var(--text-primary)] tracking-tight">{sec.heading}</h4>
                                      <p className="text-[12px] font-medium text-[var(--text-secondary)] leading-relaxed">{sec.body}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>

                            {/* Coach's Note (replaces guardrail) */}
                            <div className="flex items-start gap-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
                              <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                  <MousePointerClick className="h-3 w-3" /> Coach's Note
                                </p>
                                <p className="text-[12px] font-bold text-amber-300 leading-relaxed">{currentLesson.coachNote}</p>
                              </div>
                            </div>

                            {/* Try It CTA */}
                            {currentLesson.tryIt && (
                              <a
                                href={currentLesson.tryIt.path}
                                className="flex items-center justify-between p-5 bg-blue-600/10 border border-blue-600/20 rounded-2xl hover:bg-blue-600/20 transition-all group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                                    <PlayCircle className="h-5 w-5 text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Try It on MarketBeacon</p>
                                    <p className="text-xs font-bold text-[var(--text-primary)]">{currentLesson.tryIt.label}</p>
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                              </a>
                            )}

                            {/* Mark Complete + Next/Prev Navigation */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[var(--border-primary)]">
                              <button
                                onClick={() => toggleComplete(currentLesson.id)}
                                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-caption font-bold uppercase tracking-wider transition-all ${
                                  completedLessons.has(currentLesson.id)
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-tertiary)] border border-[var(--border-primary)] hover:border-emerald-500/30 hover:text-emerald-400'
                                }`}
                              >
                                {completedLessons.has(currentLesson.id) ? (
                                  <><CheckCircle2 className="h-4 w-4" /> Completed</>
                                ) : (
                                  <><div className="w-4 h-4 rounded-full border-2 border-current" /> Mark Complete</>
                                )}
                              </button>

                              <div className="flex items-center gap-2">
                                {currentLessonIndex > 0 && (
                                  <button
                                    onClick={() => {
                                      const prev = allLessons[currentLessonIndex - 1];
                                      goToLesson(prev.id, prev.moduleId);
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] text-caption font-bold text-[var(--text-secondary)] transition-all"
                                  >
                                    <ChevronRight className="h-4 w-4 rotate-180" />
                                    Previous
                                  </button>
                                )}
                                {currentLessonIndex < allLessons.length - 1 && (
                                  <button
                                    onClick={() => {
                                      const next = allLessons[currentLessonIndex + 1];
                                      goToLesson(next.id, next.moduleId);
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-caption font-bold transition-all shadow-md"
                                  >
                                    Next Lesson
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                )}
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

          {/* ── PLATFORM TOUR ── */}
          {mainTab === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
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

              <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTour}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="bg-[var(--bg-secondary)] rounded-3xl shadow-xl border border-[var(--border-primary)] overflow-hidden"
                  >
                    {(() => {
                      const c = colorMap[currentTourItem.color] || colorMap.blue;
                      return (
                        <>
                          <div className={`px-8 py-6 border-b border-[var(--border-primary)] ${c.bg}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1">
                                <span className="text-caption text-[var(--text-muted)]">{currentTourItem.path}</span>
                                <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic leading-none">
                                  {currentTourItem.name}
                                </h2>
                              </div>
                              <div className={`p-3 rounded-2xl ${c.bg} border ${c.border} shrink-0`}>
                                <currentTourItem.icon className={`h-7 w-7 ${c.text}`} />
                              </div>
                            </div>
                            <p className={`mt-4 text-sm font-bold text-[var(--text-secondary)] leading-relaxed border-l-4 ${c.border} pl-4`}>
                              {currentTourItem.description}
                            </p>
                          </div>

                          <div className="p-8 space-y-3">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Eye className="h-3 w-3" /> What You Can Do Here
                            </p>
                            {(currentTourItem.features || []).map((feature, i) => (
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
