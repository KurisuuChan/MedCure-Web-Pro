import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({
  size = "md",
  color = "blue",
  text = "",
  className = "",
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const colorClasses = {
    blue: "text-blue-600",
    gray: "text-gray-500",
    white: "text-white",
    green: "text-green-600",
    red: "text-red-600",
    yellow: "text-yellow-600",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-2 ${className}`}
    >
      <Loader2
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      />
      {text && (
        <p className={`text-sm ${colorClasses[color]} font-medium`}>{text}</p>
      )}
    </div>
  );
}

// Overlay variant for full screen loading
export function LoadingOverlay({
  isVisible = true,
  text = "Loading...",
  className = "",
}) {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

// Inline variant for component-level loading
export function LoadingInline({
  size = "sm",
  text = "Loading...",
  className = "",
}) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Loader2
        className={`animate-spin ${
          size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6"
        } text-gray-500`}
      />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}

// Button loading state
export function LoadingButton({
  children,
  isLoading = false,
  disabled = false,
  onClick,
  className = "",
  size = "md",
  ...props
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative inline-flex items-center justify-center
        bg-blue-600 text-white rounded-lg
        hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="animate-spin h-4 w-4 mr-2" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}
