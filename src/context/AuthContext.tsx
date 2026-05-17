import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  tier: 'free' | 'pro' | 'alpha';
  daysRemaining: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem('mb_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const { user: verifiedUser } = await response.json();
        setUser(verifiedUser);
        localStorage.setItem('mb_user', JSON.stringify(verifiedUser));
      } else {
        logout();
      }
    } catch (e) {
      console.error('Auth refresh failed:', e);
      const savedUser = localStorage.getItem('mb_user');
      if (savedUser) setUser(JSON.parse(savedUser));
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
      body: JSON.stringify({ email, password: pass })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const { token, user: userData } = await response.json();
    setUser(userData);
    localStorage.setItem('mb_user', JSON.stringify(userData));
    localStorage.setItem('mb_token', token);
  };

  const googleLogin = async (credential: string) => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: credential })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Google Login failed');
    }

    const { token, user: userData } = await response.json();
    setUser(userData);
    localStorage.setItem('mb_user', JSON.stringify(userData));
    localStorage.setItem('mb_token', token);
  };

  const register = async (email: string, pass: string, name: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const { token, user: userData } = await response.json();
    setUser(userData);
    localStorage.setItem('mb_user', JSON.stringify(userData));
    localStorage.setItem('mb_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mb_user');
    localStorage.removeItem('mb_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout, refreshAuth, loading }}>
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
