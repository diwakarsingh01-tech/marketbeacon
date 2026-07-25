import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Crown, ArrowRight } from 'lucide-react';

interface Props {
  requiredTier: 'free' | 'pro' | 'alpha';
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

const tierLabels: Record<string, string> = { free: 'Free', pro: 'Pro', alpha: 'Alpha' };
const tierWeights: Record<string, number> = { free: 0, pro: 1, alpha: 2 };

const TierGate: React.FC<Props> = ({ requiredTier, children, fallback }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 border-4 border-white/5 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 mx-auto bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Sign In Required</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {requiredTier === 'pro' ? 'This feature requires a Pro subscription.' : 'This feature requires an Alpha subscription.'} Please sign in to continue.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const userWeight = tierWeights[user.tier] ?? 0;
  const requiredWeight = tierWeights[requiredTier] ?? 0;

  if (userWeight >= requiredWeight) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Upgrade to {tierLabels[requiredTier]}</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {requiredTier === 'pro'
              ? 'Unlock Real-Time Stock Audits, ABCD Tranche Ladder, and all 12 Institutional Strategies.'
              : 'Get Alpha Strategy Overrides, Custom Universe Baskets, and Priority Support.'}
          </p>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/license-desk')}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg inline-flex items-center justify-center gap-2"
          >
            <Crown className="h-4 w-4" />
            Upgrade Now <ArrowRight className="h-3 w-3" />
          </button>
          <Link to="/pricing" className="block text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
            Compare Plans
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TierGate;
