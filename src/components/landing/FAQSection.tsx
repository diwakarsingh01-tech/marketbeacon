import React from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQSectionProps {
  openFaq: number | null;
  setOpenFaq: (val: number | null) => void;
}

const FAQSection: React.FC<FAQSectionProps> = ({ openFaq, setOpenFaq }) => {
  return (
    <section className="py-24 px-6 md:px-10 max-w-[1000px] mx-auto border-t border-slate-900">
       <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase italic">Frequently Audited Queries</h2>
          <p className="text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] text-xs">Everything you need to know about the terminal</p>
       </div>
       
       <div className="space-y-4 text-left">
          {[
            {
              q: "What is an Institutional Stock Audit?",
              a: "An institutional stock audit is a quantitative scan that measures an asset against 100 mathematical data points. Unlike standard news bulletins, it reviews deep fundamental safety, debt leverage parameters, historical valuation percentiles, and institutional demand floors to assign an audit score out of 100."
            },
            {
              q: "How does the ABCD Tranche Laddering model protect capital?",
              a: "Instead of allocating 100% of your capital at a single price point (which exposes you to instant drawdowns), the ABCD Ladder model divides buying capacity into four distinct tranches (A, B, C, D) triggered by historical pullback milestones. This averages your position downward automatically during sweeps and secures a stable demand floor."
            },
            {
              q: "Is MarketBeacon Pro investment advice or advisory?",
              a: "No. MarketBeacon Pro is NOT a SEBI-registered Investment Adviser (IA) or Research Analyst (RA). It is a quantitative mathematical research tool for educational and personal research purposes only. All audit scores, strategy signals, and ABCD zones are pre-coded mathematical models. Nothing on this platform constitutes a personalized investment recommendation, buy/sell advisory, or portfolio management service. Always consult a SEBI-registered advisor before making investment decisions."
            },
            {
              q: "How often are stock prices and audit scores updated?",
              a: "Live stock prices are synced continuously in real-time, and audit models re-examine key fundamental data points (like quarterly results, PE ratios, and institutional holdings) automatically daily to recalculate active scores and update zones."
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)] rounded-3xl overflow-hidden transition-all duration-300">
               <button 
                 type="button"
                 onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                 className="w-full px-8 py-6 flex items-center justify-between hover:bg-[var(--bg-primary)]/5 transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:outline-none"
               >
                  <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">{faq.q}</span>
                  <ChevronRight className={`h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-300 ${openFaq === idx ? 'rotate-90 text-blue-500' : ''}`} />
               </button>
               <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-8 pb-6 text-xs text-[var(--text-muted)] font-mono leading-relaxed"
                    >
                       {faq.a}
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          ))}
       </div>
    </section>
  );
};

export default FAQSection;
