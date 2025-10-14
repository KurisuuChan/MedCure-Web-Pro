/**
 * Skeleton Loaders for MedCure Pro
 * Professional skeleton screens for better perceived performance
 */

import React from "react";

/* ========================================
   1. BASE SKELETON COMPONENT
   ======================================== */

export function Skeleton({
  className = "",
  variant = "rectangular",
  animation = "shimmer",
  width,
  height,
}) {
  const variants = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded",
  };

  const animations = {
    shimmer: "animate-skeleton",
    pulse: "animate-skeleton-pulse",
    wave: "animate-wave",
  };

  const style = {
    width: width || "100%",
    height: height || "auto",
  };

  return (
    <div
      className={`${variants[variant]} ${animations[animation]} bg-gray-200 ${className}`}
      style={style}
    />
  );
}

/* ========================================
   2. SKELETON VARIANTS
   ======================================== */

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className="h-4 flex-1"
                  animation="shimmer"
                  style={{
                    animationDelay: `${
                      (rowIndex * columns + colIndex) * 0.05
                    }s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Card Skeleton
export function CardSkeleton({ count = 1, variant = "default" }) {
  const variants = {
    default: <DefaultCardSkeleton />,
    product: <ProductCardSkeleton />,
    stat: <StatCardSkeleton />,
    user: <UserCardSkeleton />,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 0.1}s` }}>
          {variants[variant]}
        </div>
      ))}
    </>
  );
}

// Default Card Skeleton
function DefaultCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Product Card Skeleton
function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <Skeleton variant="rectangular" className="h-32 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center mt-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton variant="circular" className="h-8 w-8" />
      </div>
    </div>
  );
}

// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" className="h-10 w-10" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

// User Card Skeleton
function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <Skeleton className="h-6 w-1/3 mb-6" />

      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      <div className="flex gap-3 mt-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ type = "bar" }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>

      {type === "bar" && (
        <div className="flex items-end gap-4 h-48">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
      )}

      {type === "line" && (
        <div className="relative h-48">
          <Skeleton className="h-full w-full" />
        </div>
      )}

      {type === "pie" && (
        <div className="flex justify-center items-center h-48">
          <Skeleton variant="circular" className="h-40 w-40" />
        </div>
      )}
    </div>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton type="bar" />
        <ChartSkeleton type="line" />
      </div>

      {/* Table */}
      <TableSkeleton rows={5} columns={4} />
    </div>
  );
}

// Modal Skeleton
export function ModalSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <Skeleton className="h-6 w-48" />
        <Skeleton variant="circular" className="h-8 w-8" />
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      <FormSkeleton fields={3} />

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Page Skeleton (full page loading)
export function PageSkeleton({ type = "default" }) {
  const types = {
    default: <DashboardSkeleton />,
    table: <TableSkeleton rows={10} columns={5} />,
    grid: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton count={9} variant="product" />
      </div>
    ),
    form: <FormSkeleton fields={8} />,
  };

  return <div className="animate-fade-in">{types[type] || types.default}</div>;
}

/* ========================================
   EXPORT ALL
   ======================================== */

export default Skeleton;
