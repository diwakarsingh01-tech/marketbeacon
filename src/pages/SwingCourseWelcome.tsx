import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, BookOpen, PlayCircle, Trophy, MessageCircle, Lock } from 'lucide-react';
import SEO from '../components/SEO';
import { waLink } from '../lib/constants';
import { getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

/**
 * Post-purchase Welcome / Unlock page for the Swing Course.
 * Reached after Razorpay payment success (/course/swing/welcome).
 * Shows module access + links to the complete course material.
 * WhatsApp batch group link unlocks ONLY after payment is verified
 * SERVER-SIDE (check-access against DB) — local flag is a fast-path only.
 */
const SwingCourseWelcome: React.FC = () => {
  const navigate = useNavigate();
  const [verified, setVerified] = useState<boolean | null>(null);

  // Local fast-path flag (set by payment handler)
  const localPaid = typeof window !== 'undefined' && localStorage.getItem('mb_swing_paid') === '1';
  const email = typeof window !== 'undefined' ? (localStorage.getItem('mb_swing_email') || '') : '';

  useEffect(() => {
    // Server-side check: real unlock state from DB
    if (!email) {
      setVerified(localPaid);
      return;
    }
    fetch(`${API_URL}/api/payment/check-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setVerified(!!d.unlocked);
        else setVerified(localPaid);
      })
      .catch(() => setVerified(localPaid));
  }, [email]);

  const paid = verified === null ? localPaid : verified;

  const WA_JOIN_MSG = waLink(
    `Hi! I just enrolled in the MarketBeacon Swing System${email ? ` (${email})` : ''}. Please add me to the batch WhatsApp group.`
  );

  const MODULES = [
    'Mindset, Market Reality & Scam Protection',
    'Stock Universe: Elite / Quality / Growth / Fallen Value',
    'Envelope Strategies (Long / Short / 52-Week)',
    'Advanced: Bollinger / Knoxville / SMA',
    'Growth Basket: S&R + 20% Rally',
    'Growth-45: ABCD Averaging + Patterns',
    'Fundamental Analysis + 67-Point Audit',
    'Tools & Execution (Tracker/Log/Screener/GTT)',
    'Option Selling Crash Course (Bonus)',
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <SEO
        title="Welcome — MarketBeacon Swing System"
        description="Your Swing Trading Course is unlocked."
        url="/course/swing/welcome"
        noindex
      />

      {/* animated light background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 animated-bg" />
        <div className="absolute top-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-emerald-200/40 blur-[120px] animate-orb-1" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[35rem] h-[35rem] rounded-full bg-blue-200/40 blur-[120px] animate-orb-2" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-20">
        {/* Success header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">You're In. 🎉</h1>
          <p className="text-slate-600 mt-3 text-lg">
            Welcome to the <span className="text-blue-600 font-bold">MarketBeacon Swing System</span>.
            Your lifetime access is active.
          </p>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider">
            One-time ₹999 · Lifetime · Educational, not SEBI advice
          </p>
        </div>

        {/* WhatsApp group — payment-gated */}
        <div className={`card-light p-8 mb-8 bg-white/90 backdrop-blur border rounded-2xl ${paid ? 'border-emerald-300' : 'border-slate-200'}`}>
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-slate-900">
            <MessageCircle className="w-5 h-5 text-emerald-600" /> Your Batch WhatsApp Group
          </h2>
          {paid ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Payment confirmed ✅ — tap below to join your batch group. Universe lists, doubt sessions
                and community support live there.
              </p>
              <a
                href={WA_JOIN_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-lg text-white text-center shadow-xl shadow-emerald-200 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> Join Batch WhatsApp Group
              </a>
              <p className="text-center text-xs text-slate-500 mt-3">
                Group link is unlocked because your enrollment was confirmed.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  The batch WhatsApp group unlocks after enrollment is confirmed. If you paid and landed
                  here, go back and re-open this page — or message us on WhatsApp and we'll add you
                  manually.
                </p>
              </div>
              <a
                href={waLink('Hi! I paid for the MarketBeacon Swing System but my WhatsApp group is still locked. Please help.')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
              >
                <MessageCircle className="w-4 h-4" /> Contact on WhatsApp
              </a>
            </>
          )}
        </div>

        {/* Modules unlocked */}
        <div className="card-light p-8 mb-8 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900">
            <BookOpen className="w-5 h-5 text-blue-600" /> What's Unlocked (9 Modules)
          </h2>
          <ul className="space-y-2">
            {MODULES.map((m, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span><span className="text-blue-600 font-bold mr-1">M{i + 1}.</span>{m}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA: open course */}
        <a
          href="/course/Swing_Course_Complete.html"
          className="block w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold text-lg text-white text-center shadow-xl shadow-blue-200 transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" /> Start the Course
        </a>

        <p className="text-center text-xs text-slate-500 mt-4">
          Tip: Bookmark the course page. Work one module per day — patience builds the wealth.
        </p>

        {/* Weekend live */}
        <div className="card-light p-6 mt-8 bg-white/90 backdrop-blur border border-emerald-200 rounded-2xl text-center">
          <h3 className="font-bold mb-2 text-emerald-700">📡 Weekend Live Sessions</h3>
          <p className="text-sm text-slate-600">
            Join our weekend YouTube live where we apply the system in real time.
            Check the Community tab for the next session link.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mx-auto mt-8 flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm"
        >
          ← Back to home
        </button>
      </div>

      <style>{`
        .animated-bg {
          background: linear-gradient(120deg,
            #eff6ff 0%, #f0fdf4 20%, #eef2ff 40%,
            #fdf2f8 60%, #fefce8 80%, #eff6ff 100%);
          background-size: 400% 400%;
          animation: bgShift 18s ease infinite;
        }
        @keyframes bgShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes orb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px, 30px) scale(1.1); } }
        @keyframes orb2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px, -20px) scale(1.12); } }
        .animate-orb-1 { animation: orb1 14s ease-in-out infinite; }
        .animate-orb-2 { animation: orb2 17s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animated-bg, .animate-orb-1, .animate-orb-2 { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SwingCourseWelcome;
