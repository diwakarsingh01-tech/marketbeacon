import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const authError = searchParams.get('error');

    if (authError) {
      setError(`Google authentication was cancelled or failed: ${authError}`);
      return;
    }

    if (!code) {
      setError('No authorization code received from Google');
      return;
    }

    // Exchange the authorization code for a JWT
    const exchangeCode = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setError(data.error || 'Authentication failed');
          return;
        }

        // Store token and user
        if (data.token) {
          localStorage.setItem('mb_token', data.token);
        }
        // Clear PIN flags since this is a Google login
        localStorage.removeItem('mb_has_pin');
        localStorage.removeItem('mb_pin_email');

        // Redirect to the app
        navigate('/app', { replace: true });
      } catch (e: any) {
        setError(e.message || 'Network error during authentication');
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-8 max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">&#x274C;</span>
          </div>
          <h2 className="text-xl font-bold text-white">Authentication Failed</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="px-6 py-3 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto border-4 border-white/5 border-t-[#00d09c] rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#00d09c] uppercase tracking-[0.3em]">Completing sign-in...</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
