/**
 * Advanced Loading Components for MedCure Pro
 * Professional, modern loading indicators with multiple variants
 */

import React from "react";
import { Loader2 } from "lucide-react";

/* ========================================
   1. UNIFIED SPINNER - Main Loading Component
   ======================================== */

export function UnifiedSpinner({
  variant = "default",
  size = "md",
  color = "blue",
  text = "",
  className = "",
}) {
  const variants = {
    default: <DefaultSpinner size={size} color={color} />,
    gradient: <GradientSpinner size={size} />,
    dots: <DotsWave size={size} color={color} />,
    pulse: <PulseRing size={size} color={color} />,
    orbit: <OrbitSpinner size={size} color={color} />,
    dna: <DNAHelix size={size} />,
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      {variants[variant]}
      {text && (
        <p className={`text-sm font-medium ${getColorClass(color)}`}>{text}</p>
      )}
    </div>
  );
}

/* ========================================
   2. SPINNER VARIANTS
   ======================================== */

// Default Spinner (Loader2)
function DefaultSpinner({ size, color }) {
  const sizeClass = getSizeClass(size);
  const colorClass = getColorClass(color);

  return <Loader2 className={`animate-spin ${sizeClass} ${colorClass}`} />;
}

// Gradient Spinner - Modern rotating circle with gradient
function GradientSpinner({ size }) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  return (
    <div className={`${dimensions[size]} relative`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 animate-gradient-spin">
        <div className="absolute inset-1 rounded-full bg-white"></div>
      </div>
    </div>
  );
}

// Dots Wave - Three dots bouncing in sequence
function DotsWave({ size, color }) {
  const dotSize = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
    xl: "w-6 h-6",
  };

  const colorClass =
    color === "blue"
      ? "bg-blue-600"
      : color === "white"
      ? "bg-white"
      : color === "gray"
      ? "bg-gray-600"
      : "bg-blue-600";

  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${dotSize[size]} ${colorClass} rounded-full animate-wave`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// Pulse Ring - Expanding concentric circles
function PulseRing({ size, color }) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const ringColor =
    color === "blue"
      ? "border-blue-600"
      : color === "white"
      ? "border-white"
      : color === "gray"
      ? "border-gray-600"
      : "border-blue-600";

  return (
    <div className={`${dimensions[size]} relative`}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`absolute inset-0 rounded-full border-2 ${ringColor} animate-pulse-ring`}
          style={{ animationDelay: `${i * 0.75}s` }}
        />
      ))}
    </div>
  );
}

// Orbit Spinner - Dots orbiting around center
function OrbitSpinner({ size, color }) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const dotColor =
    color === "blue"
      ? "bg-blue-600"
      : color === "white"
      ? "bg-white"
      : color === "gray"
      ? "bg-gray-600"
      : "bg-blue-600";

  return (
    <div className={`${dimensions[size]} relative`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1"
          style={{ animation: `orbit 1.5s linear infinite ${i * 0.5}s` }}
        >
          <div className={`w-full h-full ${dotColor} rounded-full`} />
        </div>
      ))}
    </div>
  );
}

// DNA Helix - Double helix rotation effect
function DNAHelix({ size }) {
  const height = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
    xl: "h-24",
  };

  return (
    <div className={`flex gap-2 ${height[size]} items-center`}>
      <div className="flex flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-600 rounded-full animate-wave"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-purple-600 rounded-full animate-wave"
            style={{ animationDelay: `${i * 0.2 + 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ========================================
   3. PROGRESS INDICATORS
   ======================================== */

// Linear Progress Bar
export function ProgressBar({
  progress = 0,
  variant = "default",
  size = "md",
  showPercentage = false,
  className = "",
}) {
  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variants = {
    default: "bg-blue-600",
    gradient: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
    success: "bg-green-600",
    warning: "bg-yellow-600",
    error: "bg-red-600",
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full bg-gray-200 rounded-full ${heights[size]} overflow-hidden`}
      >
        <div
          className={`${heights[size]} ${variants[variant]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          {variant === "gradient" && (
            <div className="w-full h-full animate-progress-gradient" />
          )}
        </div>
      </div>
      {showPercentage && (
        <p className="text-xs text-gray-600 mt-1 text-center">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
}

// Circular Progress
export function CircularProgress({
  progress = 0,
  size = "md",
  strokeWidth = 4,
  showPercentage = true,
  color = "blue",
  className = "",
}) {
  const dimensions = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 120,
  };

  const dim = dimensions[size];
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const colors = {
    blue: "stroke-blue-600",
    green: "stroke-green-600",
    purple: "stroke-purple-600",
    gradient: "stroke-url(#gradient)",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg width={dim} height={dim} className="transform -rotate-90">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          className={colors[color]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.3s ease-out",
          }}
        />
      </svg>

      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

/* ========================================
   4. OVERLAY VARIANTS
   ======================================== */

// Full Screen Loading Overlay
export function LoadingOverlay({
  isVisible = true,
  variant = "default",
  text = "Loading...",
  blur = true,
  className = "",
}) {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${
        blur ? "backdrop-blur-sm" : ""
      } ${className}`}
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl animate-scale-up">
        <UnifiedSpinner variant={variant} size="lg" text={text} />
      </div>
    </div>
  );
}

// Inline Loading (for buttons, sections)
export function LoadingInline({
  size = "sm",
  color = "gray",
  text = "",
  className = "",
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2
        className={`animate-spin ${getSizeClass(size)} ${getColorClass(color)}`}
      />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

/* ========================================
   5. HELPER FUNCTIONS
   ======================================== */

function getSizeClass(size) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };
  return sizes[size] || sizes.md;
}

function getColorClass(color) {
  const colors = {
    blue: "text-blue-600",
    white: "text-white",
    gray: "text-gray-500",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    yellow: "text-yellow-600",
  };
  return colors[color] || colors.blue;
}

/* ========================================
   6. EXPORT ALL
   ======================================== */

export default UnifiedSpinner;
