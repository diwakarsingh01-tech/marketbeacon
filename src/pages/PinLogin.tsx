import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { getApiUrl, safeJsonParse } from '../lib/api-utils';
import { useAuth } from '../context/AuthContext';

const API_URL = getApiUrl();

const PinLogin: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = (idx: number) => {
    if (inputRefs.current[idx]) inputRefs.current[idx]?.focus();
  };

  const handleDigitInput = (idx: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newPin = [...pin];
    newPin[idx] = value;
    setPin(newPin);
    if (value && idx < 3) focusInput(idx + 1);
    if (value && idx === 3) {
      setTimeout(() => handleSubmit(), 200);
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) {
      const newPin = [...pin];
      newPin[idx - 1] = '';
      setPin(newPin);
      focusInput(idx - 1);
    }
  };

  const handleSubmit = async () => {
    if (!email || pin.join('').length !== 4) { setError('Enter email and 4-digit PIN'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), pin: pin.join('') })
      });
      const data = await safeJsonParse(res);
      if (res.ok && !data.error) {
        localStorage.setItem('mb_pin_email', email.trim());
        localStorage.setItem('mb_has_pin', 'true');
        await refreshAuth();
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid PIN');
        setPin(['', '', '', '']);
        focusInput(0);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-lg font-black text-[var(--text-primary)] uppercase italic">Quick PIN Access</h1>
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Enter your email and 4-digit PIN</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-[var(--bg-primary)] border-2 border-[var(--border-primary)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">PIN</label>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="tel"
                  maxLength={1}
                  value={pin[i]}
                  disabled={loading}
                  onChange={(e) => handleDigitInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-blue-500 outline-none transition-all"
                />
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-rose-500 text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? 'Verifying...' : 'Access Account'}
        </button>

        <div className="text-center">
          <Link to="/login" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to login
          </Link>
        </div>

        <p className="text-[10px] text-[var(--text-tertiary)] text-center font-medium">
          Forgot your PIN? Log in with your password to reset it
        </p>
      </div>
    </div>
  );
};

export default PinLogin;
