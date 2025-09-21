import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../config/supabase";

/**
 * Enhanced Real-Time Analytics Hook
 * Provides live business intelligence data with WebSocket subscriptions
 */
export const useRealTimeAnalytics = (refreshInterval = 30000) => {
  const [analyticsData, setAnalyticsData] = useState({
    realTimeKPIs: null,
    salesTrends: null,
    inventoryAlerts: null,
    customerInsights: null,
    predictiveData: null,
    performanceMetrics: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const subscriptionsRef = useRef([]);
  const intervalRef = useRef(null);

  // Real-time KPI calculations
  const fetchRealTimeKPIs = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const thisMonth = now.toISOString().slice(0, 7);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 7);

      // Parallel execution for performance
      const [
        todaySales,
        yesterdaySales,
        thisMonthSales,
        lastMonthSales,
        todayTransactions,
        activeProducts,
        lowStockItems,
        revenueByHour,
      ] = await Promise.all([
        // Today's sales
        supabase
          .from("sales")
          .select("total_amount, created_at")
          .eq("status", "completed")
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`),

        // Yesterday's sales
        supabase
          .from("sales")
          .select("total_amount")
          .eq("status", "completed")
          .gte("created_at", `${yesterday}T00:00:00`)
          .lte("created_at", `${yesterday}T23:59:59`),

        // This month's sales
        supabase
          .from("sales")
          .select("total_amount")
          .eq("status", "completed")
          .gte("created_at", `${thisMonth}-01T00:00:00`),

        // Last month's sales
        supabase
          .from("sales")
          .select("total_amount")
          .eq("status", "completed")
          .gte("created_at", `${lastMonth}-01T00:00:00`)
          .lt("created_at", `${thisMonth}-01T00:00:00`),

        // Today's transaction count
        supabase
          .from("sales")
          .select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`),

        // Active products count
        supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),

        // Low stock items - get all products and filter in JavaScript since Supabase doesn't support column comparisons directly
        supabase
          .from("products")
          .select("name, stock_quantity, minimum_stock_level")
          .eq("is_active", true),

        // Hourly revenue for today
        supabase
          .from("sales")
          .select("total_amount, created_at")
          .eq("status", "completed")
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`)
          .order("created_at", { ascending: true }),
      ]);

      // Calculate KPIs
      const todayRevenue =
        todaySales.data?.reduce(
          (sum, sale) => sum + (sale.total_amount || 0),
          0
        ) || 0;
      const yesterdayRevenue =
        yesterdaySales.data?.reduce(
          (sum, sale) => sum + (sale.total_amount || 0),
          0
        ) || 0;
      const thisMonthRevenue =
        thisMonthSales.data?.reduce(
          (sum, sale) => sum + (sale.total_amount || 0),
          0
        ) || 0;
      const lastMonthRevenue =
        lastMonthSales.data?.reduce(
          (sum, sale) => sum + (sale.total_amount || 0),
          0
        ) || 0;

      const todayTransactionCount = todayTransactions.count || 0;
      const avgOrderValue =
        todayTransactionCount > 0 ? todayRevenue / todayTransactionCount : 0;

      // Growth calculations
      const dailyGrowth =
        yesterdayRevenue > 0
          ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
          : 0;
      const monthlyGrowth =
        lastMonthRevenue > 0
          ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      // Hourly revenue distribution
      const hourlyRevenue = Array(24).fill(0);
      revenueByHour.data?.forEach((sale) => {
        const hour = new Date(sale.created_at).getHours();
        hourlyRevenue[hour] += sale.total_amount || 0;
      });

      // Performance indicators
      const peakHour = hourlyRevenue.indexOf(Math.max(...hourlyRevenue));
      const salesVelocity = todayTransactionCount / (new Date().getHours() + 1); // Transactions per hour

      return {
        revenue: {
          today: todayRevenue,
          yesterday: yesterdayRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          dailyGrowth,
          monthlyGrowth,
          hourlyRevenue,
        },
        transactions: {
          today: todayTransactionCount,
          avgOrderValue,
          salesVelocity,
          peakHour,
        },
        inventory: {
          activeProducts: activeProducts.count || 0,
          lowStockCount: lowStockItems.data?.filter(item => 
            item.stock_quantity <= item.minimum_stock_level
          ).length || 0,
          lowStockItems: lowStockItems.data?.filter(item => 
            item.stock_quantity <= item.minimum_stock_level
          ) || [],
        },
        performance: {
          conversionRate: 0, // Would calculate from traffic data
          customerSatisfaction: 0, // Would calculate from feedback
          inventoryTurnover: 0, // Would calculate from sales/stock data
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ [useRealTimeAnalytics] Error fetching KPIs:", error);
      throw error;
    }
  }, []);

  // Sales trends with predictive analytics
  const fetchSalesTrends = useCallback(async () => {
    try {
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { data: salesData, error } = await supabase
        .from("sales")
        .select(
          `
          total_amount,
          created_at,
          sale_items!inner (
            quantity,
            total_price,
            products!inner (
              name,
              category
            )
          )
        `
        )
        .eq("status", "completed")
        .gte("created_at", last30Days.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by day
      const dailySales = {};
      const categoryTrends = {};
      const productPerformance = {};

      salesData.forEach((sale) => {
        const date = sale.created_at.split("T")[0];

        // Daily sales
        if (!dailySales[date]) {
          dailySales[date] = { revenue: 0, transactions: 0, items: 0 };
        }
        dailySales[date].revenue += sale.total_amount || 0;
        dailySales[date].transactions += 1;

        // Category trends
        sale.sale_items.forEach((item) => {
          const category = item.products.category || "Uncategorized";
          if (!categoryTrends[category]) {
            categoryTrends[category] = { revenue: 0, quantity: 0 };
          }
          categoryTrends[category].revenue += item.total_price || 0;
          categoryTrends[category].quantity += item.quantity || 0;
          dailySales[date].items += item.quantity || 0;

          // Product performance
          const productName = item.products.name;
          if (!productPerformance[productName]) {
            productPerformance[productName] = {
              revenue: 0,
              quantity: 0,
              frequency: 0,
            };
          }
          productPerformance[productName].revenue += item.total_price || 0;
          productPerformance[productName].quantity += item.quantity || 0;
          productPerformance[productName].frequency += 1;
        });
      });

      // Predictive analytics (simple linear regression)
      const revenueValues = Object.values(dailySales).map((day) => day.revenue);
      const trend = calculateTrend(revenueValues);
      const forecast = generateForecast(revenueValues, 7); // 7-day forecast

      return {
        dailySales,
        categoryTrends,
        productPerformance,
        trend,
        forecast,
        insights: generateInsights(
          dailySales,
          categoryTrends,
          productPerformance
        ),
      };
    } catch (error) {
      console.error("❌ [useRealTimeAnalytics] Error fetching trends:", error);
      throw error;
    }
  }, []);

  // Customer insights and segmentation
  const fetchCustomerInsights = useCallback(async () => {
    try {
      const { data: salesData, error } = await supabase
        .from("sales")
        .select(
          `
          customer_name,
          customer_phone,
          total_amount,
          created_at,
          payment_method,
          sale_items (
            quantity,
            products (category)
          )
        `
        )
        .eq("status", "completed")
        .not("customer_name", "is", null)
        .gte(
          "created_at",
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        );

      if (error) throw error;

      // Customer segmentation
      const customerData = {};
      salesData.forEach((sale) => {
        const customer = sale.customer_name || "Anonymous";
        if (!customerData[customer]) {
          customerData[customer] = {
            totalSpent: 0,
            visits: 0,
            lastVisit: null,
            preferredCategories: {},
            paymentMethods: {},
            avgOrderValue: 0,
          };
        }

        const data = customerData[customer];
        data.totalSpent += sale.total_amount || 0;
        data.visits += 1;
        data.lastVisit = new Date(
          Math.max(new Date(data.lastVisit || 0), new Date(sale.created_at))
        );

        // Track preferred categories
        sale.sale_items.forEach((item) => {
          const category = item.products?.category || "Uncategorized";
          data.preferredCategories[category] =
            (data.preferredCategories[category] || 0) + item.quantity;
        });

        // Track payment methods
        const method = sale.payment_method || "cash";
        data.paymentMethods[method] = (data.paymentMethods[method] || 0) + 1;
      });

      // Calculate customer segments
      Object.keys(customerData).forEach((customer) => {
        const data = customerData[customer];
        data.avgOrderValue =
          data.visits > 0 ? data.totalSpent / data.visits : 0;

        // Determine customer segment
        if (data.totalSpent > 10000 && data.visits > 10) {
          data.segment = "VIP";
        } else if (data.totalSpent > 5000 || data.visits > 5) {
          data.segment = "Regular";
        } else {
          data.segment = "New";
        }
      });

      return {
        customerData,
        segmentCounts: Object.values(customerData).reduce((acc, customer) => {
          acc[customer.segment] = (acc[customer.segment] || 0) + 1;
          return acc;
        }, {}),
        topCustomers: Object.entries(customerData)
          .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
          .slice(0, 10),
      };
    } catch (error) {
      console.error(
        "❌ [useRealTimeAnalytics] Error fetching customer insights:",
        error
      );
      throw error;
    }
  }, []);

  // Real-time data subscription
  const setupRealTimeSubscriptions = useCallback(() => {
    try {
      // Subscribe to sales table changes
      const salesSubscription = supabase
        .channel("sales-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sales",
          },
          (payload) => {
            console.log("🔔 [RealTime] Sales change detected:", payload);
            // Refresh KPIs when sales change
            fetchRealTimeKPIs().then((kpis) => {
              setAnalyticsData((prev) => ({
                ...prev,
                realTimeKPIs: kpis,
              }));
            });
          }
        )
        .subscribe();

      // Subscribe to inventory changes
      const inventorySubscription = supabase
        .channel("inventory-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "products",
          },
          (payload) => {
            console.log("🔔 [RealTime] Inventory change detected:", payload);
            // Refresh inventory alerts
            if (
              payload.new &&
              payload.new.stock_quantity <= payload.new.minimum_stock_level
            ) {
              setAnalyticsData((prev) => ({
                ...prev,
                inventoryAlerts: [
                  ...(prev.inventoryAlerts || []),
                  {
                    id: payload.new.id,
                    name: payload.new.name,
                    currentStock: payload.new.stock_quantity,
                    minimumLevel: payload.new.minimum_stock_level,
                    severity: "warning",
                    timestamp: new Date().toISOString(),
                  },
                ],
              }));
            }
          }
        )
        .subscribe();

      subscriptionsRef.current = [salesSubscription, inventorySubscription];
      setConnectionStatus("connected");

      console.log("🔔 [RealTime] Subscriptions established");
    } catch (error) {
      console.error("❌ [RealTime] Subscription error:", error);
      setConnectionStatus("error");
    }
  }, [fetchRealTimeKPIs]);

  // Load all analytics data
  const loadAllAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [kpis, trends, customerInsights] = await Promise.all([
        fetchRealTimeKPIs(),
        fetchSalesTrends(),
        fetchCustomerInsights(),
      ]);

      setAnalyticsData({
        realTimeKPIs: kpis,
        salesTrends: trends,
        customerInsights,
        inventoryAlerts: kpis.inventory.lowStockItems.map((item) => ({
          id: item.name,
          name: item.name,
          currentStock: item.stock_quantity,
          minimumLevel: item.minimum_stock_level,
          severity: "warning",
          timestamp: new Date().toISOString(),
        })),
        predictiveData: trends.forecast,
        performanceMetrics: calculatePerformanceMetrics(kpis, trends),
      });

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error("❌ [useRealTimeAnalytics] Error loading analytics:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRealTimeKPIs, fetchSalesTrends, fetchCustomerInsights]);

  // Setup effect
  useEffect(() => {
    loadAllAnalytics();
    setupRealTimeSubscriptions();

    // Set up periodic refresh
    intervalRef.current = setInterval(loadAllAnalytics, refreshInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      subscriptionsRef.current.forEach((subscription) => {
        subscription.unsubscribe();
      });
      setConnectionStatus("disconnected");
    };
  }, [loadAllAnalytics, setupRealTimeSubscriptions, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return loadAllAnalytics();
  }, [loadAllAnalytics]);

  return {
    data: analyticsData,
    isLoading,
    error,
    lastUpdated,
    connectionStatus,
    refresh,
  };
};

// Helper functions
function calculateTrend(values) {
  if (values.length < 2) return 0;

  const n = values.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = values.reduce((sum, val) => sum + val, 0);
  const xySum = values.reduce((sum, val, i) => sum + i * val, 0);
  const xSquareSum = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * xySum - xSum * ySum) / (n * xSquareSum - xSum * xSum);
  return slope;
}

function generateForecast(values, days) {
  const trend = calculateTrend(values);
  const lastValue = values[values.length - 1] || 0;

  return Array(days)
    .fill(0)
    .map((_, i) => ({
      day: i + 1,
      predicted: Math.max(0, lastValue + trend * (i + 1)),
      confidence: Math.max(0.5, 1 - i * 0.1), // Decreasing confidence
    }));
}

function generateInsights(dailySales, categoryTrends, productPerformance) {
  const insights = [];

  // Revenue trend insight
  const revenueValues = Object.values(dailySales).map((day) => day.revenue);
  const trend = calculateTrend(revenueValues);
  if (trend > 0) {
    insights.push({
      type: "positive",
      title: "Growing Revenue",
      description: `Sales are trending upward with a daily growth rate of ${(
        trend * 100
      ).toFixed(1)}%`,
    });
  } else if (trend < 0) {
    insights.push({
      type: "warning",
      title: "Declining Revenue",
      description: `Sales are trending downward. Consider promotional activities.`,
    });
  }

  // Top category insight
  const topCategory = Object.entries(categoryTrends).sort(
    ([, a], [, b]) => b.revenue - a.revenue
  )[0];
  if (topCategory) {
    insights.push({
      type: "info",
      title: "Top Category",
      description: `${topCategory[0]} generates ${(
        (topCategory[1].revenue /
          Object.values(categoryTrends).reduce(
            (sum, cat) => sum + cat.revenue,
            0
          )) *
        100
      ).toFixed(1)}% of revenue`,
    });
  }

  // Top product insight
  const topProduct = Object.entries(productPerformance).sort(
    ([, a], [, b]) => b.revenue - a.revenue
  )[0];
  if (topProduct) {
    insights.push({
      type: "info",
      title: "Best Selling Product",
      description: `${
        topProduct[0]
      } is your top performer with ₱${topProduct[1].revenue.toFixed(
        2
      )} in sales`,
    });
  }

  return insights;
}

function calculatePerformanceMetrics(kpis, trends) {
  const trendDirection =
    trends.trend > 0 ? "positive" : trends.trend < 0 ? "negative" : "stable";

  return {
    revenueGrowthRate: kpis.revenue.dailyGrowth,
    inventoryTurnover: 0, // Would calculate from inventory data
    customerRetentionRate: 0, // Would calculate from customer data
    profitMargin: 0, // Would calculate from cost data
    salesEfficiency: kpis.transactions.salesVelocity,
    stockoutRisk: kpis.inventory.lowStockCount / kpis.inventory.activeProducts,
    trendDirection,
    forecastAccuracy: trends.forecast ? 0.85 : 0, // Mock accuracy score
  };
}
