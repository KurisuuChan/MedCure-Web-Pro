// Enhanced Toast System with Actions and Rich Content
import { createContext, useContext, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Clock,
  Zap,
} from "lucide-react";

const EnhancedToastContext = createContext();

export function useEnhancedToast() {
  const context = useContext(EnhancedToastContext);
  if (!context) {
    throw new Error(
      "useEnhancedToast must be used within an EnhancedToastProvider"
    );
  }
  return context;
}

export function EnhancedToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", options = {}) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const toast = {
      id,
      message,
      type,
      title: options.title,
      description: options.description,
      duration: options.duration || (type === "error" ? 8000 : 5000),
      persistent: options.persistent || false,
      actions: options.actions || [],
      data: options.data,
      dismissible: options.dismissible !== false,
      icon: options.icon,
      progress: options.showProgress,
      timestamp: new Date(),
      position: options.position || "top-right",
    };

    setToasts((prev) => {
      // Limit to maximum 5 toasts to prevent UI overflow
      const filtered = prev.slice(-4);
      return [...filtered, toast];
    });

    // Auto-remove after duration (unless persistent)
    if (!toast.persistent) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast))
    );
  }, []);

  // Specialized toast methods
  const success = useCallback(
    (message, options = {}) => {
      return showToast(message, "success", {
        icon: CheckCircle,
        ...options,
      });
    },
    [showToast]
  );

  const error = useCallback(
    (message, options = {}) => {
      return showToast(message, "error", {
        icon: XCircle,
        persistent: true, // Errors should be persistent by default
        ...options,
      });
    },
    [showToast]
  );

  const warning = useCallback(
    (message, options = {}) => {
      return showToast(message, "warning", {
        icon: AlertTriangle,
        ...options,
      });
    },
    [showToast]
  );

  const info = useCallback(
    (message, options = {}) => {
      return showToast(message, "info", {
        icon: Info,
        ...options,
      });
    },
    [showToast]
  );

  // Action-based toasts
  const actionToast = useCallback(
    (message, actions, options = {}) => {
      return showToast(message, options.type || "info", {
        ...options,
        actions,
        persistent: true, // Action toasts should stay until user acts
      });
    },
    [showToast]
  );

  // Progress toast for operations
  const progressToast = useCallback(
    (message, options = {}) => {
      return showToast(message, "info", {
        ...options,
        showProgress: true,
        persistent: true,
        dismissible: false,
      });
    },
    [showToast]
  );

  // Promise-based toast for async operations
  const promiseToast = useCallback(
    async (promise, messages, options = {}) => {
      const toastId = progressToast(
        messages.loading || "Processing...",
        options
      );

      try {
        const result = await promise;
        updateToast(toastId, {
          message: messages.success || "Operation completed successfully",
          type: "success",
          showProgress: false,
          persistent: false,
          dismissible: true,
        });

        // Auto-remove success toast
        setTimeout(() => removeToast(toastId), 3000);

        return result;
      } catch (error) {
        updateToast(toastId, {
          message: messages.error || `Operation failed: ${error.message}`,
          type: "error",
          showProgress: false,
          persistent: true,
          dismissible: true,
          actions: [
            {
              label: "Retry",
              onClick: () => {
                removeToast(toastId);
                promiseToast(promise, messages, options);
              },
            },
          ],
        });
        throw error;
      }
    },
    [progressToast, updateToast, removeToast]
  );

  const value = {
    toasts,
    showToast,
    removeToast,
    updateToast,
    success,
    error,
    warning,
    info,
    actionToast,
    progressToast,
    promiseToast,
  };

  return (
    <EnhancedToastContext.Provider value={value}>
      {children}
      <EnhancedToastContainer toasts={toasts} onRemove={removeToast} />
    </EnhancedToastContext.Provider>
  );
}

// Enhanced Toast Container with positioning
function EnhancedToastContainer({ toasts, onRemove }) {
  const positions = {
    "top-right": "fixed top-4 right-4 z-50 space-y-2",
    "top-left": "fixed top-4 left-4 z-50 space-y-2",
    "bottom-right": "fixed bottom-4 right-4 z-50 space-y-2",
    "bottom-left": "fixed bottom-4 left-4 z-50 space-y-2",
    "top-center":
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2",
    "bottom-center":
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2",
  };

  // Group toasts by position
  const groupedToasts = toasts.reduce((acc, toast) => {
    const position = toast.position || "top-right";
    if (!acc[position]) acc[position] = [];
    acc[position].push(toast);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className={positions[position]}>
          {positionToasts.map((toast) => (
            <EnhancedToast key={toast.id} toast={toast} onRemove={onRemove} />
          ))}
        </div>
      ))}
    </>
  );
}

// Enhanced Toast Component with rich features
function EnhancedToast({ toast, onRemove }) {
  const {
    id,
    message,
    type,
    title,
    description,
    actions,
    dismissible,
    icon,
    progress,
    timestamp,
  } = toast;

  const typeConfig = {
    success: {
      className: "bg-green-50 border-green-200 text-green-800",
      iconColor: "text-green-600",
      progressColor: "bg-green-500",
    },
    error: {
      className: "bg-red-50 border-red-200 text-red-800",
      iconColor: "text-red-600",
      progressColor: "bg-red-500",
    },
    warning: {
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      iconColor: "text-yellow-600",
      progressColor: "bg-yellow-500",
    },
    info: {
      className: "bg-blue-50 border-blue-200 text-blue-800",
      iconColor: "text-blue-600",
      progressColor: "bg-blue-500",
    },
  };

  const config = typeConfig[type];
  const Icon = icon || typeConfig[type].icon || Info;

  return (
    <div
      className={`
      relative flex items-start space-x-3 p-4 rounded-lg border shadow-lg
      transform transition-all duration-300 ease-in-out
      min-w-[320px] max-w-md backdrop-blur-sm
      ${config.className}
    `}
    >
      {/* Progress bar */}
      {progress && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div className={`h-full ${config.progressColor} animate-pulse`} />
        </div>
      )}

      {/* Icon */}
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <h4 className="text-sm font-semibold mb-1">{title}</h4>}

        <p className="text-sm font-medium">{message}</p>

        {description && (
          <p className="text-xs mt-1 opacity-75">{description}</p>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex space-x-2 mt-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  if (action.dismissOnClick !== false) {
                    onRemove(id);
                  }
                }}
                className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                  action.variant === "primary"
                    ? "bg-white bg-opacity-20 hover:bg-opacity-30"
                    : "underline hover:no-underline"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp for error/warning toasts */}
        {(type === "error" || type === "warning") && (
          <div className="flex items-center mt-2 text-xs opacity-60">
            <Clock className="h-3 w-3 mr-1" />
            {timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={() => onRemove(id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default EnhancedToast;
