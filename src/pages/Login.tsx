import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import BrandLogo from '../components/brand/BrandLogo';
import { AlertCircle, ArrowRight, UserPlus, Globe } from 'lucide-react';
import { getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Onboarding State
  const [onboarding, setOnboarding] = useState(false);
  const [userName, setUserName] = useState('');

  const { googleLogin, user, refreshAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/screener";

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

  if (loading && !onboarding) {
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
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest pt-4">
              🚀 Server is waking up... <br />
              <span className="text-[7px] text-slate-600 font-bold">This may take 30s on first load (Render Free Tier)</span>
            </p>
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
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Complete your institutional profile</p>
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block pl-1">Full Legal Name</label>
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
              <BrandLogo variant="dark" size={36} />
           </div>
           <div className="space-y-2 pt-4">
              <span className="text-[9px] font-black tracking-[0.45em] uppercase text-blue-500 block">
                Authorized Access Only
              </span>
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+20}`} alt="User" loading="lazy" decoding="async" />
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
          <div className="space-y-8">
             <div className="flex justify-center transform hover:scale-[1.02] transition-transform">
                <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError('Google Authentication Failed')} theme="filled_blue" shape="pill" size="large" text="continue_with" width="100%" />
             </div>
          </div>
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
