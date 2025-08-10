import React from 'react';
import { RouteObject } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import SecureLoginPage from '../components/auth/SecureLoginPage';
import RequireAuth from '../auth/secureRoutes';
import UnauthorizedPage from '../components/errors/UnauthorizedPage';
import ForbiddenPage from '../components/errors/ForbiddenPage';
import NotFoundPage from '../components/errors/NotFoundPage';
import AdminPage from '../pages/admin/AdminPage';
import UsersPage from '../pages/admin/UsersPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

/**
 * Routes configuration for the secure part of the application
 */
export const secureRoutes: RouteObject[] = [
  {
    path: '/login',
    element: <SecureLoginPage />
  },
  {
    path: '/dashboard',
    element: <RequireAuth><DashboardPage /></RequireAuth>
  },
  {
    path: '/profile',
    element: <RequireAuth><ProfilePage /></RequireAuth>
  },
  {
    path: '/settings',
    element: <RequireAuth><SettingsPage /></RequireAuth>
  },
  {
    path: '/admin',
    element: <RequireAuth requireAdmin><AdminPage /></RequireAuth>,
    children: [
      {
        path: 'users',
        element: <RequireAuth requireAdmin><UsersPage /></RequireAuth>
      },
      {
        path: 'settings',
        element: <RequireAuth requireAdmin><AdminSettingsPage /></RequireAuth>
      }
    ]
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />
  },
  {
    path: '/forbidden',
    element: <ForbiddenPage />
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
];

export default secureRoutes;
