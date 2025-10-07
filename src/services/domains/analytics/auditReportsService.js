import { supabase } from "../../../config/supabase";

// ==========================================
// AUDIT SERVICE
// ==========================================
export const AuditService = {
  // Get audit logs with filtering and pagination
  getAuditLogs: async (filters = {}) => {
    try {
      console.log(
        "🔍 [AuditService] Fetching audit logs with filters:",
        filters
      );

      const {
        limit = 50,
        offset = 0,
        action_type = "all",
        user_id = null,
        date_from = null,
        date_to = null,
        // search parameter intentionally unused as it's reserved for future implementation
        // eslint-disable-next-line no-unused-vars
        search = null,
      } = filters;

      // Query stock movements as audit trail
      let query = supabase
        .from("stock_movements")
        .select(
          `
          id,
          movement_type,
          quantity,
          reason,
          stock_before,
          stock_after,
          created_at,
          reference_type,
          reference_id,
          products!inner(generic_name, brand_name, category),
          users!inner(first_name, last_name, email, role)
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (action_type !== "all") {
        query = query.eq("movement_type", action_type);
      }

      if (user_id) {
        query = query.eq("user_id", user_id);
      }

      if (date_from) {
        query = query.gte("created_at", date_from);
      }

      if (date_to) {
        query = query.lte("created_at", date_to);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error("❌ [AuditService] Error fetching audit logs:", error);
        return {
          success: false,
          error: error.message,
          data: [],
        };
      }

      // Transform data for audit display
      const auditLogs = data.map((log) => ({
        id: log.id,
        action: getActionDescription(log),
        user: `${log.users.first_name} ${log.users.last_name}`,
        userRole: log.users.role,
        userEmail: log.users.email,
        details: getActionDetails(log),
        timestamp: log.created_at,
        product: log.products.generic_name,
        productBrand: log.products.brand_name,
        category: log.products.category,
        quantity: log.quantity,
        stockBefore: log.stock_before,
        stockAfter: log.stock_after,
        referenceType: log.reference_type,
        referenceId: log.reference_id,
      }));

      console.log(
        "✅ [AuditService] Audit logs fetched successfully:",
        auditLogs.length
      );
      return {
        success: true,
        data: auditLogs,
        total: auditLogs.length,
      };
    } catch (error) {
      console.error("❌ [AuditService] Error in getAuditLogs:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Get audit summary statistics
  getAuditSummary: async (dateRange = 30) => {
    try {
      console.log(
        "📊 [AuditService] Fetching audit summary for last",
        dateRange,
        "days"
      );

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - dateRange);

      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          "movement_type, created_at, users!inner(id, first_name, last_name)"
        )
        .gte("created_at", fromDate.toISOString());

      if (error) {
        console.error("❌ [AuditService] Error fetching audit summary:", error);
        return {
          success: false,
          error: error.message,
          data: null,
        };
      }

      // Calculate summary statistics
      const summary = {
        totalActions: data.length,
        stockIn: data.filter((log) => log.movement_type === "in").length,
        stockOut: data.filter((log) => log.movement_type === "out").length,
        adjustments: data.filter((log) => log.movement_type === "adjustment")
          .length,
        uniqueUsers: [...new Set(data.map((log) => log.users.id))].length,
        dateRange: dateRange,
        fromDate: fromDate.toISOString(),
        toDate: new Date().toISOString(),
      };

      console.log("✅ [AuditService] Audit summary calculated:", summary);
      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      console.error("❌ [AuditService] Error in getAuditSummary:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Get user activity logs
  getUserActivityLogs: async (userId, limit = 20) => {
    try {
      console.log(
        "👤 [AuditService] Fetching user activity logs for user:",
        userId
      );

      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
          id,
          movement_type,
          quantity,
          reason,
          created_at,
          products!inner(generic_name, brand_name)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ [AuditService] Error fetching user activity:", error);
        return {
          success: false,
          error: error.message,
          data: [],
        };
      }

      console.log("✅ [AuditService] User activity logs fetched:", data.length);
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("❌ [AuditService] Error in getUserActivityLogs:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },
};

// ==========================================
// REPORTS SERVICE
// ==========================================
export const ReportsService = {
  // Generate sales report
  generateSalesReport: async (dateRange = {}) => {
    try {
      console.log(
        "📈 [ReportsService] Generating sales report with range:",
        dateRange
      );

      const {
        startDate = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate = new Date().toISOString(),
      } = dateRange;

      // Ensure we're using the full day range (start of day to end of day)
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      const adjustedStartDate = startDateTime.toISOString();
      const adjustedEndDate = endDateTime.toISOString();

      console.log(
        "🔍 [ReportsService] Querying sales from",
        adjustedStartDate,
        "to",
        adjustedEndDate
      );

      // First, check if there are ANY sales in the database for diagnostics
      const { data: allSales, error: checkError } = await supabase
        .from("sales")
        .select("id, created_at, status, total_amount")
        .order("created_at", { ascending: false })
        .limit(10);

      if (checkError) {
        console.error("❌ [ReportsService] Error checking sales:", checkError);
      } else {
        console.log(
          "📊 [ReportsService] Recent sales in database:",
          allSales?.length || 0,
          "records"
        );
        if (allSales && allSales.length > 0) {
          console.log("📋 [ReportsService] Most recent sale:", {
            date: allSales[0].created_at,
            status: allSales[0].status,
            amount: allSales[0].total_amount,
          });
          console.log("📋 [ReportsService] Oldest in recent 10:", {
            date: allSales[allSales.length - 1].created_at,
            status: allSales[allSales.length - 1].status,
          });
        }
      }

      // Use the SAME query structure as transactionService.getTransactions()
      // This ensures we get the same data that works in Transaction History
      let query = supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price,
            products (
              id,
              generic_name,
              brand_name,
              category,
              cost_price,
              price_per_piece
            )
          )
        `
        )
        .gte("created_at", adjustedStartDate)
        .lte("created_at", adjustedEndDate)
        .order("created_at", { ascending: false });

      const { data: salesData, error: salesError } = await query;

      console.log(
        "📊 [ReportsService] Found",
        salesData?.length || 0,
        "sales records in date range"
      );

      if (salesError) {
        console.error(
          "❌ [ReportsService] Error fetching sales data:",
          salesError
        );
        return {
          success: false,
          error: salesError.message,
          data: null,
        };
      }

      console.log(
        "📋 [ReportsService] Raw sales data sample:",
        salesData?.[0]
          ? {
              id: salesData[0].id?.substring(0, 8),
              status: salesData[0].status,
              total_amount: salesData[0].total_amount,
              items_count: salesData[0].sale_items?.length || 0,
              created_at: salesData[0].created_at,
            }
          : "No data"
      );

      // Filter only completed sales (same logic as transaction history)
      const completedSalesData =
        salesData?.filter((sale) => sale.status === "completed") || [];
      console.log(
        "✅ [ReportsService] Found",
        completedSalesData.length,
        "completed sales out of",
        salesData?.length || 0,
        "total"
      );

      // Use completed sales data for report
      const reportData = completedSalesData;

      // Calculate report metrics
      const report = {
        period: {
          startDate,
          endDate,
          days: Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
          ),
        },
        summary: {
          totalSales: 0,
          totalCost: 0,
          grossProfit: 0,
          profitMargin: 0,
          totalTransactions: reportData.length,
          averageTransaction: 0,
          averageCost: 0,
          averageProfit: 0,
          uniqueCustomers: [...new Set(reportData.map((sale) => sale.user_id))]
            .length,
        },
        paymentMethods: {
          cash: reportData
            .filter((sale) => sale.payment_method === "cash")
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
          card: reportData
            .filter((sale) => sale.payment_method === "card")
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
          digital: reportData
            .filter((sale) => sale.payment_method === "digital")
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0),
        },
        topProducts: getTopProducts(reportData),
        dailyTrends: getDailyTrends(reportData),
        categoryBreakdown: getCategoryBreakdown(reportData),
      };

      // Calculate comprehensive cost and profit metrics
      reportData.forEach((sale) => {
        const saleRevenue = parseFloat(sale.total_amount || 0);
        report.summary.totalSales += saleRevenue;

        // Calculate cost from sale_items (same structure as transaction history)
        if (sale.sale_items && Array.isArray(sale.sale_items)) {
          sale.sale_items.forEach((item) => {
            const costPrice = item.products?.cost_price || 0;
            const quantity = item.quantity || 0;
            const itemCost = costPrice * quantity;
            report.summary.totalCost += itemCost;

            console.log("💰 [ReportsService] Item cost calculation:", {
              product: item.products?.generic_name || item.products?.brand_name,
              cost_price: costPrice,
              quantity: quantity,
              item_cost: itemCost,
            });
          });
        }
      });

      // Calculate derived metrics
      report.summary.grossProfit =
        report.summary.totalSales - report.summary.totalCost;
      report.summary.profitMargin =
        report.summary.totalSales > 0
          ? (report.summary.grossProfit / report.summary.totalSales) * 100
          : 0;
      report.summary.averageTransaction =
        reportData.length > 0
          ? report.summary.totalSales / reportData.length
          : 0;
      report.summary.averageCost =
        reportData.length > 0
          ? report.summary.totalCost / reportData.length
          : 0;
      report.summary.averageProfit =
        reportData.length > 0
          ? report.summary.grossProfit / reportData.length
          : 0;

      console.log("✅ [ReportsService] Sales report generated successfully");
      console.log("📊 Transactions:", report.summary.totalTransactions);
      console.log("📊 Revenue:", report.summary.totalSales.toFixed(2));
      console.log("💰 Cost:", report.summary.totalCost.toFixed(2));
      console.log("📈 Profit:", report.summary.grossProfit.toFixed(2));
      console.log("📊 Margin:", report.summary.profitMargin.toFixed(2) + "%");
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      console.error("❌ [ReportsService] Error in generateSalesReport:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Generate inventory report
  generateInventoryReport: async () => {
    try {
      console.log("📦 [ReportsService] Generating inventory report");

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
          id,
          generic_name,
          brand_name,
          category,
          stock_in_pieces,
          reorder_level,
          price_per_piece,
          cost_price,
          expiry_date,
          is_active,
          is_archived,
          created_at
        `
        )
        .eq("is_active", true)
        .eq("is_archived", false);

      if (productsError) {
        console.error(
          "❌ [ReportsService] Error fetching products:",
          productsError
        );
        return {
          success: false,
          error: productsError.message,
          data: null,
        };
      }

      // Calculate inventory metrics
      const report = {
        summary: {
          totalProducts: productsData.length,
          totalStockValue: productsData.reduce(
            (sum, product) =>
              sum + product.stock_in_pieces * product.price_per_piece,
            0
          ),
          totalCostValue: productsData.reduce(
            (sum, product) =>
              sum + product.stock_in_pieces * (product.cost_price || 0),
            0
          ),
          averageStockLevel:
            productsData.length > 0
              ? productsData.reduce(
                  (sum, product) => sum + product.stock_in_pieces,
                  0
                ) / productsData.length
              : 0,
        },
        stockLevels: {
          outOfStock: productsData.filter((p) => p.stock_in_pieces === 0)
            .length,
          lowStock: productsData.filter(
            (p) => p.stock_in_pieces <= (p.reorder_level || 10)
          ).length,
          normalStock: productsData.filter(
            (p) => p.stock_in_pieces > (p.reorder_level || 10)
          ).length,
        },
        expiryAnalysis: getExpiryAnalysis(productsData),
        categoryAnalysis: getInventoryCategoryAnalysis(productsData),
        topValueProducts: getTopValueProducts(productsData),
        lowStockAlerts: productsData.filter(
          (p) => p.stock_in_pieces <= (p.reorder_level || 10)
        ),
      };

      console.log(
        "✅ [ReportsService] Inventory report generated successfully"
      );
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      console.error(
        "❌ [ReportsService] Error in generateInventoryReport:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Generate financial report
  generateFinancialReport: async (dateRange = {}) => {
    try {
      console.log("💰 [ReportsService] Generating financial report");

      const {
        startDate = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDate = new Date().toISOString(),
      } = dateRange;

      console.log(
        "🔍 [ReportsService] Querying financial data from",
        startDate,
        "to",
        endDate
      );

      // Ensure we're using the full day range
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);

      const adjustedStartDate = startDateTime.toISOString();
      const adjustedEndDate = endDateTime.toISOString();

      console.log(
        "📊 [ReportsService] Adjusted date range:",
        adjustedStartDate,
        "to",
        adjustedEndDate
      );

      // First, check what sales exist
      const { data: recentSales } = await supabase
        .from("sales")
        .select("id, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);

      console.log(
        "🔍 [ReportsService] Recent sales check:",
        recentSales?.length || 0,
        "found"
      );
      if (recentSales && recentSales.length > 0) {
        console.log("📅 Most recent sale:", recentSales[0].created_at);
      }

      // Use the SAME query structure as transactionService for consistency
      const [salesResult, productsResult] = await Promise.all([
        supabase
          .from("sales")
          .select(
            `
            *,
            sale_items (
              id,
              product_id,
              quantity,
              unit_type,
              unit_price,
              total_price,
              products (
                id,
                generic_name,
                brand_name,
                cost_price,
                price_per_piece
              )
            )
          `
          )
          .gte("created_at", adjustedStartDate)
          .lte("created_at", adjustedEndDate),

        supabase
          .from("products")
          .select("stock_in_pieces, cost_price, price_per_piece")
          .eq("is_active", true)
          .eq("is_archived", false),
      ]);

      if (salesResult.error || productsResult.error) {
        console.error(
          "❌ [ReportsService] Error fetching financial data:",
          salesResult.error || productsResult.error
        );
        return {
          success: false,
          error: (salesResult.error || productsResult.error).message,
          data: null,
        };
      }

      // Filter only completed sales
      const completedSales =
        salesResult.data?.filter((sale) => sale.status === "completed") || [];
      console.log(
        "📊 [ReportsService] Found",
        salesResult.data?.length || 0,
        "total sales,",
        completedSales.length,
        "completed"
      );

      if (completedSales.length > 0) {
        console.log("📋 [ReportsService] Sample completed sale:", {
          id: completedSales[0].id?.substring(0, 8),
          total_amount: completedSales[0].total_amount,
          items_count: completedSales[0].sale_items?.length || 0,
          created_at: completedSales[0].created_at,
        });
      }

      // Calculate comprehensive financial metrics using completed sales only
      const totalRevenue = completedSales.reduce(
        (sum, sale) => sum + parseFloat(sale.total_amount || 0),
        0
      );

      // Calculate Cost of Goods Sold (COGS) using the same logic as sales report
      const totalCOGS = completedSales.reduce((sum, sale) => {
        if (!sale.sale_items || !Array.isArray(sale.sale_items)) return sum;

        return (
          sum +
          sale.sale_items.reduce((itemSum, item) => {
            const costPrice = item.products?.cost_price || 0;
            const quantity = item.quantity || 0;
            return itemSum + costPrice * quantity;
          }, 0)
        );
      }, 0);

      const grossProfit = totalRevenue - totalCOGS;
      const profitMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const netProfit = grossProfit; // Simplified (no operating expenses tracked)

      const inventoryValue = productsResult.data.reduce(
        (sum, product) =>
          sum + product.stock_in_pieces * (product.cost_price || 0),
        0
      );

      // Calculate inventory turnover (COGS / Average Inventory)
      // Using current inventory as approximation
      const inventoryTurnover =
        inventoryValue > 0 ? totalCOGS / inventoryValue : 0;

      // Calculate ROI
      const roi = totalCOGS > 0 ? (grossProfit / totalCOGS) * 100 : 0;

      const daysInPeriod = Math.max(
        1,
        Math.ceil(
          (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
        )
      );

      const report = {
        period: {
          startDate,
          endDate,
          days: daysInPeriod,
        },
        revenue: {
          total: totalRevenue,
          average:
            completedSales.length > 0
              ? totalRevenue / completedSales.length
              : 0,
          daily: totalRevenue / daysInPeriod,
          growth: 0, // Could be calculated with historical comparison
        },
        costs: {
          total: totalCOGS,
          average:
            completedSales.length > 0 ? totalCOGS / completedSales.length : 0,
          daily: totalCOGS / daysInPeriod,
          percentage: totalRevenue > 0 ? (totalCOGS / totalRevenue) * 100 : 0,
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          margin: profitMargin,
          average:
            completedSales.length > 0 ? grossProfit / completedSales.length : 0,
          daily: grossProfit / daysInPeriod,
          roi: roi,
        },
        inventory: {
          currentValue: inventoryValue,
          turnover: inventoryTurnover,
          daysInventory: inventoryTurnover > 0 ? 365 / inventoryTurnover : 0,
        },
        transactions: {
          count: completedSales.length,
          averageValue: totalRevenue / Math.max(1, completedSales.length),
          dailyAverage: completedSales.length / daysInPeriod,
        },
      };

      console.log(
        "✅ [ReportsService] Financial report generated successfully"
      );
      console.log("📊 Transactions:", completedSales.length);
      console.log("💰 Revenue:", totalRevenue.toFixed(2));
      console.log("📉 COGS:", totalCOGS.toFixed(2));
      console.log("📈 Profit:", grossProfit.toFixed(2));
      console.log("📊 Margin:", profitMargin.toFixed(2) + "%");
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      console.error(
        "❌ [ReportsService] Error in generateFinancialReport:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Export report data to CSV format
  exportReportToCSV: async (reportType, reportData) => {
    try {
      console.log("📄 [ReportsService] Exporting report to CSV:", reportType);

      let csvContent = "";

      switch (reportType) {
        case "sales":
          csvContent = generateSalesCSV(reportData);
          break;
        case "inventory":
          csvContent = generateInventoryCSV(reportData);
          break;
        case "financial":
          csvContent = generateFinancialCSV(reportData);
          break;
        default:
          throw new Error("Unsupported report type");
      }

      return {
        success: true,
        data: csvContent,
        filename: `${reportType}_report_${
          new Date().toISOString().split("T")[0]
        }.csv`,
      };
    } catch (error) {
      console.error("❌ [ReportsService] Error in exportReportToCSV:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getActionDescription(log) {
  switch (log.movement_type) {
    case "in":
      return "Stock Added";
    case "out":
      return "Stock Removed";
    case "adjustment":
      return "Stock Adjusted";
    default:
      return "Stock Movement";
  }
}

function getActionDetails(log) {
  const product = log.products.generic_name;
  const quantity = Math.abs(log.quantity);
  let action;
  if (log.movement_type === "in") {
    action = "added to";
  } else if (log.movement_type === "out") {
    action = "removed from";
  } else {
    action = "adjusted for";
  }

  return `${quantity} units ${action} ${product} (${log.stock_before} → ${log.stock_after})`;
}

function getTopProducts(salesData) {
  const productSales = {};

  salesData.forEach((sale) => {
    sale.sale_items.forEach((item) => {
      const productName = item.products.generic_name;
      if (!productSales[productName]) {
        productSales[productName] = {
          name: productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[productName].quantity += item.quantity;
      productSales[productName].revenue += parseFloat(item.total_price);
    });
  });

  return Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function getDailyTrends(salesData) {
  const dailySales = {};

  salesData.forEach((sale) => {
    const date = sale.created_at.split("T")[0];
    if (!dailySales[date]) {
      dailySales[date] = {
        date,
        sales: 0,
        transactions: 0,
      };
    }
    dailySales[date].sales += parseFloat(sale.total_amount);
    dailySales[date].transactions += 1;
  });

  return Object.values(dailySales).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
}

function getCategoryBreakdown(salesData) {
  const categoryStats = {};

  salesData.forEach((sale) => {
    sale.sale_items.forEach((item) => {
      const category = item.products.category || "Uncategorized";
      if (!categoryStats[category]) {
        categoryStats[category] = {
          category,
          revenue: 0,
          quantity: 0,
        };
      }
      categoryStats[category].revenue += parseFloat(item.total_price);
      categoryStats[category].quantity += item.quantity;
    });
  });

  return Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
}

function getExpiryAnalysis(products) {
  const now = new Date();
  const analysis = {
    expired: 0,
    expiring30: 0,
    expiring90: 0,
    valid: 0,
  };

  products.forEach((product) => {
    if (!product.expiry_date) {
      analysis.valid++;
      return;
    }

    const expiryDate = new Date(product.expiry_date);
    const daysUntilExpiry = Math.ceil(
      (expiryDate - now) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      analysis.expired++;
    } else if (daysUntilExpiry <= 30) {
      analysis.expiring30++;
    } else if (daysUntilExpiry <= 90) {
      analysis.expiring90++;
    } else {
      analysis.valid++;
    }
  });

  return analysis;
}

function getInventoryCategoryAnalysis(products) {
  const categoryStats = {};

  products.forEach((product) => {
    const category = product.category || "Uncategorized";
    if (!categoryStats[category]) {
      categoryStats[category] = {
        category,
        products: 0,
        totalValue: 0,
        totalStock: 0,
      };
    }
    categoryStats[category].products++;
    categoryStats[category].totalValue +=
      product.stock_in_pieces * product.price_per_piece;
    categoryStats[category].totalStock += product.stock_in_pieces;
  });

  return Object.values(categoryStats).sort(
    (a, b) => b.totalValue - a.totalValue
  );
}

function getTopValueProducts(products) {
  return products
    .map((product) => ({
      ...product,
      totalValue: product.stock_in_pieces * product.price_per_piece,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);
}

function generateSalesCSV(reportData) {
  let csv =
    "Date,Transaction Count,Total Revenue,Average Transaction,Payment Method Breakdown\n";

  reportData.dailyTrends.forEach((day) => {
    csv += `${day.date},${day.transactions},${day.sales},${
      day.sales / day.transactions
    }\n`;
  });

  return csv;
}

function generateInventoryCSV(reportData) {
  let csv = "Product Name,Category,Stock Level,Unit Price,Total Value,Status\n";

  reportData.topValueProducts.forEach((product) => {
    let status;
    if (product.stock_in_pieces === 0) {
      status = "Out of Stock";
    } else if (product.stock_in_pieces <= product.reorder_level) {
      status = "Low Stock";
    } else {
      status = "Normal";
    }
    csv += `${product.generic_name},${product.category},${product.stock_in_pieces},${product.price_per_piece},${product.totalValue},${status}\n`;
  });

  return csv;
}

function generateFinancialCSV(reportData) {
  let csv = "Metric,Value\n";
  csv += `Total Revenue,${reportData.revenue.total.toFixed(2)}\n`;
  csv += `Total Costs (COGS),${reportData.costs.total.toFixed(2)}\n`;
  csv += `Gross Profit,${reportData.profit.gross.toFixed(2)}\n`;
  csv += `Net Profit,${reportData.profit.net.toFixed(2)}\n`;
  csv += `Profit Margin,${reportData.profit.margin.toFixed(2)}%\n`;
  csv += `ROI,${reportData.profit.roi.toFixed(2)}%\n`;
  csv += `Average Transaction Value,${reportData.revenue.average.toFixed(2)}\n`;
  csv += `Daily Revenue,${reportData.revenue.daily.toFixed(2)}\n`;
  csv += `Daily Profit,${reportData.profit.daily.toFixed(2)}\n`;
  csv += `Current Inventory Value,${reportData.inventory.currentValue.toFixed(
    2
  )}\n`;
  csv += `Inventory Turnover Ratio,${reportData.inventory.turnover.toFixed(
    2
  )}\n`;
  csv += `Days Inventory Outstanding,${reportData.inventory.daysInventory.toFixed(
    1
  )}\n`;
  csv += `Transaction Count,${reportData.transactions.count}\n`;
  csv += `Cost Percentage,${reportData.costs.percentage.toFixed(2)}%\n`;

  return csv;
}
