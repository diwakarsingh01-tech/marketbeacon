import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { safeJsonParse, getApiUrl } from '../lib/api-utils';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  tier: 'free' | 'pro' | 'alpha';
  daysRemaining: number | null;
  needsOnboarding?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  sendMobileOtp: (mobile: string) => Promise<void>;
  mobileVerify: (mobile: string, otp: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = getApiUrl();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('mb_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_has_pin');
    localStorage.removeItem('mb_pin_email');
    fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.href = '/';
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('mb_token');
      const headers: Record<string, string> = storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {};
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
        headers
      });
      const data = await safeJsonParse(response);
      if (response.ok && !data.error) {
        setUser(data.user || data);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Auth refresh failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, pass: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password: pass })
    });

    const data = await safeJsonParse(response);
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.token) {
      localStorage.setItem('mb_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
  };

  const googleLogin = async (credential: string) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: credential })
    });

    const data = await safeJsonParse(response);
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Google Login failed');
    }

    if (data.token) {
      localStorage.setItem('mb_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
  };

  const sendMobileOtp = async (mobile: string) => {
    const res = await fetch(`${API_URL}/api/auth/mobile-send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mobile })
    });
    const data = await safeJsonParse(res);
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to send OTP');
    }
  };

  const mobileVerify = async (mobile: string, otp: string) => {
    const res = await fetch(`${API_URL}/api/auth/mobile-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mobile, otp })
    });

    const data = await safeJsonParse(res);
    if (!res.ok || data.error) {
      throw new Error(data.error || 'OTP verification failed');
    }

    if (data.token) {
      localStorage.setItem('mb_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
  };

  const register = async (email: string, pass: string, name: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password: pass })
    });

    const data = await safeJsonParse(response);
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Registration failed');
    }

    if (data.token) {
      localStorage.setItem('mb_token', data.token);
      setToken(data.token);
    }
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, googleLogin, sendMobileOtp, mobileVerify, logout, refreshAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};