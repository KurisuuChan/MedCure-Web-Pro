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
import { useAuth } from "./hooks/useAuth";
import notificationSystem from "./services/NotificationSystem";
import { NotificationMigration } from "./services/NotificationMigration";
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
const ManagementPage = React.lazy(() => import("./pages/ManagementPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 2;
      },
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
          console.log('✅ Customer data persistence initialized successfully');
        } else {
          console.warn('⚠️ Customer data persistence may not be working properly');
        }
      } catch (error) {
        console.error('❌ Failed to initialize customer persistence:', error);
      }
    };

    initializeCustomerPersistence();
  }, []);

  // Initialize notifications when user logs in
  useEffect(() => {
    const initializeNotifications = async () => {
      if (user) {
        try {
          // Migrate from legacy system
          await NotificationMigration.migrateFromLegacy();
          
          // Initialize new notification system
          await notificationSystem.initialize();
          
          // Create legacy wrapper for backward compatibility
          NotificationMigration.createLegacyWrapper();
          
          // Make notification system available for debugging
          if (import.meta.env.DEV) {
            window.notificationSystem = notificationSystem;
          }
          
          console.log('✅ Notification system initialized');
        } catch (error) {
          console.error('❌ Failed to initialize notifications:', error);
        }
      } else {
        // Clean up when user logs out
        notificationSystem.destroy();
      }
    };

    initializeNotifications();
  }, [user]);

  // Cleanup notifications when app unmounts
  useEffect(() => {
    return () => {
      // Legacy cleanup is now handled by the migration system
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
        path="/management"
        element={
          <PageErrorBoundary title="Management Error">
            <ProtectedRoute requiredRole="admin">
              <ManagementPage />
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
              <SettingsPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
        <AuthProvider>
          <ToastProvider>
            <Router>
              <div className="App">
                <AppContent />
              </div>
            </Router>
          </ToastProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;