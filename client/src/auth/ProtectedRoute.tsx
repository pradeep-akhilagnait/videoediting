import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './use-auth';

/**
 * Gate for routes that need a signed-in user. While the session is being
 * restored it shows nothing; once resolved it either renders the route or
 * redirects to the login page. (The server enforces real access control; this
 * is only for navigation.)
 */
export const ProtectedRoute = () => {
  const { status } = useAuth();

  if (status === 'loading') {
    return <div className="center-screen">Loading…</div>;
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};
