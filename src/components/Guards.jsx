import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AppShell } from './AppShell.jsx';

/* Redirects anonymous visitors to /login, keeping the intended destination. */
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="spinner" role="status" aria-label="Loading" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  return <AppShell>{children}</AppShell>;
}

/* Blocks the wrong role. <RequireRole role="tutor"> sends students to /dashboard. */
export function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="spinner" role="status" aria-label="Loading" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'tutor' ? '/teach' : '/dashboard'} replace />;
  }

  return <AppShell>{children}</AppShell>;
}

/* Staff-only pages. Admins keep a user role, so this checks the flag. */
export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="spinner" role="status" aria-label="Loading" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (!user.is_admin) return <Navigate to={user.role === 'tutor' ? '/teach' : '/dashboard'} replace />;

  return <AppShell>{children}</AppShell>;
}

/* Keeps signed-in users out of /login and /signup. */
export function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" role="status" aria-label="Loading" />;
  if (user) return <Navigate to={user.role === 'tutor' ? '/teach' : '/dashboard'} replace />;
  return children;
}
