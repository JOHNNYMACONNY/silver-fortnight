import React, { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
import SettingsPage from '../pages/SettingsPage';
import SecureLoginPage from '../components/auth/SecureLoginPage';
import { createSecureRoute } from '../auth/secureRoutes';
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
  { path: '/login', element: <SecureLoginPage /> },
  createSecureRoute({ path: '/dashboard', Component: DashboardPage, requireAuth: true, validateSession: true }),
  createSecureRoute({ path: '/profile', Component: ProfilePage, requireAuth: true, validateSession: true }),
  createSecureRoute({ path: '/settings', Component: SettingsPage, requireAuth: true, validateSession: true }),
  createSecureRoute({ path: '/admin', Component: AdminPage, requireAuth: true, validateSession: true }),
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> }
];

export default secureRoutes;
