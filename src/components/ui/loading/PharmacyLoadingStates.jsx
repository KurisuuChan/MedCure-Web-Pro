/**
 * Pharmacy-Specific Loading States for MedCure Pro
 * More meaningful and content-aware loading indicators
 */

import React from "react";
import {
  Package,
  Pill,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

/* ========================================
   1. PROGRESSIVE CONTENT LOADER
   Shows actual content structure with subtle shimmer
   ======================================== */

export function ProgressiveProductCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-gray-300">
          <Pill className="h-4 w-4" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="h-5 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-100 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="space-y-1">
          <div className="h-3 w-12 bg-gray-100 rounded" />
          <div className="h-6 w-full bg-gray-200 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-16 bg-gray-100 rounded" />
          <div className="h-6 w-full bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProgressiveTableRow() {
  return (
    <tr className="border-b border-gray-100 relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-300" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-gray-200 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-1">
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

/* ========================================
   2. MINI SPINNER WITH CONTEXT
   Shows what's being loaded
   ======================================== */

export function LoadingState({
  message = "Loading...",
  icon: Icon = Package,
  size = "default",
}) {
  const sizes = {
    small: { container: "py-4", icon: "h-6 w-6", text: "text-sm" },
    default: { container: "py-8", icon: "h-8 w-8", text: "text-base" },
    large: { container: "py-16", icon: "h-12 w-12", text: "text-lg" },
  };

  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center ${s.container}`}>
      <div className="relative">
        <Icon className={`${s.icon} text-blue-500 animate-pulse`} />
        <div className="absolute inset-0 animate-ping opacity-25">
          <Icon className={`${s.icon} text-blue-500`} />
        </div>
      </div>
      <p className={`mt-3 text-gray-600 ${s.text} font-medium`}>{message}</p>
    </div>
  );
}

/* ========================================
   3. INLINE LOADING INDICATORS
   For buttons and small actions
   ======================================== */

export function InlineLoader({ text = "Loading", size = "sm" }) {
  const sizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`${sizes[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}
      />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/* ========================================
   4. PROGRESS BAR
   For multi-step operations
   ======================================== */

export function ProgressBar({
  progress = 0,
  label = "",
  showPercentage = true,
}) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm text-gray-600">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* ========================================
   5. STEP INDICATOR
   For multi-step processes
   ======================================== */

export function StepIndicator({
  steps = [],
  currentStep = 0,
  loading = false,
}) {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const isLoading = isActive && loading;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                  ${isCompleted ? "bg-green-500 text-white" : ""}
                  ${
                    isActive
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : ""
                  }
                  ${
                    !isActive && !isCompleted ? "bg-gray-200 text-gray-500" : ""
                  }
                `}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  isActive ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ========================================
   6. EMPTY STATES
   Better than just "loading" when there's no data
   ======================================== */

export function EmptyState({
  icon: Icon = Package,
  title = "No items found",
  description = "",
  action = null,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}
    >
      <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}

/* ========================================
   7. PHARMACY-SPECIFIC LOADING CARDS
   ======================================== */

export function LoadingInventoryGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProgressiveProductCard key={i} />
      ))}
    </div>
  );
}

export function LoadingTransactionTable({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left">
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 w-16 bg-gray-200 rounded" />
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </th>
            <th className="px-6 py-3 text-left">
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <ProgressiveTableRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingDashboardStats() {
  const stats = [
    { icon: TrendingUp, color: "green" },
    { icon: Package, color: "blue" },
    { icon: AlertTriangle, color: "orange" },
    { icon: Clock, color: "purple" },
  ];

  const colorClasses = {
    green: "bg-green-50 border-green-100",
    blue: "bg-blue-50 border-blue-100",
    orange: "bg-orange-50 border-orange-100",
    purple: "bg-purple-50 border-purple-100",
  };

  const iconColors = {
    green: "text-green-600",
    blue: "text-blue-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden hover:shadow-md transition-shadow duration-200"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Icon and Trend Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
              <stat.icon className={`h-6 w-6 ${iconColors[stat.color]}`} />
            </div>
            {i === 0 && (
              <div className="h-6 w-16 bg-red-50 rounded-full animate-pulse" />
            )}
          </div>

          {/* Title */}
          <div className="h-4 w-24 bg-gray-200 rounded mb-3 animate-pulse" />

          {/* Value */}
          <div className="h-8 w-32 bg-gray-300 rounded mb-2 animate-pulse" />

          {/* Subtitle */}
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ========================================
   8. POS PAGE LOADING SKELETON
   ======================================== */

export function LoadingPOSPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Area - 2/3 width */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Select Products Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-gray-200 rounded shimmer" />
            <div className="h-9 w-32 bg-gray-100 rounded-lg shimmer" />
          </div>
          <div className="h-11 w-full bg-gray-50 rounded-lg border border-gray-200 shimmer" />
        </div>

        {/* Product Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
            >
              {/* Product Name */}
              <div className="h-5 w-3/4 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-1/2 bg-gray-100 rounded shimmer" />

              {/* Badges Row */}
              <div className="flex flex-wrap gap-1.5">
                <div className="h-5 w-14 bg-purple-100 rounded shimmer" />
                <div className="h-5 w-16 bg-pink-100 rounded shimmer" />
                <div className="h-5 w-12 bg-green-100 rounded shimmer" />
              </div>

              {/* Price and Stock */}
              <div className="flex items-end justify-between pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  <div className="h-6 w-16 bg-green-200 rounded shimmer" />
                  <div className="h-3 w-12 bg-gray-100 rounded shimmer" />
                </div>
                <div className="h-4 w-20 bg-gray-100 rounded shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping Cart - 1/3 width */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Cart Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white/20 rounded shimmer" />
                <div className="h-5 w-28 bg-white/20 rounded shimmer" />
              </div>
              <div className="h-6 w-16 bg-white/20 rounded-full shimmer" />
            </div>
          </div>

          {/* Empty Cart State */}
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full mb-4 shimmer flex items-center justify-center">
              <div className="w-10 h-10 bg-gray-200 rounded shimmer" />
            </div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-2 shimmer" />
            <div className="h-4 w-48 bg-gray-100 rounded shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
} /* ========================================
   9. BATCH MANAGEMENT PAGE LOADING SKELETON
   ======================================== */

export function LoadingBatchManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg shimmer" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-64 bg-gray-100 rounded shimmer" />
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 w-32 bg-green-100 rounded-lg shimmer" />
            <div className="h-10 w-10 bg-gray-100 rounded-lg shimmer" />
          </div>
        </div>
      </div>

      {/* Add New Stock Banner */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg shimmer" />
            <div className="space-y-2">
              <div className="h-6 w-56 bg-white/30 rounded shimmer" />
              <div className="h-4 w-80 bg-white/20 rounded shimmer" />
            </div>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-lg shimmer" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="h-11 w-full bg-gray-50 rounded-lg border border-gray-200 shimmer" />
      </div>

      {/* Product Cards Grid - 4 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
          >
            {/* Product Icon & Name */}
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-full bg-gray-200 rounded shimmer" />
                <div className="h-4 w-3/4 bg-gray-100 rounded shimmer" />
                <div className="h-4 w-1/2 bg-gray-100 rounded shimmer" />
              </div>
            </div>

            {/* Classification Badge */}
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded-full shimmer" />
              <div className="h-4 w-32 bg-gray-100 rounded shimmer" />
            </div>

            {/* Stock Info */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="space-y-1">
                <div className="h-3 w-20 bg-gray-100 rounded shimmer" />
                <div className="h-6 w-16 bg-gray-200 rounded shimmer" />
              </div>
              <div className="h-6 w-20 bg-green-100 rounded-full shimmer" />
            </div>

            {/* Add Stock Button */}
            <div className="h-10 w-full bg-blue-500/10 rounded-lg shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================
   10. INVENTORY PAGE LOADING SKELETON
   ======================================== */

export function LoadingInventoryPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shimmer" />
            <div className="space-y-2">
              <div className="h-7 w-52 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-64 bg-gray-100 rounded shimmer" />
            </div>
            <div className="px-3 py-1 bg-green-100 rounded-full">
              <div className="h-4 w-12 bg-green-200 rounded shimmer" />
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 w-24 bg-gray-100 rounded-lg shimmer" />
            <div className="h-10 w-24 bg-gray-100 rounded-lg shimmer" />
            <div className="h-10 w-36 bg-blue-500/20 rounded-lg shimmer" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-4">
          <div className="flex space-x-8">
            <div className="h-12 flex items-center border-b-2 border-blue-600">
              <div className="h-5 w-20 bg-blue-100 rounded shimmer" />
            </div>
            <div className="h-12 flex items-center">
              <div className="h-5 w-40 bg-gray-100 rounded shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            bgColor: "bg-white",
            textColor: "bg-gray-200",
            iconColor: "bg-blue-100",
          },
          {
            bgColor: "bg-white",
            textColor: "bg-gray-200",
            iconColor: "bg-orange-100",
          },
          {
            bgColor: "bg-white",
            textColor: "bg-gray-200",
            iconColor: "bg-red-100",
          },
          {
            bgColor: "bg-white",
            textColor: "bg-gray-200",
            iconColor: "bg-green-100",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`${stat.bgColor} rounded-xl border border-gray-200 p-6 space-y-3`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className={`h-4 w-28 ${stat.textColor} rounded shimmer`} />
                <div className="h-8 w-20 bg-gray-300 rounded shimmer" />
              </div>
              <div
                className={`w-12 h-12 ${stat.iconColor} rounded-lg shimmer flex-shrink-0`}
              />
            </div>
            <div className={`h-3 w-24 ${stat.textColor} rounded shimmer`} />
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 h-11 bg-gray-50 rounded-lg border border-gray-200 shimmer" />
          <div className="h-11 w-11 bg-purple-100 rounded-lg shimmer" />
          <div className="h-11 w-28 bg-gray-100 rounded-lg shimmer" />
          <div className="h-11 w-11 bg-gray-100 rounded-lg shimmer" />
        </div>
      </div>

      {/* Products Info & View Toggle */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-52 bg-gray-200 rounded shimmer" />
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 bg-blue-600 rounded-lg shimmer" />
          <div className="h-10 w-10 bg-gray-100 rounded-lg shimmer" />
          <div className="h-10 w-28 bg-gray-100 rounded-lg shimmer" />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border-2 border-gray-200 rounded-xl p-4 space-y-3"
          >
            {/* Header with badge and actions */}
            <div className="flex items-start justify-between mb-2">
              <div className="px-2.5 py-1 bg-green-100 rounded-md">
                <div className="h-3.5 w-28 bg-green-200 rounded shimmer" />
              </div>
              <div className="flex space-x-1">
                <div className="w-7 h-7 bg-gray-100 rounded-lg shimmer" />
                <div className="w-7 h-7 bg-gray-100 rounded-lg shimmer" />
                <div className="w-7 h-7 bg-gray-100 rounded-lg shimmer" />
              </div>
            </div>

            {/* Product name */}
            <div className="space-y-1.5">
              <div className="h-5 w-full bg-gray-200 rounded shimmer" />
              <div className="h-4 w-3/4 bg-gray-100 rounded shimmer" />
              <div className="h-4 w-1/2 bg-gray-100 rounded shimmer" />
            </div>

            {/* Dosage badge */}
            <div className="flex items-center space-x-2">
              <div className="h-5 w-16 bg-purple-100 rounded shimmer" />
            </div>

            {/* Category */}
            <div className="flex items-start space-x-1.5">
              <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-32 bg-gray-100 rounded shimmer" />
            </div>

            {/* Price and Stock */}
            <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
              <div className="space-y-1">
                <div className="h-7 w-20 bg-gray-300 rounded shimmer" />
                <div className="h-3 w-16 bg-gray-100 rounded shimmer" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-3 w-12 bg-gray-200 rounded shimmer ml-auto" />
                <div className="h-6 w-16 bg-green-100 rounded shimmer" />
              </div>
            </div>

            {/* Expiry */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="h-3.5 w-12 bg-gray-200 rounded shimmer" />
              <div className="h-3.5 w-24 bg-green-100 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========================================
   11. CUSTOMER INFORMATION PAGE LOADING SKELETON
   ======================================== */

export function LoadingCustomerPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg shimmer" />
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shimmer" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gray-200 rounded shimmer" />
              <div className="h-4 w-64 bg-gray-100 rounded shimmer" />
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 w-32 bg-gray-100 rounded-lg shimmer" />
            <div className="h-10 w-36 bg-blue-500/20 rounded-lg shimmer" />
            <div className="h-10 w-48 bg-green-500/20 rounded-lg shimmer" />
          </div>
        </div>
      </div>

      {/* Search and Sort Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-48 bg-gray-200 rounded shimmer" />
          <div className="h-5 w-40 bg-gray-200 rounded shimmer" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex-1 h-11 bg-gray-50 rounded-lg border border-gray-200 shimmer" />
          <div className="w-64 h-11 bg-gray-50 rounded-lg border border-gray-200 shimmer" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            "Total Customers",
            "Filtered Results",
            "Displayed",
            "Cache Size",
          ].map((label, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 w-12 bg-gray-300 rounded mx-auto shimmer" />
              <div className="h-4 w-24 bg-gray-100 rounded mx-auto shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="grid grid-cols-6 gap-4">
            {[
              "CUSTOMER",
              "CONTACT",
              "JOINED",
              "PURCHASES",
              "TOTAL SPENT",
              "ACTIONS",
            ].map((header, i) => (
              <div key={i} className="h-4 w-24 bg-gray-200 rounded shimmer" />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                {/* Customer */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full shimmer" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
                    <div className="h-3 w-24 bg-gray-100 rounded shimmer" />
                  </div>
                </div>
                {/* Contact */}
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded shimmer" />
                  <div className="h-3 w-24 bg-gray-100 rounded shimmer" />
                </div>
                {/* Joined */}
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded shimmer" />
                  <div className="h-3 w-16 bg-gray-100 rounded shimmer" />
                </div>
                {/* Purchases */}
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                  <div className="h-3 w-20 bg-gray-100 rounded shimmer" />
                </div>
                {/* Total Spent */}
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded shimmer" />
                  <div className="h-3 w-16 bg-gray-100 rounded shimmer" />
                </div>
                {/* Actions */}
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg shimmer" />
                  <div className="w-8 h-8 bg-gray-100 rounded-lg shimmer" />
                  <div className="w-8 h-8 bg-gray-100 rounded-lg shimmer" />
                  <div className="w-8 h-8 bg-gray-100 rounded-lg shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================================
   12. USER MANAGEMENT PAGE LOADING SKELETON
   ======================================== */

export function LoadingUserManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shimmer" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-200 rounded shimmer" />
            <div className="h-4 w-96 bg-gray-100 rounded shimmer" />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-blue-200 rounded-full shimmer flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 w-48 bg-blue-200 rounded shimmer" />
            <div className="h-3 w-full bg-blue-100 rounded shimmer" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 px-4">
          <div className="h-12 w-32 bg-blue-100 rounded-t-lg shimmer mr-2" />
          <div className="h-12 w-40 bg-gray-100 rounded-t-lg shimmer mr-2" />
          <div className="h-12 w-32 bg-gray-100 rounded-t-lg shimmer" />
        </div>
        <div className="p-6">
          <div className="h-4 w-64 bg-gray-100 rounded shimmer" />
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-40 bg-gray-200 rounded shimmer" />
            <div className="h-4 w-64 bg-gray-100 rounded shimmer" />
          </div>
          <div className="h-10 w-32 bg-blue-500/20 rounded-lg shimmer" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { color: "bg-blue-50", icon: "bg-blue-100" },
            { color: "bg-green-50", icon: "bg-green-100" },
            { color: "bg-purple-50", icon: "bg-purple-100" },
            { color: "bg-orange-50", icon: "bg-orange-100" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`${stat.color} rounded-xl border border-gray-200 p-6 space-y-3`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${stat.icon} rounded-lg shimmer`} />
              </div>
              <div className="h-8 w-12 bg-gray-300 rounded shimmer" />
              <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex-1 h-11 bg-gray-50 rounded-lg border border-gray-200 shimmer" />
          <div className="w-32 h-11 bg-gray-50 rounded-lg border border-gray-200 shimmer" />
          <div className="w-32 h-11 bg-gray-50 rounded-lg border border-gray-200 shimmer" />
          <div className="h-11 w-11 bg-gray-100 rounded-lg shimmer" />
          <div className="h-11 w-11 bg-gray-100 rounded-lg shimmer" />
        </div>

        {/* User Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <div className="grid grid-cols-6 gap-4">
              {[
                "USER",
                "ROLE",
                "DEPARTMENT",
                "STATUS",
                "LAST LOGIN",
                "ACTIONS",
              ].map((header, i) => (
                <div key={i} className="h-4 w-24 bg-gray-200 rounded shimmer" />
              ))}
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-6 py-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* User */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full shimmer flex items-center justify-center">
                      <div className="h-5 w-5 bg-blue-200 rounded shimmer" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-28 bg-gray-200 rounded shimmer" />
                      <div className="h-3 w-36 bg-gray-100 rounded shimmer" />
                    </div>
                  </div>
                  {/* Role */}
                  <div className="h-6 w-24 bg-green-100 rounded-full shimmer" />
                  {/* Department */}
                  <div className="h-4 w-16 bg-gray-200 rounded shimmer" />
                  {/* Status */}
                  <div className="h-6 w-32 bg-yellow-100 rounded-full shimmer" />
                  {/* Last Login */}
                  <div className="h-4 w-32 bg-gray-200 rounded shimmer" />
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg shimmer" />
                    <div className="w-8 h-8 bg-gray-100 rounded-lg shimmer" />
                    <div className="w-8 h-8 bg-gray-100 rounded-lg shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================
   13. SMART LOADING WRAPPER
   Decides what to show based on state
   ======================================== */

export function SmartLoader({
  loading = false,
  error = null,
  empty = false,
  emptyState = {},
  loadingComponent = null,
  children,
}) {
  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description={error}
        action={
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (loading) {
    return loadingComponent || <LoadingState message="Loading data..." />;
  }

  if (empty) {
    return <EmptyState {...emptyState} />;
  }

  return children;
}

export default {
  ProgressiveProductCard,
  ProgressiveTableRow,
  LoadingState,
  InlineLoader,
  ProgressBar,
  StepIndicator,
  EmptyState,
  LoadingInventoryGrid,
  LoadingTransactionTable,
  LoadingDashboardStats,
  LoadingPOSPage,
  LoadingBatchManagementPage,
  LoadingInventoryPage,
  LoadingCustomerPage,
  LoadingUserManagementPage,
  SmartLoader,
};
