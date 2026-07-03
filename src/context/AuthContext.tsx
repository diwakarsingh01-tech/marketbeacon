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
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mb_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mb_user');
    fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      const data = await safeJsonParse(response);
      if (response.ok && !data.error) {
        const verifiedUser = data.user || data;
        setUser(verifiedUser);
        localStorage.setItem('mb_user', JSON.stringify(verifiedUser));
      } else {
        logout();
      }
    } catch (e) {
      console.error('Auth refresh failed:', e);
    } finally {
      setLoading(false);
    }
  }, [logout]);

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

    const { token: t, user: userData } = data;
    setUser(userData);
    setToken(t);
    localStorage.setItem('mb_user', JSON.stringify(userData));
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

    const { token: t, user: userData } = data;
    setUser(userData);
    setToken(t);
    localStorage.setItem('mb_user', JSON.stringify(userData));
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
    
    const { token: t, user: userData } = data;
    setUser(userData);
    setToken(t);
    localStorage.setItem('mb_user', JSON.stringify(userData));
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

    const { token: t, user: userData } = data;
    setUser(userData);
    setToken(t);
    localStorage.setItem('mb_user', JSON.stringify(userData));
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