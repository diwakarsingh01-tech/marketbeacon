import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, name);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Onboarding</p>
           </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 space-y-8">
           <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900">Create Account</h2>
              <p className="text-sm font-medium text-slate-400">Join 2,400+ analysts scaling their portfolios.</p>
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
                       <User className="h-5 w-5" />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                    />
                 </div>
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
                      placeholder="Secure Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                    />
                 </div>
              </div>

              <div className="space-y-3">
                 <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed text-center px-4">By creating an account, you agree to our <a href="#" className="text-blue-600">Privacy Policy</a> and <a href="#" className="text-blue-600">Terms of Use</a>.</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 disabled:pointer-events-none group"
              >
                <span>{loading ? 'Creating...' : 'Initialize Onboarding'}</span>
                {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
              </button>
           </form>
        </div>

        <p className="text-center text-sm font-medium text-slate-500">
           Already an analyst? <Link to="/login" className="font-black text-blue-600 hover:underline">Market Login</Link>
        </p>

        <div className="flex items-center justify-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-50">
           <ShieldCheck className="h-3 w-3" />
           <span>Institutional Data Safety Protocol Active</span>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
