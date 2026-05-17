import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import { useGoogleLogin } from '@react-oauth/google';
import { Activity, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
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

  /*
  const handleGoogleLoginSuccess = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      // Note: useGoogleLogin with 'code' or 'token' flow. 
      // Default is token (implicit flow).
      await googleLogin(response.access_token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const googleLoginTrigger = useGoogleLogin({
    onSuccess: handleGoogleLoginSuccess,
    onError: () => setError('Google Login Failed'),
  });
  */

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-4">
           <Link to="/" className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/30">
              <Activity className="h-8 w-8" />
           </Link>
           <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">MarketBeacon</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal Login</p>
           </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 space-y-8">
           <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Welcome Back</h2>
              <p className="text-sm font-medium text-slate-400">Access your professional trading dashboard.</p>
           </div>

           {error && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600 animate-in fade-in zoom-in duration-300">
                <AlertCircle className="h-5 w-5" />
                <span className="text-xs font-bold">{error}</span>
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                       <Mail className="h-5 w-5" />
                    </div>
                    <input 
                      type="email" 
                      required
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                    />
                 </div>
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                       <Lock className="h-5 w-5" />
                    </div>
                    <input 
                      type="password" 
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between">
                 <label className="flex items-center space-x-2 cursor-pointer group">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20" />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Remember Session</span>
                 </label>
                 <a href="#" className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">Reset Path</a>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-black active:scale-95 transition-all shadow-xl disabled:opacity-50 disabled:pointer-events-none group"
              >
                <span>{loading ? 'Verifying...' : 'Access Terminal'}</span>
                {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
           </form>

           <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 font-black text-slate-300 tracking-[0.3em]">OR</span></div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <button 
                // onClick={() => googleLoginTrigger()}
                disabled={loading}
                className="flex items-center justify-center space-x-3 w-full py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              >
                 <img src="https://www.svgrepo.com/show/355037/google.svg" className="h-4 w-4" alt="Google" />
                 <span>{loading ? 'Authenticating...' : 'Continue with Google'}</span>
              </button>
           </div>
        </div>

        <p className="text-center text-sm font-medium text-slate-500">
           New analyst? <Link to="/register" className="font-black text-blue-600 hover:underline">Request Onboarding</Link>
        </p>

        <div className="flex items-center justify-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">
           <ShieldCheck className="h-3 w-3" />
           <span>256-bit Institutional Encryption Active</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
