import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Loader } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-full animate-spin opacity-75 blur-lg"></div>
          <div className="relative bg-cyber-gray-900 p-8 rounded-lg border border-cyber-gray-800">
            <Loader className="h-8 w-8 text-neon-blue animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-cyber-gray-400 animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-lg"></div>
          <div className="relative bg-cyber-gray-900 p-8 rounded-lg border border-red-500/50 max-w-md">
            <div className="flex items-center gap-4 mb-4">
              <Shield className="h-8 w-8 text-red-500" />
              <h2 className="text-xl font-display font-bold text-red-500">Access Denied</h2>
            </div>
            <p className="text-cyber-gray-300 mb-6">
              This area requires authentication. Please log in to continue.
            </p>
            <Navigate to="/login" replace />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
