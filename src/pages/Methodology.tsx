import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, BarChart3, AlertTriangle, Shield } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const sections = [
  {
    icon: BarChart3,
    title: 'Backtest Methodology',
    items: [
      'Backtest period: January 2020 – December 2025',
      'Universe: Nifty 500 + Alpha 40 stocks (liquid, high-cap)',
      'Total signals evaluated: 1,247',
      'Slippage assumption: 0.1% per trade (entry + exit)',
      'Transaction cost: 0.05% per trade (brokerage + STT + DP charges)',
      'Benchmark: Nifty 50 Total Returns Index',
      'Results exclude tax impact; individual results will vary',
    ],
  },
  {
    icon: Shield,
    title: 'Risk & Limitations',
    items: [
      'Past performance does not guarantee future results',
      'All strategies are mathematical models for educational research only',
      'Market regimes shift — a strategy that worked in 2020–2024 may underperform in different conditions',
      'Drawdowns of 15–25% are normal even for high-scoring setups',
      'Position sizing is the single most important risk control — ABCD tranche model helps but does not eliminate risk',
      'No strategy accounts for black-swan events, corporate actions, or sudden regulatory changes',
      'Results are based on historical backtests; forward testing is recommended before deploying capital',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Strategy Application Rules',
    items: [
      'Each strategy has specific entry/exit rules; trade only when all conditions are met',
      'Smart Money Filter (FII/DII/Promoter data) is applied as a hard reject for all strategies',
      'Minimum audit score of 60/100 required for any strategy to trigger',
      'Multiple strategies on the same stock increase alignment but do not guarantee success',
      'Strategies are ranked by current market regime (trending vs range-bound vs volatile)',
    ],
  },
  {
    icon: BookOpen,
    title: 'Data Sources',
    items: [
      'Price data: NSE/BSE daily close, adjusted for splits & bonuses',
      'Fundamental data: Quarterly corporate filings, annual reports',
      'Institutional flow: FII/DII holdings from SEBI-mandated disclosures (45-day lag)',
      'Promoter data: Exchange filings (pledge, holding changes)',
      'Smart Money composite: FII + DII + Promoter trend alignment score',
    ],
  },
];

const Methodology: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Methodology — MarketBeacon Pro</title>
        <meta name="description" content="Learn how MarketBeacon Pro backtests, validates, and applies its 10 institutional trading strategies. Full methodology, assumptions, risk disclosures, and data sources." />
      </Helmet>

      <main className="min-h-screen bg-white">
        <div className="max-w-[800px] mx-auto px-6 py-16 md:py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-900 transition-colors mb-12">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-4">Methodology</h1>
          <p className="text-slate-500 text-sm mb-12 max-w-lg leading-relaxed">
            How MarketBeacon Pro builds, backtests, and applies its 10 institutional strategies. All models are for educational research — not investment advice.
          </p>

          <div className="space-y-12">
            {sections.map((section, i) => (
              <div key={i}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-[#00d09c]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{section.title}</h2>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed font-semibold">
                      <span className="w-1 h-1 rounded-full bg-[#00d09c]/60 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 p-6 rounded-2xl bg-amber-50 border border-amber-200">
            <p className="text-caption text-amber-600 uppercase tracking-wider mb-2 font-bold">⚠ Educational Disclaimer</p>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              MarketBeacon Pro is an educational platform for institutional audit research. Nothing on this website constitutes investment advice, a recommendation, or an offer to buy or sell securities. All strategies, backtests, and signals are for reference only. Always consult a SEBI-registered investment advisor before making trading decisions. Past performance is not indicative of future results.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 px-10 py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl font-bold uppercase tracking-wider text-xs transition-all shadow-md shadow-[#00d09c]/15">
              Access Quant Terminal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default Methodology;
