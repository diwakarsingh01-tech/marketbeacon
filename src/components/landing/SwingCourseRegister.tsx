import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, GraduationCap, MessageCircle, Star } from 'lucide-react';
import { waLink } from '../../lib/constants';

const WA_GROUP_MSG = waLink('Hi! I want to join the MarketBeacon Swing System WhatsApp group. Please add me.');
const WA_BATCH_MSG = waLink('Hi! I want to reserve a seat in the next MarketBeacon Swing System batch. Please share the details.');

/**
 * Swing Course registration section for the LANDING page (dark theme).
 * MOBILE-FIRST: single column, compact stats, full-width tap targets.
 * Lets any site visitor enroll in the ₹999 course or join the WhatsApp community.
 */
const SwingCourseRegister: React.FC = () => {
  return (
    <section className="py-14 md:py-24 px-4 sm:px-6 md:px-10 relative overflow-hidden border-y border-[var(--border-primary)]/50">
      {/* soft glow backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] md:w-[60rem] h-72 bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 md:w-96 h-96 bg-emerald-600/5 blur-[100px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-start lg:items-center">
          {/* Left: pitch */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 mb-4 md:mb-5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] md:text-caption text-emerald-400 uppercase tracking-wider">Swing Trading Course · ₹999 Lifetime</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] leading-tight mb-4 md:mb-5">
              Learn the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Swing System</span> behind this terminal.
            </h2>
            <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed font-medium mb-6 max-w-xl mx-auto lg:mx-0">
              Same strategies the MarketBeacon audit runs on — Envelope 200 EMA, ABCD laddering, Cup &amp; Handle,
              67-point fundamentals. 12+ strategies with exact entry/exit rules. New batch every month,
              dedicated WhatsApp group, weekend live sessions.
            </p>

            {/* quick stats — 2×2 on mobile, 4 across on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 mb-6 md:mb-8">
              {[
                { stat: '12+', label: 'Strategies' },
                { stat: '~97%', label: 'Backtest win rate' },
                { stat: '9', label: 'Modules' },
                { stat: '₹999', label: 'One-time' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl md:rounded-2xl border border-[var(--border-primary)]/60 bg-[var(--bg-secondary)]/40 px-2 py-2.5 md:px-3 md:py-3 text-center">
                  <p className="text-lg md:text-xl font-black text-[var(--text-primary)]">{s.stat}</p>
                  <p className="text-[9px] md:text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5 md:mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* value bullets — compact on mobile */}
            <ul className="space-y-2.5 mb-7 md:mb-8 text-sm text-[var(--text-muted)] text-left max-w-md mx-auto lg:mx-0">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><span className="font-bold text-[var(--text-primary)]">Monthly batches</span> — structured course-by-course with doubt sessions</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><span className="font-bold text-[var(--text-primary)]">Dedicated WhatsApp group</span> — unlocked after enrollment</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span><span className="font-bold text-[var(--text-primary)]">Weekend live sessions</span> + cheat sheet + formula bank included</span>
              </li>
            </ul>
          </div>

          {/* Right: enroll card — full-width buttons on mobile */}
          <div className="card p-6 sm:p-8 md:p-10">
            <div className="flex items-center justify-between mb-4 md:mb-5">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(x => <Star key={x} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <span className="text-[10px] md:text-xs text-[var(--text-tertiary)]">Educational · Not SEBI advice</span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-[var(--text-primary)] mb-2">
              MarketBeacon Swing System
            </h3>
            <p className="text-xs md:text-sm text-[var(--text-muted)] mb-5 md:mb-6">
              9 modules · 55+ lessons · ~6 hours · lifetime access · new batch every month
            </p>

            <div className="flex items-end gap-2 mb-6 md:mb-7">
              <span className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">₹999</span>
              <span className="text-xs md:text-sm text-[var(--text-muted)] mb-1.5 md:mb-2">one-time · lifetime</span>
            </div>

            <Link
              to="/course/swing"
              className="block w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold text-base md:text-lg text-center text-[var(--text-primary)] shadow-xl shadow-blue-900/30 transform active:scale-[0.98] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mb-3"
            >
              <GraduationCap className="w-5 h-5" /> Enroll Now <ArrowRight className="w-5 h-5" />
            </Link>

            {/* full-width stacked buttons on mobile, 2-col on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={WA_GROUP_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600/15 border border-emerald-500/40 hover:bg-emerald-600/25 rounded-xl font-bold text-sm text-emerald-300 transition-all active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4" /> Join WhatsApp Group
              </a>
              <a
                href={WA_BATCH_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-emerald-500/40 rounded-xl font-bold text-sm text-[var(--text-primary)] transition-all active:scale-[0.98]"
              >
                <CalendarDays className="w-4 h-4" /> Reserve Batch Seat
              </a>
            </div>

            <p className="text-[10px] md:text-xs text-[var(--text-tertiary)] text-center mt-5 leading-relaxed">
              Backtest results &amp; projections are illustrative — past performance is not indicative of future results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SwingCourseRegister;
