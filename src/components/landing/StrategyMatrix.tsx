import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STRATEGIES = [
  { name: 'Institutional Floor', sub: 'Envelope Long', tier: 'free', color: 'emerald', id: 'ENVELOPE_LONG', how: 'Setup when price touches SMA(200) minus 14% — the institutional floor where large buyers historically step in.', blog: '/blog/how-investors-use-envelope-zones' },
  { name: 'Momentum Ceiling', sub: 'Envelope Short', tier: 'free', color: 'emerald', id: 'ENVELOPE_SHORT', how: 'Sell/avoid when price touches SMA(200) plus 14% — momentum exhaustion zone. Step-back entry on re-test.', blog: '/blog/how-investors-use-envelope-zones' },
  { name: 'Volatility Channel', sub: 'Bollinger Band', tier: 'free', color: 'emerald', id: 'BOLLINGER', how: 'Mean-reversion around SMA(200) with 2.5σ bands. Setup at lower band, exit at upper band.', blog: '/blog/bollinger-bands-deep-dive' },
  { name: 'SMA-ABCD', sub: 'Bearish Stacking', tier: 'pro', color: 'blue', id: 'SMA_BCD', how: 'MA 20/50/200 stacking signals trend exhaustion. When short-MA crosses below long-MA, ABCD tranche triggers for reversal entry.', blog: '/blog/sma-bcd-bearish-stacking' },
  { name: '52W High/Low', sub: 'Support Matrix', tier: 'pro', color: 'blue', id: '52W_HIGH_LOW', how: 'Stocks within 10% of 52-week low with strong fundamentals get scored. Re-entry after pullback confirmation.', blog: '/blog/52-week-high-low-strategy' },
  { name: 'Structural Pivot', sub: 'Cup & Handle', tier: 'pro', color: 'blue', id: 'CUP_HANDLE_ABCD', how: 'Cup formation (30%+ depth) followed by handle. ABCD tranche entries on handle breakout retest.', blog: '/blog/cup-handle-pattern-trading' },
  { name: 'Supply-Demand Core', sub: 'S&R Zones', tier: 'alpha', color: 'amber', id: 'SR_STRATEGY', how: 'Institutional S&R with B-T-B-T-B sequencing. Entry on 3rd touch of demand zone with rising Smart Money.', blog: '/blog/support-resistance-smart-money' },
  { name: 'Velocity Retest', sub: '20% Rally Pullback', tier: 'alpha', color: 'amber', id: 'TWENTY_RALLY_RETEST', how: 'Stock rallies 20%+ from low, pulls back to 50% fib of the rally. Entry at pullback with ABCD confirmation.', blog: '/blog/20-rally-pullback-strategy' },
  { name: 'Deep Recovery', sub: '67% ATH Reset', tier: 'alpha', color: 'amber', id: 'SIXTY_SEVEN_FUNDA', how: 'Stock down 67%+ from ATH with zero debt and rising Smart Money. Contrarian value entry with 100%+ target.', blog: '/blog/67-ath-reset-recovery' },
];

const StrategyMatrix: React.FC = () => {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 px-6 md:px-10 bg-slate-50 border-y border-slate-100">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-10">
          <p className="text-caption text-[#00d09c] uppercase tracking-[0.4em] mb-3">Institutional Strategy Matrix</p>
          <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900">10 Proprietary <span className="text-[#00d09c]">Strategies.</span> One Terminal.</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-3 max-w-2xl mx-auto font-medium">
            The same quant frameworks used by institutional desks — now accessible through a single terminal. Each strategy is pre-coded, backtested, and ready to scan.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {STRATEGIES.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={`group relative p-4 md:p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer bg-white ${
                s.color === 'emerald' 
                  ? 'border-[#00d09c]/20 hover:border-[#00d09c]/50 hover:shadow-sm' 
                  : s.color === 'blue'
                  ? 'border-blue-200 hover:border-blue-400 hover:shadow-sm'
                  : 'border-amber-200 hover:border-amber-400 hover:shadow-sm'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-caption px-2 py-0.5 rounded-full ${
                    s.tier === 'free' ? 'text-[#00d09c] bg-[#00d09c]/10' : s.tier === 'pro' ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
                  }`}>{s.tier === 'free' ? 'FREE' : s.tier === 'pro' ? 'PRO' : 'ALPHA'}</span>
                  <div className="flex items-center gap-1">
                    <Info className={`h-3 w-3 ${s.tier === 'free' ? 'text-[#00d09c]/40' : 'text-slate-400'}`} />
                    {expanded === i ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                  </div>
                </div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 leading-tight mb-0.5">{s.name}</h3>
                <p className="text-xs md:text-caption text-slate-500 uppercase tracking-wider">{s.sub}</p>
              </div>
              <AnimatePresence>
                {expanded === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-500 leading-relaxed"
                  >
                    {s.how}
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-2">Educational rule. Not a signal.</p>
                    <Link to={s.blog} className="inline-flex items-center gap-1 text-[#00d09c] text-caption mt-2 hover:text-slate-900 transition-colors">
                      Read on Knowledge Base <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8 flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            All strategies are mathematical models for educational research. Past performance does not guarantee future results.
          </p>
          <Link to="/education" className="inline-flex items-center gap-2 text-[#00d09c] text-caption hover:text-slate-900 transition-colors">
            Understand Each Strategy <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default StrategyMatrix;
