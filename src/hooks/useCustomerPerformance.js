// Professional performance optimization for customer system
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';

export const useCustomerPerformance = (customers = [], config = {}) => {
  const {
    pageSize = 20,
    searchDebounce = 300,
    enableVirtualization = false,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    sortable = true
  } = config;

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState(new Map());
  
  // Refs for cleanup
  const cacheTimers = useRef(new Map());
  const searchInputRef = useRef(null);
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, searchDebounce);

  // Cache key generator
  const generateCacheKey = useCallback((search, sort, page) => {
    return `${search}-${sort.key}-${sort.direction}-${page}`;
  }, []);

  // Search filtering with performance optimization
  const filteredCustomers = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return customers;

    const searchLower = debouncedSearchTerm.toLowerCase();
    const cacheKey = `search-${searchLower}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTimeout) {
        return cached.data;
      }
    }

    // Perform search
    const filtered = customers.filter(customer => {
      const searchableText = [
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.notes
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchLower);
    });

    // Cache results
    setCache(prev => new Map(prev).set(cacheKey, {
      data: filtered,
      timestamp: Date.now()
    }));

    return filtered;
  }, [customers, debouncedSearchTerm, cache, cacheTimeout]);

  // Sorting with performance optimization
  const sortedCustomers = useMemo(() => {
    if (!sortConfig.key) return filteredCustomers;

    const cacheKey = `sort-${sortConfig.key}-${sortConfig.direction}`;
    
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheTimeout) {
        return cached.data;
      }
    }

    const sorted = [...filteredCustomers].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      // Handle different data types
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Date comparison
      if (sortConfig.key.includes('date') || sortConfig.key.includes('time')) {
        return sortConfig.direction === 'asc' 
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      // Number comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    // Cache sorted results
    setCache(prev => new Map(prev).set(cacheKey, {
      data: sorted,
      timestamp: Date.now()
    }));

    return sorted;
  }, [filteredCustomers, sortConfig, cache, cacheTimeout]);

  // Pagination with virtual scrolling support
  const paginatedCustomers = useMemo(() => {
    if (enableVirtualization) {
      // For virtual scrolling, return all sorted customers
      return sortedCustomers;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedCustomers.slice(startIndex, endIndex);
  }, [sortedCustomers, currentPage, pageSize, enableVirtualization]);

  // Pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = sortedCustomers.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      pageSize
    };
  }, [sortedCustomers.length, currentPage, pageSize]);

  // Search handler with optimizations
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page
    
    // Focus management
    if (searchInputRef.current) {
      const cursorPosition = searchInputRef.current.selectionStart;
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  }, []);

  // Sort handler
  const handleSort = useCallback((key) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  }, [sortable]);

  // Page navigation
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= paginationInfo.totalPages) {
      setCurrentPage(page);
    }
  }, [paginationInfo.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasNextPage]);

  const prevPage = useCallback(() => {
    if (paginationInfo.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationInfo.hasPrevPage]);

  // Cache cleanup
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      const newCache = new Map();
      
      cache.forEach((value, key) => {
        if (now - value.timestamp < cacheTimeout) {
          newCache.set(key, value);
        }
      });
      
      if (newCache.size !== cache.size) {
        setCache(newCache);
      }
    };

    const interval = setInterval(cleanup, cacheTimeout / 2);
    return () => clearInterval(interval);
  }, [cache, cacheTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cacheTimers.current.forEach(timer => clearTimeout(timer));
      cacheTimers.current.clear();
    };
  }, []);

  // Virtual scrolling hook (if enabled)
  const useVirtualScrolling = (containerRef, itemHeight = 60) => {
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
    const [scrollTop, setScrollTop] = useState(0);

    const handleScroll = useCallback((e) => {
      const container = e.target;
      const newScrollTop = container.scrollTop;
      setScrollTop(newScrollTop);

      const containerHeight = container.clientHeight;
      const start = Math.floor(newScrollTop / itemHeight);
      const visibleCount = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(start + visibleCount + 5, sortedCustomers.length); // Buffer of 5

      setVisibleRange({ start: Math.max(0, start - 5), end });
    }, [itemHeight, sortedCustomers.length]);

    const visibleItems = useMemo(() => {
      return sortedCustomers.slice(visibleRange.start, visibleRange.end);
    }, [sortedCustomers, visibleRange]);

    const totalHeight = sortedCustomers.length * itemHeight;
    const offsetY = visibleRange.start * itemHeight;

    return {
      visibleItems,
      totalHeight,
      offsetY,
      handleScroll,
      visibleRange
    };
  };

  // Performance metrics
  const metrics = useMemo(() => ({
    totalCustomers: customers.length,
    filteredCustomers: filteredCustomers.length,
    displayedCustomers: paginatedCustomers.length,
    cacheSize: cache.size,
    searchTerm: debouncedSearchTerm,
    sortConfig,
    performanceOptimized: true
  }), [
    customers.length,
    filteredCustomers.length,
    paginatedCustomers.length,
    cache.size,
    debouncedSearchTerm,
    sortConfig
  ]);

  return {
    // Data
    customers: paginatedCustomers,
    filteredCustomers,
    sortedCustomers,
    
    // State
    searchTerm,
    sortConfig,
    loading,
    
    // Pagination
    pagination: paginationInfo,
    
    // Handlers
    handleSearch,
    handleSort,
    goToPage,
    nextPage,
    prevPage,
    
    // Refs
    searchInputRef,
    
    // Virtual scrolling
    useVirtualScrolling: enableVirtualization ? useVirtualScrolling : null,
    
    // Performance
    metrics,
    
    // Cache control
    clearCache: () => setCache(new Map()),
    refreshData: () => {
      setCache(new Map());
      setLoading(true);
      // Trigger data refresh in parent component
      setTimeout(() => setLoading(false), 100);
    }
  };
};

// Hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCount.current}, Time since last: ${timeSinceLastRender}ms`);
    }
    
    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    logPerformance: (operation, duration) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${componentName}] ${operation}: ${duration}ms`);
      }
    }
  };
};