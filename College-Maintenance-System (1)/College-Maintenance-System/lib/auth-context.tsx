import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'student' | 'staff' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = '@campusfix_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((data) => {
      if (data) {
        try {
          setUser(JSON.parse(data));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (u: AuthUser) => {
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
