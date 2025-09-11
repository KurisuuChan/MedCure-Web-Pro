/**
 * Performance Optimization Service
 * Handles system-wide performance improvements, caching, and monitoring
 */

import React, { memo, useMemo, useCallback } from "react";
import { QueryClient } from "@tanstack/react-query";

// Query Client Configuration with optimized defaults
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache queries for 5 minutes by default
        staleTime: 1000 * 60 * 5,
        // Keep unused data in cache for 10 minutes
        gcTime: 1000 * 60 * 10,
        // Retry failed requests 3 times with exponential backoff
        retry: (failureCount, error) => {
          if (error?.status === 404 || error?.status === 403) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus only for critical data
        refetchOnWindowFocus: false,
        // Background refetch for data consistency
        refetchOnMount: "always",
      },
      mutations: {
        // Retry mutations once for network errors
        retry: (failureCount, error) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false; // Don't retry client errors
          }
          return failureCount < 1;
        },
      },
    },
  });
};

// Memoization Utilities
export const MemoizedComponent = memo;

// Custom hooks for memoization - use directly in components
export const createMemoizedValue = () => useMemo;
export const createMemoizedCallback = () => useCallback;

// Image Optimization
export const optimizeImageLoading = (imageUrl, options = {}) => {
  const {
    width = "auto",
    height = "auto",
    quality = 80,
    format = "webp",
  } = options;

  // Return optimized image URL with query parameters
  const url = new URL(imageUrl);
  url.searchParams.set("w", width.toString());
  url.searchParams.set("h", height.toString());
  url.searchParams.set("q", quality.toString());
  url.searchParams.set("f", format);

  return url.toString();
};

// Lazy Loading Utilities
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  };

  if ("IntersectionObserver" in window) {
    return new IntersectionObserver(callback, defaultOptions);
  }

  // Fallback for browsers without IntersectionObserver
  return {
    observe: () => {},
    unobserve: () => {},
    disconnect: () => {},
  };
};

// Virtual Scrolling Helper
export const calculateVirtualScrolling = (
  containerHeight,
  itemHeight,
  totalItems,
  scrollTop = 0
) => {
  const itemsInView = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + itemsInView + 5, totalItems); // 5 item buffer
  const offsetY = startIndex * itemHeight;

  return {
    startIndex: Math.max(0, startIndex - 2), // 2 item buffer above
    endIndex,
    offsetY,
    visibleItems: endIndex - Math.max(0, startIndex - 2),
  };
};

// Bundle Splitting Utilities
export const loadComponentAsync = (importFunction) => {
  return React.lazy(() =>
    importFunction().catch((error) => {
      console.error("Component loading failed:", error);
      // Return a fallback component
      return {
        default: () => (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">Failed to load component</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ),
      };
    })
  );
};

// Performance Monitoring
export class PerformanceMonitor {
  static measurements = new Map();
  static observers = [];

  static startMeasurement(name) {
    const startTime = performance.now();
    this.measurements.set(name, { startTime });

    // Mark the start for browser performance tools
    if ("performance" in window && "mark" in performance) {
      performance.mark(`${name}-start`);
    }
  }

  static endMeasurement(name) {
    const measurement = this.measurements.get(name);
    if (!measurement) {
      console.warn(`No measurement found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - measurement.startTime;

    // Mark the end and measure for browser performance tools
    if ("performance" in window && "mark" in performance) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }

    const result = {
      name,
      duration,
      startTime: measurement.startTime,
      endTime,
    };
    this.measurements.delete(name);

    // Notify observers
    this.observers.forEach((observer) => observer(result));

    return result;
  }

  static addObserver(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  static getNavigationTiming() {
    if ("performance" in window && "getEntriesByType" in performance) {
      const [navigation] = performance.getEntriesByType("navigation");
      return navigation;
    }
    return null;
  }

  static getLargestContentfulPaint() {
    return new Promise((resolve) => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry?.startTime || null);
          observer.disconnect();
        });
        observer.observe({ entryTypes: ["largest-contentful-paint"] });

        // Timeout after 10 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 10000);
      } else {
        resolve(null);
      }
    });
  }

  static getFirstInputDelay() {
    return new Promise((resolve) => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const firstEntry = entries[0];
          resolve(firstEntry?.processingStart - firstEntry?.startTime || null);
          observer.disconnect();
        });
        observer.observe({ entryTypes: ["first-input"] });

        // Timeout after 30 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, 30000);
      } else {
        resolve(null);
      }
    });
  }
}

// Debounce and Throttle Utilities
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const throttle = (func, delay) => {
  let lastExecTime = 0;
  return (...args) => {
    const currentTime = Date.now();
    if (currentTime - lastExecTime >= delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    }
  };
};

// Memory Management
export class MemoryManager {
  static cleanup() {
    // Clear expired cache entries
    if ("caches" in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          if (cacheName.includes("expired") || cacheName.includes("old")) {
            caches.delete(cacheName);
          }
        });
      });
    }

    // Clear large objects from memory
    if (window.gc && typeof window.gc === "function") {
      window.gc();
    }
  }

  static monitorMemoryUsage() {
    if ("performance" in window && "memory" in performance) {
      const memory = performance.memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }

  static setupMemoryPressureListener(callback) {
    if ("performance" in window && "addEventListener" in performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "memory") {
            callback(entry);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ["memory"] });
        return () => observer.disconnect();
      } catch (error) {
        console.warn("Memory pressure monitoring not supported:", error);
        return () => {};
      }
    }
    return () => {};
  }
}

// Cache Management
export class CacheManager {
  static cache = new Map();
  static maxSize = 100;
  static ttl = 1000 * 60 * 5; // 5 minutes default

  static set(key, value, customTtl = this.ttl) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTtl,
    });
  }

  static get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  static has(key) {
    return this.get(key) !== null;
  }

  static delete(key) {
    return this.cache.delete(key);
  }

  static clear() {
    this.cache.clear();
  }

  static cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  static size() {
    return this.cache.size;
  }
}

// Resource Loading Optimization
export const preloadResource = (url, type = "fetch") => {
  if ("preload" in HTMLLinkElement.prototype) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = url;

    switch (type) {
      case "script":
        link.as = "script";
        break;
      case "style":
        link.as = "style";
        break;
      case "image":
        link.as = "image";
        break;
      case "font":
        link.as = "font";
        link.crossOrigin = "anonymous";
        break;
      default:
        link.as = "fetch";
        link.crossOrigin = "anonymous";
    }

    document.head.appendChild(link);
  }
};

export const prefetchResource = (url) => {
  if ("prefetch" in HTMLLinkElement.prototype) {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  }
};

// Network Optimization
export class NetworkOptimizer {
  static getConnectionInfo() {
    if ("connection" in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }
    return null;
  }

  static isSlowConnection() {
    const connection = this.getConnectionInfo();
    if (!connection) return false;

    return (
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g" ||
      connection.saveData ||
      connection.downlink < 1.5
    );
  }

  static adaptToConnection() {
    const isSlowConnection = this.isSlowConnection();

    return {
      imageQuality: isSlowConnection ? 60 : 80,
      prefetchEnabled: !isSlowConnection,
      lazyLoadingThreshold: isSlowConnection ? "200px" : "50px",
      chunkSize: isSlowConnection ? "small" : "medium",
    };
  }
}

// Performance Reporting
export const reportWebVitals = async () => {
  const vitals = {};

  // Collect Core Web Vitals
  try {
    vitals.lcp = await PerformanceMonitor.getLargestContentfulPaint();
    vitals.fid = await PerformanceMonitor.getFirstInputDelay();

    // CLS (Cumulative Layout Shift)
    if ("PerformanceObserver" in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });
      observer.observe({ entryTypes: ["layout-shift"] });

      setTimeout(() => {
        vitals.cls = clsValue;
        observer.disconnect();
      }, 5000);
    }

    // Navigation timing
    vitals.navigation = PerformanceMonitor.getNavigationTiming();

    // Memory usage
    vitals.memory = MemoryManager.monitorMemoryUsage();

    return vitals;
  } catch (error) {
    console.error("Error collecting performance vitals:", error);
    return vitals;
  }
};

export default {
  createOptimizedQueryClient,
  MemoizedComponent,
  createMemoizedValue,
  createMemoizedCallback,
  optimizeImageLoading,
  createIntersectionObserver,
  calculateVirtualScrolling,
  loadComponentAsync,
  PerformanceMonitor,
  debounce,
  throttle,
  MemoryManager,
  CacheManager,
  preloadResource,
  prefetchResource,
  NetworkOptimizer,
  reportWebVitals,
};
