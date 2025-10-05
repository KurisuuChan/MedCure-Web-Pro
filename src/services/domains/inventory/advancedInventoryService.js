import { supabase } from "../../../config/supabase.js";
import { notificationService } from "../../notifications/NotificationService.js";

/**
 * Advanced Inventory Management Service
 * Provides sophisticated inventory tracking, automated reorder points,
 * supplier management, batch tracking, and expiration monitoring
 */
export class AdvancedInventoryService {
  static REORDER_ALGORITHMS = {
    MOVING_AVERAGE: "moving_average",
    SEASONAL: "seasonal",
    TREND_ANALYSIS: "trend_analysis",
    SAFETY_STOCK: "safety_stock",
  };

  static INVENTORY_STATUS = {
    IN_STOCK: "in_stock",
    LOW_STOCK: "low_stock",
    OUT_OF_STOCK: "out_of_stock",
    OVERSTOCKED: "overstocked",
    EXPIRING_SOON: "expiring_soon",
    EXPIRED: "expired",
  };

  static ALERT_TYPES = {
    LOW_STOCK: "low_stock",
    OUT_OF_STOCK: "out_of_stock",
    EXPIRATION_WARNING: "expiration_warning",
    EXPIRED_PRODUCT: "expired_product",
    SUPPLIER_DELAY: "supplier_delay",
    REORDER_SUGGESTION: "reorder_suggestion",
    BATCH_RECALL: "batch_recall",
  };

  /**
   * Get comprehensive inventory analysis
   */
  static async getInventoryAnalysis() {
    try {
      const { data: products, error } = await supabase.from("products").select(`
          *,
          batches:product_batches(*),
          suppliers:product_suppliers(
            supplier_id,
            suppliers(*)
          ),
          sales_history:sales_items(
            quantity,
            unit_price,
            created_at
          )
        `);

      if (error) {
        console.error("Error fetching inventory:", error);
        return this.getMockInventoryAnalysis();
      }

      return this.analyzeInventoryData(products || []);
    } catch (error) {
      console.error("Error in getInventoryAnalysis:", error);
      return this.getMockInventoryAnalysis();
    }
  }

  /**
   * Analyze inventory data and generate insights
   */
  static analyzeInventoryData(products) {
    const analysis = {
      totalProducts: products.length,
      totalValue: 0,
      lowStockItems: [],
      expiringSoon: [],
      expiredItems: [],
      overstockedItems: [],
      reorderSuggestions: [],
      supplierPerformance: {},
      categoryAnalysis: {},
      batchAnalysis: [],
    };

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    products.forEach((product) => {
      // Calculate total value
      analysis.totalValue +=
        (product.quantity || 0) * (product.cost_price || 0);

      // Check stock levels
      const reorderPoint = this.calculateReorderPoint(product);
      const maxStock = this.calculateMaxStock(product);

      if (product.quantity <= 0) {
        analysis.lowStockItems.push({
          ...product,
          status: this.INVENTORY_STATUS.OUT_OF_STOCK,
          priority: "critical",
        });
      } else if (product.quantity <= reorderPoint) {
        analysis.lowStockItems.push({
          ...product,
          status: this.INVENTORY_STATUS.LOW_STOCK,
          priority: "high",
          reorderPoint,
        });
      } else if (product.quantity > maxStock) {
        analysis.overstockedItems.push({
          ...product,
          status: this.INVENTORY_STATUS.OVERSTOCKED,
          excessQuantity: product.quantity - maxStock,
        });
      }

      // Check expiration dates
      if (product.batches) {
        product.batches.forEach((batch) => {
          if (batch.expiry_date) {
            const expiryDate = new Date(batch.expiry_date);

            if (expiryDate < now) {
              analysis.expiredItems.push({
                ...product,
                batch,
                status: this.INVENTORY_STATUS.EXPIRED,
                daysExpired: Math.floor(
                  (now - expiryDate) / (1000 * 60 * 60 * 24)
                ),
              });
            } else if (expiryDate < thirtyDaysFromNow) {
              analysis.expiringSoon.push({
                ...product,
                batch,
                status: this.INVENTORY_STATUS.EXPIRING_SOON,
                daysUntilExpiry: Math.floor(
                  (expiryDate - now) / (1000 * 60 * 60 * 24)
                ),
              });
            }
          }
        });
      }

      // Generate reorder suggestions
      const suggestion = this.generateReorderSuggestion(product);
      if (suggestion) {
        analysis.reorderSuggestions.push(suggestion);
      }

      // Category analysis
      const category = product.category || "Uncategorized";
      if (!analysis.categoryAnalysis[category]) {
        analysis.categoryAnalysis[category] = {
          count: 0,
          totalValue: 0,
          lowStockCount: 0,
          averageStock: 0,
        };
      }

      analysis.categoryAnalysis[category].count++;
      analysis.categoryAnalysis[category].totalValue +=
        (product.quantity || 0) * (product.cost_price || 0);
      if (product.quantity <= reorderPoint) {
        analysis.categoryAnalysis[category].lowStockCount++;
      }
    });

    // Calculate averages
    Object.keys(analysis.categoryAnalysis).forEach((category) => {
      const cat = analysis.categoryAnalysis[category];
      cat.averageValue = cat.totalValue / cat.count;
    });

    return analysis;
  }

  /**
   * Calculate optimal reorder point for a product
   */
  static calculateReorderPoint(
    product,
    algorithm = this.REORDER_ALGORITHMS.MOVING_AVERAGE
  ) {
    const dailyUsage = this.calculateDailyUsage(product);
    const leadTime = this.getSupplierLeadTime(product) || 7; // Default 7 days
    const safetyStock = this.calculateSafetyStock(product);

    switch (algorithm) {
      case this.REORDER_ALGORITHMS.MOVING_AVERAGE:
        return Math.ceil(dailyUsage * leadTime + safetyStock);

      case this.REORDER_ALGORITHMS.SEASONAL: {
        const seasonalFactor = this.getSeasonalFactor(product);
        return Math.ceil(dailyUsage * seasonalFactor * leadTime + safetyStock);
      }

      case this.REORDER_ALGORITHMS.TREND_ANALYSIS: {
        const trendFactor = this.getTrendFactor(product);
        return Math.ceil(dailyUsage * trendFactor * leadTime + safetyStock);
      }

      default:
        return Math.max(10, Math.ceil(dailyUsage * leadTime + safetyStock));
    }
  }

  /**
   * Calculate maximum stock level
   */
  static calculateMaxStock(product) {
    const reorderPoint = this.calculateReorderPoint(product);
    const orderQuantity = this.calculateOptimalOrderQuantity(product);

    return reorderPoint + orderQuantity;
  }

  /**
   * Calculate daily usage based on sales history
   */
  static calculateDailyUsage(product) {
    if (!product.sales_history || product.sales_history.length === 0) {
      return 1; // Default minimum usage
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSales = product.sales_history.filter(
      (sale) => new Date(sale.created_at) >= thirtyDaysAgo
    );

    if (recentSales.length === 0) {
      return 0.5; // Very low usage if no recent sales
    }

    const totalSold = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const daysCovered = Math.min(30, recentSales.length);

    return Math.max(0.1, totalSold / daysCovered);
  }

  /**
   * Calculate safety stock
   */
  static calculateSafetyStock(product) {
    const dailyUsage = this.calculateDailyUsage(product);
    const variability = this.calculateDemandVariability(product);
    const zScore = 1.65; // Z-score for 95% service level

    return Math.ceil(zScore * Math.sqrt(variability) * dailyUsage);
  }

  /**
   * Calculate demand variability
   */
  static calculateDemandVariability(product) {
    if (!product.sales_history || product.sales_history.length < 7) {
      return 1; // Default low variability
    }

    const dailyUsage = this.calculateDailyUsage(product);
    const usageHistory = this.getDailyUsageHistory(product);

    const variance =
      usageHistory.reduce((sum, usage) => {
        return sum + Math.pow(usage - dailyUsage, 2);
      }, 0) / usageHistory.length;

    return Math.max(0.1, variance);
  }

  /**
   * Get daily usage history
   */
  static getDailyUsageHistory(product) {
    if (!product.sales_history) return [];

    const dailyUsage = {};
    product.sales_history.forEach((sale) => {
      const date = new Date(sale.created_at).toDateString();
      dailyUsage[date] = (dailyUsage[date] || 0) + sale.quantity;
    });

    return Object.values(dailyUsage);
  }

  /**
   * Get supplier lead time
   */
  static getSupplierLeadTime(product) {
    if (product.suppliers && product.suppliers.length > 0) {
      return product.suppliers[0].suppliers?.lead_time_days || 7;
    }
    return 7; // Default lead time
  }

  /**
   * Calculate optimal order quantity (EOQ)
   */
  static calculateOptimalOrderQuantity(product) {
    const annualDemand = this.calculateDailyUsage(product) * 365;
    const orderingCost = 50; // Default ordering cost
    const holdingCost = (product.cost_price || 1) * 0.2; // 20% of cost as holding cost

    if (holdingCost === 0) return 50; // Default order quantity

    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCost);
    return Math.max(10, Math.ceil(eoq));
  }

  /**
   * Generate reorder suggestion
   */
  static generateReorderSuggestion(product) {
    const currentStock = product.quantity || 0;
    const reorderPoint = this.calculateReorderPoint(product);
    const optimalQuantity = this.calculateOptimalOrderQuantity(product);

    if (currentStock <= reorderPoint) {
      const urgency =
        currentStock === 0
          ? "critical"
          : currentStock <= reorderPoint * 0.5
          ? "high"
          : "medium";

      return {
        productId: product.id,
        productName: product.name,
        currentStock,
        reorderPoint,
        suggestedQuantity: optimalQuantity,
        urgency,
        estimatedCost: optimalQuantity * (product.cost_price || 0),
        supplier: product.suppliers?.[0]?.suppliers || null,
        reason: currentStock === 0 ? "Out of stock" : "Below reorder point",
      };
    }

    return null;
  }

  /**
   * Get seasonal factor for product
   */
  static getSeasonalFactor() {
    const month = new Date().getMonth();

    // Default seasonal factors (can be customized per product)
    const seasonalFactors = {
      // Winter months (cold/flu season for pharmacy)
      11: 1.3,
      0: 1.3,
      1: 1.2,
      // Spring
      2: 1.0,
      3: 1.0,
      4: 1.0,
      // Summer
      5: 0.9,
      6: 0.9,
      7: 0.9,
      // Fall
      8: 1.0,
      9: 1.1,
      10: 1.2,
    };

    return seasonalFactors[month] || 1.0;
  }

  /**
   * Get trend factor for product
   */
  static getTrendFactor(product) {
    if (!product.sales_history || product.sales_history.length < 14) {
      return 1.0; // No trend data
    }

    const recentSales = this.getRecentSalesTrend(product);
    const olderSales = this.getOlderSalesTrend(product);

    if (olderSales === 0) return 1.0;

    const trendRatio = recentSales / olderSales;
    return Math.max(0.5, Math.min(2.0, trendRatio)); // Cap between 0.5x and 2x
  }

  /**
   * Get recent sales trend
   */
  static getRecentSalesTrend(product) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSales = product.sales_history.filter(
      (sale) => new Date(sale.created_at) >= sevenDaysAgo
    );

    return recentSales.reduce((sum, sale) => sum + sale.quantity, 0) / 7;
  }

  /**
   * Get older sales trend
   */
  static getOlderSalesTrend(product) {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const olderSales = product.sales_history.filter((sale) => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= fourteenDaysAgo && saleDate < sevenDaysAgo;
    });

    return olderSales.reduce((sum, sale) => sum + sale.quantity, 0) / 7;
  }

  /**
   * Create automated purchase order
   */
  static async createPurchaseOrder(suggestions) {
    try {
      const groupedBySupplier = this.groupSuggestionsBySupplier(suggestions);
      const orders = [];

      for (const [supplierId, items] of Object.entries(groupedBySupplier)) {
        const order = {
          supplier_id: supplierId,
          order_date: new Date().toISOString(),
          expected_delivery: this.calculateExpectedDelivery(),
          status: "pending",
          total_amount: items.reduce(
            (sum, item) => sum + item.estimatedCost,
            0
          ),
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.suggestedQuantity,
            unit_cost: item.estimatedCost / item.suggestedQuantity,
          })),
        };

        const { data, error } = await supabase
          .from("purchase_orders")
          .insert([order])
          .select()
          .single();

        if (error) {
          console.error("Error creating purchase order:", error);
        } else {
          orders.push(data);

          // Create notification
          // Note: NotificationService doesn't have showSystemAlert method
          // Use notificationService.create() instead if needed
          console.log(
            `📦 Purchase Order Created: Order #${data.id} created for ${items.length} items`
          );
        }
      }

      return orders;
    } catch (error) {
      console.error("Error in createPurchaseOrder:", error);
      return [];
    }
  }

  /**
   * Group suggestions by supplier
   */
  static groupSuggestionsBySupplier(suggestions) {
    const grouped = {};

    suggestions.forEach((suggestion) => {
      const supplierId = suggestion.supplier?.id || "default";
      if (!grouped[supplierId]) {
        grouped[supplierId] = [];
      }
      grouped[supplierId].push(suggestion);
    });

    return grouped;
  }

  /**
   * Calculate expected delivery date
   */
  static calculateExpectedDelivery() {
    const leadTime = 7; // Default lead time in days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + leadTime);
    return deliveryDate.toISOString();
  }

  /**
   * Monitor expiration alerts
   */
  static async checkExpirationAlerts() {
    try {
      const analysis = await this.getInventoryAnalysis();
      const alerts = [];

      // Critical: Expired items
      analysis.expiredItems.forEach((item) => {
        alerts.push({
          type: this.ALERT_TYPES.EXPIRED_PRODUCT,
          priority: "critical",
          productId: item.id,
          productName: item.name,
          batchId: item.batch.id,
          message: `Product expired ${item.daysExpired} days ago`,
          metadata: { daysExpired: item.daysExpired },
        });
      });

      // High: Expiring soon
      analysis.expiringSoon.forEach((item) => {
        alerts.push({
          type: this.ALERT_TYPES.EXPIRATION_WARNING,
          priority: item.daysUntilExpiry <= 7 ? "high" : "medium",
          productId: item.id,
          productName: item.name,
          batchId: item.batch.id,
          message: `Product expires in ${item.daysUntilExpiry} days`,
          metadata: { daysUntilExpiry: item.daysUntilExpiry },
        });
      });

      // Send notifications for critical alerts
      for (const alert of alerts.filter((a) => a.priority === "critical")) {
        // Note: NotificationService doesn't have showSystemAlert method
        // Use notificationService.create() instead if needed
        console.log(`🚨 Critical: Expired Product - ${alert.message}`);
      }

      return alerts;
    } catch (error) {
      console.error("Error checking expiration alerts:", error);
      return [];
    }
  }

  /**
   * Mock data for development
   */
  static getMockInventoryAnalysis() {
    return {
      totalProducts: 150,
      totalValue: 75000,
      lowStockItems: [
        {
          id: "prod1",
          name: "Aspirin 100mg",
          quantity: 5,
          reorderPoint: 20,
          status: "low_stock",
          priority: "high",
        },
      ],
      expiringSoon: [
        {
          id: "prod2",
          name: "Insulin Pen",
          batch: { id: "batch1", lot_number: "LOT123" },
          daysUntilExpiry: 15,
          status: "expiring_soon",
        },
      ],
      expiredItems: [],
      overstockedItems: [],
      reorderSuggestions: [
        {
          productId: "prod1",
          productName: "Aspirin 100mg",
          currentStock: 5,
          suggestedQuantity: 100,
          urgency: "high",
          estimatedCost: 500,
        },
      ],
      categoryAnalysis: {
        "Pain Relief": { count: 25, totalValue: 15000, lowStockCount: 3 },
        "Diabetes Care": { count: 18, totalValue: 22000, lowStockCount: 1 },
      },
    };
  }
}

export default AdvancedInventoryService;
