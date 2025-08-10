import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !user.email?.endsWith('@admin.com')) {
    // Redirect to forbidden if admin access is required but user isn't admin
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
