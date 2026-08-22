import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, ArrowRight, ChevronRight } from 'lucide-react';
import BrandLogo from '../components/brand/BrandLogo';
import SiteFooter from '../components/layout/SiteFooter';
import SEO from '../components/SEO';
import { OrganizationSchema, ArticleSchema, BreadcrumbSchema } from '../components/StructuredData';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { getApiUrl } from '../lib/api-utils';

// ── Fallback Articles (used when API is unavailable, e.g. prerendering) ──

const FALLBACK_ARTICLES: Record<string, any> = {
  'abcd-tranche-laddering-guide': {
    title: "What is ABCD Tranche Laddering? A Beginner's Guide for Indian Traders",
    metaDescription: "Learn ABCD Tranche Laddering — the institutional method to split stock purchases into 4 systematic tranches. Used by FII/DII desks in India. Free guide for retail traders.",
    tag: 'Strategy',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    readTime: '6 min read',
    date: 'Jun 06, 2026',
    sections: [
      { heading: "The Problem With How Most Retail Traders Buy Stocks", body: "Most retail traders do the same thing: they see a stock they like, check the price, and buy 100% of their intended position in one go. It feels decisive. It feels efficient. But it's one of the biggest reasons retail traders underperform institutions consistently.\n\nWhen you allocate 100% of your capital at a single price point, you have zero buffer. If the market drops 8-10% after your purchase (which it often does — even in good stocks), you're sitting on a drawdown with no buying power left. You either panic-sell at a loss, or you hold and hope — neither of which is a strategy." },
      { heading: "What Is ABCD Tranche Laddering?", body: "ABCD Tranche Laddering is a capital deployment method where instead of buying 100% of your intended position at one price, you divide it into four tranches — A, B, C, and D — each triggered at a different price level.\n\nThis is not a new idea. It's how Foreign Institutional Investors (FIIs) and Domestic Institutional Investors (DIIs) have been building positions in Indian equities for decades. The difference is that they do it systematically, with pre-defined triggers. Retail traders do it randomly, emotionally, or not at all." },
      { heading: "How Each Tranche Works", body: "Stage A (25% Allocation): You establish your initial position at the current price when the stock clears the audit criteria. You're not going all-in — you're testing the thesis.\n\nStage B (25% Allocation): The market pulls back 8-12% from your Stage A entry. This is where most retail traders panic-sell. You buy more, lowering your average cost. Your total allocation is now 50%.\n\nStage C (35% Allocation): A deeper pullback — the stock has now corrected 15-20% from Stage A. This is the \"value floor\" — the historical level where institutional buyers tend to step in aggressively. Your heaviest allocation goes here.\n\nStage D (Exit): The stock recovers and moves toward its target price. You've built a position at an average cost well below Stage D — making the upside significantly larger than if you'd bought everything at Stage A." },
      { heading: "Why Does This Work? The Math Behind It", body: "Let's say a stock is at \u20B91000. You want to invest \u20B91,00,000.\n\nRetail approach: Buy \u20B91,00,000 worth at \u20B91000. Stock drops to \u20B9800. You're down 20%.\n\nABCD Tranche approach:\n- Stage A: \u20B925,000 at \u20B91000 (25 shares)\n- Stage B: \u20B925,000 at \u20B9900 (27.7 shares)\n- Stage C: \u20B950,000 at \u20B9820 (60.9 shares)\n- Average cost: ~\u20B9870 per share (113.6 shares total)\n\nWhen the stock recovers to \u20B91000, the retail buyer is at breakeven. The tranche buyer is already up 15%. At a 20% target (\u20B91200), the retail buyer makes 20%. The tranche buyer makes 38% — on the same stock, with the same \u20B91,00,000." },
      { heading: "How MarketBeacon Pro Implements This", body: "MarketBeacon Pro's ABCD Ladder strategy automatically calculates the A, B, C, and D price zones for every qualified stock based on its historical volatility, support levels, and institutional demand floors. You don't need to manually calculate anything.\n\nThe screener shows you stocks that are currently in Stage A (fresh entry), Stage B (pullback opportunity), or Stage C (deep value floor) — so you always know where you are in the tranche cycle." }
    ],
    keyTakeaways: [
      "Never allocate 100% at one price — split into 4 tranches (A, B, C, D)",
      "Stage C (the deepest pullback) should get your heaviest allocation (35%)",
      "Tranche buyers consistently achieve 15-20% better average costs than single-entry buyers",
      "MarketBeacon Pro automatically calculates ABCD zones for 500+ stocks",
      "This is the same method FII/DII desks use to build institutional positions"
    ],
    relatedSlug: 'how-to-trade-like-fii-dii-india',
    relatedTitle: 'How to Trade Like FII/DII in India',
  },
  'what-is-sebi-compliant-stock-screener': {
    title: "What Should a Responsible Stock Research Tool Look Like? A SEBI Framework Guide",
    metaDescription: "Learn what SEBI regulations say about stock screeners and research tools in India. Understand the difference between investment advisers, research analysts, and educational research tools like MarketBeacon Pro.",
    tag: 'Education',
    tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    readTime: '5 min read',
    date: 'Jun 06, 2026',
    sections: [
      { heading: "The Problem With Many Stock Tip Platforms in India", body: "There are hundreds of stock screener apps and platforms in India. Many freely use phrases like \"Strong Buy\", \"Top Pick\", or \"Best Stock to Buy Now\" — without a SEBI registration. This is potentially problematic under the SEBI (Investment Advisers) Regulations, 2013, which requires anyone giving personalized investment advice to be a registered Investment Adviser (IA).\n\nAs a user, this matters. If a platform gives you unregistered investment advice and gets shut down by SEBI, your subscription is gone — and your portfolio decisions were based on legally unverifiable recommendations." },
      { heading: "What SEBI Says: The Three Categories", body: "SEBI distinguishes between:\n\n1. Investment Advisers (IA): Give personalized buy/sell recommendations. Must be SEBI-registered. Regulated under SEBI IA Regulations 2013.\n\n2. Research Analysts (RA): Publish general research reports on stocks — not personalized advice. Must follow SEBI RA Regulations 2014 if publishing for public consumption.\n\n3. Mathematical / Educational Tools: Platforms that provide screeners, backtesting, and quantitative models purely as educational/mathematical tools — without personalized recommendations — and clearly disclaim they are not providing investment advice." },
      { heading: "Where MarketBeacon Pro Stands", body: "MarketBeacon Pro is an educational quantitative research tool. We are NOT registered as a SEBI Investment Adviser (IA) or Research Analyst (RA).\n\nWhat this means for you:\n\nWe DO NOT: Give personalized buy/sell calls. Say 'buy this stock now'. Promise specific returns. Manage your portfolio or act as an adviser.\n\nWe DO: Provide 100-point mathematical audit scores based on publicly available data. Show historical patterns and institutional entry zones (ABCD model). Explain the logic and criteria behind every score. Let you make your own independent decisions based on data.\n\nIMPORTANT: All information on MarketBeacon Pro is for educational and research purposes only. It is not investment advice. Always consult a SEBI-registered Investment Adviser before making any investment decisions." },
      { heading: "What to Look For in Any Research Platform", body: "Whether you use MarketBeacon Pro or any other platform, here's what responsible research tools should do:\n\n1. Clear Disclaimers: State clearly that data is for educational/research use only, not investment advice.\n\n2. No Performance Promises: Avoid platforms that guarantee returns or claim specific future performance.\n\n3. Methodology Transparency: Good platforms explain their scoring logic — you should know WHY a stock scores well, not just that it does.\n\n4. Regulatory Honesty: A platform should clearly state its regulatory status (registered or not) rather than making vague compliance claims.\n\n5. User Empowerment: The best research tools teach you to evaluate — they don't make you dependent on following signals blindly." }
    ],
    keyTakeaways: [
      "SEBI requires Investment Advisers to be registered if giving personalized buy/sell advice",
      "MarketBeacon Pro is NOT a SEBI-registered IA or RA — it is an educational research tool",
      "All audit scores and data on MarketBeacon are for educational/research purposes only",
      "Always consult a SEBI-registered advisor before making actual investment decisions",
      "Good research tools are transparent about their methodology and regulatory status"
    ],
    relatedSlug: 'institutional-audit-score-explained',
    relatedTitle: 'The 100-Point Institutional Audit Score Explained',
  },
  'how-to-trade-like-fii-dii-india': {
    title: "How to Trade Like FII/DII in India: The Institutional Strategy Explained",
    metaDescription: "Learn how FIIs and DIIs build positions in Indian stocks — systematic value-floor accumulation, smart money tracking, and tranche deployment. A guide for retail traders to replicate institutional logic.",
    tag: 'Institutional',
    tagColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    readTime: '8 min read',
    date: 'Jun 06, 2026',
    sections: [
      { heading: "Why FIIs and DIIs Don't Think Like Retail Traders", body: "Foreign Institutional Investors (FIIs) and Domestic Institutional Investors (DIIs) — mutual funds, insurance companies, pension funds, and foreign portfolio investors — collectively control trillions of rupees in Indian equity markets.\n\nThey don't chase news. They don't panic-sell on red candles. They don't buy because a YouTube video told them to. They operate on 3 principles that most retail traders never learn: (1) Value floors, not price momentum. (2) Systematic accumulation, not single-entry bets. (3) Fundamental conviction, not chart patterns alone." },
      { heading: "Principle 1: Institutions Buy at Value Floors", body: "Retail traders often buy when a stock is 'going up' — at or near 52-week highs, after a news catalyst. Institutions do the opposite. They use data models to identify historical value floors — price levels where the stock has repeatedly found strong buying support relative to its earnings, book value, and cash flows.\n\nThese value floors are not random. They are calculated using PE percentiles (how cheap is the stock relative to its own history?), price-to-book ratios, and institutional demand data from quarterly shareholding patterns.\n\nMarketBeacon Pro's 100-point audit score maps these floors as Stage C in the ABCD model — the zone where institutional accumulation historically peaks." },
      { heading: "Principle 2: Smart Money Tracking via Shareholding Data", body: "Every quarter, listed Indian companies publish their shareholding pattern. This shows exactly how much FIIs, DIIs, and promoters hold. This is publicly available data — but most retail traders never read it.\n\nWhen FII holding increases quarter-on-quarter in a stock while the price is declining, it's a clear signal: institutions are accumulating. They're building a tranche position at lower prices while retail traders are selling.\n\nMarketBeacon Pro's Smart Money filter tracks FII/DII shareholding changes and flags stocks where institutional accumulation is rising — giving you visibility into what the 'smart money' is doing before the price reflects it." },
      { heading: "Principle 3: Fundamental Conviction Before Any Entry", body: "Institutions will not invest in a company with dangerous debt ratios, declining revenue, or poor return-on-equity — regardless of how 'cheap' the price looks. They run fundamental checks first.\n\nThe MarketBeacon Pro audit score evaluates 12 parameters before a stock is considered 'Qualified':\n- Debt-to-equity ratio (hard reject if > 1.0 for most sectors)\n- Revenue and profit growth trajectory\n- Return on Capital Employed (ROCE)\n- Promoter holding stability\n- FII/DII holding trend\n- PE percentile vs 5-year history\n- 52-week position relative to historical ranges\n\nA stock that clears all 12 parameters gets a score of 80+ and is marked 'Qualified' — meaning it meets the institutional conviction threshold." },
      { heading: "How to Apply This As a Retail Trader", body: "You can't replicate the exact systems of a \u20B950,000 crore mutual fund. But you can replicate the logic.\n\nStep 1: Only trade Qualified stocks (audit score 80+). This removes the 70% of the market that institutions would reject outright.\n\nStep 2: Use the ABCD Tranche model for entry. Don't buy at one price. Split into 4 tranches across A, B, C, D zones — just like institutions build positions.\n\nStep 3: Track Smart Money. Check if FII/DII holding is increasing in your target stocks. Institutional accumulation is the strongest confirmation signal available.\n\nStep 4: Be patient. Institutions build positions over weeks and months — not hours. Their patience is a core part of the strategy. The biggest retail mistake is exiting too early." }
    ],
    keyTakeaways: [
      "FIIs/DIIs buy at value floors — not at highs or news-driven peaks",
      "Rising FII/DII holding during a price decline = institutional accumulation signal",
      "Institutions reject stocks with high debt, poor ROCE, and declining fundamentals",
      "Retail traders can replicate institutional logic using audit scores + ABCD zones",
      "Patience is the institutional edge — positions are built over weeks, not hours"
    ],
    relatedSlug: 'abcd-tranche-laddering-guide',
    relatedTitle: 'ABCD Tranche Laddering: The Complete Guide',
  },
  'institutional-audit-score-explained': {
    title: "The 100-Point Institutional Audit Score: How Stocks Are Graded",
    metaDescription: "MarketBeacon Pro grades every stock on a 100-point institutional audit score across 12 parameters. Learn how each parameter works and what a Qualified, Neutral, or Rejected rating means.",
    tag: 'Deep Dive',
    tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    readTime: '7 min read',
    date: 'Jun 06, 2026',
    sections: [
      { heading: "Why We Built a 100-Point Score", body: "Most stock screeners show you raw data — PE ratios, revenue numbers, debt figures. But they leave you to figure out what's 'good' or 'bad'. For a retail trader without institutional training, this is overwhelming.\n\nThe 100-point Institutional Audit Score converts complex multi-parameter analysis into a single conviction score. It's designed to answer one question: 'Is this stock fundamentally safe and positioned for institutional-grade accumulation?'" },
      { heading: "The Three Rating Categories", body: "Every stock receives one of three ratings based on its audit score:\n\nQUALIFIED (Score 80-100): The stock meets institutional-grade fundamental and technical criteria. It has cleared all hard reject rules and shows signals of smart money interest.\n\nNEUTRAL (Score 50-79): The stock has some positives but also some concerns. It may be in a transitional phase — worth watching but not ready for aggressive entry.\n\nREJECTED (Score 0-49): The stock fails on one or more critical parameters. Institutional desks would typically exclude these from active consideration." },
      { heading: "The 12 Audit Parameters", body: "Parameter 1 — Debt-to-Equity: Hard reject if D/E > 1.0 (except banks/NBFCs). High debt = high bankruptcy risk in downturns.\n\nParameter 2 — Smart Money (FII+DII Holding): Minimum 70% threshold. Below this, the 'smart money is absent' hard reject triggers.\n\nParameter 3 — Revenue Trajectory: 3-year revenue growth trend. Declining revenue is a major red flag.\n\nParameter 4 — PE Percentile: Where does the current PE stand vs the stock's own 5-year PE history? Cheap PE = higher score.\n\nParameter 5 — ROCE (Return on Capital Employed): Minimum 12% required. Measures how efficiently the company uses its capital.\n\nParameter 6 — Promoter Holding Stability: Declining promoter stake is a significant confidence signal.\n\nParameter 7 — 52-Week Range Position: Stocks trading near their 52-week low (but fundamentally sound) score higher.\n\nParameter 8 — Price-to-Book Value: For capital-intensive businesses, P/B below 3x scores positively.\n\nParameter 9 — Operating Margin Trend: Expanding margins = improving business quality.\n\nParameter 10 — Interest Coverage Ratio: Earnings should cover interest payments at least 3x.\n\nParameter 11 — Free Cash Flow: Companies that generate real cash (not just accounting profit) score higher.\n\nParameter 12 — Institutional Momentum (Strategy Triggers): How many of the 12 ABCD strategies currently show active entry signals?" },
      { heading: "How the Score Is Calculated", body: "Each of the 12 parameters is weighted based on its importance:\n- Hard reject parameters (D/E, Smart Money, ROCE): If these fail, the stock is automatically Rejected regardless of other scores.\n- Weighted scoring parameters: Each remaining parameter contributes a weighted score based on how far the metric is from the ideal institutional threshold.\n\nThe final score is a composite weighted average, updated daily as new market data flows in. When quarterly results are published, the relevant parameters are recalculated automatically." }
    ],
    keyTakeaways: [
      "100-point audit score converts complex multi-parameter analysis into one conviction number",
      "Qualified = 80+, Neutral = 50-79, Rejected = 0-49",
      "Hard reject rules (D/E > 1.0, Smart Money < 70%) immediately disqualify stocks regardless of other scores",
      "Scores update daily with live market data and quarterly on fundamental data",
      "12 parameters cover debt, growth, valuation, profitability, and institutional sentiment"
    ],
    relatedSlug: 'what-is-sebi-compliant-stock-screener',
    relatedTitle: 'What Is a SEBI Compliant Stock Screener?',
  },

  // ── Added by Growth Agent (2026-08-22) ──
  'abcd-tranche-laddering-guide': {
    title: "ABCD Tranche Laddering: The Complete Guide to Institutional Entry Zones",
    metaDescription: "Learn how institutional desks build positions in tranches (A, B, C, D) instead of one lump entry. A practical guide to the ABCD model used inside MarketBeacon Pro for risk-managed accumulation.",
    tag: 'Strategy',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    readTime: '9 min read',
    date: 'Aug 22, 2026',
    sections: [
      { heading: "Why Lump-Sum Entry Is the Retail Trap", body: "Most retail traders enter a stock in one shot — they see a signal, hit 'buy', and deploy 100% of their planned capital at a single price. The problem: the market rarely rewards timing a single point. If you enter at the wrong moment, you sit in drawdown with no capital left to average intelligently.\n\nInstitutional desks never do this. They build positions in stages — called tranches — so that no single price point decides their fate. MarketBeacon Pro formalizes this as the ABCD model: four staged entry zones, each with a defined role." },
      { heading: "What Each Stage Means", body: "Stage A — Base Price Floor: The algorithm registers initial institutional activity at a key support floor. A 25% initial tranche is cleared for audit. This is the 'toe in the water' — enough to participate, little enough to survive if the floor breaks.\n\nStage B — Confirmation Retest: Price retests the floor or a higher structure and holds. Another 25% is added. Risk is now partially validated by price action.\n\nStage C — Conviction Build: The stock shows fundamental safety + smart-money interest (FII/DII rising). The third 25% is deployed. This is the zone where institutional accumulation historically peaks.\n\nStage D — Momentum Continuation: Trend and strategy triggers confirm. Final 25% deploys. Full position is now built, but only after three prior validations." },
      { heading: "Why 25% Tranches, Not 50/50", body: "A 4-stage ladder gives you three chances to be wrong before you are fully committed. If Stage A fails, you lost only 25% of planned capital at the worst possible price. Compare that to a lump entry where 100% is exposed immediately.\n\nThe math favours patience: even if two of four stages underperform, the averaged entry is still better than most emotional single-point buys. This is how institutions control drawdown without sacrificing upside." },
      { heading: "How to Apply ABCD As a Retail Trader", body: "Step 1: Only consider stocks that are 'Qualified' (audit score 80+). The ABCD ladder is meaningless on a fundamentally rejected stock.\n\nStep 2: Pre-define your 4 zones using the stock's support structure, not random percentages. MarketBeacon Pro plots A/B/C/D on the chart for you.\n\nStep 3: Allocate fixed tranches (e.g. 25% each) and never 'go all in' at Stage A out of FOMO.\n\nStep 4: Journal the reason for each tranche. If Stage C doesn't confirm, you simply don't deploy the last 50%. That restraint is the edge." },
      { heading: "Common Mistakes", body: "1. Skipping stages during a rally — FOMO makes traders jump to Stage D pricing at Stage A. 2. Increasing tranche size after a loss (revenge sizing). 3. Using ABCD on speculative, low-audit-score stocks. 4. No journal — if you can't explain why each tranche was added, you're guessing.\n\nABCD is a discipline system, not a prediction system. It manages risk; it does not guarantee direction." }
    ],
    keyTakeaways: [
      "Institutional desks build positions in tranches, not lump-sum entries",
      "ABCD = four staged zones (A floor, B confirm, C conviction, D momentum), 25% each",
      "A 4-stage ladder gives three chances to be wrong before full commitment",
      "Only apply ABCD on Qualified stocks (audit score 80+)",
      "ABCD manages risk and drawdown — it is not a directional prediction"
    ],
    relatedSlug: 'how-to-trade-like-fii-dii-india',
    relatedTitle: 'How to Trade Like FII/DII in India',
  },

  'swing-vs-intraday-trading-india': {
    title: "Swing vs Intraday Trading in India: Which Suits Your Temperament?",
    metaDescription: "Compare swing trading and intraday trading for Indian equity markets. Understand time commitment, capital needs, tax impact, and which style pairs best with MarketBeacon Pro's strategy matrix.",
    tag: 'Education',
    tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    readTime: '7 min read',
    date: 'Aug 22, 2026',
    sections: [
      { heading: "The Core Difference", body: "Intraday trading means opening and closing positions within the same session. You never carry overnight risk, but you fight milliseconds, brokerage, and STT on every exit. Swing trading means holding for days to weeks to capture a larger move — you accept overnight risk in exchange for fewer trades and cleaner setups.\n\nNeither is 'better'. The right choice depends on your capital, time, and temperament." },
      { heading: "Time Commitment", body: "Intraday demands screen time — you must be available during market hours (9:15 to 15:30 IST) to manage entries, targets, and stops. Swing trading needs only a daily review: 15-20 minutes after close to scan, plan, and adjust. For a working professional, swing trading is far more realistic." },
      { heading: "Capital & Leverage", body: "Intraday brokers offer high leverage (up to 5x on some segments), which amplifies both profit and loss. Swing traders typically use 1x-2x and size positions with a hard stop. With ₹1,00,000 capital, intraday leverage can be tempting but the kill-rate needed to stay profitable is brutal. Swing trading on the same capital with disciplined ABCD tranches is more survivable." },
      { heading: "Tax Impact (India)", body: "Both are 'speculative business income' if done frequently — taxed at slab rate, no ₹1.25L LTCG exemption. But intraday racks up far more turnover, meaning more STT, more brokerage, and heavier compliance (possible tax audit above turnover thresholds). Swing trading generates fewer, larger taxable events — simpler books." },
      { heading: "Which Pairs With MarketBeacon Pro", body: "MarketBeacon Pro's 10-strategy matrix is built for swing-to-positional horizons. Strategies like Institutional Floor, 52W Support Matrix, and Velocity Retest signal over days-to-weeks, not minutes. The ABCD ladder is a swing-positioning tool. If you are an intraday purist, the audit score and smart-money filter still help stock selection — but the strategy triggers are not tuned for 5-minute charts." }
    ],
    keyTakeaways: [
      "Intraday = same-day close, high screen time, high leverage, heavy STT/tax turnover",
      "Swing = days-to-weeks hold, 15-min daily review, more survivable on small capital",
      "Both are speculative income in India — taxed at slab, no LTCG benefit",
      "MarketBeacon Pro strategies are tuned for swing/positional, not 5-min charts",
      "Working professionals usually fit swing trading better than intraday"
    ],
    relatedSlug: 'abcd-tranche-laddering-guide',
    relatedTitle: 'ABCD Tranche Laddering: The Complete Guide',
  },

  'long-term-compounding-india': {
    title: "The Quiet Power of Long-Term Compounding for Indian Investors",
    metaDescription: "Why compounding beats trading for most Indian retail investors. A data-grounded case for positional wealth-building, and how MarketBeacon Pro's audit score helps you pick fundamentally safe stocks to hold.",
    tag: 'Deep Dive',
    tagColor: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    readTime: '8 min read',
    date: 'Aug 22, 2026',
    sections: [
      { heading: "The Math Nobody Argues With", body: "₹10,000 growing at 15% annually becomes ₹40,455 in 10 years and ₹1,63,665 in 20 years — without adding a single rupee. That is the power of compounding, and it requires only two things: a decent return and time. Trading tries to manufacture both daily; investing lets time do the heavy lifting." },
      { heading: "Why Most Traders Underperform", body: "Study after study shows the majority of frequent retail traders earn less than passive index investing after costs. Causes: overtrading (brokerage + STT bleed), revenge sizing, emotional exits, and tax drag. The market does not pay you for activity — it pays you for correct, low-cost exposure held long enough." },
      { heading: "Compounding Needs Fundamentals, Not Tips", body: "Compounding only works if the underlying business survives and grows. A 15% return assumption is destroyed if the company craters on debt or promotes exit. This is exactly where MarketBeacon Pro's 100-point audit helps: it hard-rejects stocks with D/E > 1.0, pledging > 5%, or smart-money < 70%. Those are the companies most likely to break your compounding chain." },
      { heading: "A Hybrid That Actually Works", body: "You do not have to choose purely. Use the audit score to build a core holding of fundamentally 'Qualified' stocks (80+) for compounding, and use a small swing book (ABCD tranches) for active returns. The audit keeps your core safe; the swing book adds alpha. Most retail portfolios fail because they have no core at all." },
      { heading: "Start With the Score, Not the Chart", body: "Before you hold any stock for 10 years, ask: would an institution hold it? If the audit score is Rejected, no chart pattern justifies a decade-long bet. Filter first, then compound. That single discipline separates wealth-builders from spectators." }
    ],
    keyTakeaways: [
      "₹10k at 15% = ₹1.63L in 20 years with zero added capital (compounding)",
      "Most frequent retail traders underperform passive indexing after costs + tax",
      "Compounding breaks if the underlying business fails — fundamentals matter most",
      "Use the 100-point audit to reject dangerous stocks before holding long-term",
      "Hybrid: audit-qualified core for compounding + small ABCD swing book for alpha"
    ],
    relatedSlug: 'institutional-audit-score-explained',
    relatedTitle: 'The 100-Point Institutional Audit Score Explained',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

const BlogArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    fetch(`${getApiUrl()}/api/blog/${slug}`)
      .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
      .then(data => {
        setArticle({
          ...data,
          sections: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
          keyTakeaways: typeof data.key_takeaways === 'string' ? JSON.parse(data.key_takeaways) : data.key_takeaways,
          metaDescription: data.meta_description,
          relatedSlug: data.related_slug,
          relatedTitle: data.related_title,
          tagColor: data.tag_color,
        });
      })
      .catch(() => {
        const fallback = FALLBACK_ARTICLES[slug!];
        if (fallback) setArticle(fallback);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { window.scrollTo(0, 0); }, [article]);

  if (loading) return <div className="min-h-screen bg-slate-950" />;
  if (!article) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SEO title={article.title} description={article.metaDescription} image={`https://marketbeaconpro.com/api/og/blog/${slug}`} url={`/blog/${slug}`} type="article" />
      <OrganizationSchema />
      <ArticleSchema
        title={article.title}
        description={article.metaDescription}
        url={`/blog/${slug}`}
        datePublished={article.date}
      />
      <BreadcrumbSchema items={[
        { label: 'Home', href: '/' },
        { label: 'Blog', href: '/blog' },
        { label: article.title, href: `/blog/${slug}` }
      ]} />
      {/* Navigation */}
      <nav className="border-b border-slate-800/60 px-6 md:px-10 py-5 flex items-center justify-between backdrop-blur-md bg-slate-950/80 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <BrandLogo variant="dark" size={28} />
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/blog" className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors hidden md:flex items-center gap-1.5">
            <ArrowLeft className="w-3 h-3" /> All Articles
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-caption transition-colors shadow-lg shadow-blue-500/20"
          >
            Launch Terminal
          </Link>
        </div>
      </nav>

      <div className="max-w-[780px] mx-auto w-full px-6 md:px-10 mt-6">
        <Breadcrumbs items={[
          { label: 'Blog', href: '/blog' },
          { label: article?.title || slug }
        ]} />
      </div>

      {/* Article Header */}
      <header className="py-16 px-6 md:px-10 max-w-[780px] mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-2 text-caption text-slate-500 hover:text-blue-400 uppercase tracking-wider transition-colors mb-8">
          <ArrowLeft className="w-3 h-3" /> Back to Blog
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full border text-caption ${article.tagColor}`}>
            {article.tag}
          </span>
          <span className="flex items-center gap-1.5 text-caption text-slate-500 uppercase tracking-wider">
            <Clock className="w-3 h-3" />{article.readTime}
          </span>
          <span className="text-caption text-slate-600 uppercase tracking-wider">{article.date}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight mb-6">
          {article.title}
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed border-t border-slate-800 pt-6">
          MarketBeacon Pro Research Team · Published for educational and informational purposes. Not investment advice.
        </p>
      </header>

      {/* Article Body */}
      <main className="px-6 md:px-10 max-w-[780px] mx-auto pb-16">
        <div className="space-y-10">
          {(article.sections || []).map((section: any, i: number) => (
            <div key={i} className="space-y-4">
              {section.heading && (
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {section.heading}
                </h2>
              )}
              {(section.body || '').split('\n\n').map((para: string, j: number) => (
                <p key={j} className="text-slate-300 text-base leading-[1.8] whitespace-pre-line">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Key Takeaways */}
        <div className="mt-12 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] p-8">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-[0.3em] mb-5">Key Takeaways</h3>
          <ul className="space-y-3">
            {(article.keyTakeaways || []).map((point: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-sm text-slate-300 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Related Article */}
        <div className="mt-10">
          <p className="text-caption text-slate-500 uppercase tracking-[0.3em] mb-4">Read Next</p>
          <Link
            to={`/blog/${article.relatedSlug}`}
            className="group flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-6 hover:border-slate-600 transition-all"
          >
            <span className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{article.relatedTitle}</span>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </main>

      {/* CTA */}
      <section className="border-t border-slate-800 py-16 px-6 text-center bg-slate-900/30">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] mb-4">Apply This Knowledge</p>
        <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter mb-3">
          Start Using the System. <span className="text-blue-400">Free.</span>
        </h3>
        <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
          Live ABCD zones, 100-point audit scores, and smart money tracking &mdash; all in one terminal.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold uppercase tracking-wider text-sm hover:scale-105 transition-all shadow-xl shadow-blue-900/30 shadow-lg shadow-blue-500/20"
        >
          Launch Terminal Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
      <SiteFooter />
    </div>
  );
};

export default BlogArticlePage;
