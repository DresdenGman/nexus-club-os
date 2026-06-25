import React, { createContext, useContext, useEffect, useState } from 'react';
import * as api from './api';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'president' | 'member';
  department?: string;
  joinDate?: string;
  contribution?: number;
  avatar?: string;
}

interface AuthContextType {
  user: { uid: string; email: string; displayName?: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  loginWithEmail: async () => {},
  signupWithEmail: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const init = async () => {
      const token = sessionStorage.getItem('__auth_token');
      if (token) {
        try {
          const data = await api.getSession();
          if (data.user) {
            setUser(data.user);
            setProfile(data.profile);
            setLoading(false);
            return;
          }
        } catch {
          sessionStorage.removeItem('__auth_token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    const data = await api.login(email, password);
    if (data.session?.access_token) {
      sessionStorage.setItem('__auth_token', data.session.access_token);
    }
    setUser(data.user);
    setProfile(data.profile);
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    const data = await api.signup(email, password, name);
    if (data.session?.access_token) {
      sessionStorage.setItem('__auth_token', data.session.access_token);
    }
    setUser(data.user);
    setProfile(data.profile);
  };

  const logout = () => {
    // Call server logout to blacklist token
    const token = sessionStorage.getItem('__auth_token');
    if (token) {
      fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    sessionStorage.removeItem('__auth_token');
    setUser(null);
    setProfile(null);
    location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, signupWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
