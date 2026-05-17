import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Activity, ShieldCheck, AlertCircle, ArrowRight, Smartphone, UserPlus, LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'google' | 'mobile'>('google');
  
  // Mobile Login State
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);

  // Onboarding State
  const [onboarding, setOnboarding] = useState(false);
  const [userName, setUserName] = useState('');

  const { googleLogin, mobileVerify, user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/screener";

  // Gmail Flow
  const onGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      await googleLogin(credentialResponse.credential);
    } catch (err: any) {
      setError(err.message || 'Google Authentication Failed');
      setLoading(false);
    }
  };

  // Mobile Flow
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    // FALLBACK: Since Firebase isn't configured, we use the backend bypass for testing
    setTimeout(() => {
      setShowOtpField(true);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Direct backend verify (Bypassing Firebase SDK for user testing)
      await mobileVerify(mobileNumber, otp);
    } catch (err: any) {
      setError('Invalid OTP or verification failed.');
      setLoading(false);
    }
  };

  // Monitor user state for onboarding
  useEffect(() => {
    if (user) {
      if ((user as any).needsOnboarding) {
        setOnboarding(true);
        setLoading(false);
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, from]);

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('mb_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: userName })
      });
      if (res.ok) {
        await refreshAuth();
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError("Failed to save profile.");
    } finally {
      setLoading(false);
    }
  };

  if (onboarding) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 space-y-10 animate-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16" />
        <div className="text-center space-y-4 relative z-10">
           <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-blue-500/20 rotate-3">
              <UserPlus className="h-10 w-10" />
           </div>
           <div className="space-y-1 pt-4">
              <h1 className="text-3xl font-black text-slate-900 uppercase italic leading-none">Identity Audit</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Complete your institutional profile</p>
           </div>
        </div>

        <form onSubmit={handleCompleteOnboarding} className="space-y-8 relative z-10">
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block pl-1">Full Legal Name</label>
              <input 
                type="text" 
                placeholder="Ex: Diwakar Singh"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-black focus:bg-white focus:border-blue-600 transition-all outline-none shadow-inner"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                autoFocus
              />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 italic">* Used for certification and audit logs</p>
           </div>

           <button 
             type="submit" 
             disabled={loading}
             className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center space-x-3 transition-all active:scale-95 hover:bg-black"
           >
             <span>{loading ? 'Decrypting...' : 'Initialize Terminal Access'}</span>
             <ArrowRight className="h-5 w-5" />
           </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl border border-slate-100 space-y-12 animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] -ml-32 -mb-32" />

        <div className="text-center space-y-4 relative z-10">
           <div className="flex items-center justify-center space-x-3">
              <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-xl rotate-12">
                 <Activity className="h-6 w-6" />
              </div>
              <span className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">MarketBeacon</span>
           </div>
           <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Terminal Access</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Institutional Research Environment</p>
           </div>
        </div>

        {error && (
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-start space-x-4 text-rose-600 animate-in fade-in zoom-in duration-300 relative z-10 shadow-sm">
             <AlertCircle className="h-6 w-6 shrink-0" />
             <span className="text-xs font-black uppercase tracking-tight leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-10 relative z-10">
           {/* GMAIL: Primary Action */}
           <div className="space-y-6">
              <div className="flex items-center space-x-3 justify-center">
                 <div className="h-px w-10 bg-slate-100" />
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Institutional Single Sign-On</span>
                 <div className="h-px w-10 bg-slate-100" />
              </div>
              <div className="flex justify-center transform hover:scale-[1.02] transition-transform">
                 <GoogleLogin 
                   onSuccess={onGoogleSuccess}
                   onError={() => setError('Google Authentication Failed')}
                   theme="filled_blue"
                   shape="pill"
                   size="large"
                   text="continue_with"
                   width="100%"
                 />
              </div>
           </div>

           <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-50"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-6 text-slate-300 font-black tracking-[0.5em] text-[9px]">Alternatively</span></div>
           </div>

           {/* MOBILE: Secondary fallback */}
           {loginMethod === 'google' ? (
             <button 
               onClick={() => setLoginMethod('mobile')}
               className="w-full py-5 border-2 border-slate-100 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:border-blue-600 hover:text-blue-600 transition-all flex items-center justify-center space-x-3 bg-slate-50/50"
             >
               <Smartphone className="h-5 w-5" />
               <span>Login via Mobile OTP</span>
             </button>
           ) : (
             <form onSubmit={showOtpField ? handleVerifyOtp : handleSendOtp} className="space-y-8 animate-in slide-in-from-bottom duration-500">
               <div className="space-y-4">
                  {!showOtpField ? (
                     <div className="relative group">
                       <div className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">+91</div>
                       <input 
                         type="tel" 
                         placeholder="Verified Mobile"
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] pl-16 pr-8 py-5 text-sm font-black focus:bg-white focus:border-blue-600 transition-all outline-none shadow-inner"
                         value={mobileNumber}
                         onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0,10))}
                         required
                         autoFocus
                       />
                     </div>
                  ) : (
                     <div className="relative space-y-4">
                       <input 
                         type="text" 
                         placeholder="Passcode"
                         className="w-full bg-slate-50 border-2 border-blue-600 rounded-[2rem] px-8 py-6 text-center text-2xl font-black tracking-[1.5em] focus:bg-white transition-all outline-none shadow-xl"
                         value={otp}
                         onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                         required
                         autoFocus
                       />
                       <div className="flex items-center justify-center space-x-2 text-blue-500 animate-pulse">
                          <ShieldCheck className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest italic">Check SMS: Simulated OTP 123456</span>
                       </div>
                     </div>
                  )}
               </div>

               <div className="flex flex-col space-y-4">
                  <button 
                   type="submit" 
                   disabled={loading}
                   className="w-full py-6 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50 active:scale-95"
                 >
                   {loading ? 'Initializing...' : (showOtpField ? 'Confirm Access' : 'Request OTP Passcode')}
                 </button>
                 <button 
                   type="button" 
                   onClick={() => { setLoginMethod('google'); setShowOtpField(false); }}
                   className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
                 >
                   <LogIn className="h-3 w-3" />
                   <span>Return to Gmail SSO</span>
                 </button>
               </div>
             </form>
           )}
        </div>

        <div className="pt-10 border-t border-slate-50 flex items-center justify-center space-x-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-60 relative z-10">
           <ShieldCheck className="h-4 w-4" />
           <span>256-bit Node Encryption Active</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
