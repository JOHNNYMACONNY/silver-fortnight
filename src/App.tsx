/**
 * Main App Component
 *
 * Sets up routing and global providers for the application.
 */

import React, { Suspense, lazy, useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ToastProvider } from "./contexts/ToastContext";
import { RouteErrorBoundary } from "./components/ui/ErrorBoundary";
import EnhancedErrorBoundary from "./components/ui/EnhancedErrorBoundary";
import { errorService } from "./services/errorService";
import { AdminRoute } from "./components/auth/AdminRoute";
import MainLayout from "./components/layout/MainLayout";
import NetworkStatusIndicator from "./components/ui/NetworkStatusIndicator";
import NotificationContainer from "./components/gamification/notifications/NotificationContainer";
import GamificationIntegration from "./components/gamification/GamificationIntegration";
import { initializeMigrationRegistry } from "./services/migration";
import { getFirebaseInstances, initializeFirebase } from "./firebase-config";
import { GamificationNotificationProvider } from "./contexts/GamificationNotificationContext";
import ConsistencyCheckerPage from "./pages/ConsistencyCheckerPage";
import DevDashboard from "./components/development/DevDashboard";
import { StyleGuide } from "./components/ui/StyleGuide";
import { logger } from "./utils/logging/logger";
import Spinner from "./components/ui/Spinner";
import AppPreloader from "./components/ui/AppPreloader";
import RoutePreloader from "./components/ui/RoutePreloader";
import { LoadingFallback } from "./components/fallbacks/FallbackUISystem";

// Import consistency checker for development
import "./utils/runComprehensiveCheck";

// Import development tools
import "./utils/development/enhancedDevConsole";
import "./utils/development/performanceProfiler";

// Lazy-loaded components
const HomePage = lazy(() => import("./pages/HomePage"));
const ProfileComponentsDemo = lazy(
  () => import("./pages/ProfileComponentsDemo")
);
const CollaborationsPage = lazy(() => import("./pages/CollaborationsPage"));
const CreateCollaborationPage = lazy(
  () => import("./pages/CreateCollaborationPage")
);
const CollaborationDetailPage = lazy(
  () => import("./pages/CollaborationDetailPage")
);
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const UserDirectoryPage = lazy(() => import("./pages/UserDirectoryPage"));
const ChallengesPage = lazy(() => import("./pages/ChallengesPage"));
const CreateChallengePage = lazy(() => import("./pages/CreateChallengePage"));
const ChallengeDetailPage = lazy(() => import("./pages/ChallengeDetailPage"));
const ChallengeCalendarPage = lazy(
  () => import("./pages/ChallengeCalendarPage")
);
const CreateTradePage = lazy(() => import("./pages/CreateTradePage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const SeedChallengesPage = lazy(
  () => import("./pages/admin/SeedChallengesPage")
);
const MessagesPage = lazy(() =>
  import("./pages/MessagesPage").then((module) => ({
    default: module.MessagesPage,
  }))
);
const CreateTestConversationPage = lazy(() =>
  import("./pages/CreateTestConversationPage").then((module) => ({
    default: module.CreateTestConversationPage,
  }))
);
const DebugMessagesPage = lazy(() =>
  import("./pages/DebugMessagesPage").then((module) => ({
    default: module.DebugMessagesPage,
  }))
);
const SimpleConversationTest = lazy(() =>
  import("./pages/SimpleConversationTest").then((module) => ({
    default: module.SimpleConversationTest,
  }))
);
const TestMessagesPage = lazy(() =>
  import("./pages/TestMessagesPage").then((module) => ({
    default: module.TestMessagesPage,
  }))
);
const TestFirestoreAccess = lazy(() =>
  import("./pages/TestFirestoreAccess").then((module) => ({
    default: module.TestFirestoreAccess,
  }))
);
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const MigrationPage = lazy(() => import("./pages/MigrationPage"));
const AsymmetricHomePageLayout = lazy(
  () => import("./pages/AsymmetricHomePageLayout")
);
const HelpReputation = lazy(() => import("./pages/HelpReputation"));

// Import pages that we've created
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const TradesPage = lazy(() => import("./pages/TradesPage").then(module => ({ default: module.TradesPage })));
const TradeDetailPage = lazy(() => import("./pages/TradeDetailPage").then(module => ({ default: module.TradeDetailPage })));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
import LoginPage from "./components/auth/LoginPage";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
import { SignUpPage } from "./pages/SignUpPage";
import { PasswordResetPage } from "./pages/PasswordResetPage";
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then(module => ({ default: module.NotificationsPage })));

// Import Component Status Checker
import ComponentStatusChecker from "./components/ui/ComponentStatusChecker";
// Production build - test pages removed

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    // Save intended destination in location state
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};

// Initialize Firebase before the app renders
const firebaseInitializationPromise = initializeFirebase();

function App() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Hide loading screen when app starts rendering
    const loadingElement = document.getElementById("app-loading");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }

    // Initialize error service with user context when available
    errorService.setUserContext({
      userId: "anonymous", // Will be updated when user logs in
    });

    let isMounted = true;

    firebaseInitializationPromise
      .then(async () => {
        const { db } = await getFirebaseInstances();
        if (!isMounted) return;
        initializeMigrationRegistry(db, true);
        setFirebaseInitialized(true);
        logger.info("Firebase has been initialized successfully", "FIREBASE");
      })
      .catch((error) => {
        logger.error(
          "Firebase initialization failed",
          "FIREBASE",
          undefined,
          error
        );
        // Handle Firebase initialization error through error service
        errorService.handleError(error, {
          component: "App",
          action: "firebase_initialization",
        });
      });

    return () => {
      isMounted = false;
    };
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
      <ToastProvider>
        <NotificationsProvider>
          <GamificationNotificationProvider>
          <MainLayout containerized={false}>
            {/* Preload critical application resources */}
            <AppPreloader />

            {/* Preload route-specific resources */}
            <RoutePreloader />

            <Suspense
              fallback={<LoadingFallback size="md" message="Loading…" />}
            >
              <Routes>
                <Route
                  path="/"
                  element={
                    <RouteErrorBoundary>
                      <HomePage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/trades"
                  element={
                    <RouteErrorBoundary>
                      <TradesPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/trades/new"
                  element={
                    <RouteErrorBoundary>
                      <ProtectedRoute>
                        <CreateTradePage />
                      </ProtectedRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/trades/:tradeId"
                  element={
                    <RouteErrorBoundary>
                      <TradeDetailPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <RouteErrorBoundary>
                      <CollaborationsPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/collaborations"
                  element={
                    <RouteErrorBoundary>
                      <CollaborationsPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/collaborations/new"
                  element={
                    <RouteErrorBoundary>
                      <CreateCollaborationPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/collaborations/:id"
                  element={
                    <RouteErrorBoundary>
                      <CollaborationDetailPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/connections"
                  element={
                    <RouteErrorBoundary>
                      <ConnectionsPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/directory"
                  element={
                    <RouteErrorBoundary>
                      <UserDirectoryPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/users"
                  element={<Navigate to="/directory" replace />}
                />
                <Route
                  path="/docs/profile-reputation"
                  element={
                    <RouteErrorBoundary>
                      <HelpReputation />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/challenges"
                  element={
                    <RouteErrorBoundary>
                      <ChallengesPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/challenges/create"
                  element={
                    <RouteErrorBoundary>
                      <CreateChallengePage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/challenges/calendar"
                  element={
                    <RouteErrorBoundary>
                      <ChallengeCalendarPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/challenges/:challengeId"
                  element={
                    <RouteErrorBoundary>
                      <ChallengeDetailPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <RouteErrorBoundary>
                      <LeaderboardPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <RouteErrorBoundary>
                      <PortfolioPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <RouteErrorBoundary>
                      <LoginPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <RouteErrorBoundary>
                      <SignUpPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/profile-components"
                  element={
                    <RouteErrorBoundary>
                      <ProfileComponentsDemo />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/asymmetric"
                  element={
                    <RouteErrorBoundary>
                      <AsymmetricHomePageLayout />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RouteErrorBoundary>
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/admin/seed-challenges"
                  element={
                    <RouteErrorBoundary>
                      <AdminRoute>
                        <SeedChallengesPage />
                      </AdminRoute>
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <RouteErrorBoundary>
                      <PasswordResetPage />
                    </RouteErrorBoundary>
                  }
                />

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

                <Route
                  path="/profile/:userId"
                  element={
                    <RouteErrorBoundary>
                      <ProfilePage />
                    </RouteErrorBoundary>
                  }
                />

                <Route
                  path="/messages"
                  element={
                    <RouteErrorBoundary>
                      <MessagesPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/messages/:conversationId"
                  element={
                    <RouteErrorBoundary>
                      <MessagesPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/create-test-conversation"
                  element={
                    <RouteErrorBoundary>
                      <CreateTestConversationPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/debug-messages"
                  element={
                    <RouteErrorBoundary>
                      <DebugMessagesPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/simple-conversation-test"
                  element={
                    <RouteErrorBoundary>
                      <SimpleConversationTest />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/test-messages"
                  element={
                    <RouteErrorBoundary>
                      <TestMessagesPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/test-firestore-access"
                  element={
                    <RouteErrorBoundary>
                      <TestFirestoreAccess />
                    </RouteErrorBoundary>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <RouteErrorBoundary>
                      <NotificationsPage />
                    </RouteErrorBoundary>
                  }
                />
                <Route
                  path="/leaderboard"
                  element={
                    <RouteErrorBoundary>
                      <LeaderboardPage />
                    </RouteErrorBoundary>
                  }
                />

                {/* Test routes */}
                <Route
                  path="/component-status"
                  element={
                    <RouteErrorBoundary>
                      <div className="max-w-4xl mx-auto p-6">
                        <ComponentStatusChecker />
                      </div>
                    </RouteErrorBoundary>
                  }
                />
                {process.env.NODE_ENV === "development" && (
                  <>
                    <Route
                      path="/consistency-checker"
                      element={
                        <RouteErrorBoundary>
                          <ConsistencyCheckerPage />
                        </RouteErrorBoundary>
                      }
                    />
                    <Route
                      path="/style-guide"
                      element={
                        <RouteErrorBoundary>
                          <StyleGuide />
                        </RouteErrorBoundary>
                      }
                    />
                  </>
                )}

                {/* Admin routes */}
                <Route
                  path="/admin/migrations"
                  element={
                    <RouteErrorBoundary>
                      <AdminRoute>
                        <MigrationPage />
                      </AdminRoute>
                    </RouteErrorBoundary>
                  }
                />

                {/* 404 route */}
                <Route
                  path="*"
                  element={
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                      <h1 className="text-4xl font-bold text-foreground mb-4">
                        404
                      </h1>
                      <p className="text-xl text-muted-foreground mb-8">
                        Page not found
                      </p>
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
    </ToastProvider>
  </EnhancedErrorBoundary>
  );
}

export default App;
