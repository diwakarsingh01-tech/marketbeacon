import { useState } from 'react';
import { getApiUrl } from '../lib/api-utils';
import { useAuth } from '../context/AuthContext';

const API_URL = getApiUrl();

export function useVoucherRedeem() {
  const { token, user } = useAuth();
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const redeem = async () => {
    if (!code.trim()) return;
    setError(null);
    setSuccess(false);
    if (!token || !user) { setError('Please log in first to redeem a voucher code.'); return; }
    setRedeeming(true);
    try {
      const res = await fetch(`${API_URL}/api/user/redeem-voucher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const result = await res.json();
      if (res.ok) { setSuccess(true); } else { setError(result.error || 'Invalid voucher code.'); }
    } catch { setError('Network error. Please try again.'); }
    finally { setRedeeming(false); }
  };

  return { code, setCode, redeeming, error, setError, success, redeem };
}
