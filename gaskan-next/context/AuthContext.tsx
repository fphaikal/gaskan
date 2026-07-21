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
        res = await api.get('/user', { timeout: 4000 });
      } catch {
        res = await api.get('/auth/me', { timeout: 4000 }).catch(() => null);
      }

      if (res?.data) {
        const u = res.data.user || res.data.data || res.data;
        if (u) {
          const updatedUser: User = {
            ...u,
            id: String(u.id || u.nis || u.NIS || '1'),
            name: u.nama || u.name || u.Nama || 'Pengguna',
            email: u.email || '',
            role: String(u.role || 'siswa').toLowerCase() as any,
            avatar: u.url_picture || u.avatar,
            nis: u.nis || u.NIS || u.nis_siswa || u.studentNis || '',
            kelas: u.kelas?.nama_kelas || u.kelas || u.Kelas || u.className || '',
          };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
      }
    } catch (e) {
      // Keep existing user state
    }
  }, []);

  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken) {
          setToken(storedToken);
          if (typeof document !== 'undefined') {
            const encodedToken = encodeURIComponent(storedToken);
            document.cookie = `auth_token=${encodedToken}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `token=${encodedToken}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `sessionId=${encodedToken}; path=/; max-age=86400; SameSite=Lax`;
          }

          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              // ignore parse error
            }
          }

          // Fetch fresh user data in background without blocking initial UI render
          refreshUser().catch(() => null);
        } else {
          if (typeof document !== 'undefined') {
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'sessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
    const normalizedUser = {
      ...userData,
      role: String(userData.role || 'siswa').toLowerCase() as any,
      nis: userData.nis || userData.NIS || (userData as any).nis_siswa || '',
      kelas: typeof userData.kelas === 'object' ? userData.kelas?.nama_kelas : userData.kelas || (userData as any).Kelas || '',
    };
    setToken(newToken);
    setUser(normalizedUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser));

    if (typeof document !== 'undefined') {
      const encodedToken = encodeURIComponent(newToken);
      document.cookie = `auth_token=${encodedToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `token=${encodedToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `sessionId=${encodedToken}; path=/; max-age=86400; SameSite=Lax`;
    }

    refreshUser().catch(() => null);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sessionId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }

    api.post('/auth/logout').catch(() => null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
