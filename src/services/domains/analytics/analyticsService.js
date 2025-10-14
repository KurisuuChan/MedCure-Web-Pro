import { supabase } from "../../../config/supabase";

/**
 * Advanced Analytics Service
 * Provides business intelligence data for dashboards and reports
 */
export class AnalyticsService {
  // ==================== SALES ANALYTICS ====================

  /**
   * Get comprehensive sales analytics for specified period
   */
  static async getSalesAnalytics(period = "30days") {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);

      const { data: salesData, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (
              name,
              category,
              price_per_piece
            )
          )
        `
        )
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return this.processSalesData(salesData);
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      throw error;
    }
  }

  /**
   * Get real-time sales KPIs
   */
  static async getSalesKPIs() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      // Today's sales - ONLY COMPLETED TRANSACTIONS
      const { data: todaySales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      // This month's sales - ONLY COMPLETED TRANSACTIONS
      const { data: monthSales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", `${thisMonth}-01T00:00:00`);

      // Transaction count today - ONLY COMPLETED TRANSACTIONS
      const { count: todayTransactions } = await supabase
        .from("sales")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      // Average order value today
      const todayRevenue =
        todaySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) ||
        0;
      const avgOrderValue =
        todayTransactions > 0 ? todayRevenue / todayTransactions : 0;

      return {
        todayRevenue,
        monthRevenue:
          monthSales?.reduce(
            (sum, sale) => sum + (sale.total_amount || 0),
            0
          ) || 0,
        todayTransactions: todayTransactions || 0,
        avgOrderValue,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching sales KPIs:", error);
      throw error;
    }
  }

  // ==================== INVENTORY ANALYTICS ====================

  /**
   * Get inventory analytics and optimization insights
   */
  static async getInventoryAnalytics() {
    try {
      const { data: products, error } = await supabase.from("products").select(`
          *,
          sale_items (
            quantity,
            created_at
          )
        `);

      if (error) throw error;

      return this.processInventoryData(products);
    } catch (error) {
      console.error("Error fetching inventory analytics:", error);
      throw error;
    }
  }

  /**
   * Get low stock alerts and recommendations
   */
  static async getLowStockAlerts() {
    try {
      const { data: lowStockProducts, error } = await supabase
        .from("products")
        .select("*")
        .or("stock_in_pieces.lte.10,stock_in_pieces.eq.0")
        .order("stock_in_pieces", { ascending: true });

      if (error) throw error;

      return lowStockProducts.map((product) => ({
        ...product,
        alertLevel: product.stock_in_pieces === 0 ? "critical" : "warning",
        recommendedAction:
          product.stock_in_pieces === 0
            ? "Immediate restock needed"
            : "Reorder soon",
        daysToStockout: this.calculateDaysToStockout(product),
      }));
    } catch (error) {
      console.error("Error fetching low stock alerts:", error);
      throw error;
    }
  }

  /**
   * Get expiry alerts for products
   */
  static async getExpiryAlerts() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringProducts, error } = await supabase
        .from("products")
        .select("*")
        .not("expiry_date", "is", null)
        .lte("expiry_date", thirtyDaysFromNow.toISOString())
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      return expiringProducts.map((product) => {
        const daysToExpiry = Math.ceil(
          (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...product,
          daysToExpiry,
          alertLevel: this.getAlertLevel(daysToExpiry),
          recommendedAction: this.getRecommendedAction(daysToExpiry),
        };
      });
    } catch (error) {
      console.error("Error fetching expiry alerts:", error);
      throw error;
    }
  }

  // ==================== PROFIT ANALYTICS ====================

  /**
   * Get profit margin analysis by product and category
   */
  static async getProfitAnalytics(period = "30days") {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);

      const { data: salesData, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            unit_price,
            total_price,
            products (
              name,
              category,
              price_per_piece
            )
          )
        `
        )
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      return this.processProfitData(salesData);
    } catch (error) {
      console.error("Error fetching profit analytics:", error);
      throw error;
    }
  }

  // ==================== TREND ANALYTICS ====================

  /**
   * Get sales trend data for charts
   */
  static async getSalesTrends(period = "30days") {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);

      const { data: salesData, error } = await supabase
        .from("sales")
        .select("total_amount, created_at")
        .eq("status", "completed") // ✅ CRITICAL: Only completed transactions
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return this.groupSalesByPeriod(salesData, period);
    } catch (error) {
      console.error("Error fetching sales trends:", error);
      throw error;
    }
  }

  /**
   * Get top performing products
   */
  static async getTopProducts(limit = 10, period = "30days") {
    try {
      const { startDate, endDate } = this.getPeriodDates(period);

      const { data: topProducts, error } = await supabase
        .from("sale_items")
        .select(
          `
          quantity,
          total_price,
          products (
            id,
            name,
            category,
            price_per_piece
          ),
          sales!inner (
            created_at
          )
        `
        )
        .gte("sales.created_at", startDate)
        .lte("sales.created_at", endDate);

      if (error) throw error;

      return this.processTopProducts(topProducts, limit);
    } catch (error) {
      console.error("Error fetching top products:", error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get date range for specified period
   */
  static getPeriodDates(period) {
    const endDate = new Date();
    // Set end date to end of today (23:59:59)
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();

    switch (period) {
      case "7days":
        startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 29); // Last 30 days including today
        break;
      case "90days":
        startDate.setDate(startDate.getDate() - 89); // Last 90 days including today
        break;
      case "365days":
        startDate.setDate(startDate.getDate() - 364); // Last 365 days including today
        break;
      case "thisYear":
        startDate.setMonth(0, 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 29); // Default 30 days including today
    }

    // Set start date to beginning of that day (00:00:00)
    startDate.setHours(0, 0, 0, 0);

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  /**
   * Process raw sales data into analytics
   */
  static processSalesData(salesData) {
    const totalRevenue = salesData.reduce(
      (sum, sale) => sum + (sale.total_amount || 0),
      0
    );
    const totalTransactions = salesData.length;
    const avgOrderValue =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate total items sold
    const totalItemsSold = salesData.reduce((sum, sale) => {
      return (
        sum +
        (sale.sale_items?.reduce(
          (itemSum, item) => itemSum + item.quantity,
          0
        ) || 0)
      );
    }, 0);

    // Group by category
    const categoryBreakdown = this.groupSalesByCategory(salesData);

    return {
      totalRevenue,
      totalTransactions,
      avgOrderValue,
      totalItemsSold,
      categoryBreakdown,
      salesData,
    };
  }

  /**
   * Process inventory data for analytics
   */
  static processInventoryData(products) {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => {
      return sum + product.stock_in_pieces * (product.price_per_piece * 0.7); // Estimated cost at 70% of selling price
    }, 0);

    const lowStockCount = products.filter(
      (p) => p.stock_in_pieces <= (p.reorder_level || 10)
    ).length;
    const outOfStockCount = products.filter(
      (p) => p.stock_in_pieces === 0
    ).length;

    // Calculate inventory turnover (simplified)
    const fastMoving = products.filter((p) => {
      const recentSales =
        p.sale_items?.filter((item) => {
          const saleDate = new Date(item.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return saleDate >= thirtyDaysAgo;
        }) || [];
      return recentSales.length > 5;
    }).length;

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      fastMoving,
      slowMoving: totalProducts - fastMoving,
      averageValue: totalProducts > 0 ? totalValue / totalProducts : 0,
    };
  }

  /**
   * Process profit data analysis
   */
  static processProfitData(salesData) {
    let totalRevenue = 0;
    let totalCost = 0;
    const categoryProfits = {};

    salesData.forEach((sale) => {
      sale.sale_items?.forEach((item) => {
        const revenue = item.total_price || 0;
        const cost =
          (item.products?.price_per_piece * 0.7 || 0) * item.quantity; // Estimated cost at 70% of selling price

        totalRevenue += revenue;
        totalCost += cost;

        const category = item.products?.category || "Uncategorized";
        if (!categoryProfits[category]) {
          categoryProfits[category] = {
            revenue: 0,
            cost: 0,
            profit: 0,
            margin: 0,
          };
        }

        categoryProfits[category].revenue += revenue;
        categoryProfits[category].cost += cost;
      });
    });

    // Calculate margins
    Object.keys(categoryProfits).forEach((category) => {
      const data = categoryProfits[category];
      data.profit = data.revenue - data.cost;
      data.margin = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
    });

    const totalProfit = totalRevenue - totalCost;
    const overallMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      overallMargin,
      categoryProfits,
    };
  }

  /**
   * Group sales by category
   */
  static groupSalesByCategory(salesData) {
    const categories = {};

    salesData.forEach((sale) => {
      sale.sale_items?.forEach((item) => {
        const category = item.products?.category || "Uncategorized";
        if (!categories[category]) {
          categories[category] = { count: 0, revenue: 0 };
        }
        categories[category].count += item.quantity;
        categories[category].revenue += item.total_price || 0;
      });
    });

    return categories;
  }

  /**
   * Group sales by time period for trend analysis
   */
  static groupSalesByPeriod(salesData, period) {
    const grouped = {};

    // First, group existing sales data
    salesData.forEach((sale) => {
      const date = new Date(sale.created_at);
      let key;

      if (period === "7days" || period === "30days") {
        // ✅ FIX: Use local date instead of UTC date
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        key = `${year}-${month}-${day}`; // Local date
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`; // Monthly
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, revenue: 0, transactions: 0 };
      }

      grouped[key].revenue += sale.total_amount || 0;
      grouped[key].transactions += 1;
    });

    // ✅ FIX: Fill in missing days with zero values
    if (period === "7days" || period === "30days") {
      const { startDate, endDate } = this.getPeriodDates(period);
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Loop through each day in the range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        // ✅ FIX: Use local date for filling gaps too
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const key = `${year}-${month}-${day}`;

        if (!grouped[key]) {
          grouped[key] = { date: key, revenue: 0, transactions: 0 };
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Process top products data
   */
  static processTopProducts(salesItems, limit) {
    const productStats = {};

    salesItems.forEach((item) => {
      const productId = item.products?.id;
      if (!productId) return;

      if (!productStats[productId]) {
        productStats[productId] = {
          ...item.products,
          totalQuantity: 0,
          totalRevenue: 0,
          transactionCount: 0,
        };
      }

      productStats[productId].totalQuantity += item.quantity;
      productStats[productId].totalRevenue += item.total_price || 0;
      productStats[productId].transactionCount += 1;
    });

    return Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /**
   * Calculate days to stockout based on sales velocity
   */
  static calculateDaysToStockout(product) {
    // Simplified calculation - in real implementation, use historical sales data
    const dailyUsage = 1; // Default assumption
    return product.stock_in_pieces > 0
      ? Math.floor(product.stock_in_pieces / dailyUsage)
      : 0;
  }

  // Helper methods for alert processing
  static getAlertLevel(daysToExpiry) {
    if (daysToExpiry <= 7) return "critical";
    if (daysToExpiry <= 14) return "warning";
    return "info";
  }

  static getRecommendedAction(daysToExpiry) {
    if (daysToExpiry <= 0) return "Remove expired product";
    if (daysToExpiry <= 7) return "Urgent sale needed";
    return "Plan promotion";
  }
}
