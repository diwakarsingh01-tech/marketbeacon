import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Activity, ArrowRight, ShieldCheck, AlertCircle, Phone } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Login Method State
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'google'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);

  const { googleLogin, sendMobileOtp, mobileVerify } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/screener";

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Brand */}
        <div className="text-center space-y-4">
           <div className="flex items-center justify-center space-x-2">
              <div className="bg-slate-900 p-1.5 rounded-lg text-white">
                 <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic">MarketBeacon</span>
           </div>
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Terminal Access</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Verified Institutional Research</p>
           </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 animate-in fade-in zoom-in duration-300">
             <AlertCircle className="h-5 w-5 shrink-0" />
             <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
          </div>
        )}

        {/* Login Options Tab */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
           <button 
             onClick={() => { setLoginMethod('mobile'); setError(null); }}
             className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
           >
             Mobile OTP
           </button>
           <button 
             onClick={() => { setLoginMethod('google'); setError(null); }}
             className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${loginMethod === 'google' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
           >
             Gmail SSO
           </button>
        </div>

        {loginMethod === 'mobile' ? (
          <form onSubmit={handleMobileSubmit} className="space-y-6">
            <div className="space-y-4">
               <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">+91</div>
                  <input 
                    type="tel" 
                    placeholder="Enter Mobile Number"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
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
        ) : (
          <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom duration-500">
             <div className="text-center space-y-2">
                <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">Instant Decryption</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect your institutional Gmail account</p>
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
        )}

        <div className="pt-4 border-t border-slate-50 flex items-center justify-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">
           <ShieldCheck className="h-3 w-3" />
           <span>256-bit Institutional Encryption Active</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
