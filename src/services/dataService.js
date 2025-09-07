// Data Service Abstraction Layer
// This allows easy switching between mock data and Supabase

// Environment configuration
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== "false";

// Import mock data
import { mockProducts } from "../data/mockProducts";
import { mockUsers } from "../data/mockUsers";
import {
  mockDashboardData as mockDashboard,
  formatGrowth,
  getCriticalAlerts,
} from "../data/mockDashboard";
import { mockSales } from "../data/mockSales";

// Import Supabase client (will be used when switching to real data)
import { supabase } from "../config/supabase";

/**
 * Product Service
 * Handles all product-related data operations
 */
export class ProductService {
  static async getProducts() {
    if (USE_MOCK_DATA) {
      return mockProducts;
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) throw error;
    return data;
  }

  static async getProduct(id) {
    if (USE_MOCK_DATA) {
      return mockProducts.find((p) => p.id === id);
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProductStock(id, newStock) {
    if (USE_MOCK_DATA) {
      // For mock data, just log the update
      console.log(`Mock: Updated product ${id} stock to ${newStock}`);
      return { success: true };
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("products")
      .update({ stock_in_pieces: newStock })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async addProduct(product) {
    if (USE_MOCK_DATA) {
      console.log("Mock: Added product", product);
      return { ...product, id: Date.now() };
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select();

    if (error) throw error;
    return data[0];
  }
}

/**
 * User Service
 * Handles all user-related data operations
 */
export class UserService {
  static async getUsers() {
    if (USE_MOCK_DATA) {
      return mockUsers;
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("full_name");

    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email) {
    console.log("📧 UserService.getUserByEmail called:", {
      email,
      USE_MOCK_DATA,
    });

    if (USE_MOCK_DATA) {
      console.log(
        "📋 Available mock users:",
        mockUsers.map((u) => ({ email: u.email, status: u.status }))
      );
      const user = mockUsers.find((u) => u.email === email);
      console.log("🔍 Found user by email:", user);
      return user;
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUser(id, updates) {
    if (USE_MOCK_DATA) {
      console.log(`Mock: Updated user ${id}`, updates);
      return { success: true };
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    return data[0];
  }
}

/**
 * Sales Service
 * Handles all sales transaction operations
 */
export class SalesService {
  static async processSale(saleData) {
    if (USE_MOCK_DATA) {
      console.log("📦 Mock: Processing sale", saleData);

      // Create a mock sale transaction
      const sale = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        total_amount: saleData.total,
        payment_method: saleData.paymentMethod,
        customer_info: saleData.customer,
        cashier_id: saleData.cashierId,
        items: saleData.items,
        status: "completed",
      };

      // In mock mode, we don't actually update inventory
      // but in real implementation, this would be atomic
      console.log("✅ Mock: Sale processed successfully", sale);
      return sale;
    }

    // Supabase implementation - use stored procedure for atomic operation
    const { data, error } = await supabase.rpc("process_sale", {
      sale_items: saleData.items,
      total_amount: saleData.total,
      payment_method: saleData.paymentMethod,
      customer_info: saleData.customer,
      cashier_id: saleData.cashierId,
    });

    if (error) throw error;
    return data;
  }

  static async getSales(limit = 100) {
    if (USE_MOCK_DATA) {
      return mockSales.slice(0, limit);
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        sale_items (
          *,
          products (*)
        ),
        users (full_name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async createSale(saleData) {
    if (USE_MOCK_DATA) {
      console.log("Mock: Created sale", saleData);
      return { ...saleData, id: Date.now().toString() };
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("sales")
      .insert([saleData])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async getSalesByDateRange(startDate, endDate) {
    if (USE_MOCK_DATA) {
      return mockSales.filter((sale) => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Supabase implementation
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  static async voidSale(saleId, reason) {
    if (USE_MOCK_DATA) {
      console.log(`Mock: Voided sale ${saleId} - Reason: ${reason}`);
      return { success: true, voidedAt: new Date().toISOString() };
    }

    // Supabase implementation
    const { data, error } = await supabase.rpc("void_sale_transaction", {
      sale_id: saleId,
      void_reason: reason,
    });

    if (error) throw error;
    return data;
  }

  static async getDailySalesSummary(date) {
    if (USE_MOCK_DATA) {
      const targetDate = new Date(date);
      const dailySales = mockSales.filter((sale) => {
        const saleDate = new Date(sale.created_at);
        return saleDate.toDateString() === targetDate.toDateString();
      });

      const totalSales = dailySales.reduce(
        (sum, sale) => sum + sale.total_amount,
        0
      );
      const totalTransactions = dailySales.length;

      return {
        date: targetDate.toISOString(),
        totalSales,
        totalTransactions,
        averageTransaction:
          totalTransactions > 0 ? totalSales / totalTransactions : 0,
        sales: dailySales,
      };
    }

    // Supabase implementation
    const { data, error } = await supabase.rpc("get_daily_sales_summary", {
      target_date: date,
    });

    if (error) throw error;
    return data;
  }

  static async getSalesAnalytics(startDate, endDate) {
    if (USE_MOCK_DATA) {
      const salesInRange = mockSales.filter((sale) => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= startDate && saleDate <= endDate;
      });

      const totalRevenue = salesInRange.reduce(
        (sum, sale) => sum + sale.total_amount,
        0
      );
      const totalTransactions = salesInRange.length;
      const averageTransaction =
        totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Group by payment method
      const paymentMethods = {};
      salesInRange.forEach((sale) => {
        paymentMethods[sale.payment_method] =
          (paymentMethods[sale.payment_method] || 0) + sale.total_amount;
      });

      return {
        period: { startDate, endDate },
        totalRevenue,
        totalTransactions,
        averageTransaction,
        paymentMethods,
        sales: salesInRange,
      };
    }

    // Supabase implementation
    const { data, error } = await supabase.rpc("get_sales_analytics", {
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;
    return data;
  }
}

/**
 * Dashboard Service
 * Handles dashboard analytics and summary data
 */
export class DashboardService {
  static async getDashboardData() {
    if (USE_MOCK_DATA) {
      return {
        ...mockDashboard,
        formatGrowth,
        getCriticalAlerts,
      };
    }

    // Supabase implementation - aggregate real data
    const [salesData, productsData, usersData] = await Promise.all([
      SalesService.getSales(30), // Last 30 sales
      ProductService.getProducts(),
      UserService.getUsers(),
    ]);

    // Calculate dashboard metrics from real data
    const totalSales = salesData.reduce(
      (sum, sale) => sum + sale.total_amount,
      0
    );
    const lowStockProducts = productsData.filter(
      (p) => p.stock_in_pieces <= p.reorder_level
    );
    const activeUsers = usersData.filter((u) => u.status === "active");

    return {
      totalSales,
      totalProducts: productsData.length,
      lowStockCount: lowStockProducts.length,
      activeUsers: activeUsers.length,
      recentSales: salesData.slice(0, 5),
      salesTrend: salesData.slice(0, 7).reverse(), // Last 7 days
    };
  }
}

/**
 * Auth Service
 * Handles authentication operations
 */
export class AuthService {
  static async signIn(email, password) {
    if (USE_MOCK_DATA) {
      // Mock authentication
      const user = await UserService.getUserByEmail(email);

      if (user && user.status === "active") {
        // For demo, any password works for active users
        return {
          user,
          session: {
            access_token: "mock-token-" + Date.now(),
            expires_at: Date.now() + 3600000, // 1 hour
          },
        };
      }
      throw new Error("Invalid credentials");
    }

    // Supabase implementation
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user profile data
    const userProfile = await UserService.getUserByEmail(email);

    return {
      ...data,
      user: userProfile,
    };
  }

  static async signOut() {
    if (USE_MOCK_DATA) {
      return { success: true };
    }

    // Supabase implementation
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  }

  static async getCurrentUser() {
    if (USE_MOCK_DATA) {
      // For mock, return cached user from localStorage
      const cached = localStorage.getItem("medcure-current-user");
      return cached ? JSON.parse(cached) : null;
    }

    // Supabase implementation
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const userProfile = await UserService.getUserByEmail(user.email);
      return userProfile;
    }
    return null;
  }
}

// Export configuration for easy switching
export const DataConfig = {
  USE_MOCK_DATA,

  // Function to switch to real data
  switchToRealData: () => {
    localStorage.setItem("VITE_USE_MOCK_DATA", "false");
    window.location.reload();
  },

  // Function to switch back to mock data
  switchToMockData: () => {
    localStorage.setItem("VITE_USE_MOCK_DATA", "true");
    window.location.reload();
  },
};

// Default export for convenience
export default {
  ProductService,
  UserService,
  SalesService,
  DashboardService,
  AuthService,
  DataConfig,
};
