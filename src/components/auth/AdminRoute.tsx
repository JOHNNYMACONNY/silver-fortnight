import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Spinner from '../ui/Spinner';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/not-found" replace />;
  }

  return <>{children}</>;
};