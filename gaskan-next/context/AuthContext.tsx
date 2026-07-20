'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (newToken: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      let res;
      try {
        res = await api.get('/auth/me');
      } catch (err1) {
        res = await api.get('/user').catch(() => api.get('/api/auth/me'));
      }

      if (res?.data) {
        const u = res.data.user || res.data.data || res.data;
        if (u) {
          const updatedUser: User = {
            id: u.id || u.nis || '1',
            name: u.nama || u.name || 'Pengguna',
            email: u.email || '',
            role: u.role || 'siswa',
            avatar: u.url_picture || u.avatar,
          };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
      }
    } catch (e) {
      // Keep existing stored user on minor API error
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken) {
          setToken(storedToken);
          if (typeof document !== 'undefined' && !document.cookie.includes('auth_token=')) {
            document.cookie = `auth_token=${storedToken}; path=/; max-age=86400; SameSite=Lax`;
          }

          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          // Fetch fresh user data from API in background
          await refreshUser();
        } else {
          if (typeof document !== 'undefined') {
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    if (typeof document !== 'undefined') {
      document.cookie = `auth_token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => api.post('/api/auth/logout')).catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    if (typeof document !== 'undefined') {
      document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
