/**
 * ============================================================================
 * NotificationErrorBoundary - Error Boundary for Notification System
 * ============================================================================
 *
 * A React error boundary that catches errors in notification components
 * and prevents them from crashing the entire application.
 *
 * Features:
 * - Graceful error handling
 * - Fallback UI (shows alert icon)
 * - Error logging to console
 * - Optional Sentry integration
 * - Prevents white screen of death
 *
 * Usage:
 *   <NotificationErrorBoundary>
 *     <NotificationBell userId={user.id} />
 *   </NotificationErrorBoundary>
 *
 * @version 1.0.0
 * @date 2025-10-07
 */

import React from "react";
import { AlertCircle } from "lucide-react";

class NotificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error("🔴 [Notification Error Boundary]:", error);
    console.error("📋 Error Info:", errorInfo);

    // Store error info in state for debugging
    this.setState({
      error,
      errorInfo,
    });

    // Log to monitoring service (Sentry, LogRocket, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: "NotificationSystem",
          boundary: "NotificationErrorBoundary",
        },
        extra: {
          errorInfo,
          componentStack: errorInfo.componentStack,
        },
      });
    }

    // Optional: Log to custom analytics
    if (window.analytics) {
      window.analytics.track("NotificationError", {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI - show alert icon instead of bell
      return (
        <button
          onClick={this.handleReset}
          style={{
            position: "relative",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            transition: "background-color 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          title="Notifications temporarily unavailable. Click to retry."
          aria-label="Notification system error. Click to retry."
        >
          <AlertCircle
            size={20}
            color="#ef4444"
            strokeWidth={2}
            style={{
              animation: "pulse 2s infinite",
            }}
          />
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}</style>
        </button>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

export default NotificationErrorBoundary;
