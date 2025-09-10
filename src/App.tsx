/**
 * Main App Component
 *
 * Sets up routing and global providers for the application.
 */

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { RouteErrorBoundary } from './components/ui/ErrorBoundary';
import EnhancedErrorBoundary from './components/ui/EnhancedErrorBoundary';
import { errorService } from './services/errorService';
import { AdminRoute } from './components/auth/AdminRoute';
import MainLayout from './components/layout/MainLayout';
import NetworkStatusIndicator from './components/ui/NetworkStatusIndicator';
import NotificationContainer from './components/gamification/notifications/NotificationContainer';
import GamificationIntegration from './components/gamification/GamificationIntegration';
import { initializeMigrationRegistry } from './services/migration';
import { getSyncFirebaseDb } from './firebase-config';
import { GamificationNotificationProvider } from './contexts/GamificationNotificationContext';
import { initializeFirebase } from './firebase-config';
import ConsistencyCheckerPage from './pages/ConsistencyCheckerPage';
import DevDashboard from './components/development/DevDashboard';
import { logger } from './utils/logging/logger';
import Spinner from './components/ui/Spinner';
import AppPreloader from './components/ui/AppPreloader';
import RoutePreloader from './components/ui/RoutePreloader';
import { LoadingFallback } from './components/fallbacks/FallbackUISystem';

// Import consistency checker for development
import './utils/runComprehensiveCheck';

// Import development tools
import './utils/development/enhancedDevConsole';
import './utils/development/performanceProfiler';

// Lazy-loaded components
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfileComponentsDemo = lazy(() => import('./pages/ProfileComponentsDemo'));
const CollaborationsPage = lazy(() => import('./pages/CollaborationsPage'));
const CreateCollaborationPage = lazy(() => import('./pages/CreateCollaborationPage'));
const CollaborationDetailPage = lazy(() => import('./pages/CollaborationDetailPage'));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'));
const UserDirectoryPage = lazy(() => import('./pages/UserDirectoryPage'));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'));
const ChallengeDetailPage = lazy(() => import('./pages/ChallengeDetailPage'));
const ChallengeCalendarPage = lazy(() => import('./pages/ChallengeCalendarPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(module => ({ default: module.MessagesPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const BannerTestPage = lazy(() => import('./pages/BannerTestPage'));
const MigrationPage = lazy(() => import('./pages/MigrationPage'));
const AsymmetricHomePageLayout = lazy(() => import('./pages/AsymmetricHomePageLayout'));
const TailwindTestPage = lazy(() => import('./pages/TailwindTestPage'));
const CardTestPage = lazy(() => import('./pages/CardTestPage'));
const BentoGridDemoPage = lazy(() => import('./pages/BentoGridDemoPage'));
const FormSystemDemoPage = lazy(() => import('./pages/FormSystemDemoPage'));
const MicroAnimationsDemoPage = lazy(() => import('./pages/MicroAnimationsDemoPage'));
const NavigationSystemDemoPage = lazy(() => import('./pages/NavigationSystemDemoPage'));
const DesignSystemOverviewPage = lazy(() => import('./pages/DesignSystemOverviewPage'));
const AsymmetricLayoutTestPage = lazy(() => import('./pages/AsymmetricLayoutTestPage'));
const HelpReputation = lazy(() => import('./pages/HelpReputation'));
const SimpleAsymmetricTest = lazy(() => import('./pages/SimpleAsymmetricTest'));

// Import test components
import ThemeTest from './components/ThemeTest';
import SimpleTailwindTest from './components/SimpleTailwindTest';
import ComprehensiveThemeTest from './components/ComprehensiveThemeTest';

// Import pages that we've created
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
import { TradesPage } from './pages/TradesPage';
import { TradeDetailPage } from './pages/TradeDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import LoginPage from './components/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { SignUpPage } from './pages/SignUpPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { NotificationsPage } from './pages/NotificationsPage';

// Import Evidence Test Page
import EvidenceTestPage from './pages/EvidenceTestPage';
// Import Component Status Checker
import ComponentStatusChecker from './components/ui/ComponentStatusChecker';
// Production build - test pages removed

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Initialize Firebase before the app renders
const firebaseInitializationPromise = initializeFirebase();
const db = getSyncFirebaseDb();

function App() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Initialize error service with user context when available
    errorService.setUserContext({
      userId: 'anonymous', // Will be updated when user logs in
    });

    firebaseInitializationPromise.then(() => {
      initializeMigrationRegistry(db, true);
      setFirebaseInitialized(true);
      logger.info("Firebase has been initialized successfully", 'FIREBASE');
    }).catch(error => {
      logger.error("Firebase initialization failed", 'FIREBASE', undefined, error);
      // Handle Firebase initialization error through error service
      errorService.handleError(error, {
        component: 'App',
        action: 'firebase_initialization',
      });
    });
  }, []);

  const isBootstrapping = !firebaseInitialized || authLoading;

  if (isBootstrapping) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-purple-900">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="text-white text-lg mt-4">Preparing TradeYa…</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedErrorBoundary>
      <NotificationsProvider>
        <GamificationNotificationProvider>
      <MainLayout containerized={false}>
        {/* Preload critical application resources */}
        <AppPreloader />

        {/* Preload route-specific resources */}
        <RoutePreloader />

        <Suspense fallback={<LoadingFallback size="md" message="Loading…" />}>
          <Routes>
            <Route path="/" element={<RouteErrorBoundary><HomePage /></RouteErrorBoundary>} />
            <Route path="/trades" element={<RouteErrorBoundary><TradesPage /></RouteErrorBoundary>} />
        <Route path="/trades/:tradeId" element={<RouteErrorBoundary><TradeDetailPage /></RouteErrorBoundary>} />
        <Route path="/projects" element={<RouteErrorBoundary><CollaborationsPage /></RouteErrorBoundary>} />
        <Route path="/collaborations" element={<RouteErrorBoundary><CollaborationsPage /></RouteErrorBoundary>} />
        <Route path="/collaborations/new" element={<RouteErrorBoundary><CreateCollaborationPage /></RouteErrorBoundary>} />
        <Route path="/collaborations/:id" element={<RouteErrorBoundary><CollaborationDetailPage /></RouteErrorBoundary>} />
        <Route path="/connections" element={<RouteErrorBoundary><ConnectionsPage /></RouteErrorBoundary>} />
        <Route path="/directory" element={<RouteErrorBoundary><UserDirectoryPage /></RouteErrorBoundary>} />
        <Route path="/users" element={<Navigate to="/directory" replace />} />
        <Route path="/docs/profile-reputation" element={<RouteErrorBoundary><HelpReputation /></RouteErrorBoundary>} />
        <Route path="/challenges" element={<RouteErrorBoundary><ChallengesPage /></RouteErrorBoundary>} />
        <Route path="/challenges/calendar" element={<RouteErrorBoundary><ChallengeCalendarPage /></RouteErrorBoundary>} />
        <Route path="/challenges/:challengeId" element={<RouteErrorBoundary><ChallengeDetailPage /></RouteErrorBoundary>} />
        <Route path="/leaderboard" element={<RouteErrorBoundary><LeaderboardPage /></RouteErrorBoundary>} />
        <Route path="/portfolio" element={<RouteErrorBoundary><PortfolioPage /></RouteErrorBoundary>} />
        <Route path="/login" element={<RouteErrorBoundary><LoginPage /></RouteErrorBoundary>} />
        <Route path="/signup" element={<RouteErrorBoundary><SignUpPage /></RouteErrorBoundary>} />
        <Route path="/profile-components" element={<RouteErrorBoundary><ProfileComponentsDemo /></RouteErrorBoundary>} />
        <Route path="/asymmetric" element={<RouteErrorBoundary><AsymmetricHomePageLayout /></RouteErrorBoundary>} />
        <Route path="/bentogrid-demo" element={<RouteErrorBoundary><BentoGridDemoPage /></RouteErrorBoundary>} />
        <Route path="/form-system-demo" element={<RouteErrorBoundary><FormSystemDemoPage /></RouteErrorBoundary>} />
        <Route path="/micro-animations-demo" element={<RouteErrorBoundary><MicroAnimationsDemoPage /></RouteErrorBoundary>} />
        <Route path="/navigation-demo" element={<RouteErrorBoundary><NavigationSystemDemoPage /></RouteErrorBoundary>} />
        <Route path="/design-system-overview" element={<RouteErrorBoundary><DesignSystemOverviewPage /></RouteErrorBoundary>} />
        <Route path="/asymmetric-layout-test" element={<RouteErrorBoundary><AsymmetricLayoutTestPage /></RouteErrorBoundary>} />
        <Route path="/simple-asymmetric-test" element={<RouteErrorBoundary><SimpleAsymmetricTest /></RouteErrorBoundary>} />
        <Route path="/tailwind-debug" element={<RouteErrorBoundary><TailwindTestPage /></RouteErrorBoundary>} />
        <Route path="/card-test" element={<RouteErrorBoundary><CardTestPage /></RouteErrorBoundary>} />
        <Route path="/theme-test" element={<RouteErrorBoundary><ThemeTest /></RouteErrorBoundary>} />
        <Route path="/tailwind-test" element={<RouteErrorBoundary><SimpleTailwindTest /></RouteErrorBoundary>} />
        <Route path="/comprehensive-theme-test" element={<RouteErrorBoundary><ComprehensiveThemeTest /></RouteErrorBoundary>} />
        <Route path="/admin" element={<RouteErrorBoundary><AdminRoute><AdminDashboard /></AdminRoute></RouteErrorBoundary>} />
        <Route path="/reset-password" element={<RouteErrorBoundary><PasswordResetPage /></RouteErrorBoundary>} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <RouteErrorBoundary>
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />
        <Route
          path="/profile"
          element={
            <RouteErrorBoundary>
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            </RouteErrorBoundary>
          }
        />

        <Route path="/profile/:userId" element={<RouteErrorBoundary><ProfilePage /></RouteErrorBoundary>} />

        <Route path="/messages" element={<RouteErrorBoundary><MessagesPage /></RouteErrorBoundary>} />
        <Route path="/messages/:conversationId" element={<RouteErrorBoundary><MessagesPage /></RouteErrorBoundary>} />

        <Route path="/notifications" element={<RouteErrorBoundary><NotificationsPage /></RouteErrorBoundary>} />
        <Route path="/leaderboard" element={<RouteErrorBoundary><LeaderboardPage /></RouteErrorBoundary>} />

        {/* Test routes */}
        <Route path="/banner-test" element={<RouteErrorBoundary><BannerTestPage /></RouteErrorBoundary>} />
        <Route path="/evidence-demo" element={<RouteErrorBoundary><EvidenceTestPage /></RouteErrorBoundary>} />
        <Route path="/component-status" element={<RouteErrorBoundary><div className="max-w-4xl mx-auto p-6"><ComponentStatusChecker /></div></RouteErrorBoundary>} />
        {process.env.NODE_ENV === 'development' && (
          <Route path="/consistency-checker" element={<RouteErrorBoundary><ConsistencyCheckerPage /></RouteErrorBoundary>} />
        )}

        {/* Admin routes */}
        <Route path="/admin/migrations" element={<RouteErrorBoundary><AdminRoute><MigrationPage /></AdminRoute></RouteErrorBoundary>} />

        {/* 404 route */}
        <Route
          path="*"
          element={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
              <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
              <p className="text-xl text-muted-foreground mb-8">Page not found</p>
              <Link
                to="/"
                className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200"
              >
                Go Home
              </Link>
            </div>
          }
        />
      </Routes>
        </Suspense>

        {/* Network status indicator */}
        <NetworkStatusIndicator />

        {/* Gamification integration and notifications */}
        <GamificationIntegration />
        <NotificationContainer />

        {/* Development Dashboard - only in development */}
        <DevDashboard />
      </MainLayout>
      </GamificationNotificationProvider>
    </NotificationsProvider>
    </EnhancedErrorBoundary>
  );
}

export default App;
