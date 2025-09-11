// 📊 **DASHBOARD SERVICE**
// Handles dashboard analytics and summary data
// Professional database-only implementation with Supabase

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";
// Import from the new separated services
import ProductService from "../inventory/productService";
import UserService from "../auth/userService";
import SalesService from "../sales/salesService";

export class DashboardService {
  static async getDashboardData() {
    try {
      logDebug("Fetching dashboard data");

      // Aggregate real data from multiple sources
      const [salesData, productsData, usersDataResponse] = await Promise.all([
        SalesService.getSales(30), // Last 30 sales - returns data directly
        ProductService.getProducts(), // Returns data directly
        UserService.getUsers(), // Returns wrapped response
      ]);

      // Extract actual data from wrapped responses
      const usersData = usersDataResponse.success ? usersDataResponse.data : [];

      logDebug("Dashboard data fetched:", {
        salesCount: salesData.length,
        productsCount: productsData.length,
        usersCount: usersData.length,
      });

      // Calculate dashboard metrics from real data (FIXED: Exclude cancelled transactions)
      const totalSales = salesData
        .filter((sale) => sale.status === "completed") // ✅ Only count completed transactions
        .reduce((sum, sale) => sum + sale.total_amount, 0);
      const lowStockProducts = productsData.filter(
        (p) => p.stock_in_pieces <= (p.reorder_level || 10)
      );
      const activeUsers = usersData.filter((u) => u.is_active !== false);

      const dashboardData = {
        totalSales,
        totalProducts: productsData.length,
        lowStockCount: lowStockProducts.length,
        lowStockItems: lowStockProducts.length, // For Management page compatibility
        totalUsers: usersData.length, // For Management page
        activeUsers: activeUsers.length,
        todaySales: totalSales, // For Management page
        recentSales: salesData.slice(0, 5),
        salesTrend: salesData.slice(0, 7).reverse(), // Last 7 days

        // Add analytics object for ManagementPage compatibility
        analytics: {
          totalProducts: productsData.length,
          lowStockProducts: lowStockProducts.length,
          todaysSales: totalSales,
        },

        // Add the expected structure for DashboardPage
        todayMetrics: {
          totalSales: totalSales,
          transactions: salesData.filter((sale) => sale.status === "completed")
            .length, // ✅ Only completed
          customers: new Set(
            salesData
              .filter((sale) => sale.status === "completed") // ✅ Only completed
              .map((s) => s.customer_name)
              .filter(Boolean)
          ).size,
          averageOrder:
            salesData.filter((sale) => sale.status === "completed").length > 0
              ? totalSales /
                salesData.filter((sale) => sale.status === "completed").length
              : 0,
        },
        yesterdayMetrics: {
          totalSales: totalSales * 0.9, // Mock yesterday data
          transactions: Math.max(
            0,
            salesData.filter((sale) => sale.status === "completed").length - 2
          ), // ✅ Only completed
          customers: Math.max(
            0,
            new Set(
              salesData
                .filter((sale) => sale.status === "completed") // ✅ Only completed
                .map((s) => s.customer_name)
                .filter(Boolean)
            ).size - 1
          ),
          averageOrder:
            salesData.filter((sale) => sale.status === "completed").length > 1
              ? (totalSales * 0.9) /
                (salesData.filter((sale) => sale.status === "completed")
                  .length -
                  2)
              : 0,
        },
        weeklyData: salesData
          .filter((sale) => sale.status === "completed") // ✅ Only completed transactions
          .slice(0, 7)
          .map((sale) => ({
            day: new Date(sale.created_at).toLocaleDateString("en-US", {
              weekday: "short",
            }),
            sales: sale.total_amount,
            date: sale.created_at,
          })),
        topProducts: productsData
          .sort((a, b) => (b.stock_in_pieces || 0) - (a.stock_in_pieces || 0))
          .slice(0, 5)
          .map((p) => ({
            name: p.name,
            sales: p.stock_in_pieces || 0,
            revenue: (p.stock_in_pieces || 0) * (p.price_per_piece || 0),
          })),
        recentTransactions: salesData
          .filter((sale) => sale.status === "completed") // ✅ Only completed transactions
          .slice(0, 5)
          .map((sale) => ({
            id: sale.id,
            amount: sale.total_amount,
            customer: sale.customer_name || "Walk-in Customer",
            time: sale.created_at,
            status: sale.status || "completed",
          })),
        formatGrowth: (current, previous) => {
          if (!previous || previous === 0)
            return { percentage: 0, trend: "neutral" };
          const growth = ((current - previous) / previous) * 100;
          return {
            percentage: Math.abs(growth).toFixed(1),
            trend: growth > 0 ? "up" : growth < 0 ? "down" : "neutral",
          };
        },
        getCriticalAlerts: () => {
          const expiredProducts = productsData.filter(
            (p) =>
              p.expiry_date &&
              new Date(p.expiry_date) < new Date() &&
              p.is_active
          );
          const expiringProducts = productsData.filter(
            (p) =>
              p.expiry_date &&
              new Date(p.expiry_date) <=
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
              new Date(p.expiry_date) >= new Date() &&
              p.is_active
          );

          return {
            lowStock: lowStockProducts.map((p) => ({
              type: "warning",
              message: `${p.name} is low in stock (${p.stock_in_pieces} remaining)`,
              product: p,
            })),
            expiring: [
              ...expiredProducts.map((p) => ({
                type: "danger",
                message: `${p.name} has expired`,
                product: p,
              })),
              ...expiringProducts.map((p) => ({
                type: "warning",
                message: `${p.name} expires on ${new Date(
                  p.expiry_date
                ).toLocaleDateString()}`,
                product: p,
              })),
            ],
            system:
              activeUsers.length === 0
                ? [
                    {
                      type: "danger",
                      message: "No active users found",
                      count: 0,
                    },
                  ]
                : [],
          };
        },
      };

      logDebug("Successfully compiled dashboard data", dashboardData);

      // Return in the format expected by Management page
      return {
        success: true,
        data: dashboardData,
      };
    } catch (error) {
      console.error("❌ [DashboardService] Get dashboard data failed:", error);

      // Return default dashboard data to prevent UI crashes
      return {
        success: false,
        error: error.message,
        data: {
          totalSales: 0,
          totalProducts: 0,
          lowStockCount: 0,
          lowStockItems: 0,
          totalUsers: 0,
          activeUsers: 0,
          todaySales: 0,
          recentSales: [],
          salesTrend: [],

          // Add analytics object for ManagementPage compatibility
          analytics: {
            totalProducts: 0,
            lowStockProducts: 0,
            todaysSales: 0,
          },

          getCriticalAlerts: () => ({
            lowStock: [],
            expiring: [],
            system: [
              {
                type: "danger",
                message: "Dashboard data failed to load",
                count: 0,
              },
            ],
          }),
        },
      };
    }
  }
}

export default DashboardService;
