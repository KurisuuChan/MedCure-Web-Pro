import { supabase } from "../config/supabase";
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  startOfMonth,
} from "date-fns";

export class BusinessIntelligenceService {
  // Sales Analytics
  static async getSalesAnalytics(timeframe = "30days") {
    try {
      const dates = this.getDateRange(timeframe);

      const { data: sales, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            unit_price,
            total_amount,
            products (
              name,
              category,
              brand,
              cost_price,
              price_per_piece
            )
          )
        `
        )
        .gte("created_at", dates.start.toISOString())
        .lte("created_at", dates.end.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Process sales data for analytics
      const analytics = {
        totalSales: sales?.length || 0,
        totalRevenue: 0,
        totalProfit: 0,
        averageOrderValue: 0,
        topProducts: [],
        salesByCategory: {},
        salesByBrand: {},
        dailySales: {},
        profitMargin: 0,
        growth: {
          sales: 0,
          revenue: 0,
          profit: 0,
        },
      };

      if (sales && sales.length > 0) {
        // Calculate totals
        sales.forEach((sale) => {
          analytics.totalRevenue += sale.total_amount || 0;

          if (sale.sale_items) {
            sale.sale_items.forEach((item) => {
              const profit =
                (item.unit_price - (item.products?.cost_price || 0)) *
                item.quantity;
              analytics.totalProfit += profit;

              // Track products
              const productName = item.products?.name || "Unknown";
              if (!analytics.topProducts[productName]) {
                analytics.topProducts[productName] = {
                  name: productName,
                  quantity: 0,
                  revenue: 0,
                  profit: 0,
                };
              }
              analytics.topProducts[productName].quantity += item.quantity;
              analytics.topProducts[productName].revenue += item.total_amount;
              analytics.topProducts[productName].profit += profit;

              // Track categories
              const category = item.products?.category || "Other";
              if (!analytics.salesByCategory[category]) {
                analytics.salesByCategory[category] = {
                  sales: 0,
                  revenue: 0,
                  profit: 0,
                };
              }
              analytics.salesByCategory[category].sales += item.quantity;
              analytics.salesByCategory[category].revenue += item.total_amount;
              analytics.salesByCategory[category].profit += profit;

              // Track brands
              const brand = item.products?.brand || "Generic";
              if (!analytics.salesByBrand[brand]) {
                analytics.salesByBrand[brand] = {
                  sales: 0,
                  revenue: 0,
                  profit: 0,
                };
              }
              analytics.salesByBrand[brand].sales += item.quantity;
              analytics.salesByBrand[brand].revenue += item.total_amount;
              analytics.salesByBrand[brand].profit += profit;
            });
          }

          // Daily sales tracking
          const day = format(new Date(sale.created_at), "yyyy-MM-dd");
          if (!analytics.dailySales[day]) {
            analytics.dailySales[day] = { sales: 0, revenue: 0, profit: 0 };
          }
          analytics.dailySales[day].sales += 1;
          analytics.dailySales[day].revenue += sale.total_amount || 0;
        });

        // Calculate derived metrics
        analytics.averageOrderValue =
          analytics.totalRevenue / analytics.totalSales;
        analytics.profitMargin =
          analytics.totalRevenue > 0
            ? (analytics.totalProfit / analytics.totalRevenue) * 100
            : 0;

        // Convert to arrays and sort
        analytics.topProducts = Object.values(analytics.topProducts)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        analytics.salesByCategory = Object.entries(analytics.salesByCategory)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue);

        analytics.salesByBrand = Object.entries(analytics.salesByBrand)
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue);
      }

      return analytics;
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      throw error;
    }
  }

  // Customer Analytics
  static async getCustomerInsights(timeframe = "30days") {
    try {
      const dates = this.getDateRange(timeframe);

      const { data: sales, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            total_amount
          )
        `
        )
        .gte("created_at", dates.start.toISOString())
        .lte("created_at", dates.end.toISOString());

      if (error) throw error;

      const insights = {
        totalCustomers: 0,
        totalTransactions: sales?.length || 0,
        averageTransactionValue: 0,
        customerFrequency: {},
        peakHours: {},
        repeatCustomers: 0,
        newCustomers: 0,
      };

      if (sales && sales.length > 0) {
        const customerData = {};

        sales.forEach((sale) => {
          const customerId = sale.customer_name || "Walk-in";

          // Track customers
          if (!customerData[customerId]) {
            customerData[customerId] = {
              transactions: 0,
              totalSpent: 0,
              firstVisit: sale.created_at,
            };
          }
          customerData[customerId].transactions += 1;
          customerData[customerId].totalSpent += sale.total_amount || 0;

          // Track peak hours
          const hour = new Date(sale.created_at).getHours();
          if (!insights.peakHours[hour]) {
            insights.peakHours[hour] = 0;
          }
          insights.peakHours[hour] += 1;
        });

        insights.totalCustomers = Object.keys(customerData).length;
        insights.averageTransactionValue =
          sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) /
          sales.length;

        // Calculate repeat vs new customers
        Object.values(customerData).forEach((customer) => {
          if (customer.transactions > 1) {
            insights.repeatCustomers += 1;
          } else {
            insights.newCustomers += 1;
          }
        });
      }

      return insights;
    } catch (error) {
      console.error("Error fetching customer insights:", error);
      throw error;
    }
  }

  // Inventory Performance
  static async getInventoryPerformance() {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          *,
          sale_items (
            quantity,
            total_amount,
            created_at
          )
        `
        )
        .eq("is_archived", false);

      if (error) throw error;

      const performance = {
        totalProducts: products?.length || 0,
        totalValue: 0,
        lowStockItems: 0,
        fastMovingItems: [],
        slowMovingItems: [],
        categoryPerformance: {},
        stockTurnover: {},
      };

      if (products && products.length > 0) {
        products.forEach((product) => {
          const stockValue =
            (product.stock_in_pieces || 0) * (product.price_per_piece || 0);
          performance.totalValue += stockValue;

          if ((product.stock_in_pieces || 0) <= (product.reorder_level || 10)) {
            performance.lowStockItems += 1;
          }

          // Calculate sales velocity
          const salesData = product.sale_items || [];
          const last30Days = salesData.filter((item) => {
            const itemDate = new Date(item.created_at);
            const thirtyDaysAgo = subDays(new Date(), 30);
            return itemDate >= thirtyDaysAgo;
          });

          const totalSold = last30Days.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const velocity = totalSold / 30; // items per day

          const productPerformance = {
            id: product.id,
            name: product.name,
            category: product.category,
            stockLevel: product.stock_in_pieces,
            velocity,
            totalSold,
            stockValue,
          };

          if (velocity > 2) {
            performance.fastMovingItems.push(productPerformance);
          } else if (velocity < 0.1 && totalSold === 0) {
            performance.slowMovingItems.push(productPerformance);
          }

          // Category performance
          const category = product.category || "Other";
          if (!performance.categoryPerformance[category]) {
            performance.categoryPerformance[category] = {
              products: 0,
              totalValue: 0,
              totalSold: 0,
              avgVelocity: 0,
            };
          }
          performance.categoryPerformance[category].products += 1;
          performance.categoryPerformance[category].totalValue += stockValue;
          performance.categoryPerformance[category].totalSold += totalSold;
          performance.categoryPerformance[category].avgVelocity += velocity;
        });

        // Calculate average velocities
        Object.keys(performance.categoryPerformance).forEach((category) => {
          const cat = performance.categoryPerformance[category];
          cat.avgVelocity = cat.avgVelocity / cat.products;
        });

        // Sort items
        performance.fastMovingItems.sort((a, b) => b.velocity - a.velocity);
        performance.fastMovingItems = performance.fastMovingItems.slice(0, 10);
        performance.slowMovingItems.sort((a, b) => a.velocity - b.velocity);
        performance.slowMovingItems = performance.slowMovingItems.slice(0, 10);
      }

      return performance;
    } catch (error) {
      console.error("Error fetching inventory performance:", error);
      throw error;
    }
  }

  // Profit Analysis
  static async getProfitAnalysis(timeframe = "30days") {
    try {
      const dates = this.getDateRange(timeframe);

      const { data: sales, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            quantity,
            unit_price,
            total_amount,
            products (
              cost_price,
              category,
              brand
            )
          )
        `
        )
        .gte("created_at", dates.start.toISOString())
        .lte("created_at", dates.end.toISOString());

      if (error) throw error;

      const analysis = {
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        profitMargin: 0,
        profitByCategory: {},
        profitByBrand: {},
        profitTrends: {},
        topProfitableProducts: [],
      };

      if (sales && sales.length > 0) {
        const productProfits = {};

        sales.forEach((sale) => {
          const saleDate = format(new Date(sale.created_at), "yyyy-MM-dd");

          if (!analysis.profitTrends[saleDate]) {
            analysis.profitTrends[saleDate] = {
              revenue: 0,
              cost: 0,
              profit: 0,
            };
          }

          if (sale.sale_items) {
            sale.sale_items.forEach((item) => {
              const revenue = item.total_amount || 0;
              const cost = (item.products?.cost_price || 0) * item.quantity;
              const profit = revenue - cost;

              analysis.totalRevenue += revenue;
              analysis.totalCost += cost;
              analysis.grossProfit += profit;

              analysis.profitTrends[saleDate].revenue += revenue;
              analysis.profitTrends[saleDate].cost += cost;
              analysis.profitTrends[saleDate].profit += profit;

              // Track by category
              const category = item.products?.category || "Other";
              if (!analysis.profitByCategory[category]) {
                analysis.profitByCategory[category] = {
                  revenue: 0,
                  cost: 0,
                  profit: 0,
                  margin: 0,
                };
              }
              analysis.profitByCategory[category].revenue += revenue;
              analysis.profitByCategory[category].cost += cost;
              analysis.profitByCategory[category].profit += profit;

              // Track by brand
              const brand = item.products?.brand || "Generic";
              if (!analysis.profitByBrand[brand]) {
                analysis.profitByBrand[brand] = {
                  revenue: 0,
                  cost: 0,
                  profit: 0,
                  margin: 0,
                };
              }
              analysis.profitByBrand[brand].revenue += revenue;
              analysis.profitByBrand[brand].cost += cost;
              analysis.profitByBrand[brand].profit += profit;

              // Track product profits
              const productKey = `${item.products?.name || "Unknown"}-${
                item.products?.category || "Other"
              }`;
              if (!productProfits[productKey]) {
                productProfits[productKey] = {
                  name: item.products?.name || "Unknown",
                  category: item.products?.category || "Other",
                  revenue: 0,
                  cost: 0,
                  profit: 0,
                  margin: 0,
                  quantity: 0,
                };
              }
              productProfits[productKey].revenue += revenue;
              productProfits[productKey].cost += cost;
              productProfits[productKey].profit += profit;
              productProfits[productKey].quantity += item.quantity;
            });
          }
        });

        // Calculate margins
        analysis.profitMargin =
          analysis.totalRevenue > 0
            ? (analysis.grossProfit / analysis.totalRevenue) * 100
            : 0;

        Object.keys(analysis.profitByCategory).forEach((category) => {
          const cat = analysis.profitByCategory[category];
          cat.margin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
        });

        Object.keys(analysis.profitByBrand).forEach((brand) => {
          const brandData = analysis.profitByBrand[brand];
          brandData.margin =
            brandData.revenue > 0
              ? (brandData.profit / brandData.revenue) * 100
              : 0;
        });

        Object.keys(productProfits).forEach((product) => {
          const prod = productProfits[product];
          prod.margin =
            prod.revenue > 0 ? (prod.profit / prod.revenue) * 100 : 0;
        });

        analysis.topProfitableProducts = Object.values(productProfits)
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 10);
      }

      return analysis;
    } catch (error) {
      console.error("Error fetching profit analysis:", error);
      throw error;
    }
  }

  // Trend Analysis & Forecasting
  static async getTrendAnalysis(timeframe = "6months") {
    try {
      const dates = this.getDateRange(timeframe);

      const { data: sales, error } = await supabase
        .from("sales")
        .select(
          `
          created_at,
          total_amount,
          sale_items (
            quantity,
            total_amount
          )
        `
        )
        .gte("created_at", dates.start.toISOString())
        .lte("created_at", dates.end.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const trends = {
        salesGrowth: 0,
        revenueGrowth: 0,
        monthlyData: {},
        seasonalPatterns: {},
        forecast: {},
      };

      if (sales && sales.length > 0) {
        // Group by month
        sales.forEach((sale) => {
          const month = format(new Date(sale.created_at), "yyyy-MM");
          const dayOfWeek = format(new Date(sale.created_at), "EEEE");

          if (!trends.monthlyData[month]) {
            trends.monthlyData[month] = { sales: 0, revenue: 0, items: 0 };
          }
          trends.monthlyData[month].sales += 1;
          trends.monthlyData[month].revenue += sale.total_amount || 0;

          if (sale.sale_items) {
            trends.monthlyData[month].items += sale.sale_items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
          }

          // Seasonal patterns
          if (!trends.seasonalPatterns[dayOfWeek]) {
            trends.seasonalPatterns[dayOfWeek] = { sales: 0, revenue: 0 };
          }
          trends.seasonalPatterns[dayOfWeek].sales += 1;
          trends.seasonalPatterns[dayOfWeek].revenue += sale.total_amount || 0;
        });

        // Calculate growth rates
        const months = Object.keys(trends.monthlyData).sort((a, b) =>
          a.localeCompare(b)
        );
        if (months.length >= 2) {
          const firstMonth = trends.monthlyData[months[0]];
          const lastMonth = trends.monthlyData[months[months.length - 1]];

          trends.salesGrowth =
            firstMonth.sales > 0
              ? ((lastMonth.sales - firstMonth.sales) / firstMonth.sales) * 100
              : 0;
          trends.revenueGrowth =
            firstMonth.revenue > 0
              ? ((lastMonth.revenue - firstMonth.revenue) /
                  firstMonth.revenue) *
                100
              : 0;
        }

        // Simple forecast (linear trend)
        if (months.length >= 3) {
          const recentData = months
            .slice(-3)
            .map((month) => trends.monthlyData[month].revenue);
          const avgGrowth =
            recentData.reduce((sum, val, idx) => {
              if (idx === 0) return sum;
              return sum + (val - recentData[idx - 1]) / recentData[idx - 1];
            }, 0) /
            (recentData.length - 1);

          const lastRevenue = recentData[recentData.length - 1];
          trends.forecast = {
            nextMonth: lastRevenue * (1 + avgGrowth),
            confidence: Math.min(
              95,
              Math.max(60, 100 - Math.abs(avgGrowth * 100))
            ),
          };
        }
      }

      return trends;
    } catch (error) {
      console.error("Error fetching trend analysis:", error);
      throw error;
    }
  }

  // Comprehensive Dashboard Data
  static async getDashboardOverview(timeframe = "30days") {
    try {
      const [
        salesAnalytics,
        customerInsights,
        inventoryPerformance,
        profitAnalysis,
        trendAnalysis,
      ] = await Promise.all([
        this.getSalesAnalytics(timeframe),
        this.getCustomerInsights(timeframe),
        this.getInventoryPerformance(),
        this.getProfitAnalysis(timeframe),
        this.getTrendAnalysis("6months"),
      ]);

      return {
        sales: salesAnalytics,
        customers: customerInsights,
        inventory: inventoryPerformance,
        profit: profitAnalysis,
        trends: trendAnalysis,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      throw error;
    }
  }

  // Utility method for date ranges
  static getDateRange(timeframe) {
    const end = endOfDay(new Date());
    let start;

    switch (timeframe) {
      case "7days":
        start = startOfDay(subDays(new Date(), 7));
        break;
      case "30days":
        start = startOfDay(subDays(new Date(), 30));
        break;
      case "3months":
        start = startOfMonth(subMonths(new Date(), 3));
        break;
      case "6months":
        start = startOfMonth(subMonths(new Date(), 6));
        break;
      case "1year":
        start = startOfMonth(subMonths(new Date(), 12));
        break;
      default:
        start = startOfDay(subDays(new Date(), 30));
    }

    return { start, end };
  }
}
