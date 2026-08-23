import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShieldCheck, Target, BookOpen, CheckCircle2, Star,
  Zap, Layers, ArrowRight, Award, Users, Clock, BarChart3,
  ChevronRight, PlayCircle, Lock, Sparkles, Trophy, GraduationCap,
  MessageCircle, CalendarDays, Flame, Wallet, LineChart, AlertTriangle,
  Gauge, IndianRupee, Gift, ShieldAlert, Activity,
  Gem, Sprout, Mountain
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
    icon: ShieldAlert, lessons: 8, duration: '60 min', color: 'from-rose-400 to-pink-500'
  },
  {
    module: 'Module 2', title: 'Stock Universe — Elite / Quality / Growth / Fallen Value',
    desc: 'The 4 institutional baskets. Elite = market leaders (band strategies), Quality = steady compounders, Growth = ~200 strong names (S&R + 20% rally), Fallen Value = deep-discount quality (67% reset). Kab kya buy karna hai — exact fall table.',
    icon: Layers, lessons: 6, duration: '45 min', color: 'from-blue-500 to-indigo-500'
  },
  {
    module: 'Module 3', title: 'Envelope Strategies (Long / Short / 52-Week)',
    desc: 'The core: 200 EMA ±14% bands. Long Envelope — lower band touch pe buy, 30% pe sell. Short Envelope — 2 trades, 12% each. 52-Week High-Low — beginner-friendly, kabhi loss mein mat bechna.',
    icon: LineChart, lessons: 6, duration: '48 min', color: 'from-emerald-500 to-teal-500'
  },
  {
    module: 'Module 4', title: 'Advanced — Bollinger / Knoxville / SMA',
    desc: 'Price & time corrections (crash, major, minor — har level ka apna play). Bollinger 200/2.5 (lower band + width ≥35%). Envelope+Knoxville divergence. Advanced SMA — dead cross pe buy (99% ka ulta).',
    icon: Gauge, lessons: 5, duration: '40 min', color: 'from-amber-400 to-orange-500'
  },
  {
    module: 'Module 5', title: 'Growth Basket — S&R / 20% Rally',
    desc: 'Support & Resistance — zone, point nahi; 2 baar bounce. 20% Rally — sirf green candles, rally start pe entry. Growth basket pe stability + consistent growth play.',
    icon: Target, lessons: 5, duration: '38 min', color: 'from-cyan-500 to-sky-500'
  },
  {
    module: 'Module 6', title: 'Growth-45 Strategies (ABCD / RHS / Cup-Handle)',
    desc: 'The wealth-builder: ABCD laddered averaging (A 2–3%, B 10%, C 20%, D 30% — B→A, C→B, D→C exits). Reverse Head & Shoulders + Cup with Handle — sirf 20–30% neeche wala pattern. SMA+BCD / 52wk+BCD.',
    icon: BarChart3, lessons: 7, duration: '52 min', color: 'from-purple-500 to-fuchsia-500'
  },
  {
    module: 'Module 7', title: 'Fundamental Analysis + 67-Point Audit',
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
    icon: Wallet, lessons: 6, duration: '48 min', color: 'from-emerald-500 to-green-500'
  },
];

// ---------- The strategy engine (aligned to website basket names) ----------
const STRATEGIES = [
  { name: 'Long Envelope', list: 'Elite · Quality', entry: 'Lower band touch (mandatory)', exit: '30% flat (ya upper band @ 25%+)' },
  { name: 'Short Envelope', list: 'Elite · Quality', entry: 'Orange pe (1–1.5%) / lower band (3–5%)', exit: '12% (2 independent trades)' },
  { name: '52 Week High-Low', list: 'Elite · Quality', entry: '52-week low touch', exit: '52-week high touch' },
  { name: 'Bollinger 200/2.5', list: 'Elite · Quality', entry: 'Lower band, width ≥ 35%', exit: 'Upper band' },
  { name: 'Envelope + Knoxville', list: 'Elite · Quality', entry: 'P1 (lower band ke neeche) / P2', exit: 'Orange ke upar, red-top line' },
  { name: 'Advanced SMA', list: 'Elite · Quality', entry: 'Dead cross (Price > Black > Green > Red)', exit: 'Golden cross (ulta)' },
  { name: 'Support & Resistance', list: 'Growth', entry: 'Support zone, 2 baar bounce', exit: 'Resistance zone' },
  { name: '20% Rally / Super', list: 'Growth', entry: 'Rally start point pe wapas aaye', exit: 'Pehli red se pehle wali green ka high' },
  { name: 'ABCD Averaging', list: 'Growth · Quality', entry: 'A (2–3%), B (10%), C (20%), D (30%)', exit: 'B→A, C→B, D→C; A→A~' },
  { name: 'RHS / Cup-Handle', list: 'Growth · Quality', entry: 'Breakout sirf 20–30% neeche wala', exit: 'Technical target (rupaye mapping)' },
  { name: 'SMA with BCD', list: 'Growth · Quality', entry: 'B/C/D levels (A trade NAHI)', exit: 'Pehle level pe sell' },
  { name: '52wk with BCD', list: 'Growth · Quality', entry: 'Zone ke andar BCD', exit: 'Pehle level; valid till 52w high' },
];

// ---------- Accuracy (verified strategy-tester backtests, TradingView 1D) ----------
const ACCURACY = [
  { stock: 'TCS', trades: 35, win: '100%' },
  { stock: 'TITAN', trades: 27, win: '100%' },
  { stock: 'AXISBANK', trades: 34, win: '100%' },
  { stock: 'KOTAKBANK', trades: 20, win: '100%' },
  { stock: 'NESTLEIND', trades: 21, win: '100%' },
  { stock: 'HDFCLIFE', trades: 10, win: '100%' },
  { stock: 'PAGEIND', trades: 23, win: '91%' },
  { stock: 'PIDILITIND', trades: 35, win: '89%' },
];

// ---------- Wealth math (compounding, course-standard 25–30% CAGR) ----------
const WEALTH = [
  { years: '4 years', x25: '₹2.44L', x30: '₹2.86L', note: 'First doubling zone' },
  { years: '6 years', x25: '₹3.81L', x30: '₹4.83L', note: '~4–5x (6 saal 4x)' },
  { years: '9 years', x25: '₹7.45L', x30: '₹10.60L', note: '8–10x' },
  { years: '12 years', x25: '₹14.55L', x30: '₹23.30L', note: '16–23x' },
  { years: '20 years', x25: '₹86.7L', x30: '₹1.90Cr', note: '~100x' },
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
    name: 'Short Envelope case', period: 'Elite basket · 2016–2022 rally',
    quote: 'Stock never touched lower band for 6 years. The 2-trade Short Envelope system booked 12 signals × 12% each — stock doubled/tripled and the trader kept collecting.',
    stat: '12 × 12%', label: 'booked in a bull run', verified: 'Course module example'
  },
];

const FAQS = [
  { q: 'Is this SEBI-registered advice?', a: 'No. MarketBeacon is an educational research platform — not a SEBI-registered Investment Adviser or Research Analyst. We teach a repeatable system and show historical data; you make your own decisions. No guaranteed returns.' },
  { q: 'How is this different from tips/signals groups?', a: 'We do not give buy/sell tips or recommendations. You learn strategies with exact rules, build your own list, and run the system yourself. Tips make you dependent; a system makes you independent.' },
  { q: 'Do I need trading experience?', a: 'No. Module 1 starts from market reality and scam protection. Module 3 has a beginner-friendly 52-Week strategy. If you can read a chart, you can learn this.' },
  { q: 'Are there batches? When does the next one start?', a: 'Yes — a new batch starts every month. Join the WhatsApp group to get batch dates, the stock universe lists, and doubt sessions. Reserve your seat via WhatsApp.' },
  { q: 'Is there a WhatsApp group?', a: 'Yes. After enrollment, your batch WhatsApp group link is unlocked on the welcome page — payment-confirmed members join automatically via the group link.' },
  { q: 'What exactly do I get for ₹999?', a: 'Lifetime access to all 9 modules + bonus Option Selling module, the strategy engine, entry/exit cheat sheet, formula bank, 67-point audit checklist, monthly batch access, weekend live sessions, and the batch WhatsApp group.' },
  { q: 'Is there live support?', a: 'Yes. Weekend live sessions + WhatsApp batch group. Ask questions, see the system applied in real time.' },
  { q: 'What is the refund policy?', a: 'Course access is digital. Review the free preview content first. Reach out within 7 days for any concern.' },
];

// ---------- Animated candlestick chart background (market-themed) ----------
const CHART_CANDLES = (() => {
  const data: any[] = [];
  let price = 210;
  for (let i = 0; i < 44; i++) {
    const up = Math.random() > 0.42;
    const move = (Math.random() * 16 + 4) * (up ? 1 : -1);
    const open = price;
    const close = price + move;
    const high = Math.max(open, close) + Math.random() * 6;
    const low = Math.min(open, close) - Math.random() * 6;
    data.push({ x: i * 33 + 16, up, open, close, high, low });
    price = close;
  }
  const min = Math.min(...data.map(d => d.low));
  const max = Math.max(...data.map(d => d.high));
  const range = (max - min) || 1;
  const y = (v: number) => 392 - ((v - min) / range) * 360;
  return data.map(d => ({
    x: d.x, w: 11, up: d.up,
    bodyTop: y(Math.max(d.open, d.close)),
    bodyH: Math.max(2, Math.abs(y(d.open) - y(d.close))),
    wickTop: y(d.high), wickBottom: y(d.low),
    closeY: y(d.close),
  }));
})();

const SwingCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [showFAQ, setShowFAQ] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [indices, setIndices] = useState<any[]>([]);

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
    // Live market indices for ticker
    fetch(`${API_URL}/api/market-indices`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setIndices(d?.results || []))
      .catch(() => {});
  }, []);

  // Scroll-reveal: sections animate in page-by-page as user scrolls
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.course-light > section, .course-light > header');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // 3D mouse tilt on interactive cards (real perspective per cursor position)
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.course-light .tilt-card');
    if (!cards.length) return;
    const onMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(1100px) rotateY(${px * 14}deg) rotateX(${py * -12}deg) translateY(-6px)`;
    };
    const onLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      card.style.transform = '';
    };
    cards.forEach(c => { c.addEventListener('mousemove', onMove); c.addEventListener('mouseleave', onLeave); });
    return () => {
      cards.forEach(c => { c.removeEventListener('mousemove', onMove); c.removeEventListener('mouseleave', onLeave); });
    };
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
          // Mark payment done → welcome page unlocks WhatsApp group
          localStorage.setItem('mb_swing_paid', '1');
          localStorage.setItem('mb_swing_email', userEmail);
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
    <div className="course-light min-h-screen bg-[#f8fafc] text-[#0f172a] relative overflow-x-hidden">
      <SEO
        title="MarketBeacon Swing System — Learn Institutional Swing Trading"
        description="A repeatable swing-trading system: Envelope 200 EMA, ABCD ladder, Cup & Handle, 67-point fundamental audit. 12+ strategies, monthly batches, WhatsApp community. Educational, not advice."
        url="/course/swing"
      />

      {/* Animated light background: moving gradient + candlestick chart + floating candles + soft orbs */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="absolute inset-0 animated-bg" />
        <div className="absolute inset-0 bg-grid-light opacity-50" />
        <div className="absolute top-[-15%] left-[-10%] w-[50rem] h-[50rem] rounded-full bg-blue-300/30 blur-[140px] animate-orb-1" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-indigo-300/30 blur-[140px] animate-orb-2" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-emerald-300/20 blur-[100px] animate-orb-3" />
        <div className="absolute top-2/3 left-1/5 w-72 h-72 rounded-full bg-amber-200/30 blur-[110px] animate-orb-1" />
        {/* animated candlestick chart (market-themed) */}
        <svg className="absolute bottom-0 left-0 w-full h-[46vh] opacity-25 chart-svg" viewBox="0 0 1460 400" preserveAspectRatio="none" aria-hidden>
          <g className="chart-candles-group">
            {CHART_CANDLES.map((c, i) => (
              <g key={i} className="chart-candle" style={{ animationDelay: `${i * 0.09}s` }}>
                <line x1={c.x} y1={c.wickTop} x2={c.x} y2={c.wickBottom}
                  stroke={c.up ? '#059669' : '#e11d48'} strokeWidth="2" opacity="0.8" />
                <rect x={c.x - c.w / 2} y={c.bodyTop} width={c.w} height={c.bodyH} rx="1.5"
                  fill={c.up ? '#10b981' : '#f43f5e'} opacity="0.85" />
              </g>
            ))}
          </g>
          <polyline className="chart-line" fill="none" stroke="#3b82f6" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            points={CHART_CANDLES.map(c => `${c.x},${c.closeY}`).join(' ')} />
        </svg>
        {/* floating candlesticks */}
        <div className="candles">
          {[...Array(16)].map((_, i) => (
            <span key={i} className="candle" style={{
              left: `${(i * 6.3 + 3) % 100}%`,
              animationDelay: `${i * 1.4}s`,
              animationDuration: `${10 + (i % 5) * 2.5}s`,
              height: `${20 + (i % 6) * 12}px`
            }}>
              <i className="candle-wick" />
            </span>
          ))}
        </div>
      </div>

      {/* Live market ticker */}
      <div className="relative z-10 bg-white/85 backdrop-blur border-b border-slate-200 overflow-hidden">
        <div className="ticker-track flex gap-8 py-2 text-xs font-mono whitespace-nowrap">
          {[...indices, ...indices].map((idx, i) => (
            <span key={i} className="flex items-center gap-2 px-4">
              <span className="text-slate-500">{idx.name}</span>
              <span className="font-bold text-slate-800">{idx.price?.toLocaleString('en-IN')}</span>
              <span className={idx.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* ============ HERO ============ */}
      <header className="relative z-10 overflow-hidden pt-16 pb-16 px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 border border-blue-200 rounded-full mb-6 animate-float">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">New Batch Every Month · WhatsApp Community Live</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-5 text-slate-900">
              SWING TRADING,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 animate-gradient-x">DECODED.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-4">
              The repeatable swing-trading system behind institutional desks — 12+ strategies with
              exact entry/exit rules. <span className="text-blue-600 font-semibold">Not tips. Not signals. A system you own.</span>
            </p>
            <p className="text-sm text-slate-500 max-w-xl mx-auto lg:mx-0 mb-8">
              Realistic target: <span className="text-emerald-600 font-bold">25–30% CAGR</span> — the same math that takes
              ₹1L to <span className="text-emerald-600 font-bold">~₹4.8L in 6 years</span> and <span className="text-emerald-600 font-bold">~₹1.9Cr in 20 years</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-6">
              <button
                onClick={handleBuy}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl font-bold text-lg text-white shadow-xl shadow-blue-200 transform hover:scale-105 hover:rotate-[-1deg] transition-all flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Starting…' : <>Enroll for ₹999 <ArrowRight className="w-5 h-5" /></>}
              </button>
              <a
                href={WA_GROUP_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-2xl font-bold text-lg text-emerald-700 transition-all flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
              </a>
            </div>

            {err && <p className="text-rose-600 text-sm font-bold mb-4">{err}</p>}
            {!user && (
              <div className="flex items-center gap-2 justify-center lg:justify-start max-w-md">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-800"
                />
              </div>
            )}

            <p className="text-xs text-slate-500 mt-4 uppercase tracking-wider">
              One-time ₹999 · Lifetime access · Monthly batch + WhatsApp group · Educational only, not SEBI advice
            </p>
          </div>

          {/* 3D hero card */}
          <div className="hidden lg:block perspective-1000">
            <div className="tilt-card card-light p-8 bg-white/90 backdrop-blur border border-slate-200 shadow-xl shadow-slate-200/60 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Live Market Pulse
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono">
                  {indices.length ? '● LIVE' : '—'}
                </span>
              </div>
              <div className="space-y-4 mb-8">
                {indices.length ? indices.map((idx, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{idx.name}</p>
                      <p className="text-xs text-slate-500">ATH {idx.ath?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black font-mono text-slate-900">{idx.price?.toLocaleString('en-IN')}</p>
                      <p className={`text-xs font-bold ${idx.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.change).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="space-y-3">
                    {[0,1,2].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />)}
                  </div>
                )}
              </div>
              {/* mini sparkline candles */}
              <div className="flex items-end justify-between gap-1 h-16 mb-6">
                {[35, 48, 42, 60, 55, 70, 64, 82, 75, 92, 88, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-gradient-to-t from-blue-500 to-indigo-400 rounded-t-sm animate-candle-grow"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-3">Strategy accuracy — verified backtests</p>
                <p className="text-4xl font-black text-emerald-600 mb-1">~97%</p>
                <p className="text-xs text-slate-500">avg win rate · 8 stocks · TradingView strategy tester</p>
              </div>
            </div>
          </div>
        </div>

        {/* PROOF STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
          {[
            { stat: '12+', label: 'Strategies with exact rules', icon: Layers },
            { stat: '~97%', label: 'Backtest win rate (avg)', icon: TrendingUp },
            { stat: '₹999', label: 'One-time · lifetime access', icon: IndianRupee },
            { stat: 'Monthly', label: 'New batch every month', icon: CalendarDays },
          ].map((p, i) => (
            <div key={i} className="card-light p-6 text-center bg-white/90 backdrop-blur border border-slate-200 rounded-2xl hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200 transition-all tilt-card">
              <p.icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
              <p className="text-3xl font-black text-slate-900">{p.stat}</p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{p.label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* ============ ACCURACY ============ */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Verified Backtest Accuracy</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            Strategy-tester results on live market data (TradingView, daily bars). Historical — never a future guarantee.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ACCURACY.map((a, i) => (
            <div key={i} className="card-light p-5 text-center bg-white/90 backdrop-blur border border-slate-200 rounded-2xl hover:scale-105 transition-all tilt-card">
              <p className="text-sm font-bold text-blue-600">{a.stock}</p>
              <p className={`text-2xl font-black mt-1 ${a.win === '100%' ? 'text-emerald-600' : 'text-amber-600'}`}>{a.win}</p>
              <p className="text-xs text-slate-500 mt-1">{a.trades} trades backtested</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          Past performance / backtest results are not indicative of future results. Markets carry risk — educational context only.
        </p>
      </section>

      {/* ============ PAIN → SOLUTION ============ */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card-light p-8 bg-white/90 backdrop-blur border border-rose-200 rounded-2xl tilt-card">
            <h3 className="text-xl font-bold mb-4 text-rose-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Why 99% of Traders Lose</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>• Chasing "tips" and FOMO entries with no system</li>
              <li>• Buying at the top, panic-selling at the bottom</li>
              <li>• Unrealistic targets — "daily 5%" is mathematically a scam (1.05¹² = 80%/yr)</li>
              <li>• No position sizing → one bad trade wipes the account</li>
              <li>• Falling for 6 proven scam patterns (MLM, guaranteed returns, crypto, fake apps)</li>
            </ul>
          </div>
          <div className="card-light p-8 bg-white/90 backdrop-blur border border-emerald-200 rounded-2xl tilt-card">
            <h3 className="text-xl font-bold mb-4 text-emerald-700 flex items-center gap-2"><Trophy className="w-5 h-5" /> The MarketBeacon Swing System</h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>• Buy in the <span className="text-blue-600 font-semibold">lower envelope band</span> — where institutions accumulate</li>
              <li>• Laddered ABCD entries → average down with protection</li>
              <li>• 67-point audit filters noise → only qualified stocks</li>
              <li>• Scam-protection training — know exactly what to say NO to</li>
              <li>• GTT + alerts → the system runs even while you sleep</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============ WEALTH MATH ============ */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">What ₹1 Lakh Becomes</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            Compounding at the system's realistic 25–30% CAGR. No "double in a week" fantasy — this is the
            math of patient wealth creation. (Illustrative projections, not guarantees.)
          </p>
        </div>
        <div className="card-light overflow-hidden bg-white/90 backdrop-blur border border-slate-200 rounded-2xl tilt-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="p-4 font-bold text-slate-800">Horizon</th>
                  <th className="p-4 font-bold text-blue-700">@ 25% CAGR</th>
                  <th className="p-4 font-bold text-emerald-700">@ 30% CAGR</th>
                  <th className="p-4 font-bold hidden md:table-cell text-slate-500">Milestone</th>
                </tr>
              </thead>
              <tbody>
                {WEALTH.map((w, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{w.years}</td>
                    <td className="p-4 text-blue-700">{w.x25}</td>
                    <td className="p-4 text-emerald-700">{w.x30}</td>
                    <td className="p-4 hidden md:table-cell text-slate-500 text-xs">{w.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="p-4 text-xs text-slate-500 border-t border-slate-100">
            Base: ₹1L starting capital. 30% yearly → 3 saal ~2.2x · 6 saal ~4.8x · 9 saal ~10x · 12 saal ~23x · 20 saal ~190x.
            Projections are educational illustrations — markets carry risk.
          </p>
        </div>
      </section>

      {/* ============ SUCCESS STORIES ============ */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">Proof The System Works</h2>
          <p className="text-slate-500 mt-3">Real cases from the training records — same rules you will learn.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STORIES.map((s, i) => (
            <div key={i} className="card-light p-6 flex flex-col bg-white/90 backdrop-blur border border-slate-200 rounded-2xl hover:scale-[1.02] hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200 transition-all tilt-card">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(x => <Star key={x} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="text-xs text-slate-500">{s.period}</span>
              </div>
              <p className="text-3xl font-black text-emerald-600 mb-1">{s.stat}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{s.label}</p>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">"{s.quote}"</p>
              <p className="text-xs text-slate-400 mt-4">{s.name} · {s.verified}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 text-center mt-6">
          Results are from reported course records / worked examples. Individual results vary — educational context only.
        </p>
      </section>

      {/* ============ THE STRATEGY ENGINE ============ */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">12+ Strategies. Exact Entry. Exact Exit.</h2>
          <p className="text-slate-500 mt-3 max-w-2xl mx-auto">
            No ambiguity, no "feel". Every strategy has a rulebook: which basket it applies to, when to enter, when to exit.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STRATEGIES.map((s, i) => (
            <div key={i} className="card-light p-5 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all tilt-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-800">{s.name}</h3>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">{s.list}</span>
              </div>
              <p className="text-xs text-slate-500 mb-1"><span className="text-emerald-700 font-semibold">ENTRY:</span> {s.entry}</p>
              <p className="text-xs text-slate-500"><span className="text-rose-600 font-semibold">EXIT:</span> {s.exit}</p>
            </div>
          ))}
        </div>
        <div className="card-light p-6 mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <p className="text-sm text-slate-600 flex items-start gap-2">
            <Gift className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <span><span className="font-bold text-slate-800">Bonus included:</span> Option Selling Crash Course (theta decay, rollover math, ₹12L capital efficiency), Entry/Exit Cheat Sheet, Formula Bank (ROCE, NDE, POC, PB, debtor days), and the 20-point Master Golden Rules.</span>
          </p>
        </div>
      </section>

      {/* ============ BASKETS ============ */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">The 4 Institutional Baskets</h2>
          <p className="text-slate-500 mt-3">Same universe names as the MarketBeacon platform — strategy meets basket.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Elite Basket', icon: Gem, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100/60 border-blue-200', desc: 'Market leaders — TCS, Reliance, HDFC Bank. Band strategies: Envelope, 52-week, Bollinger, SMA.' },
            { name: 'Quality Basket', icon: Award, color: 'text-cyan-700', bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100/60 border-cyan-200', desc: 'Steady compounders with strong fundamentals. Envelope, 52-week, Knoxville divergence plays.' },
            { name: 'Growth Basket', icon: Sprout, color: 'text-emerald-700', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200', desc: '~200 growth names. S&R, 20% Rally, ABCD, RHS, Cup-Handle, BCD strategies.' },
            { name: 'Fallen Value Basket', icon: Mountain, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200', desc: 'Deep-discount quality — the 67% Institutional Reset plays. Buy the fear, sell the greed.' },
          ].map((b, i) => (
            <div key={i} className={`card-light p-6 ${b.bg} border rounded-2xl hover:scale-105 hover:-translate-y-1 transition-all tilt-card`}>
              <b.icon className={`w-8 h-8 mb-3 ${b.color}`} />
              <h3 className="font-bold mb-2 text-slate-800">{b.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CURRICULUM ============ */}
      <section id="curriculum" className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">The Real Course — Module by Module</h2>
          <p className="text-slate-500 mt-3">9 modules · 55+ lessons · ~6 hours · lifetime access · new batch every month</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CURRICULUM.map((c, i) => (
            <div key={i} className="card-light p-6 bg-white/90 backdrop-blur border border-slate-200 rounded-2xl hover:scale-[1.02] hover:-translate-y-1 transition-all group tilt-card">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${c.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-md shadow-slate-200`}>
                <c.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{c.module}</p>
              <h3 className="text-lg font-bold mt-1 mb-2 text-slate-800">{c.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{c.desc}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c.lessons} lessons</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ BATCHES + WHATSAPP ============ */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="card-light p-10 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl overflow-hidden relative tilt-card">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-200/40 blur-[100px] pointer-events-none" />
          <div className="grid md:grid-cols-2 gap-10 items-center relative">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 border border-emerald-300 rounded-full mb-4">
                <Users className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Monthly Batches · WhatsApp Community</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 text-slate-900">One Batch Every Month. Learn With A Group.</h2>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> <span><span className="font-bold text-slate-800">New batch monthly</span> — structured, course-by-course, with doubt sessions</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> <span><span className="font-bold text-slate-800">Dedicated WhatsApp group</span> for every batch — universe lists, education, community</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> <span><span className="font-bold text-slate-800">Group unlocked on payment</span> — enroll, and your batch group link appears on the welcome page</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> <span><span className="font-bold text-slate-800">Weekend live sessions</span> + lifetime access, revisit any module</span></li>
              </ul>
            </div>
            <div className="space-y-4">
              <a
                href={WA_GROUP_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-bold text-lg text-white shadow-xl shadow-emerald-200 transform hover:scale-105 transition-all"
              >
                <MessageCircle className="w-6 h-6" /> Join the WhatsApp Group
              </a>
              <a
                href={WA_BATCH_MSG}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-2xl font-bold text-emerald-700 transition-all"
              >
                <CalendarDays className="w-5 h-5" /> Reserve Next Batch Seat
              </a>
              <p className="text-xs text-slate-500 text-center">
                WhatsApp pe message bhejenge — batch dates, universe lists aur group link direct milega.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEBI COMPLIANCE ============ */}
      <section className="relative z-10 px-6 py-8 max-w-6xl mx-auto">
        <div className="card-light p-6 border border-amber-300 bg-amber-50/80 rounded-2xl">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-800 mb-1">Educational Research Platform — Compliance Note</p>
              <p>
                MarketBeacon is <span className="text-amber-700 font-semibold">NOT a SEBI-registered Investment Adviser or Research Analyst</span>.
                All content is educational research — we teach a system and show historical data, we do not give personalized
                buy/sell recommendations or guarantee returns. Backtest results, success stories and projections are
                illustrative; <span className="text-amber-700 font-semibold">past performance is not indicative of future results</span>.
                Markets carry risk — invest only what you can afford to lose, and consult a SEBI-registered adviser for
                personalized advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="relative z-10 px-6 py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl font-black tracking-tighter text-center mb-10 text-slate-900">Questions, Answered</h2>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div key={i} className="card-light overflow-hidden bg-white/90 backdrop-blur border border-slate-200 rounded-2xl">
              <button
                onClick={() => setShowFAQ(showFAQ === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-800">{f.q}</span>
                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showFAQ === i ? 'rotate-90' : ''}`} />
              </button>
              {showFAQ === i && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="card-light p-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-3xl shadow-2xl shadow-blue-200 tilt-card">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 animate-float" />
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
              className="px-10 py-4 bg-white/15 border border-white/30 rounded-2xl font-bold hover:bg-white/25 transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" /> WhatsApp Group
            </a>
          </div>
          <p className="text-xs opacity-80 mt-4 uppercase tracking-wider">Educational research · Not SEBI-registered advice · No guaranteed returns</p>
        </div>
      </section>

      <footer className="relative z-10 text-center py-8 text-xs text-slate-500 border-t border-slate-200">
        MarketBeacon Pro · Educational platform · Not a SEBI-registered Investment Adviser or Research Analyst
      </footer>

      {/* ============ MOBILE STICKY ENROLL BAR (most traffic is mobile) ============ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 shadow-[0_-8px_30px_rgba(148,163,184,0.25)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Swing System · Lifetime</p>
            <p className="text-lg font-black text-slate-900 leading-tight">₹999 <span className="text-xs font-semibold text-slate-400">one-time</span></p>
          </div>
          <button
            onClick={handleBuy}
            disabled={loading}
            className="flex-1 px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg shadow-blue-200 active:scale-[0.97] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? 'Starting…' : <>Enroll Now <ArrowRight className="w-4 h-4" /></>}
          </button>
          <a
            href={WA_GROUP_MSG}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join WhatsApp group"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-700 active:scale-[0.95] transition-transform"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        </div>
        {err && <p className="text-rose-600 text-[11px] font-bold mt-2 text-center">{err}</p>}
      </div>
      {/* spacer so sticky bar doesn't cover footer on mobile */}
      <div className="lg:hidden h-20" />

      {/* Global page animations + light theme overrides */}
      <style>{`
        /* Light theme scope */
        .course-light .card {
          background: linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.95)) !important;
          border-color: rgba(226,232,240,0.9) !important;
          color: #0f172a;
        }
        .course-light .card::before {
          background: linear-gradient(135deg, transparent 40%, rgba(59,130,246,0.2), transparent 60%) !important;
        }
        .course-light .card::after {
          background: linear-gradient(to right, transparent, rgba(59,130,246,0.25), transparent) !important;
        }
        .course-light .card:hover {
          border-color: rgba(59,130,246,0.35) !important;
          box-shadow: 0 20px 40px rgba(148,163,184,0.35), 0 0 30px rgba(59,130,246,0.08) !important;
        }
        .card-light { position: relative; overflow: hidden; }

        /* Animated light background */
        .animated-bg {
          background: linear-gradient(120deg,
            #eff6ff 0%, #f0fdf4 20%, #eef2ff 40%,
            #fdf2f8 60%, #fefce8 80%, #eff6ff 100%);
          background-size: 400% 400%;
          animation: bgShift 18s ease infinite;
        }
        @keyframes bgShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

        .bg-grid-light {
          background-image:
            linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%);
        }

        @keyframes orb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px, 30px) scale(1.1); } }
        @keyframes orb2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px, -20px) scale(1.12); } }
        @keyframes orb3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px, -40px) scale(1.08); } }
        .animate-orb-1 { animation: orb1 14s ease-in-out infinite; }
        .animate-orb-2 { animation: orb2 17s ease-in-out infinite; }
        .animate-orb-3 { animation: orb3 12s ease-in-out infinite; }

        @keyframes gradient-x { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-gradient-x { background-size: 200% 200%; animation: gradient-x 6s ease infinite; }

        @keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-float { animation: floaty 3.5s ease-in-out infinite; }

        @keyframes candleGrow { 0% { transform: scaleY(0.3); opacity: 0.4; } 100% { transform: scaleY(1); opacity: 1; } }
        .animate-candle-grow { transform-origin: bottom; animation: candleGrow 1.2s ease-out both; }

        @keyframes tickerMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-track { animation: tickerMove 30s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }

        .candles { position: absolute; inset: 0; overflow: hidden; }
        .candle { position: absolute; bottom: -20px; width: 3px; border-radius: 2px;
          background: linear-gradient(to top, rgba(59,130,246,0.5), rgba(99,102,241,0.2));
          opacity: 0.4; animation: candleRise linear infinite; }
        .candle-wick { position: absolute; top: -8px; left: 1px; width: 1px; height: 10px; background: rgba(100,116,139,0.5); }
        @keyframes candleRise {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.45; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-110vh) rotate(20deg); opacity: 0; }
        }

        .perspective-1000 { perspective: 1200px; }
        .tilt-card { transform-style: preserve-3d; will-change: transform; transition: transform 0.18s ease-out, box-shadow 0.3s ease, border-color 0.3s ease; }
        .tilt-card:hover { box-shadow: 0 24px 48px rgba(148,163,184,0.4), 0 0 30px rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.35); }
        .tilt-card .tilt-inner { transform: translateZ(24px); }

        /* Scroll-reveal: page-by-page section entrance */
        .course-light > section, .course-light > header {
          opacity: 0;
          transform: translateY(48px) scale(0.98);
          transition: opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1);
        }
        .course-light > section.reveal-in, .course-light > header.reveal-in {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .course-light > section > * , .course-light > header > * {
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .course-light > section.reveal-in > *, .course-light > header.reveal-in > * {
          opacity: 1;
          transform: none;
        }
        /* staggered children pop */
        .course-light > section.reveal-in .card-light,
        .course-light > header.reveal-in .card-light {
          animation: cardPop 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        .course-light > section.reveal-in .card-light:nth-child(1) { animation-delay: 0.08s; }
        .course-light > section.reveal-in .card-light:nth-child(2) { animation-delay: 0.16s; }
        .course-light > section.reveal-in .card-light:nth-child(3) { animation-delay: 0.24s; }
        .course-light > section.reveal-in .card-light:nth-child(4) { animation-delay: 0.32s; }
        .course-light > section.reveal-in .card-light:nth-child(5) { animation-delay: 0.4s; }
        .course-light > section.reveal-in .card-light:nth-child(6) { animation-delay: 0.48s; }
        @keyframes cardPop {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Candlestick chart background */
        .chart-svg { overflow: visible; }
        .chart-candle { transform-origin: center bottom; animation: candleDraw 0.7s ease-out both; }
        @keyframes candleDraw {
          0% { transform: scaleY(0); opacity: 0; }
          60% { transform: scaleY(1.05); opacity: 1; }
          100% { transform: scaleY(1); opacity: 1; }
        }
        .chart-line {
          stroke-dasharray: 2400;
          stroke-dashoffset: 2400;
          animation: lineDraw 4.5s ease-in-out forwards;
          filter: drop-shadow(0 2px 6px rgba(59,130,246,0.5));
        }
        @keyframes lineDraw { 0% { stroke-dashoffset: 2400; } 100% { stroke-dashoffset: 0; } }

        @media (prefers-reduced-motion: reduce) {
          .ticker-track, .candle, .animate-float, .animate-orb-1, .animate-orb-2, .animate-orb-3,
          .animate-gradient-x, .animated-bg, .chart-candle, .chart-line,
          .course-light > section, .course-light > header { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; }
          .tilt-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default SwingCoursePage;
