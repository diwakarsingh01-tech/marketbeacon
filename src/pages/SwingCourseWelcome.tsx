import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, BookOpen, Download, PlayCircle, ArrowRight, Trophy } from 'lucide-react';
import SEO from '../components/SEO';

/**
 * Post-purchase Welcome / Unlock page for the Swing Course.
 * Reached after Razorpay payment success (/course/swing/welcome).
 * Shows module access + links to the complete course material.
 */
const SwingCourseWelcome: React.FC = () => {
  const navigate = useNavigate();

  const MODULES = [
    'Mindset, Market Reality & Scam Protection',
    'Stock Universe: Super 45 / Good 45 / Good 200',
    'Envelope Strategies (Long / Short / 52-Week)',
    'Advanced: Bollinger / Noxwell / SMA',
    'Good 200: S&R + 20% Rally',
    'Good 45: ABCD Averaging + Patterns',
    'Fundamental Analysis + 67-Funda',
    'Tools & Execution (Tracker/Log/Screener/GTT)',
    'Option Selling Crash Course (Bonus)',
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <SEO
        title="Welcome — MarketBeacon Swing System"
        description="Your Swing Trading Course is unlocked."
        url="/course/swing/welcome"
        noindex
      />

      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Success header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">You're In. 🎉</h1>
          <p className="text-[var(--text-muted)] mt-3 text-lg">
            Welcome to the <span className="text-blue-400 font-bold">MarketBeacon Swing System</span>.
            Your lifetime access is active.
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-2 uppercase tracking-wider">
            One-time ₹999 · Lifetime · Educational, not SEBI advice
          </p>
        </div>

        {/* Modules unlocked */}
        <div className="card p-8 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" /> What's Unlocked (9 Modules)
          </h2>
          <ul className="space-y-2">
            {MODULES.map((m, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span><span className="text-blue-400 font-bold mr-1">M{i + 1}.</span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA: open course */}
        <a
          href="/course/Swing_Course_Complete.html"
          className="block w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold text-lg text-center shadow-xl shadow-blue-900/30 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" /> Start the Course
        </a>

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-4">
          Tip: Bookmark the course page. Work one module per day — patience builds the wealth.
        </p>

        {/* Weekend live */}
        <div className="card p-6 mt-8 border-emerald-500/20 text-center">
          <h3 className="font-bold mb-2 text-emerald-400">📡 Weekend Live Sessions</h3>
          <p className="text-sm text-[var(--text-muted)]">
            Join our weekend YouTube live where we apply the system in real time.
            Check the Community tab for the next session link.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mx-auto mt-8 flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default SwingCourseWelcome;
