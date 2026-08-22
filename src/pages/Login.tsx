import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/brand/BrandLogo';
import PinSetupModal from '../components/modals/PinSetupModal';
import {
  AlertCircle, ArrowRight, UserPlus, Globe, Bug, Mail,
  TrendingUp, ShieldCheck, Zap, BarChart2, KeyRound
} from 'lucide-react';
import { getApiUrl } from '../lib/api-utils';
import { authFetch } from '../lib/authFetch';
import SEO from '../components/SEO';
import { OrganizationSchema } from '../components/StructuredData';

const API_URL = getApiUrl();

// ─── Indian Market Ticker Data ───────────────────────────────────────────────
const MARKET_TICKERS = [
  { sym: 'NIFTY 50', val: '24,323', chg: '+135.20', pct: '+0.56%', up: true },
  { sym: 'SENSEX',   val: '80,014', chg: '+422.10', pct: '+0.53%', up: true },
  { sym: 'RELIANCE', val: '₹2,845', chg: '+34.10',  pct: '+1.21%', up: true },
  { sym: 'TCS',      val: '₹3,920', chg: '-12.40',  pct: '-0.31%', up: false },
  { sym: 'HDFCBANK', val: '₹1,728', chg: '+18.90',  pct: '+1.10%', up: true },
  { sym: 'INFY',     val: '₹1,495', chg: '-8.30',   pct: '-0.55%', up: false },
  { sym: 'WIPRO',    val: '₹512',   chg: '+6.20',   pct: '+1.23%', up: true },
  { sym: 'ITC',      val: '₹468',   chg: '+3.80',   pct: '+0.82%', up: true },
  { sym: 'BAJAJ-AUTO',val:'₹9,214', chg: '+88.50',  pct: '+0.97%', up: true },
  { sym: 'TITAN',    val: '₹3,412', chg: '-22.60',  pct: '-0.66%', up: false },
];

const FEATURES = [
  { icon: ShieldCheck, label: '100-Point Audit Score', desc: 'Institutional-grade fundamentals' },
  { icon: TrendingUp,  label: 'FII/DII Smart Money',  desc: 'Real-time institutional tracking' },
  { icon: Zap,         label: 'ABCD Tranche Zones',   desc: 'Systematic entry laddering' },
  { icon: BarChart2,   label: 'Nifty 500 Universe',   desc: 'Full market coverage' },
];

// ─── Animated Canvas Background ───────────────────────────────────────────────
const MarketCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Candlestick bars
    const candles = Array.from({ length: 22 }, (_, i) => ({
      x: 40 + i * 28,
      y: 0,
      w: 10,
      h: 0,
      up: Math.random() > 0.45,
      baseH: 30 + Math.random() * 60,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.006,
    }));

    // Floating orbs
    const orbs = Array.from({ length: 6 }, (_, i) => ({
      x: 80 + i * 80,
      y: 80 + Math.random() * 200,
      r: 30 + Math.random() * 50,
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.005,
      color: i % 3 === 0 ? '#00d09c' : i % 3 === 1 ? '#3b82f6' : '#f59e0b',
    }));

    // Particle nodes (network dots)
    const nodes = Array.from({ length: 35 }, () => ({
      x: Math.random() * 500,
      y: Math.random() * 700,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1.5 + Math.random() * 2,
    }));

    let t = 0;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (W === 0 || H === 0) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, W, H);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const scrollOffset = window.scrollY || 0;

      // ── Dark gradient background ──
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // ── Subtle grid (offset by scrollOffset) ──
      ctx.strokeStyle = 'rgba(51,65,85,0.35)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = -(scrollOffset * 0.4) % 40; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      // ── Floating glowing orbs with mouse + scroll parallax ──
      orbs.forEach((o) => {
        const px = o.x + (mx - W / 2) * 0.03;
        const py = o.y + Math.sin(t * o.speed + o.phase) * 18 + (my - H / 2) * 0.02 - scrollOffset * 0.25;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, o.r);
        grd.addColorStop(0, o.color + '30');
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px, py, o.r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      });

      // ── Network nodes + connections ──
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y - scrollOffset * 0.15);
            ctx.lineTo(b.x, b.y - scrollOffset * 0.15);
            ctx.strokeStyle = `rgba(0,208,156,${0.12 * (1 - d / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
        ctx.beginPath();
        ctx.arc(a.x, a.y - scrollOffset * 0.15, a.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,208,156,0.4)';
        ctx.fill();
      });

      // ── Animated candlestick chart (moves up on scroll) ──
      const chartY = H * 0.62 - scrollOffset * 0.3;
      candles.forEach((c) => {
        c.h = c.baseH + Math.sin(t * c.speed + c.phase + (mx / W) * 0.5) * 20;
        const x = c.x + (mx - W / 2) * 0.015;
        const y = chartY - c.h;
        const color = c.up ? '#00d09c' : '#f43f5e';

        // shadow/wick
        ctx.strokeStyle = color + '99';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + c.w / 2, y - 10);
        ctx.lineTo(x + c.w / 2, y + c.h + 10);
        ctx.stroke();

        // body
        ctx.fillStyle = color + (c.up ? 'cc' : '99');
        ctx.beginPath();
        ctx.roundRect(x, y, c.w, c.h, 2);
        ctx.fill();

        // glow
        const cg = ctx.createRadialGradient(x + c.w / 2, y + c.h / 2, 0, x + c.w / 2, y + c.h / 2, c.w * 2);
        cg.addColorStop(0, color + '20');
        cg.addColorStop(1, 'transparent');
        ctx.fillStyle = cg;
        ctx.fillRect(x - 10, y - 10, c.w + 20, c.h + 20);
      });

      // ── Chart baseline ──
      ctx.strokeStyle = 'rgba(0,208,156,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(20, chartY);
      ctx.lineTo(W - 20, chartY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Floating ticker labels ──
      const tickerY = H * 0.18 + (my - H / 2) * 0.04 - scrollOffset * 0.35;
      MARKET_TICKERS.slice(0, 4).forEach((tick, i) => {
        const tx = 30 + i * (W / 4.2);
        const ty = tickerY + Math.sin(t * 0.012 + i) * 8;

        ctx.fillStyle = 'rgba(15,23,42,0.85)';
        ctx.beginPath();
        ctx.roundRect(tx - 4, ty - 22, 88, 42, 8);
        ctx.fill();

        ctx.strokeStyle = tick.up ? 'rgba(0,208,156,0.4)' : 'rgba(244,63,94,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(tick.sym, tx, ty - 8);

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = tick.up ? '#00d09c' : '#f43f5e';
        ctx.fillText(tick.pct, tx, ty + 8);
      });

      t += 1;
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    canvas.addEventListener('mousemove', onMouse);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
};

// ─── Dev Login ─────────────────────────────────────────────────────────────
// Local-only convenience. Requires DEV_LOGIN_SECRET (set in backend/.env) on the server.
// No credentials are hardcoded in the client bundle.
const DevLoginForm: React.FC<{ onLogin: (token: string) => void; setError: (err: string | null) => void }> = ({ onLogin, setError }) => {
  const [devEmail, setDevEmail] = useState('');
  const [devSecret, setDevSecret] = useState('');
  const handleDevLogin = async () => {
    try {
      setError(null);
      const res = await fetch('http://localhost:3001/api/dev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: devEmail, secret: devSecret }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      onLogin(data.token);
    } catch (e: any) {
      setError(e.message || 'Network error');
    }
  };
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider text-center">Dev Login (Local Only)</p>
      <input
        type="email"
        value={devEmail}
        onChange={(e) => setDevEmail(e.target.value)}
        placeholder="Dev email"
        className="w-full px-3 py-2 bg-white/60 border border-amber-200 rounded-xl text-xs text-amber-800 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <input
        type="password"
        value={devSecret}
        onChange={(e) => setDevSecret(e.target.value)}
        placeholder="DEV_LOGIN_SECRET"
        className="w-full px-3 py-2 bg-white/60 border border-amber-200 rounded-xl text-xs text-amber-800 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <button onClick={handleDevLogin}
        className="w-full px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2">
        <Bug className="h-3.5 w-3.5" /> Dev Login
      </button>
    </div>
  );
};

// ─── Main Login Page ────────────────────────────────────────────────────────
const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [userName, setUserName] = useState('');
  const [showWakingMessage, setShowWakingMessage] = useState(false);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { googleLogin, login, register, user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/app';

  useEffect(() => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: '500460562927-5b1mt1r0vcke4u3mm5hhj1a4cmilsgao.apps.googleusercontent.com',
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            googleLogin(response.credential).catch(() => {
              setError('Google Authentication Failed');
            });
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  }, []);

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError(null);
    setShowWakingMessage(false);
    const wakeTimer = setTimeout(() => setShowWakingMessage(true), 6000);

    // Timeout after 15 seconds - if One Tap hasn't worked, show fallback
    const timeoutTimer = setTimeout(() => {
      setLoading(false);
      setShowWakingMessage(false);
      setError('Google One Tap is taking too long. Try the direct sign-in button below.');
    }, 15000);

    try {
      if (window.google?.accounts?.id) {
        // Reset any previous prompt
        window.google.accounts.id.prompt?.((notification: any) => {
          clearTimeout(wakeTimer);
          clearTimeout(timeoutTimer);

          if (notification.isNotDisplayed?.()) {
            // One Tap was blocked - show fallback option
            setLoading(false);
            setError('Google pop-up was blocked by your browser. Use the direct sign-in button below.');
          } else if (notification.isDismissedMoment?.()) {
            // User dismissed - don't show error, just stop loading
            setLoading(false);
          }
          // If prompt is displayed, we wait for the callback
        });
      } else {
        clearTimeout(wakeTimer);
        clearTimeout(timeoutTimer);
        setLoading(false);
        throw new Error('Google sign-in is not available yet.');
      }
    } catch (e) {
      clearTimeout(wakeTimer);
      clearTimeout(timeoutTimer);
      setLoading(false);
      setShowWakingMessage(false);
      setError('Google sign-in failed. Please try again or use direct sign-in.');
    }
  };

  // Fallback: Full Google OAuth redirect (bypasses One Tap issues)
  const handleGoogleRedirect = () => {
    const clientId = '500460562927-5b1mt1r0vcke4u3mm5hhj1a4cmilsgao.apps.googleusercontent.com';
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    window.location.href = url;
  };

  useEffect(() => {
    // Only auto-redirect to PIN login if user has a valid session
    // Don't redirect if session is expired or user is null
    const hasPinFlag = localStorage.getItem('mb_has_pin') === 'true';
    const hasToken = !!localStorage.getItem('mb_token');

    // If user has PIN flag but no token, clear the flag (session expired)
    if (hasPinFlag && !hasToken) {
      localStorage.removeItem('mb_has_pin');
      localStorage.removeItem('mb_pin_email');
      // Don't redirect, let them login normally
      return;
    }

    // If user has both PIN flag and token, redirect to PIN login
    if (hasPinFlag && hasToken) {
      navigate('/pin-login', { replace: true });
      return;
    }

    if (user) {
      if (user?.needsOnboarding) setOnboarding(true);
      else {
        authFetch('/api/auth/pin-status').then(r => r.json()).then(data => {
          if (!data.hasPin) setPinSetupOpen(true);
          else navigate(from, { replace: true });
        }).catch(() => navigate(from, { replace: true }));
      }
    }
  }, [user, navigate, from]);

  // Loading state
  if (loading && !onboarding) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 border-t-[#00d09c] rounded-full animate-spin" />
          {showWakingMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse border-2 border-[#020617]" />
          )}
        </div>
        <div className="space-y-2 text-center max-w-xs">
          <p className="text-xs font-bold text-[#00d09c] uppercase tracking-[0.4em]">Authenticating</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing with Institutional Hub...</p>
          {showWakingMessage && (
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-4">
              Please choose an account in the Google pop-up prompt if it is open...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Onboarding state
  if (onboarding) return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#00d09c]/5 blur-3xl -mr-20 -mt-20" />
        <div className="text-center space-y-4 relative z-10">
          <div className="bg-[#00d09c] w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg">
            <UserPlus className="h-8 w-8" />
          </div>
          <div className="space-y-1 pt-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Complete Profile</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">One last step to access the terminal</p>
          </div>
        </div>
        <form className="space-y-6 relative z-10" onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const res = await fetch(`${API_URL}/api/user/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ name: userName })
            });
            if (res.ok) { await refreshAuth(); navigate(from, { replace: true }); }
          } catch (err) { setError('Failed to save profile.'); }
          finally { setLoading(false); }
        }}>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] block">Your Name</label>
            <input
              type="text"
              placeholder="e.g. Diwakar Singh"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 focus:border-[#00d09c] focus:bg-white transition-all outline-none"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl text-sm font-bold uppercase tracking-wider shadow-md shadow-[#00d09c]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
          >
            Launch My Terminal <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );

  // Main login page
  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans overflow-x-hidden bg-white">
      <SEO title="Login — MarketBeacon Pro" description="Access your MarketBeacon Pro terminal. Google sign-in for institutional stock research tools." url="/login" />
      <OrganizationSchema />

      {/* ── LEFT PANEL: Animated Indian Market Canvas (Sticky) ── */}
      <div
        className="relative hidden lg:flex flex-col lg:w-[45%] h-screen lg:sticky lg:top-0 overflow-hidden shrink-0"
      >
        {/* Canvas fills the left side */}
        <MarketCanvas />

        {/* Overlay content on top of canvas */}
        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Top logo */}
          <div>
            <BrandLogo variant="dark" size={32} />
          </div>

          {/* Center hero text */}
          <div className="space-y-6 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00d09c]/15 border border-[#00d09c]/30 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#00d09c] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-[#00d09c] uppercase tracking-[0.3em]">Live Market Terminal</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-tight">
              India's Institutional<br />
              <span className="text-[#00d09c]">Research Engine.</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              100-point audit scores, FII/DII smart money tracking, and ABCD tranche zones — all in one terminal.
            </p>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                  <div className="w-8 h-8 bg-[#00d09c]/15 border border-[#00d09c]/25 rounded-lg flex items-center justify-center shrink-0">
                    <f.icon className="w-3.5 h-3.5 text-[#00d09c]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-wide leading-none">{f.label}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom live ticker strip */}
          <div className="overflow-hidden relative">
            <div className="flex gap-4 animate-[marquee_20s_linear_infinite]">
              {[...MARKET_TICKERS, ...MARKET_TICKERS].map((t, i) => (
                <div key={i} className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">{t.sym}</span>
                  <span className={`text-[10px] font-bold ${t.up ? 'text-[#00d09c]' : 'text-rose-400'}`}>{t.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login Form + Scrollable Info Sections ── */}
      <div className="flex-1 flex flex-col bg-white min-h-screen">
        {/* Main Login Form Screen */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 min-h-screen relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d09c]/4 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-50 blur-[80px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          <div className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center">
              <BrandLogo variant="light" size={30} />
            </div>

            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-[#00d09c]/20 rounded-full mb-1">
                <span className="w-1.5 h-1.5 bg-[#00d09c] rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-[#00d09c] uppercase tracking-[0.3em]">Institutional Access</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-sm text-slate-500 font-medium">Sign in to access your research terminal</p>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 20}`} alt="Trader" loading="lazy" />
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#00d09c] flex items-center justify-center text-[9px] font-bold text-white shadow-sm">+30K</div>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Joined by <span className="text-slate-700 font-extrabold">31,402</span> traders
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-600 animate-in shake duration-500">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-relaxed">{error}</span>
              </div>
            )}

            {/* Login Card */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-100/80 space-y-6">
              {/* Google Login button */}
              <div className="w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-4">Continue with</p>
                <div className="w-full">
                  <button
                     onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </button>
                </div>
              </div>

              {/* Fallback: Direct Google sign-in link (when One Tap fails) */}
              <div className="text-center">
                <button
                  onClick={handleGoogleRedirect}
                  className="text-[10px] font-bold text-slate-400 hover:text-[#00d09c] uppercase tracking-wider transition-colors"
                >
                  <Globe className="h-3 w-3 inline mr-1" />
                  Or sign in with Google directly
                </button>
              </div>

              {/* Toggle email login */}
              <div className="text-center">
                <button
                  onClick={() => { setShowEmailForm(!showEmailForm); setError(null); }}
                  className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[#00d09c] uppercase tracking-wider transition-colors"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {showEmailForm ? 'Hide Email Login' : 'Sign in with Email'}
                </button>
              </div>

              {/* Email / Password Login Form (collapsible) */}
              {showEmailForm && (
                <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      {isRegister ? 'New Account' : 'Email Login'}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setError(null);
                    setLoading(true);
                    try {
                      if (isRegister) {
                        await register(emailInput, passwordInput, nameInput || emailInput.split('@')[0]);
                      } else {
                        await login(emailInput, passwordInput);
                      }
                    } catch (err: any) {
                      setError(err.message || 'Authentication failed');
                      setLoading(false);
                      return;
                    }
                    setLoading(false);
                    window.location.href = from;
                  }} className="space-y-3">
                    {isRegister && (
                      <input
                        type="text"
                        placeholder="Your Name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#00d09c] focus:bg-white transition-all outline-none"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                    )}
                    <input
                      type="email"
                      placeholder="Email address"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#00d09c] focus:bg-white transition-all outline-none"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password (min 6 chars)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 focus:border-[#00d09c] focus:bg-white transition-all outline-none"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-[#00d09c]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>{isRegister ? 'Create Account' : 'Sign In'} <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  </form>

                  <div className="text-center">
                    <button
                      onClick={() => { setIsRegister(!isRegister); setError(null); }}
                      className="text-[10px] font-bold text-slate-400 hover:text-[#00d09c] uppercase tracking-wider transition-colors"
                    >
                      {isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">OR</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                </div>
              )}

              {/* PIN Login Link */}
              <div className="text-center">
                <Link
                  to="/pin-login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#00d09c] uppercase tracking-wider transition-colors"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Quick PIN Access
                </Link>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Free to Start', icon: '🎁' },
                  { label: 'No Card Needed', icon: '🛡️' },
                  { label: 'SEBI Disclaimer', icon: '📋' },
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 p-2.5 bg-slate-50 rounded-xl text-center">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide leading-tight">{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Dev login (localhost only) */}
              {window.location.hostname === 'localhost' && (
                <div className="pt-2 border-t border-slate-100">
                  <DevLoginForm onLogin={(_token) => { window.location.href = '/app'; }} setError={setError} />
                </div>
              )}
            </div>

            {/* Key Platform Stats */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 grid grid-cols-4 gap-1 text-center shadow-sm">
              <div className="space-y-0.5">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Accuracy</p>
                 <p className="text-xs font-black text-[#00d09c]">99.4%</p>
              </div>
              <div className="space-y-0.5 border-l border-slate-200">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Alpha Gain</p>
                 <p className="text-xs font-black text-[#00d09c]">1.8x</p>
              </div>
              <div className="space-y-0.5 border-l border-slate-200">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Rejection</p>
                 <p className="text-xs font-black text-rose-500">70%+</p>
              </div>
              <div className="space-y-0.5 border-l border-slate-200">
                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Traders</p>
                 <p className="text-xs font-black text-[#00d09c]">30K+</p>
              </div>
            </div>

            {/* Blog Section */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Latest from Research Hub</h3>
              <div className="space-y-2">
                <Link to="/blog/how-abcd-tranche-saved-my-portfolio-2024" className="block p-3 bg-white rounded-xl hover:border-[#00d09c]/30 transition-all border border-slate-100">
                  <p className="text-xs font-bold text-slate-800">How ABCD Tranche Saved My Portfolio in 2024</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Institutional averaging strategy</p>
                </Link>
                <Link to="/blog/fii-dii-tracking-beginners-guide" className="block p-3 bg-white rounded-xl hover:border-[#00d09c]/30 transition-all border border-slate-100">
                  <p className="text-xs font-bold text-slate-800">FII/DII Tracking & Smart Money</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Follow institutional flows</p>
                </Link>
                <Link to="/blog/why-67-percent-fall-strategy-works" className="block p-3 bg-white rounded-xl hover:border-[#00d09c]/30 transition-all border border-slate-100">
                  <p className="text-xs font-bold text-slate-800">Why 67% Fall Strategy Works</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Deep value multibagger framework</p>
                </Link>
              </div>
            </div>

            {/* Footer links */}
            <div className="text-center space-y-3">
              <Link
                to="/connect"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#00d09c] uppercase tracking-wider transition-colors"
              >
                <Globe className="h-3.5 w-3.5" /> Connectivity Hub
              </Link>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
                By signing in, you agree to our terms. MarketBeacon is for educational research — not investment advice.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <PinSetupModal
        isOpen={pinSetupOpen}
        email={user?.email}
        onClose={() => { setPinSetupOpen(false); navigate(from, { replace: true }); }}
        onSuccess={() => { setPinSetupOpen(false); navigate(from, { replace: true }); }}
      />
    </div>
  );
};

export default LoginPage;
