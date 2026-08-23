import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShieldCheck, Target, BookOpen, CheckCircle2, Star,
  Zap, Layers, ArrowRight, Award, Users, Clock, BarChart3,
  ChevronRight, PlayCircle, Lock, Sparkles, Trophy, GraduationCap,
  MessageCircle, CalendarDays, Flame, Wallet, LineChart, AlertTriangle,
  Gauge, IndianRupee, Gift, ShieldAlert, RefreshCcw
} from 'lucide-react';
import SEO from '../components/SEO';
import { getApiUrl } from '../lib/api-utils';
import { waLink } from '../lib/constants';

const API_URL = getApiUrl();

// WhatsApp prefilled messages (group join + batch enquiry)
const WA_GROUP_MSG = waLink('Hi! I want to join the MarketBeacon Swing System WhatsApp group. Please add me.');
const WA_BATCH_MSG = waLink('Hi! I want to reserve a seat in the next MarketBeacon Swing System batch. Please share the details.');

// ---------- Real curriculum (rebranded, from swing course master notes) ----------
const CURRICULUM = [
  {
    module: 'Module 1', title: 'Mindset, Market Reality & Scam Protection',
    desc: 'Why 99% lose and 1% win. Realistic expectations (25–30% CAGR is real; "daily 5%" is a scam). 6 scams decoded — MLM, guaranteed returns, option-buying traps, crypto, fake institutional apps, fake teacher groups.',
    icon: ShieldAlert, lessons: 8, duration: '60 min', color: 'from-rose-500 to-pink-500'
  },
  {
    module: 'Module 2', title: 'Stock Universe — Super 45 / Good 45 / Good 200',
    desc: 'The 3 institutional lists. Super 45 ke 6 bare-minimum criteria (Net Profit > ₹200cr, NDE < 0.2, ROCE > 12%, 15+ yr business, market leader). Market-cap fall table — exactly kab buy karna hai.',
    icon: Layers, lessons: 6, duration: '45 min', color: 'from-blue-500 to-indigo-500'
  },
  {
    module: 'Module 3', title: 'Envelope Strategies (Long / Short / 52-Week)',
    desc: 'The core: 200 EMA ±14% bands. Long Envelope — lower blue touch pe buy, 30% pe sell. Short Envelope — 2 trades, 12% each. 52-Week High-Low — beginner-friendly, kabhi loss mein mat bechna.',
    icon: LineChart, lessons: 6, duration: '48 min', color: 'from-emerald-500 to-teal-500'
  },
  {
    module: 'Module 4', title: 'Advanced — Bollinger / Noxwell / SMA',
    desc: 'Price & time corrections (crash, major, minor — har level ka apna play). Bollinger 200/2.5 (lower band + width ≥35%). Envelope+Noxwell divergence. Advanced SMA — dead cross pe buy (99% ka ulta).',
    icon: Gauge, lessons: 5, duration: '40 min', color: 'from-amber-500 to-orange-500'
  },
  {
    module: 'Module 5', title: 'Good 200 Strategies (S&R / 20% Rally)',
    desc: 'Support & Resistance — zone, point nahi; 2 baar bounce. 20% Rally — sirf green candles, rally start pe entry. Stability + consistent growth universe (3-ratio screener built live).',
    icon: Target, lessons: 5, duration: '38 min', color: 'from-cyan-500 to-sky-500'
  },
  {
    module: 'Module 6', title: 'Good 45 Strategies (ABCD / RHS / Cup-Handle)',
    desc: 'The wealth-builder: ABCD laddered averaging (A 2–3%, B 10%, C 20%, D 30% — B→A, C→B, D→C exits). Reverse Head & Shoulders + Cup with Handle — sirf 20–30% neeche wala pattern. SMA+BCD / 52wk+BCD.',
    icon: BarChart3, lessons: 7, duration: '52 min', color: 'from-purple-500 to-fuchsia-500'
  },
  {
    module: 'Module 7', title: 'Fundamental Analysis + 67-Funda Audit',
    desc: 'Balance sheet, P&L, cash flow, shareholding, pledge (POC < 5%), debtor days, PB < 0.4 reversion trades. 20-point golden rules + the 67-point institutional checklist — filter 500 stocks to 10 qualifiers.',
    icon: ShieldCheck, lessons: 7, duration: '55 min', color: 'from-violet-500 to-indigo-500'
  },
  {
    module: 'Module 8', title: 'Tools & Execution (Tracker / Log / GTT)',
    desc: 'Trading log (broker ka average NEVER — FIFO vs LIFO), screener.in custom ratios, TradingView indicators, GTT orders — trade lete hi auto-exit, bina screen dekhe discipline. 20% gain alert system.',
    icon: Zap, lessons: 5, duration: '35 min', color: 'from-slate-500 to-gray-600'
  },
  {
    module: 'Module 9', title: 'Option Selling Crash Course (Bonus)',
    desc: '"I sell puts to buy stock." Theta decay — seller ka best friend. ₹12L capital math, rollover (losses postpone, DAB example — ₹13,125 profit), expiry square-off rules. Bonus module, included free.',
    icon: Wallet, lessons: 6, duration: '48 min', color: 'from-emerald-600 to-green-500'
  },
];

// ---------- The 12-strategy engine (from entry/exit cheat sheet) ----------
const STRATEGIES = [
  { name: 'Long Envelope', list: 'Super 45', entry: 'Lower blue touch (mandatory)', exit: '30% flat (ya upper blue @ 25%+)' },
  { name: 'Short Envelope', list: 'Super 45', entry: 'Orange pe (1–1.5%) / lower blue (3–5%)', exit: '12% (2 independent trades)' },
  { name: '52 Week High-Low', list: 'Super 45', entry: '52-week low touch', exit: '52-week high touch' },
  { name: 'Bollinger 200/2.5', list: 'Super 45', entry: 'Lower band, width ≥ 35%', exit: 'Upper band' },
  { name: 'Envelope + Noxwell', list: 'Super 45', entry: 'P1 (lower blue ke neeche) / P2', exit: 'Orange ke upar, red-top line' },
  { name: 'Advanced SMA', list: 'Super 45', entry: 'Dead cross (Price > Black > Green > Red)', exit: 'Golden cross (ulta)' },
  { name: 'Support & Resistance', list: 'Good 200', entry: 'Support zone, 2 baar bounce', exit: 'Resistance zone' },
  { name: '20% Rally / Super', list: 'Good 200', entry: 'Rally start point pe wapas aaye', exit: 'Pehli red se pehle wali green ka high' },
  { name: 'ABCD Averaging', list: 'Good 45', entry: 'A (2–3%), B (10%), C (20%), D (30%)', exit: 'B→A, C→B, D→C; A→A~' },
  { name: 'RHS / Cup-Handle', list: 'Good 45', entry: 'Breakout sirf 20–30% neeche wala', exit: 'Technical target (rupaye mapping)' },
  { name: 'SMA with BCD', list: 'Good 45', entry: 'B/C/D levels (A trade NAHI)', exit: 'Pehle level pe sell' },
  { name: '52wk with BCD', list: 'Good 45', entry: 'Zone ke andar BCD', exit: 'Pehle level; valid till 52w high' },
];

// ---------- Wealth math (compounding, course-standard 25–30% CAGR) ----------
const WEALTH = [
  { years: '4 years', x25: '₹2.44L', x30: '₹2.86L', note: 'First doubling zone' },
  { years: '6 years', x25: '₹3.81L', x30: '₹4.83L', note: '~4–5x (course: 6 saal 4x)' },
  { years: '9 years', x25: '₹7.45L', x30: '₹10.60L', note: '8–10x' },
  { years: '12 years', x25: '₹14.55L', x30: '₹23.30L', note: '16–23x' },
  { years: '20 years', x25: '₹86.7L', x30: '₹1.90Cr', note: '~100x (course standard)' },
];

// ---------- Success stories (real, from course records) ----------
const STORIES = [
  {
    name: 'Reported student result', period: '12 months · 3–4 techniques only',
    quote: 'Followed the system religiously — Envelope, S&R, 20% Rally + ABCD. ~₹31 lakh deployed, ~₹2.3 lakh total profit booked. ABCD averaging alone contributed 31.8% of profits; S&R 21% at open.',
    stat: '₹2.3L+', label: 'profit in 12 months', verified: 'Reported class result · illustrative'
  },
  {
    name: 'Rollover example', period: 'Option selling · 4-month math',
    quote: 'Stock fell 520 → 480 the whole time. Rolling the put every month still banked +₹10.5 per share = ₹13,125 on one position. "Yehi hai what the system does."',
    stat: '₹13,125', label: 'profit while stock fell', verified: 'Course module example'
  },
  {
    name: 'Short Envelope case', period: 'Super 45 · 2016–2022 rally',
    quote: 'Stock never touched lower blue for 6 years. The 2-trade Short Envelope system booked 12 signals × 12% each — stock doubled/tripled and the trader kept collecting.',
    stat: '12 × 12%', label: 'booked in a bull run', verified: 'Course module example'
  },
];

const FAQS = [
  { q: 'Is this SEBI-registered advice?', a: 'No. MarketBeacon is an educational research platform. We teach a repeatable swing-trading system — you make your own decisions. Not investment advice.' },
  { q: 'How is this different from tips/signals groups?', a: 'We do not give buy/sell tips. You learn 12+ strategies with exact entry/exit rules, build your own list, and run the system yourself. Tips make you dependent; a system makes you independent.' },
  { q: 'Do I need trading experience?', a: 'No. Module 1 starts from market reality and scam protection. Module 3 has a beginner-friendly 52-Week strategy. If you can read a chart, you can learn this.' },
  { q: 'Are there batches? When does the next one start?', a: 'Yes — a new batch starts every month. Join the WhatsApp group to get batch dates, the stock universe lists, and doubt sessions. Reserve your seat via WhatsApp.' },
  { q: 'Is there a WhatsApp group?', a: 'Yes. Every batch gets its own WhatsApp group — universe lists, weekly doubt sessions, and community support. Join via the WhatsApp button on this page.' },
  { q: 'What exactly do I get for ₹999?', a: 'Lifetime access to all 9 modules + bonus Option Selling module, the 12-strategy engine, entry/exit cheat sheet, formula bank, 67-point audit checklist, monthly batch access, and weekend live sessions.' },
  { q: 'Is there live support?', a: 'Yes. Weekend live sessions + WhatsApp batch group. Ask questions, see the system applied in real time.' },
  { q: 'What is the refund policy?', a: 'Course access is digital. Review the free preview content first. Reach out within 7 days for any concern.' },
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
        description="A repeatable swing-trading system: Envelope 200 EMA, ABCD ladder, Cup & Handle, 67-point fundamental audit. 12+ strategies, monthly batches, WhatsApp community. Educational, not advice."
        url="/course/swing"
      />

      {/* ============ HERO ============ */}
      <header className="relative overflow-hidden pt-20 pb-16 px-6 max-w-6xl mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-72 bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-950/50 border border-blue-900 rounded-full mb-6">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">New Batch Every Month · WhatsApp Community Live</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-5">
            SWING TRADING,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">DECODED.</span>
          </h1>
          <p className="text-base md:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed mb-4">
            The repeatable swing-trading system behind institutional desks — 12+ strategies with
            exact entry/exit rules. <span className="text-blue-400 font-semibold">Not tips. Not signals. A system you own.</span>
          </p>
          <p className="text-sm text-[var(--text-tertiary)] max-w-xl mx-auto mb-8">
            Realistic target: <span className="text-emerald-400 font-bold">25–30% CAGR</span> — the same math that takes
            ₹1L to <span className="text-emerald-400 font-bold">~₹4.8L in 6 years</span> and <span className="text-emerald-400 font-bold">~₹1.9Cr in 20 years</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={handleBuy}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/30 transform hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Starting…' : <>Enroll for ₹999 <ArrowRight className="w-5 h-5" /></>}
            </button>
            <a
              href={WA_GROUP_MSG}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-emerald-600/15 border border-emerald-500/40 hover:bg-emerald-600/25 rounded-2xl font-bold text-lg text-emerald-300 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
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
            One-time ₹999 · Lifetime access · Monthly batch + WhatsApp group · Educational only, not SEBI advice
          </p>
        </div>

        {/* PROOF STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
          {[
            { stat: '12+', label: 'Strategies with exact rules', icon: Layers },
            { stat: '25–30%', label: 'CAGR target (realistic, not "daily 5%")', icon: TrendingUp },
            { stat: '₹999', label: 'One-time · lifetime access', icon: IndianRupee },
            { stat: 'Monthly', label: 'New batch every month', icon: CalendarDays },
          ].map((p, i) => (
            <div key={i} className="card p-6 text-center hover:scale-105 transition-transform">
              <p.icon className="w-8 h-8 mx-auto mb-3 text-blue-400" />
              <p className="text-3xl font-black text-[var(--text-primary)]">{p.stat}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">{p.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* ============ PAIN → SOLUTION ============ */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-8 border-rose-500/20">
            <h3 className="text-xl font-bold mb-4 text-rose-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Why 99% of Traders Lose</h3>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li>• Chasing "tips" and FOMO entries with no system</li>
              <li>• Buying at the top, panic-selling at the bottom</li>
              <li>• Unrealistic targets — "daily 5%" is mathematically a scam (1.05¹² = 80%/yr)</li>
              <li>• No position sizing → one bad trade wipes the account</li>
              <li>• Falling for 6 proven scam patterns (MLM, guaranteed returns, crypto, fake apps)</li>
            </ul>
          </div>
          <div className="card p-8 border-emerald-500/20">
            <h3 className="text-xl font-bold mb-4 text-emerald-400 flex items-center gap-2"><Trophy className="w-5 h-5" /> The MarketBeacon Swing System</h3>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li>• Buy in the <span className="text-blue-400 font-semibold">lower envelope band</span> — where institutions accumulate</li>
              <li>• Laddered ABCD entries → average down with protection</li>
              <li>• 67-point audit filters noise → only qualified stocks</li>
              <li>• Scam-protection training — know exactly what to say NO to</li>
              <li>• GTT + alerts → the system runs even while you sleep</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ WEALTH MATH ============ */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">What ₹1 Lakh Becomes</h2>
          <p className="text-[var(--text-muted)] mt-3 max-w-2xl mx-auto">
            Compounding at the system's realistic 25–30% CAGR. No "double in a week" fantasy — this is the
            math of patient wealth creation. (Illustrative projections, not guarantees.)
          </p>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-left">
                  <th className="p-4 font-bold">Horizon</th>
                  <th className="p-4 font-bold text-blue-400">@ 25% CAGR</th>
                  <th className="p-4 font-bold text-emerald-400">@ 30% CAGR</th>
                  <th className="p-4 font-bold hidden md:table-cell text-[var(--text-muted)]">Milestone</th>
                </tr>
              </thead>
              <tbody>
                {WEALTH.map((w, i) => (
                  <tr key={i} className="border-t border-[var(--border-primary)]">
                    <td className="p-4 font-bold">{w.years}</td>
                    <td className="p-4 text-blue-300">{w.x25}</td>
                    <td className="p-4 text-emerald-300">{w.x30}</td>
                    <td className="p-4 hidden md:table-cell text-[var(--text-muted)] text-xs">{w.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="p-4 text-xs text-[var(--text-tertiary)] border-t border-[var(--border-primary)]">
            Base: ₹1L starting capital. 30% yearly → 3 saal ~2.2x · 6 saal ~4.8x · 9 saal ~10x · 12 saal ~23x · 20 saal ~190x.
            Projections are educational illustrations — markets carry risk.
          </p>
        </div>
      </section>

      {/* ============ SUCCESS STORIES ============ */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Proof The System Works</h2>
          <p className="text-[var(--text-muted)] mt-3">Real cases from the training records — same rules you will learn.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STORIES.map((s, i) => (
            <div key={i} className="card p-6 flex flex-col hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(x => <Star key={x} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{s.period}</span>
              </div>
              <p className="text-3xl font-black text-emerald-400 mb-1">{s.stat}</p>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">{s.label}</p>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed flex-1">"{s.quote}"</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-4">{s.name} · {s.verified}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] text-center mt-6">
          Results are from reported course records / worked examples. Individual results vary — educational context only.
        </p>
      </section>

      {/* ============ THE 12-STRATEGY ENGINE ============ */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">12+ Strategies. Exact Entry. Exact Exit.</h2>
          <p className="text-[var(--text-muted)] mt-3 max-w-2xl mx-auto">
            No ambiguity, no "feel". Every strategy has a rulebook: which list it applies to, when to enter, when to exit.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STRATEGIES.map((s, i) => (
            <div key={i} className="card p-5 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{s.name}</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-600/15 text-blue-300 uppercase tracking-wider">{s.list}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-1"><span className="text-emerald-400 font-semibold">ENTRY:</span> {s.entry}</p>
              <p className="text-xs text-[var(--text-muted)]"><span className="text-rose-400 font-semibold">EXIT:</span> {s.exit}</p>
            </div>
          ))}
        </div>
        <div className="card p-6 mt-6 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border-blue-500/20">
          <p className="text-sm text-[var(--text-muted)] flex items-start gap-2">
            <Gift className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <span><span className="font-bold text-[var(--text-primary)]">Bonus included:</span> Option Selling Crash Course (theta decay, rollover math, ₹12L capital efficiency), Entry/Exit Cheat Sheet, Formula Bank (ROCE, NDE, POC, PB, debtor days), and the 20-point Master Golden Rules.</span>
          </p>
        </div>
      </section>

      {/* ============ CURRICULUM ============ */}
      <section id="curriculum" className="px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter">The Real Course — Module by Module</h2>
          <p className="text-[var(--text-muted)] mt-3">9 modules · 55+ lessons · ~6 hours · lifetime access · new batch every month</p>
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

      {/* ============ BATCHES + WHATSAPP ============ */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="card p-10 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 border-emerald-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 blur-[100px] pointer-events-none" />
          <div className="grid md:grid-cols-2 gap-10 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-950/50 border border-emerald-800 rounded-full mb-4">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Monthly Batches · WhatsApp Community</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4">One Batch Every Month. Learn With A Group.</h2>
              <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> <span><span className="font-bold text-[var(--text-primary)]">New batch monthly</span> — structured, course-by-course, with doubt sessions</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> <span><span className="font-bold text-[var(--text-primary)]">Dedicated WhatsApp group</span> for every batch — universe lists, signals education, community</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> <span><span className="font-bold text-[var(--text-primary)]">Weekend live sessions</span> — see the system applied in real time</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> <span><span className="font-bold text-[var(--text-primary)]">Lifetime access</span> — revisit any module, join future batch refreshers</span></li>
              </ul>
            </div>
            <div className="space-y-4">
              <a
                href={WA_GROUP_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-900/30 transform hover:scale-105 transition-all"
              >
                <MessageCircle className="w-6 h-6" /> Join the WhatsApp Group
              </a>
              <a
                href={WA_BATCH_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-[var(--bg-secondary)] border border-emerald-500/40 hover:bg-emerald-600/15 rounded-2xl font-bold text-emerald-300 transition-all"
              >
                <CalendarDays className="w-5 h-5" /> Reserve Next Batch Seat
              </a>
              <p className="text-xs text-[var(--text-tertiary)] text-center">
                WhatsApp pe message bhejenge — batch dates, universe lists aur group link direct milega.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
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

      {/* ============ FINAL CTA ============ */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="card p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl">
          <GraduationCap className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-black mb-3">Own The System. Trade With Conviction.</h2>
          <p className="mb-8 opacity-90 max-w-xl mx-auto">One-time ₹999. Lifetime access. Monthly batch + WhatsApp group. Stop following — start trading with a system.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleBuy}
              disabled={loading}
              className="px-10 py-4 bg-white text-blue-700 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-all disabled:opacity-60"
            >
              {loading ? 'Starting…' : 'Enroll for ₹999'}
            </button>
            <a
              href={WA_GROUP_MSG}
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 bg-emerald-500/20 border border-emerald-300/40 rounded-2xl font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp Group
            </a>
          </div>
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
