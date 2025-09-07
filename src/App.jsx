import React from "react";
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
import { GlobalSpinner } from "./components/common/GlobalSpinner";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import {
  ToastProvider,
  ErrorBoundary,
  PageErrorBoundary,
} from "./components/ui";

// Import pages (we'll create these in Phase 2)
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import POSPage from "./pages/POSPage";
import InventoryPage from "./pages/InventoryPage";
import ManagementPage from "./pages/ManagementPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

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
        path="/management"
        element={
          <PageErrorBoundary title="Management Error">
            <ProtectedRoute requiredRole="admin">
              <ManagementPage />
            </ProtectedRoute>
          </PageErrorBoundary>
        }
      />

      <Route
        path="/analytics"
        element={
          <PageErrorBoundary title="Analytics Error">
            <ProtectedRoute requiredRole={["admin", "manager"]}>
              <AnalyticsPage />
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
