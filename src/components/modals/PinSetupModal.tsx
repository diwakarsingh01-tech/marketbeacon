import React, { useState, useRef } from 'react';
import { Lock, X } from 'lucide-react';
import { authFetch } from '../../lib/authFetch';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  email?: string;
}

const PinSetupModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, email }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'set' | 'confirm'>('set');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = (idx: number) => {
    if (inputRefs.current[idx]) inputRefs.current[idx]?.focus();
  };

  const handleDigitInput = (idx: number, value: string, state: string[], setState: any) => {
    if (value && !/^\d$/.test(value)) return;
    const newPin = [...state];
    newPin[idx] = value;
    setState(newPin);
    if (value && idx < 3) focusInput(idx + 1);
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent, state: string[], setState: any) => {
    if (e.key === 'Backspace' && !state[idx] && idx > 0) {
      const newPin = [...state];
      newPin[idx - 1] = '';
      setState(newPin);
      focusInput(idx - 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (step === 'set') {
      const pinStr = pin.join('');
      if (pinStr.length !== 4) { setError('Enter 4 digits'); return; }
      setStep('confirm');
      setTimeout(() => focusInput(0), 100);
      return;
    }
    const pinStr = pin.join('');
    const confirmStr = confirmPin.join('');
    if (pinStr !== confirmStr) { setError('PINs do not match'); return; }
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinStr })
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        if (email) localStorage.setItem('mb_pin_email', email);
        localStorage.setItem('mb_has_pin', 'true');
        onSuccess();
      } else {
        setError(data.error || 'Failed to set PIN');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderInputs = (state: string[], setState: any, disabled: boolean) => (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="tel"
          maxLength={1}
          value={state[i]}
          disabled={disabled}
          onChange={(e) => handleDigitInput(i, e.target.value, state, setState)}
          onKeyDown={(e) => handleKeyDown(i, e, state, setState)}
          className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-[var(--bg-primary)] text-[var(--text-primary)] focus:border-blue-500 outline-none transition-all"
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Lock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Set PIN Code</h2>
              <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
                {step === 'set' ? 'Create 4-digit PIN' : 'Confirm your PIN'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'set' ? renderInputs(pin, setPin, loading) : renderInputs(confirmPin, setConfirmPin, loading)}

        {error && (
          <p className="text-xs font-bold text-rose-500 text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg"
        >
          {loading ? 'Setting...' : step === 'set' ? 'Continue' : 'Confirm PIN'}
        </button>

        <p className="text-[10px] text-[var(--text-tertiary)] text-center font-medium">
          Use this PIN to quickly access your account instead of logging in each time
        </p>
      </div>
    </div>
  );
};

export default PinSetupModal;
