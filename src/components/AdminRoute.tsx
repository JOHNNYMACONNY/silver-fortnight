import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';

export function AdminRoute({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin, adminModeEnabled } = useAdmin();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin || !adminModeEnabled) {
    return <Navigate to="/" />;
  }

  return children ? <>{children}</> : <Outlet />;
}
