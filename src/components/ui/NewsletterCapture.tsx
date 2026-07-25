import React, { useState } from 'react';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../../lib/api-utils';
import { toast } from 'sonner';

interface NewsletterCaptureProps {
  segment?: string;
  className?: string;
}

export const NewsletterCapture: React.FC<NewsletterCaptureProps> = ({
  segment = 'blog',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), segment })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setEmail('');
        toast.success(data.duplicate ? 'Already subscribed!' : 'Thanks for subscribing!');
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center ${className}`}>
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <p className="text-emerald-700 font-semibold">You're on the list!</p>
        <p className="text-emerald-600 text-sm mt-1">We'll send you institutional insights weekly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 ${className}`}>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weekly Institutional Insights</p>
        <h3 className="text-lg font-black text-slate-900">Get ABCD zones, audit scores & smart money moves in your inbox.</h3>
        <p className="text-xs text-slate-500">No spam. Unsubscribe anytime. 2,000+ traders read this.</p>
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="your@email.com"
          disabled={loading}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
          autoComplete="email"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !email}
        className="w-full py-3 bg-[#00d09c] hover:bg-[#00bda0] disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Subscribing...
          </>
        ) : (
          'Subscribe Free'
        )}
      </button>
      {error && (
        <p className="text-xs text-rose-500 font-medium text-center flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
      <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider">
        By subscribing you agree to our <a href="/privacy" className="underline hover:text-[#00d09c]">Privacy Policy</a>.
      </p>
    </form>
  );
};

export default NewsletterCapture;