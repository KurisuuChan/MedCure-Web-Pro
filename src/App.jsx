import React, { useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "./providers/AuthProvider";
import { SettingsProvider } from "./contexts/SettingsContext";
import { useAuth } from "./hooks/useAuth";
import { notificationService } from "./services/notifications/NotificationService.js";
import { supabase } from "./config/supabase.js";
import { CustomerService } from "./services/CustomerService";
import { GlobalSpinner } from "./components/common/GlobalSpinner";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import {
  ToastProvider,
  ErrorBoundary,
  PageErrorBoundary,
} from "./components/ui";

// Lazy load pages for better code splitting
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const POSPage = React.lazy(() => import("./pages/POSPage"));
const InventoryPage = React.lazy(() => import("./pages/InventoryPage"));
const SystemSettingsPage = React.lazy(() =>
  import("./pages/SystemSettingsPage")
);
const HeroLanding = React.lazy(() => import("./pages/HeroLanding"));
const LearnMore = React.lazy(() => import("./pages/LearnMore"));
const UnauthorizedPage = React.lazy(() => import("./pages/UnauthorizedPage"));
const UserManagementPage = React.lazy(() =>
  import("./pages/UserManagementPage")
);
const TransactionHistoryPage = React.lazy(() =>
  import("./pages/TransactionHistoryPage")
);
const CustomerInformationPage = React.lazy(() =>
  import("./pages/CustomerInformationPage")
);
const BatchManagementPage = React.lazy(() =>
  import("./pages/BatchManagementPage")
);
const DiscountDebugTest = React.lazy(() =>
  import("./components/debug/DiscountDebugTest")
);

// Create a client with optimized cache settings for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimized stale times for different data types
      staleTime: 1000 * 60 * 10, // Default: 10 minutes (good for most data)
      gcTime: 1000 * 60 * 30, // Cache for 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnMount: false, // Only fetch if data is stale
    },
  },
});

function AppContent() {
  const { isLoadingAuth, user } = useAuth();

  // Initialize customer persistence on app load
  useEffect(() => {
    const initializeCustomerPersistence = async () => {
      try {
        const persistenceStatus = await CustomerService.ensurePersistence();
        if (persistenceStatus) {
          console.log("✅ Customer data persistence initialized successfully");
        } else {
          console.warn(
            "⚠️ Customer data persistence may not be working properly"
          );
        }
      } catch (error) {
        console.error("❌ Failed to initialize customer persistence:", error);
      }
    };

    initializeCustomerPersistence();
  }, []);

  // Initialize notifications when user logs in
  useEffect(() => {
    const initializeNotifications = async () => {
      if (user) {
        try {
          // Initialize database-backed notification service
          await notificationService.initialize();

          // ✅ IMPROVED: Health checks with duplicate prevention
          // Only runs if 15+ minutes have passed (database checks this)
          console.log("🔍 Checking if health checks needed...");
          await notificationService.runHealthChecks();

          // Start health checks every 15 minutes
          const healthCheckInterval = setInterval(() => {
            console.log("⏰ Scheduled health check triggered");
            notificationService.runHealthChecks();
          }, 15 * 60 * 1000); // 15 minutes

          // Make notification service available for debugging
          if (import.meta.env.DEV) {
            window.notificationService = notificationService;

            // ✅ ADD: Debug helper to view last health check time
            window.checkHealthStatus = async () => {
              const { data, error } = await supabase
                .from("notification_health_checks")
                .select("*")
                .eq("check_type", "all")
                .single();

              if (error) {
                console.log(
                  "ℹ️ Health check tracking not set up yet. Run the database script from NOTIFICATION_DUPLICATE_FIX.md"
                );
                return;
              }

              console.log("📊 Last health check:", {
                lastRun: new Date(data.last_run_at).toLocaleString(),
                nextRun: new Date(data.next_run_at).toLocaleString(),
                status: data.status,
                notificationsCreated: data.notifications_created,
              });
            };

            console.log(
              "💡 Debug helpers available: window.notificationService, window.checkHealthStatus()"
            );
          }
          console.log(
            "✅ Notification system initialized with database backend"
          );
          console.log("✅ Health checks scheduled every 15 minutes");

          // Cleanup function
          return () => {
            clearInterval(healthCheckInterval);
          };
        } catch (error) {
          console.error("❌ Failed to initialize notifications:", error);
        }
      }
    };

    const cleanup = initializeNotifications();

    return () => {
      if (cleanup && typeof cleanup.then === "function") {
        cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
      }
    };
  }, [user]);

  // Cleanup notifications when app unmounts
  useEffect(() => {
    return () => {
      // Notification service will be cleaned up when user logs out
    };
  }, []);

  // Show loading spinner while checking authentication
  if (isLoadingAuth) {
    return <GlobalSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PageErrorBoundary title="Login Error">
            {user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          </PageErrorBoundary>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <PageErrorBoundary title="Dashboard Error">
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/pos"
        element={
          <PageErrorBoundary title="POS System Error">
            <ProtectedRoute>
              <POSPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/inventory"
        element={
          <PageErrorBoundary title="Inventory Error">
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/transaction-history"
        element={
          <PageErrorBoundary title="Transaction History Error">
            <ProtectedRoute>
              <TransactionHistoryPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/customers"
        element={
          <PageErrorBoundary title="Customer Information Error">
            <ProtectedRoute>
              <CustomerInformationPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/batch-management"
        element={
          <PageErrorBoundary title="Batch Management Error">
            <ProtectedRoute requiredRole={["admin", "manager", "staff"]}>
              <BatchManagementPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/system-settings"
        element={
          <PageErrorBoundary title="System Settings Error">
            <ProtectedRoute requiredRole="admin">
              <SystemSettingsPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      {/* Advanced Management Routes - Phase 4 Features */}
      <Route
        path="/admin/users"
        element={
          <PageErrorBoundary title="User Management Error">
            <ProtectedRoute requiredRole={["super_admin", "admin"]}>
              <UserManagementPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      {/* Alternative shorter routes */}
      <Route
        path="/user-management"
        element={
          <PageErrorBoundary title="User Management Error">
            <ProtectedRoute requiredRole={["super_admin", "admin"]}>
              <UserManagementPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/settings"
        element={
          <PageErrorBoundary title="Settings Error">
            <ProtectedRoute>
              <SystemSettingsPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      {/* Debug routes for development */}
      <Route
        path="/debug/discount"
        element={
          <PageErrorBoundary title="Discount Debug Error">
            <ProtectedRoute>
              <DiscountDebugTest />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Public home / landing page (placed before login) */}
      <Route
        path="/"
        element={
          <PageErrorBoundary title="Welcome">
            <HeroLanding />
          </PageErrorBoundary>
        }
      />

      <Route
        path="/learn-more"
        element={
          <PageErrorBoundary title="Learn More">
            <LearnMore />
          </PageErrorBoundary>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary
      title="Application Error"
      message="The pharmacy management system encountered an unexpected error. Please refresh the page or contact support if the problem persists."
      onError={(error, errorInfo) => {
        // Log error to error reporting service in production
        console.error("Global application error:", error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Router>
          <SettingsProvider>
            <AuthProvider>
              <ToastProvider>
                <div className="App">
                  <AppContent />
                </div>
              </ToastProvider>
            </AuthProvider>
          </SettingsProvider>
        </Router>
        {/* Only load React Query Devtools in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
