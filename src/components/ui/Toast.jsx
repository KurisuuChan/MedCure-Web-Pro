import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

// Toast Context
const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", options = {}) => {
    const id = Date.now().toString();
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      action: options.action,
      persistent: options.persistent || false,
    };

    setToasts((prev) => [...prev, toast]);

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

  const success = useCallback(
    (message, options) => {
      return showToast(message, "success", options);
    },
    [showToast]
  );

  const error = useCallback(
    (message, options) => {
      return showToast(message, "error", options);
    },
    [showToast]
  );

  const warning = useCallback(
    (message, options) => {
      return showToast(message, "warning", options);
    },
    [showToast]
  );

  const info = useCallback(
    (message, options) => {
      return showToast(message, "info", options);
    },
    [showToast]
  );

  const value = {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Individual Toast Component
function Toast({ toast, onRemove }) {
  const { id, message, type, action } = toast;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      className: "bg-green-50 border-green-200 text-green-800",
      iconColor: "text-green-600",
    },
    error: {
      icon: XCircle,
      className: "bg-red-50 border-red-200 text-red-800",
      iconColor: "text-red-600",
    },
    warning: {
      icon: AlertCircle,
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      iconColor: "text-yellow-600",
    },
    info: {
      icon: Info,
      className: "bg-blue-50 border-blue-200 text-blue-800",
      iconColor: "text-blue-600",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        flex items-start space-x-3 p-4 rounded-lg border shadow-lg
        transform transition-all duration-300 ease-in-out
        min-w-[320px] max-w-md
        ${config.className}
      `}
    >
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {action && (
          <div className="mt-2">
            <button
              onClick={action.onClick}
              className="text-xs font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Standalone Toast functions for direct use
export const toast = {
  success: (message, options) => {
    // This would need to be connected to a global toast manager
    console.log("Toast Success:", message);
  },
  error: (message, options) => {
    console.log("Toast Error:", message);
  },
  warning: (message, options) => {
    console.log("Toast Warning:", message);
  },
  info: (message, options) => {
    console.log("Toast Info:", message);
  },
};

export default Toast;
