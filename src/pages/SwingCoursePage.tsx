import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShieldCheck, Target, BookOpen, CheckCircle2, Star,
  Zap, Layers, ArrowRight, Award, Users, Clock, BarChart3,
  ChevronRight, PlayCircle, Lock, Sparkles, Trophy, GraduationCap
} from 'lucide-react';
import SEO from '../components/SEO';
import { getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

// ---------- Course curriculum (from Hemant Swing notes, rebranded) ----------
const CURRICULUM = [
  {
    module: 'Module 1', title: 'The Envelope Method (200 EMA ±14%)',
    desc: 'Identify the buy zone like institutions. Lower blue band = accumulation. Upper band = exit. 5% disciplined targets.',
    icon: Layers, lessons: 6, duration: '45 min', color: 'from-blue-500 to-indigo-500'
  },
  {
    module: 'Module 2', title: 'ABCD Ladder Entry System',
    desc: 'Four-tranche laddered entry (A→B→C→D) at historical pullback milestones. Averaging down automatically, protected.',
    icon: BarChart3, lessons: 5, duration: '40 min', color: 'from-emerald-500 to-teal-500'
  },
  {
    module: 'Module 3', title: 'Cup & Handle + Reverse H&S',
    desc: 'Chart patterns that precede big moves. Spot the base, trade the breakout with predefined risk.',
    icon: TrendingUp, lessons: 5, duration: '38 min', color: 'from-amber-500 to-orange-500'
  },
  {
    module: 'Module 4', title: '67-Point Fundamental Checklist',
    desc: 'The institutional audit: D/E, pledged shares, smart money, sales-at-ATH. Filter 500 stocks → 10 qualifiers.',
    icon: ShieldCheck, lessons: 7, duration: '52 min', color: 'from-purple-500 to-fuchsia-500'
  },
  {
    module: 'Module 5', title: 'RSI Bounce + ATH-30% Setup',
    desc: 'The high-probability reversal: RSI crosses under 25, price ≥30% off ATH. The core entry trigger.',
    icon: Zap, lessons: 4, duration: '30 min', color: 'from-rose-500 to-pink-500'
  },
  {
    module: 'Module 6', title: 'Risk, Position & Live Practice',
    desc: 'Capital allocation, max drawdown guardrails, weekend live trading sessions. Build your own system.',
    icon: Award, lessons: 6, duration: '48 min', color: 'from-cyan-500 to-sky-500'
  },
];

const PROOF = [
  { stat: '94', label: 'Nifty-500 stocks audited', icon: BarChart3 },
  { stat: '67', label: 'Point fundamental scorecard', icon: ShieldCheck },
  { stat: '5%', label: 'Disciplined target per trade', icon: Target },
  { stat: '12', label: 'Strategy modules included', icon: BookOpen },
];

const FAQS = [
  { q: 'Is this SEBI-registered advice?', a: 'No. MarketBeacon is an educational research platform. We teach a repeatable swing-trading system — you make your own decisions. Not investment advice.' },
  { q: 'Do I need trading experience?', a: 'No. Module 1 starts from the envelope method. If you can read a chart, you can learn this.' },
  { q: 'How is this different from tips/signals?', a: 'We do not give buy/sell tips. We teach YOU the system used by institutional desks — so you trade with conviction, not blind follows.' },
  { q: 'Is there live support?', a: 'Yes. Weekend live sessions + community access. Ask questions, see the system applied in real time.' },
  { q: 'What is the refund policy?', a: 'Course access is digital. Review the free preview modules first. Reach out within 7 days for any concern.' },
];

const SwingCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [showFAQ, setShowFAQ] = useState<number | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    // fetch user if logged in
    const token = localStorage.getItem('mb_token');
    if (token) {
      fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(d => setUser(d?.user || null))
        .catch(() => {});
    }
    // Load Razorpay checkout script once
    if (!(window as any).Razorpay) {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const handleBuy = async () => {
    setErr('');
    const userEmail = user?.email || email;
    if (!userEmail) {
      setErr('Please enter your email (or login) to purchase.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, name: user?.name || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment init failed');

      const rzp = new (window as any).Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: 'MarketBeacon Swing System',
        description: 'Lifetime access to the Swing Trading Course',
        image: '/favicon.svg',
        handler: function () {
          // On success, redirect to thank-you / course unlock
          navigate('/course/swing/welcome');
        },
        prefill: { email: userEmail, name: user?.name || '' },
        theme: { color: '#2563eb' },
      });
      rzp.open();
    } catch (e: any) {
      setErr(e.message || 'Could not start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <SEO
        title="MarketBeacon Swing System — Learn Institutional Swing Trading"
        description="A repeatable swing-trading system: Envelope 200 EMA, ABCD ladder, Cup & Handle, 67-point fundamental audit. Educational, not advice."
        url="/course/swing"
      />

      {/* HERO */}
      <header className="relative overflow-hidden pt-20 pb-16 px-6 max-w-6xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-72 bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-950/50 border border-blue-900 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">The System Institutions Use</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-5">
            SWING TRADING,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">DECODED.</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-8">
            Learn the repeatable swing-trading system behind institutional desks — the Envelope Method,
            ABCD ladder, and a 67-point fundamental audit. <span className="text-blue-400 font-semibold">Not tips. Not signals. A system you own.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
            <button
              onClick={handleBuy}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/30 transform hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Starting…' : <>Enroll for ₹999 <ArrowRight className="w-5 h-5" /></>}
            </button>
            <a href="#curriculum" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-semibold flex items-center gap-1">
              <PlayCircle className="w-5 h-5" /> See what's inside
            </a>
          </div>

          {err && <p className="text-rose-400 text-sm font-bold mb-4">{err}</p>}
          {!user && (
            <div className="flex items-center gap-2 justify-center max-w-md mx-auto">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          )}

          <p className="text-xs text-[var(--text-tertiary)] mt-4 uppercase tracking-wider">
            One-time ₹999 · Lifetime access · Educational only, not SEBI advice
          </p>
        </div>

        {/* PROOF STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
          {PROOF.map((p, i) => (
            <div key={i} className="card p-6 text-center hover:scale-105 transition-transform">
              <p.icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
              <p className="text-3xl font-black text-[var(--text-primary)]">{p.stat}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">{p.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* PAIN → SOLUTION */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-8 border-rose-500/20">
            <h3 className="text-xl font-bold mb-4 text-rose-400 flex items-center gap-2"><Lock className="w-5 h-5" /> The Trap Most Retail Traders Fall Into</h3>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li>• Chasing "tips" and FOMO entries with no system</li>
              <li>• Buying at the top, panic-selling at the bottom</li>
              <li>• No position sizing → one bad trade wipes the account</li>
              <li>• Trusting "signals" from unregistered sources</li>
            </ul>
          </div>
          <div className="card p-8 border-emerald-500/20">
            <h3 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2"><Trophy className="w-5 h-5" /> The MarketBeacon Swing System</h3>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li>• Buy in the <span className="text-blue-400 font-semibold">lower envelope band</span> — where institutions accumulate</li>
              <li>• Laddered ABCD entries → average down with protection</li>
              <li>• 67-point audit filters noise → only qualified stocks</li>
              <li>• A repeatable system you run, not blind follows</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CURRICULUM */}
      <section id="curriculum" className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">What You'll Master</h2>
          <p className="text-[var(--text-muted)] mt-3">6 modules · 33 lessons · ~4 hours · lifetime access</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CURRICULUM.map((c, i) => (
            <div key={i} className="card p-6 hover:scale-[1.02] transition-transform group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${c.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <c.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">{c.module}</p>
              <h3 className="text-lg font-bold mt-1 mb-2">{c.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">{c.desc}</p>
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.lessons} lessons</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SOCIAL PROOF / TESTIMONIALS (placeholder, editable) */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="card p-10 text-center bg-gradient-to-br from-blue-600/5 to-indigo-600/5 border-blue-500/10">
          <div className="flex justify-center gap-1 mb-4">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-6 h-6 fill-amber-400 text-amber-400" />)}
          </div>
          <p className="text-xl md:text-2xl font-bold max-w-3xl mx-auto leading-relaxed">
            "Finally a system I understand. The envelope method showed me exactly where to buy — no more guessing."
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-4">— Early Student, MarketBeacon Swing System</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black tracking-tighter text-center mb-10">Questions, Answered</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setShowFAQ(showFAQ === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <span className="font-bold">{f.q}</span>
                <ChevronRight className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${showFAQ === i ? 'rotate-90' : ''}`} />
              </button>
              {showFAQ === i && (
                <div className="px-5 pb-5 text-sm text-[var(--text-muted)] leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="card p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl">
          <GraduationCap className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-black mb-3">Own The System. Trade With Conviction.</h2>
          <p className="mb-8 opacity-90 max-w-xl mx-auto">One-time ₹999. Lifetime access. Weekend live sessions. Stop following — start trading with a system.</p>
          <button
            onClick={handleBuy}
            disabled={loading}
            className="px-10 py-4 bg-white text-blue-700 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-60"
          >
            {loading ? 'Starting…' : 'Enroll for ₹999'}
          </button>
          <p className="text-xs opacity-80 mt-4 uppercase tracking-wider">Educational research · Not SEBI-registered advice</p>
        </div>
      </section>

      <footer className="text-center py-8 text-xs text-[var(--text-tertiary)] border-t border-[var(--border-primary)]">
        MarketBeacon Pro · Educational platform · Not a SEBI-registered Investment Adviser or Research Analyst
      </footer>
    </div>
  );
};

export default SwingCoursePage;
