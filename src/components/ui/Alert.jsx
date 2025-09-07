import React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export default function Alert({
  children,
  type = "info",
  title,
  closable = false,
  onClose,
  className = "",
  size = "md",
}) {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      className: "bg-green-50 border-green-200 text-green-800",
      iconColor: "text-green-600",
      titleColor: "text-green-800",
    },
    error: {
      icon: XCircle,
      className: "bg-red-50 border-red-200 text-red-800",
      iconColor: "text-red-600",
      titleColor: "text-red-800",
    },
    warning: {
      icon: AlertTriangle,
      className: "bg-yellow-50 border-yellow-200 text-yellow-800",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-800",
    },
    info: {
      icon: Info,
      className: "bg-blue-50 border-blue-200 text-blue-800",
      iconColor: "text-blue-600",
      titleColor: "text-blue-800",
    },
  };

  const sizeClasses = {
    sm: "p-3 text-sm",
    md: "p-4 text-sm",
    lg: "p-6 text-base",
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`
        flex items-start space-x-3 rounded-lg border
        ${config.className}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-medium mb-1 ${config.titleColor}`}>{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>

      {closable && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Specialized alert variants
export function SuccessAlert(props) {
  return <Alert type="success" {...props} />;
}

export function ErrorAlert(props) {
  return <Alert type="error" {...props} />;
}

export function WarningAlert(props) {
  return <Alert type="warning" {...props} />;
}

export function InfoAlert(props) {
  return <Alert type="info" {...props} />;
}
