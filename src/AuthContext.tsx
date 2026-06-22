import React, { createContext, useContext, useEffect, useState } from 'react';

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
  user: { uid: string; email: string; displayName: string; photoURL: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo login stored in sessionStorage (survives reload)
    const demoData = sessionStorage.getItem('__demoLogin');
    if (demoData) {
      try {
        const { user: demoUser, profile: demoProfile } = JSON.parse(demoData);
        setUser(demoUser);
        setProfile(demoProfile);
        setLoading(false);
        return;
      } catch {}
    }

    // No auth — show login screen
    setLoading(false);
  }, []);

  // Expose demo login: persist to sessionStorage then reload
  useEffect(() => {
    (window as any).__demoLogin = (data: any) => {
      sessionStorage.setItem('__demoLogin', JSON.stringify(data));
      location.reload();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
