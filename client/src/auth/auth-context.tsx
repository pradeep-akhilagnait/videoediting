import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setAccessToken, setUnauthorizedHandler } from '@/lib/api';

export type AuthUser = { publicId: string; role: string };

export type AuthState = {
  user: AuthUser | null;
  companyName: string | null;
  permissions: Set<string>;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
};

export const AuthContext = createContext<AuthState | null>(null);

type LoginResponse = { accessToken: string };
type MeResponse = { user: AuthUser; company: { name: string }; permissions: string[] };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<AuthState['status']>('loading');

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setCompanyName(null);
    setPermissions(new Set());
    setStatus('anonymous');
  }, []);

  const loadMe = useCallback(async () => {
    const me = await api<MeResponse>('/auth/me');
    setUser(me.user);
    setCompanyName(me.company.name);
    setPermissions(new Set(me.permissions));
    setStatus('authenticated');
  }, []);

  // On first load, try to restore a session using the refresh cookie.
  useEffect(() => {
    setUnauthorizedHandler(clear);
    (async () => {
      try {
        await loadMe();
      } catch {
        clear();
      }
    })();
  }, [clear, loadMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } });
      setAccessToken(res.accessToken);
      await loadMe();
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      clear();
    }
  }, [clear]);

  const can = useCallback((permission: string) => permissions.has(permission), [permissions]);

  const value = useMemo<AuthState>(
    () => ({ user, companyName, permissions, status, login, logout, can }),
    [user, companyName, permissions, status, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
