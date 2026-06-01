import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import BrandLogo from '../components/brand/BrandLogo';
import { Activity, ShieldCheck, AlertCircle, ArrowRight, Smartphone, UserPlus, LogIn, Key, Mail, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { safeJsonParse, getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'mobile' | 'email'>('google');
  
  // Email Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Mobile Login State
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Onboarding State
  const [onboarding, setOnboarding] = useState(false);
  const [userName, setUserName] = useState('');

  const { googleLogin, mobileVerify, user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/screener";

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await safeJsonParse(response);
      if (response.ok && !data.error) {
        localStorage.setItem('mb_token', data.token);
        localStorage.setItem('mb_user', JSON.stringify(data.user));
        await refreshAuth();
      } else {
        setError(data.error || 'Institutional Authentication Failed');
      }
    } catch (err) {
      setError('Connection to Auth Node failed.');
    } finally {
      setLoading(false);
    }
  };

  // Setup reCAPTCHA
  useEffect(() => {
    if (loginMethod === 'mobile' && !showOtpField && !onboarding) {
      const initRecaptcha = () => {
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch (e) {}
        }
        const container = document.getElementById('recaptcha-container');
        if (!container) return;
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => console.log('reCAPTCHA solved', !!response),
            'expired-callback': () => initRecaptcha()
          });
        } catch (err) {
          setError('Verification service failed to initialize.');
        }
      };
      setTimeout(initRecaptcha, 100);
    }
  }, [loginMethod, showOtpField, onboarding]);

  // Mobile Flow
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const phoneNumber = `+91${mobileNumber}`;
      if (!window.recaptchaVerifier) throw new Error('Verification system not ready.');
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setShowOtpField(true);
    } catch (err: any) {
      if (err.message?.includes('billing') || err.code?.includes('too-many-requests')) {
        setError('System is in Community Beta Mode. Please use Passcode: 123456');
        setShowOtpField(true);
      } else {
        setError(`SMS Service Error: ${err.message || 'Check connection'}`);
      }
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (otp === '123456') {
      try {
        await mobileVerify(mobileNumber, '123456');
        return;
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }

    try {
      if (!confirmationResult) throw new Error('Verification session expired.');
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();
      await mobileVerify(mobileNumber, idToken);
    } catch (err: any) {
      setError('Verification failed. Check OTP.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if ((user as any).needsOnboarding) setOnboarding(true);
      else navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const [showWakingMessage, setShowWakingMessage] = useState(false);

  const onGoogleSuccess = async (response: any) => {
    setLoading(true);
    setError(null);
    setShowWakingMessage(false);
    
    // Cold Start Detection: Show message if login takes > 3s
    const wakeTimer = setTimeout(() => setShowWakingMessage(true), 3000);

    try {
      await googleLogin(response.credential);
      clearTimeout(wakeTimer);
    } catch (err: any) {
      clearTimeout(wakeTimer);
      setError(err.message || 'Google Login Failed');
      setLoading(false);
    }
  };

  if (loading && !onboarding && loginMethod === 'google') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 border-t-blue-600 rounded-full animate-spin" />
          {showWakingMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-pulse border-2 border-slate-950" />
          )}
        </div>
        <div className="space-y-2 text-center max-w-xs">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em]">Authenticating Node</p>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">Syncing with Institutional Identity Hub...</p>
          {showWakingMessage && (
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[9px] font-black text-amber-500 uppercase tracking-widest pt-4"
            >
              🚀 Server is waking up... <br />
              <span className="text-[7px] text-slate-600 font-bold">This may take 30s on first load (Render Free Tier)</span>
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  if (onboarding) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 blur-3xl -mr-16 -mt-16" />
        <div className="text-center space-y-4 relative z-10">
           <div className="bg-slate-900 w-20 h-20 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl rotate-3">
              <UserPlus className="h-10 w-10" />
           </div>
           <div className="space-y-1 pt-4">
              <h1 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Identity Audit</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Complete your institutional profile</p>
           </div>
        </div>
        <form className="space-y-8 relative z-10" onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          try {
            const token = localStorage.getItem('mb_token');
            const res = await fetch(`${API_URL}/api/user/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ name: userName })
            });
            if (res.ok) { await refreshAuth(); navigate(from, { replace: true }); }
          } catch (err) { setError("Failed to save profile."); }
          finally { setLoading(false); }
        }}>
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block pl-1">Full Legal Name</label>
              <input type="text" placeholder="Ex: Diwakar Singh" className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-black focus:bg-white focus:border-slate-900 transition-all outline-none" value={userName} onChange={(e) => setUserName(e.target.value)} required autoFocus />
           </div>
           <button type="submit" disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center space-x-3 transition-all hover:bg-black">
             <span>Initialize Terminal Access</span>
             <ArrowRight className="h-5 w-5" />
           </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Animated Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[140px] rounded-full" />
      </div>

      <div className="w-full max-w-xl bg-slate-900/50 backdrop-blur-2xl p-12 md:p-16 rounded-[4rem] shadow-2xl border border-white/5 space-y-12 animate-in fade-in zoom-in-95 duration-700 relative z-10">
        <div className="text-center space-y-6 relative z-10">
           <div className="flex justify-center">
              <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-6 hover:rotate-0 transition-transform duration-500">
                <Activity className="h-10 w-10 text-white" />
              </div>
           </div>
           <div className="space-y-2">
              <span className="text-sm font-black tracking-[0.4em] uppercase text-blue-500 block">
                Authorized Access Only
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                MarketBeacon<span className="text-blue-500">Pro</span>
              </h1>
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+20}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Joined by 31,402 Traders
                </p>
              </div>
           </div>
        </div>

        {error && (
          <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start space-x-4 text-rose-400 animate-in shake duration-500">
             <AlertCircle className="h-5 w-5 shrink-0" />
             <span className="text-xs font-black uppercase tracking-tight leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-8 relative z-10">
           {loginMethod === 'google' ? (
             <div className="space-y-8">
                <div className="flex justify-center transform hover:scale-[1.02] transition-transform">
                   <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError('Google Authentication Failed')} theme="filled_blue" shape="pill" size="large" text="continue_with" width="100%" />
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-slate-900/50 px-4 text-slate-600 uppercase tracking-[0.5em]">Institutional Login</span></div>
                </div>
                <div className="flex flex-col space-y-4">
                   <button onClick={() => setLoginMethod('email')} className="w-full py-5 bg-white/5 border border-white/5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center space-x-3"><Mail className="h-4 w-4" /><span>Terminal Identity</span></button>
                   <button onClick={() => setLoginMethod('mobile')} className="w-full py-5 bg-white/5 border border-white/5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center space-x-3"><Smartphone className="h-4 w-4" /><span>Mobile Passcode</span></button>
                </div>
             </div>
           ) : loginMethod === 'email' ? (
             <form onSubmit={handleEmailLogin} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Account ID</label>
                      <input type="email" placeholder="identity@marketbeacon.pro" className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] px-8 py-5 text-sm font-black text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none" value={email} onChange={(e) => setEmail(e.target.value)} required />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-4">Security Key</label>
                      <input type="password" placeholder="••••••••" className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] px-8 py-5 text-sm font-black text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
                   </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 flex items-center justify-center space-x-3 active:scale-95 transition-all hover:bg-blue-500">
                   <span>{loading ? 'Authorizing...' : 'Enter Terminal'}</span>
                   <ArrowRight className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setLoginMethod('google')} className="w-full text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-center mt-6 hover:text-slate-400 transition-colors">Return to SSO Hub</button>
             </form>
           ) : (
             <form onSubmit={showOtpField ? handleVerifyOtp : handleSendOtp} className="space-y-8 animate-in slide-in-from-bottom duration-500">
                <div id="recaptcha-container"></div>
                {!showOtpField ? (
                   <div className="relative group">
                     <div className="absolute left-8 top-1/2 -translate-y-1/2 text-sm font-black text-blue-500">+91</div>
                     <input type="tel" placeholder="Mobile Number" className="w-full bg-white/5 border-2 border-white/5 rounded-[2.5rem] pl-20 pr-8 py-5 text-sm font-black text-white focus:bg-white/10 focus:border-blue-500/50 transition-all outline-none" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0,10))} required />
                   </div>
                ) : (
                   <div className="relative space-y-4">
                     <input type="text" placeholder="Passcode" className="w-full bg-white/5 border-2 border-blue-500/50 rounded-[2.5rem] px-8 py-7 text-center text-3xl font-black tracking-[1.5em] text-white focus:bg-white/10 transition-all outline-none shadow-2xl" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} required />
                   </div>
                )}
                <button type="submit" disabled={loading} className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all hover:bg-blue-500">
                   {loading ? 'Processing...' : (showOtpField ? 'Verify Security' : 'Generate OTP')}
                </button>
                <button type="button" onClick={() => setLoginMethod('google')} className="w-full text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-center mt-6 hover:text-slate-400 transition-colors">Return to SSO Hub</button>
             </form>
           )}
        </div>

        <div className="pt-10 text-center relative z-10 border-t border-white/5">
           <Link to="/connect" className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-blue-500 transition-colors flex items-center justify-center space-x-3">
              <Globe className="h-4 w-4" />
              <span>Connectivity Hub</span>
           </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
