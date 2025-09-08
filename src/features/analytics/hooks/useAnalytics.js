import { useState, useEffect, useCallback } from "react";
import { AnalyticsService } from "../../../services/analyticsService";

/**
 * Custom hook for managing analytics data
 */
export const useAnalytics = (period = "30days", autoRefresh = true) => {
  const [data, setData] = useState({
    kpis: null,
    salesAnalytics: null,
    inventoryAnalytics: null,
    profitAnalytics: null,
    trends: null,
    topProducts: null,
    alerts: {
      lowStock: [],
      expiring: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        kpis,
        salesAnalytics,
        inventoryAnalytics,
        profitAnalytics,
        trends,
        topProducts,
        lowStockAlerts,
        expiryAlerts,
      ] = await Promise.all([
        AnalyticsService.getSalesKPIs(),
        AnalyticsService.getSalesAnalytics(period),
        AnalyticsService.getInventoryAnalytics(),
        AnalyticsService.getProfitAnalytics(period),
        AnalyticsService.getSalesTrends(period),
        AnalyticsService.getTopProducts(10, period),
        AnalyticsService.getLowStockAlerts(),
        AnalyticsService.getExpiryAlerts(),
      ]);

      setData({
        kpis,
        salesAnalytics,
        inventoryAnalytics,
        profitAnalytics,
        trends,
        topProducts,
        alerts: {
          lowStock: lowStockAlerts,
          expiring: expiryAlerts,
        },
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [period]);

  // Load data on mount and period change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchAnalytics, autoRefresh]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  };
};

/**
 * Hook for real-time KPIs only (lighter weight)
 */
export const useKPIs = (autoRefresh = true) => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKPIs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AnalyticsService.getSalesKPIs();
      setKpis(data);
    } catch (err) {
      console.error("Error fetching KPIs:", err);
      setError(err.message || "Failed to load KPIs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKPIs();

    if (autoRefresh) {
      const interval = setInterval(fetchKPIs, 2 * 60 * 1000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [fetchKPIs, autoRefresh]);

  return {
    kpis,
    loading,
    error,
    refresh: fetchKPIs,
  };
};

/**
 * Hook for alerts only
 */
export const useAlerts = (autoRefresh = true) => {
  const [alerts, setAlerts] = useState({
    lowStock: [],
    expiring: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [lowStockAlerts, expiryAlerts] = await Promise.all([
        AnalyticsService.getLowStockAlerts(),
        AnalyticsService.getExpiryAlerts(),
      ]);

      setAlerts({
        lowStock: lowStockAlerts,
        expiring: expiryAlerts,
      });
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, 60 * 1000); // 1 minute for alerts
      return () => clearInterval(interval);
    }
  }, [fetchAlerts, autoRefresh]);

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts,
  };
};

export default useAnalytics;
