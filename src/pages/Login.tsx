import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Activity, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Key, Phone } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Mobile Login State
  const [loginMethod, setLoginMethod] = useState<'email' | 'mobile'>('email');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);

  const { login, googleLogin, sendMobileOtp, mobileVerify } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/screener";

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!showOtpField) {
      if (!/^\d{10}$/.test(mobileNumber)) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }
      setLoading(true);
      try {
        await sendMobileOtp(mobileNumber);
        setShowOtpField(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await mobileVerify(mobileNumber, otp);
        navigate(from, { replace: true });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const onGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      await googleLogin(credentialResponse.credential);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError('Google Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-10 animate-in fade-in zoom-in-95 duration-700">
        {/* Brand */}
        <div className="text-center space-y-4">
           <div className="flex items-center justify-center space-x-2">
              <div className="bg-slate-900 p-1.5 rounded-lg text-white">
                 <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic">MarketBeacon</span>
           </div>
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Terminal Login</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Access Institutional Research</p>
           </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 animate-in fade-in zoom-in duration-300">
             <AlertCircle className="h-5 w-5 shrink-0" />
             <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
           <button 
             onClick={() => { setLoginMethod('email'); setShowOtpField(false); setError(null); }}
             className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
           >
             Email Access
           </button>
           <button 
             onClick={() => { setLoginMethod('mobile'); setError(null); }}
             className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
           >
             Mobile / OTP
           </button>
        </div>

        {loginMethod === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                 <input 
                   type="email" 
                   placeholder="diwakar.singh01@gmail.com"
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                 />
              </div>
              <div className="relative group">
                 <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                 <input 
                   type="password" 
                   placeholder="•••••••••"
                   className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                 />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none group"
            >
              <span>{loading ? 'Decrypting Access...' : 'Connect to Terminal'}</span>
              {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMobileSubmit} className="space-y-6">
            <div className="space-y-4">
               <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">+91</div>
                  <input 
                    type="tel" 
                    placeholder="Enter Mobile Number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0,10))}
                    disabled={showOtpField}
                    required
                  />
               </div>
               {showOtpField && (
                 <div className="relative animate-in slide-in-from-top duration-300">
                    <input 
                      type="text" 
                      placeholder="Enter 6-Digit OTP"
                      className="w-full bg-slate-50 border-2 border-blue-100 rounded-2xl px-6 py-4 text-center text-lg font-black tracking-[1em] focus:bg-white focus:border-blue-600 transition-all outline-none"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
                      required
                    />
                    <p className="text-[8px] font-black text-center text-slate-400 uppercase mt-2 italic">Institutional OTP Check Active</p>
                 </div>
               )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? 'Verifying...' : (showOtpField ? 'Verify & Login' : 'Send One-Time Passcode')}
            </button>
          </form>
        )}

        {/* OAuth Integration */}
        <div className="space-y-6">
           <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-300 font-black tracking-widest text-[9px]">or institutional sso</span></div>
           </div>

           <div className="flex justify-center">
              <GoogleLogin 
                onSuccess={onGoogleSuccess}
                onError={() => setError('Google Authentication Failed')}
                theme="outline"
                shape="pill"
                size="large"
                text="continue_with"
                width="100%"
              />
           </div>
        </div>

        <div className="text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              New Analyst? <Link to="/register" className="text-blue-600 hover:underline font-black">Request Onboarding</Link>
           </p>
        </div>

        <div className="flex items-center justify-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">
           <ShieldCheck className="h-3 w-3" />
           <span>256-bit Institutional Encryption Active</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
