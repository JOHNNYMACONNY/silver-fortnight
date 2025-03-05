import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface AdminContextValue {
  isAdmin: boolean;
  adminModeEnabled: boolean;
  toggleAdminMode: () => void;
}

const AdminContext = createContext<AdminContextValue>({
  isAdmin: false,
  adminModeEnabled: false,
  toggleAdminMode: () => {},
});

export function useAdmin() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminModeEnabled, setAdminModeEnabled] = useState(() => {
    // Only check localStorage if user is admin
    if (user?.email === 'johnfroberts11@gmail.com') {
      const stored = localStorage.getItem('adminModeEnabled');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  useEffect(() => {
    const isUserAdmin = user?.email === 'johnfroberts11@gmail.com';
    console.log('Admin Context: User auth state changed', {
      userEmail: user?.email,
      isAdmin: isUserAdmin
    });
    setIsAdmin(isUserAdmin);
  }, [user]);

  const toggleAdminMode = () => {
    // Only allow admins to toggle admin mode
    if (user?.email === 'johnfroberts11@gmail.com') {
      setAdminModeEnabled(prev => {
        const newValue = !prev;
        console.log('Admin Context: Admin mode toggled', {
          previous: prev,
          new: newValue,
          userEmail: user?.email
        });
        localStorage.setItem('adminModeEnabled', JSON.stringify(newValue));
        return newValue;
      });
    } else {
      console.log('Admin Context: Unauthorized toggle attempt', {
        userEmail: user?.email
      });
    }
  };

  // Log current state whenever it changes
  useEffect(() => {
    console.log('Admin Context: State updated', {
      isAdmin,
      adminModeEnabled,
      userEmail: user?.email
    });
  }, [isAdmin, adminModeEnabled, user?.email]);

  return (
    <AdminContext.Provider value={{ isAdmin, adminModeEnabled, toggleAdminMode }}>
      {children}
    </AdminContext.Provider>
  );
}
