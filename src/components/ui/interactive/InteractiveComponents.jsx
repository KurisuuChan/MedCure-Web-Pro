/**
 * Interactive Components for MedCure Pro
 * Enhanced buttons, cards, and inputs with micro-interactions
 */

import React, { useState } from "react";
import { UnifiedSpinner } from "./loading/UnifiedSpinner";

/* ========================================
   1. ANIMATED BUTTON
   ======================================== */

export function AnimatedButton({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  icon: Icon,
  onClick,
  className = "",
  ...props
}) {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
    success:
      "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg",
    ghost: "hover:bg-gray-100 text-gray-700",
    gradient:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const handleClick = (e) => {
    if (disabled || isLoading) return;

    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);

    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        transform hover:scale-105 active:scale-95
        ${variants[variant]}
        ${sizes[size]}
        ${isPressed ? "animate-button-press" : ""}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <UnifiedSpinner variant="default" size="sm" color="white" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4" />}
          {children}
        </>
      )}
    </button>
  );
}

/* ========================================
   2. HOVER CARD
   ======================================== */

export function HoverCard({
  children,
  variant = "default",
  onClick,
  className = "",
  animateOnHover = true,
  ...props
}) {
  const variants = {
    default: "bg-white border border-gray-200",
    elevated: "bg-white border border-gray-200 shadow-sm hover:shadow-xl",
    gradient: "bg-gradient-to-br from-white to-gray-50 border border-gray-200",
    colorful:
      "bg-gradient-to-br from-blue-50 via-white to-purple-50 border border-gray-200",
  };

  const hoverClass = animateOnHover
    ? "hover:scale-[1.02] hover:-translate-y-1"
    : "";

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl p-6
        transition-all duration-300
        ${variants[variant]}
        ${hoverClass}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/* ========================================
   3. ANIMATED INPUT
   ======================================== */

export function AnimatedInput({
  label,
  error,
  icon: Icon,
  type = "text",
  className = "",
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium transition-colors duration-200 ${
            isFocused ? "text-blue-600" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon
              className={`h-5 w-5 transition-colors duration-200 ${
                isFocused ? "text-blue-600" : "text-gray-400"
              }`}
            />
          </div>
        )}

        <input
          type={type}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-3 py-2 ${Icon ? "pl-10" : ""}
            border rounded-lg
            transition-all duration-200
            ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }
            focus:outline-none
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 animate-slide-down">{error}</p>
      )}
    </div>
  );
}

/* ========================================
   4. RIPPLE BUTTON
   ======================================== */

export function RippleButton({ children, onClick, className = "", ...props }) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = {
      x,
      y,
      id: Date.now(),
    };

    setRipples([...ripples, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    if (onClick) onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/50 rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
        />
      ))}
      {children}
    </button>
  );
}

/* ========================================
   5. STAT CARD WITH ANIMATION
   ======================================== */

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
  animated = true,
  className = "",
}) {
  const colors = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      trend: "text-blue-600",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      trend: "text-green-600",
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600",
      trend: "text-red-600",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
      trend: "text-purple-600",
    },
  };

  return (
    <HoverCard
      variant="elevated"
      animateOnHover={animated}
      className={className}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className={`p-3 rounded-xl ${colors[color].bg}`}>
            <Icon className={`h-6 w-6 ${colors[color].text}`} />
          </div>
        )}

        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${colors[color].trend}`}
          >
            {trend === "up" ? "↑" : "↓"} {trendValue}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </HoverCard>
  );
}

/* ========================================
   6. SUCCESS/ERROR INDICATOR
   ======================================== */

export function StatusIndicator({ type = "success", message, onClose }) {
  const configs = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "✓",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "✕",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "⚠",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "ℹ",
    },
  };

  const config = configs[type];

  return (
    <div
      className={`
      flex items-center justify-between p-4 rounded-lg border
      ${config.bg} ${config.border}
      animate-slide-down
    `}
    >
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${config.text} animate-success-scale`}>
          {config.icon}
        </div>
        <p className={`font-medium ${config.text}`}>{message}</p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className={`${config.text} hover:opacity-70 transition-opacity`}
        >
          ✕
        </button>
      )}
    </div>
  );
}

/* ========================================
   7. BADGE WITH ANIMATION
   ======================================== */

export function AnimatedBadge({
  children,
  variant = "default",
  pulse = false,
  className = "",
}) {
  const variants = {
    default: "bg-gray-100 text-gray-700",
    primary: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    gradient: "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
  };

  return (
    <span
      className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${variants[variant]}
      ${pulse ? "animate-pulse" : ""}
      ${className}
    `}
    >
      {pulse && (
        <span className="w-2 h-2 bg-current rounded-full mr-1 animate-ping" />
      )}
      {children}
    </span>
  );
}

/* ========================================
   8. TOOLTIP (Bonus)
   ======================================== */

export function Tooltip({ children, content, position = "top" }) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`
          absolute ${positions[position]} z-50
          px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
          whitespace-nowrap animate-fade-in
        `}
        >
          {content}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}
    </div>
  );
}

/* ========================================
   EXPORT ALL
   ======================================== */

export default {
  AnimatedButton,
  HoverCard,
  AnimatedInput,
  RippleButton,
  StatCard,
  StatusIndicator,
  AnimatedBadge,
  Tooltip,
};
