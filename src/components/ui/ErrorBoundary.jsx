import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Button from "./Button";
import { ErrorAlert } from "./Alert";

/**
 * Basic Error Boundary Component
 * Catches JavaScript errors in the component tree and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report error to error reporting service in production
    if (this.props.onError && typeof this.props.onError === "function") {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-6">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {this.props.title || "Something went wrong"}
              </h1>
              <p className="text-gray-600">
                {this.props.message ||
                  "An unexpected error occurred. Please try again."}
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                icon={RefreshCw}
              >
                Try Again
              </Button>

              {this.props.showBackButton !== false && (
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="w-full"
                  icon={ArrowLeft}
                >
                  Go Back
                </Button>
              )}
            </div>

            {/* Development mode error details */}
            {import.meta.env.DEV && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 p-4 bg-gray-100 rounded-md">
                  <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto">
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Page-level Error Boundary
 * Used to wrap individual pages/routes
 */
export const PageErrorBoundary = ({ children, title, message }) => {
  return (
    <ErrorBoundary
      title={title || "Page Error"}
      message={
        message ||
        "This page encountered an error. Please try refreshing or go back."
      }
      fallback={(error, retry) => (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="max-w-md w-full text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {title || "Page Error"}
            </h2>
            <p className="text-gray-600 mb-6">
              {message ||
                "This page encountered an error. Please try refreshing or go back."}
            </p>
            <div className="space-y-3">
              <Button onClick={retry} icon={RefreshCw}>
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Component-level Error Boundary
 * Used to wrap smaller components or features
 */
export const ComponentErrorBoundary = ({ children, name }) => {
  return (
    <ErrorBoundary
      title={`${name} Error`}
      message={`The ${name} component encountered an error.`}
      fallback={(error, retry) => (
        <ErrorAlert
          title={`${name} Error`}
          message={`The ${name} component encountered an error.`}
          action={
            <Button size="sm" onClick={retry} icon={RefreshCw}>
              Retry
            </Button>
          }
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Feature-level Error Boundary
 * Used to wrap major features or sections
 */
export const FeatureErrorBoundary = ({ children, feature }) => {
  return (
    <ErrorBoundary
      title={`${feature} Unavailable`}
      message={`The ${feature} feature is temporarily unavailable. Please try again.`}
      fallback={(error, retry) => (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {feature} Unavailable
              </h3>
              <p className="text-sm text-red-700 mt-1">
                The {feature} feature is temporarily unavailable. Please try
                again.
              </p>
              <div className="mt-4">
                <Button size="sm" onClick={retry} icon={RefreshCw}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary;
