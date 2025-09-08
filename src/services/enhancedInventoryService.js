import { supabase } from "../config/supabase";
import { AnalyticsService } from "./analyticsService";

/**
 * Enhanced Inventory Management Service
 * Provides advanced inventory features including forecasting, reorder suggestions, and intelligent categorization
 */
export class EnhancedInventoryService {
  // ==================== INVENTORY ANALYTICS ====================

  /**
   * Get comprehensive inventory overview with advanced metrics
   */
  static async getInventoryOverview() {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;

      const overview = {
        totalProducts: products.length,
        totalValue: products.reduce(
          (sum, p) => sum + p.stock_in_pieces * p.price_per_piece,
          0
        ),
        lowStockItems: products.filter((p) => p.stock_in_pieces <= 10).length,
        outOfStockItems: products.filter((p) => p.stock_in_pieces === 0).length,
        expiringItems: await this.getExpiringProductsCount(),
        categoryBreakdown: this.getCategoryBreakdown(products),
        stockMovement: await this.getStockMovementTrends(),
        reorderSuggestions: await this.getReorderSuggestions(),
      };

      return overview;
    } catch (error) {
      console.error("Error fetching inventory overview:", error);
      throw error;
    }
  }

  /**
   * Get intelligent reorder suggestions based on sales velocity and lead times
   */
  static async getReorderSuggestions() {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .lte("stock_in_pieces", 20); // Focus on low stock items

      if (error) throw error;

      const suggestions = await Promise.all(
        products.map(async (product) => {
          const salesVelocity = await this.calculateSalesVelocity(product.id);
          const daysToStockout =
            salesVelocity > 0
              ? Math.floor(product.stock_in_pieces / salesVelocity)
              : 999;
          const suggestedQuantity = await this.calculateOptimalOrderQuantity(
            product.id,
            salesVelocity
          );

          return {
            product,
            salesVelocity,
            daysToStockout,
            suggestedQuantity,
            priority: this.calculateReorderPriority(
              daysToStockout,
              salesVelocity
            ),
            estimatedCost: suggestedQuantity * product.price_per_piece * 0.7, // Estimated wholesale cost
            category: product.category,
          };
        })
      );

      return suggestions
        .filter((s) => s.priority !== "low")
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    } catch (error) {
      console.error("Error calculating reorder suggestions:", error);
      return [];
    }
  }

  /**
   * Calculate sales velocity (units sold per day) for a product
   */
  static async calculateSalesVelocity(productId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: salesItems, error } = await supabase
        .from("sale_items")
        .select(
          `
          quantity,
          sales!inner(created_at)
        `
        )
        .eq("product_id", productId)
        .gte("sales.created_at", startDate.toISOString());

      if (error) throw error;

      const totalSold = salesItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      return totalSold / days;
    } catch (error) {
      console.error("Error calculating sales velocity:", error);
      return 0;
    }
  }

  /**
   * Calculate optimal order quantity using basic EOQ principles
   */
  static async calculateOptimalOrderQuantity(productId, salesVelocity) {
    // Basic EOQ calculation - in real implementation, use more sophisticated models
    const leadTimeDays = 7; // Assume 7-day lead time
    const safetyStockDays = 5; // 5-day safety stock
    const reorderPoint =
      salesVelocity * leadTimeDays + salesVelocity * safetyStockDays;

    // Order enough for 30 days plus safety stock
    const orderQuantity = Math.ceil(salesVelocity * 30 + reorderPoint);

    return Math.max(orderQuantity, 10); // Minimum order of 10 units
  }

  /**
   * Calculate reorder priority based on stockout risk
   */
  static calculateReorderPriority(daysToStockout, salesVelocity) {
    if (daysToStockout <= 3 || salesVelocity > 2) return "critical";
    if (daysToStockout <= 7 || salesVelocity > 1) return "high";
    if (daysToStockout <= 14) return "medium";
    return "low";
  }

  // ==================== INVENTORY FORECASTING ====================

  /**
   * Get inventory forecast for the next 30 days
   */
  static async getInventoryForecast(productId = null) {
    try {
      const products = productId
        ? await this.getProductById(productId)
        : await this.getAllProducts();

      const forecasts = await Promise.all(
        (Array.isArray(products) ? products : [products]).map(
          async (product) => {
            const salesVelocity = await this.calculateSalesVelocity(
              product.id,
              30
            );
            const forecastDays = 30;

            const forecast = [];
            let currentStock = product.stock_in_pieces;

            for (let day = 1; day <= forecastDays; day++) {
              currentStock -= salesVelocity;

              forecast.push({
                day,
                date: new Date(Date.now() + day * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0],
                projectedStock: Math.max(Math.round(currentStock), 0),
                stockoutRisk:
                  currentStock <= 0
                    ? "critical"
                    : currentStock <= 5
                    ? "high"
                    : "low",
              });

              if (currentStock <= 0) break; // Stop forecast when out of stock
            }

            return {
              product,
              salesVelocity,
              forecast,
              stockoutDate:
                forecast.find((f) => f.projectedStock <= 0)?.date || null,
            };
          }
        )
      );

      return productId ? forecasts[0] : forecasts;
    } catch (error) {
      console.error("Error generating inventory forecast:", error);
      return productId ? null : [];
    }
  }

  // ==================== BATCH & EXPIRY MANAGEMENT ====================

  /**
   * Get products expiring within specified days
   */
  static async getExpiringProducts(days = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .not("expiry_date", "is", null)
        .lte("expiry_date", futureDate.toISOString())
        .order("expiry_date");

      if (error) throw error;

      return products.map((product) => ({
        ...product,
        daysToExpiry: Math.ceil(
          (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        ),
        expiryRisk: this.calculateExpiryRisk(product.expiry_date),
        recommendedAction: this.getExpiryRecommendation(product),
      }));
    } catch (error) {
      console.error("Error fetching expiring products:", error);
      return [];
    }
  }

  /**
   * Calculate expiry risk level
   */
  static calculateExpiryRisk(expiryDate) {
    const daysToExpiry = Math.ceil(
      (new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysToExpiry <= 7) return "critical";
    if (daysToExpiry <= 14) return "high";
    if (daysToExpiry <= 30) return "medium";
    return "low";
  }

  /**
   * Get expiry-based recommendations
   */
  static getExpiryRecommendation(product) {
    const daysToExpiry = Math.ceil(
      (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (daysToExpiry <= 3) return "Sell immediately or dispose";
    if (daysToExpiry <= 7) return "Offer discount to move quickly";
    if (daysToExpiry <= 14) return "Prioritize in sales efforts";
    if (daysToExpiry <= 30) return "Monitor closely";
    return "Normal inventory flow";
  }

  /**
   * Get count of expiring products
   */
  static async getExpiringProductsCount(days = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .not("expiry_date", "is", null)
        .lte("expiry_date", futureDate.toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error counting expiring products:", error);
      return 0;
    }
  }

  // ==================== SMART CATEGORIZATION ====================

  /**
   * Get category breakdown with analytics
   */
  static getCategoryBreakdown(products) {
    const breakdown = {};

    products.forEach((product) => {
      const category = product.category || "Uncategorized";

      if (!breakdown[category]) {
        breakdown[category] = {
          name: category,
          count: 0,
          totalValue: 0,
          totalStock: 0,
          lowStockCount: 0,
          avgPrice: 0,
        };
      }

      breakdown[category].count++;
      breakdown[category].totalValue +=
        product.stock_in_pieces * product.price_per_piece;
      breakdown[category].totalStock += product.stock_in_pieces;

      if (product.stock_in_pieces <= 10) {
        breakdown[category].lowStockCount++;
      }
    });

    // Calculate averages
    Object.values(breakdown).forEach((category) => {
      category.avgPrice = category.totalValue / category.totalStock || 0;
    });

    return Object.values(breakdown);
  }

  /**
   * Get category performance analytics
   */
  static async getCategoryPerformance(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: salesData, error } = await supabase
        .from("sale_items")
        .select(
          `
          quantity,
          total_price,
          products!inner(category),
          sales!inner(created_at)
        `
        )
        .gte("sales.created_at", startDate.toISOString());

      if (error) throw error;

      const categoryStats = {};

      salesData.forEach((item) => {
        const category = item.products.category || "Uncategorized";

        if (!categoryStats[category]) {
          categoryStats[category] = {
            name: category,
            revenue: 0,
            quantitySold: 0,
            transactionCount: 0,
          };
        }

        categoryStats[category].revenue += item.total_price;
        categoryStats[category].quantitySold += item.quantity;
        categoryStats[category].transactionCount++;
      });

      return Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error("Error fetching category performance:", error);
      return [];
    }
  }

  // ==================== STOCK MOVEMENT TRACKING ====================

  /**
   * Get stock movement trends
   */
  static async getStockMovementTrends(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: salesData, error } = await supabase
        .from("sale_items")
        .select(
          `
          quantity,
          products!inner(name, category),
          sales!inner(created_at)
        `
        )
        .gte("sales.created_at", startDate.toISOString())
        .order("sales(created_at)");

      if (error) throw error;

      // Group by date
      const dailyMovement = {};

      salesData.forEach((item) => {
        const date = item.sales.created_at.split("T")[0];

        if (!dailyMovement[date]) {
          dailyMovement[date] = {
            date,
            totalUnitsOut: 0,
            uniqueProducts: new Set(),
            categories: new Set(),
          };
        }

        dailyMovement[date].totalUnitsOut += item.quantity;
        dailyMovement[date].uniqueProducts.add(item.products.name);
        dailyMovement[date].categories.add(item.products.category);
      });

      // Convert sets to counts
      return Object.values(dailyMovement).map((day) => ({
        ...day,
        uniqueProducts: day.uniqueProducts.size,
        categories: day.categories.size,
      }));
    } catch (error) {
      console.error("Error fetching stock movement trends:", error);
      return [];
    }
  }

  // ==================== SUPPLIER MANAGEMENT ====================

  /**
   * Get supplier performance analytics
   */
  static async getSupplierAnalytics() {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*");

      if (error) throw error;

      const supplierStats = {};

      products.forEach((product) => {
        const supplier = product.supplier || "Unknown";

        if (!supplierStats[supplier]) {
          supplierStats[supplier] = {
            name: supplier,
            productCount: 0,
            totalValue: 0,
            lowStockProducts: 0,
            avgStockLevel: 0,
            categories: new Set(),
          };
        }

        supplierStats[supplier].productCount++;
        supplierStats[supplier].totalValue +=
          product.stock_in_pieces * product.price_per_piece;
        supplierStats[supplier].avgStockLevel += product.stock_in_pieces;
        supplierStats[supplier].categories.add(product.category);

        if (product.stock_in_pieces <= 10) {
          supplierStats[supplier].lowStockProducts++;
        }
      });

      // Calculate averages and convert sets
      return Object.values(supplierStats).map((supplier) => ({
        ...supplier,
        avgStockLevel: Math.round(
          supplier.avgStockLevel / supplier.productCount
        ),
        categories: Array.from(supplier.categories),
        categoryCount: supplier.categories.size,
        lowStockPercentage:
          (supplier.lowStockProducts / supplier.productCount) * 100,
      }));
    } catch (error) {
      console.error("Error fetching supplier analytics:", error);
      return [];
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get product by ID
   */
  static async getProductById(productId) {
    try {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      return product;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  }

  /**
   * Get all products
   */
  static async getAllProducts() {
    try {
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  /**
   * Update product stock levels
   */
  static async updateStock(
    productId,
    newStockLevel,
    reason = "Manual adjustment"
  ) {
    try {
      const { data, error } = await supabase
        .from("products")
        .update({
          stock_in_pieces: newStockLevel,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;

      // Log the stock adjustment (if audit logging is implemented)
      await this.logInventoryAdjustment(productId, newStockLevel, reason);

      return data;
    } catch (error) {
      console.error("Error updating stock:", error);
      throw error;
    }
  }

  /**
   * Log inventory adjustments for audit trail
   */
  static async logInventoryAdjustment(productId, newStockLevel, reason) {
    try {
      // This would be implemented when audit logging is added
      console.log(
        `Stock adjustment logged: Product ${productId}, New level: ${newStockLevel}, Reason: ${reason}`
      );
    } catch (error) {
      console.error("Error logging inventory adjustment:", error);
    }
  }
}
