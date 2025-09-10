import { supabase } from "\.\.\/\.\.\/\.\.\/config\/supabase";

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
          products!inner(name, brand, category),
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
        product: log.products.name,
        productBrand: log.products.brand,
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
          products!inner(name, brand)
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

      // Get sales data
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(
          `
          id,
          total_amount,
          payment_method,
          status,
          created_at,
          users!inner(first_name, last_name),
          sale_items!inner(
            quantity,
            unit_price,
            total_price,
            products!inner(name, category)
          )
        `
        )
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

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
          totalSales: salesData.reduce(
            (sum, sale) => sum + parseFloat(sale.total_amount),
            0
          ),
          totalTransactions: salesData.length,
          averageTransaction:
            salesData.length > 0
              ? salesData.reduce(
                  (sum, sale) => sum + parseFloat(sale.total_amount),
                  0
                ) / salesData.length
              : 0,
          uniqueCustomers: [...new Set(salesData.map((sale) => sale.users.id))]
            .length,
        },
        paymentMethods: {
          cash: salesData
            .filter((sale) => sale.payment_method === "cash")
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
          card: salesData
            .filter((sale) => sale.payment_method === "card")
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
          digital: salesData
            .filter((sale) => sale.payment_method === "digital")
            .reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0),
        },
        topProducts: getTopProducts(salesData),
        dailyTrends: getDailyTrends(salesData),
        categoryBreakdown: getCategoryBreakdown(salesData),
      };

      console.log("✅ [ReportsService] Sales report generated successfully");
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
          name,
          brand,
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
            (p) => p.stock_in_pieces > 0 && p.stock_in_pieces <= p.reorder_level
          ).length,
          normalStock: productsData.filter(
            (p) => p.stock_in_pieces > p.reorder_level
          ).length,
        },
        expiryAnalysis: getExpiryAnalysis(productsData),
        categoryAnalysis: getInventoryCategoryAnalysis(productsData),
        topValueProducts: getTopValueProducts(productsData),
        lowStockAlerts: productsData.filter(
          (p) => p.stock_in_pieces <= p.reorder_level && p.stock_in_pieces > 0
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

      // Get sales and product data
      const [salesResult, productsResult] = await Promise.all([
        supabase
          .from("sales")
          .select(
            `
            id,
            total_amount,
            created_at,
            sale_items!inner(
              quantity,
              unit_price,
              total_price,
              products!inner(cost_price, price_per_piece, name)
            )
          `
          )
          .gte("created_at", startDate)
          .lte("created_at", endDate)
          .eq("status", "completed"),

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

      // Calculate financial metrics
      const totalRevenue = salesResult.data.reduce(
        (sum, sale) => sum + parseFloat(sale.total_amount),
        0
      );

      const totalCost = salesResult.data.reduce((sum, sale) => {
        return (
          sum +
          sale.sale_items.reduce((itemSum, item) => {
            const costPrice = item.products.cost_price || 0;
            return itemSum + item.quantity * costPrice;
          }, 0)
        );
      }, 0);

      const grossProfit = totalRevenue - totalCost;
      const profitMargin =
        totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      const inventoryValue = productsResult.data.reduce(
        (sum, product) =>
          sum + product.stock_in_pieces * (product.cost_price || 0),
        0
      );

      const report = {
        period: {
          startDate,
          endDate,
          days: Math.ceil(
            (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
          ),
        },
        revenue: {
          total: totalRevenue,
          average:
            salesResult.data.length > 0
              ? totalRevenue / salesResult.data.length
              : 0,
          daily:
            totalRevenue /
            Math.max(
              1,
              Math.ceil(
                (new Date(endDate) - new Date(startDate)) /
                  (1000 * 60 * 60 * 24)
              )
            ),
        },
        costs: {
          total: totalCost,
          percentage: totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0,
        },
        profit: {
          gross: grossProfit,
          margin: profitMargin,
        },
        inventory: {
          currentValue: inventoryValue,
          turnover: inventoryValue > 0 ? totalCost / inventoryValue : 0,
        },
      };

      console.log(
        "✅ [ReportsService] Financial report generated successfully"
      );
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
  const product = log.products.name;
  const quantity = Math.abs(log.quantity);
  const action =
    log.movement_type === "in"
      ? "added to"
      : log.movement_type === "out"
      ? "removed from"
      : "adjusted for";

  return `${quantity} units ${action} ${product} (${log.stock_before} → ${log.stock_after})`;
}

function getTopProducts(salesData) {
  const productSales = {};

  salesData.forEach((sale) => {
    sale.sale_items.forEach((item) => {
      const productName = item.products.name;
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
    const status =
      product.stock_in_pieces === 0
        ? "Out of Stock"
        : product.stock_in_pieces <= product.reorder_level
        ? "Low Stock"
        : "Normal";
    csv += `${product.name},${product.category},${product.stock_in_pieces},${product.price_per_piece},${product.totalValue},${status}\n`;
  });

  return csv;
}

function generateFinancialCSV(reportData) {
  let csv = "Metric,Value\n";
  csv += `Total Revenue,${reportData.revenue.total}\n`;
  csv += `Total Costs,${reportData.costs.total}\n`;
  csv += `Gross Profit,${reportData.profit.gross}\n`;
  csv += `Profit Margin,${reportData.profit.margin}%\n`;
  csv += `Inventory Value,${reportData.inventory.currentValue}\n`;

  return csv;
}
