import { useContext } from 'react';
import { AuthContext, type AuthState } from './auth-context';

/** Access the auth state. Throws if used outside <AuthProvider>. */
export const useAuth = (): AuthState => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
};
