import { CategoryService } from "../services/enhancedServices";

// ==========================================
// SMART CATEGORY MANAGEMENT SERVICE
// ==========================================
export const SmartCategoryService = {
  // Detect new categories during import and request approval
  detectAndProcessCategories: async (importData, userId) => {
    try {
      console.log("🔍 [SmartCategory] Analyzing categories in import data...");

      // Get existing categories
      const existingCategoriesResult = await CategoryService.getAllCategories();
      const existingCategories = existingCategoriesResult.success
        ? existingCategoriesResult.data.map((cat) => cat.name.toLowerCase())
        : [];

      // Find new categories in import data
      const importCategories = [
        ...new Set(
          importData.map((item) => item.category?.trim()).filter(Boolean)
        ),
      ];

      const newCategories = importCategories.filter(
        (category) => !existingCategories.includes(category.toLowerCase())
      );

      if (newCategories.length === 0) {
        return {
          success: true,
          data: {
            newCategories: [],
            requiresApproval: false,
            processedData: importData,
          },
        };
      }

      console.log("📋 [SmartCategory] Found new categories:", newCategories);

      // Return data for user approval
      return {
        success: true,
        data: {
          newCategories: newCategories.map((name) => ({
            name,
            suggested: true,
            color: generateCategoryColor(),
            icon: suggestCategoryIcon(name),
            count: importData.filter(
              (item) => item.category?.toLowerCase() === name.toLowerCase()
            ).length,
          })),
          requiresApproval: true,
          processedData: importData,
        },
      };
    } catch (error) {
      console.error("❌ [SmartCategory] Error detecting categories:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Create approved categories automatically
  createApprovedCategories: async (approvedCategories, userId) => {
    try {
      console.log(
        "✅ [SmartCategory] Creating approved categories:",
        approvedCategories
      );

      const createdCategories = [];
      for (const category of approvedCategories) {
        const result = await CategoryService.createCategory({
          name: category.name,
          description: `Auto-created from import by system`,
          color: category.color,
          icon: category.icon,
          is_active: true,
          sort_order: 999, // Put new categories at the end
        });

        if (result.success) {
          createdCategories.push(result.data);
          console.log(`✅ [SmartCategory] Created category: ${category.name}`);
        } else {
          console.error(
            `❌ [SmartCategory] Failed to create category: ${category.name}`
          );
        }
      }

      return {
        success: true,
        data: createdCategories,
      };
    } catch (error) {
      console.error("❌ [SmartCategory] Error creating categories:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  // Map import data to use category IDs instead of names
  mapCategoriesToIds: async (importData) => {
    try {
      console.log("🔗 [SmartCategory] Mapping categories to IDs...");

      const categoriesResult = await CategoryService.getAllCategories();
      if (!categoriesResult.success) {
        throw new Error("Failed to fetch categories");
      }

      const categoryMap = new Map();
      categoriesResult.data.forEach((cat) => {
        categoryMap.set(cat.name.toLowerCase(), cat.id);
      });

      const mappedData = importData.map((item) => ({
        ...item,
        category_id: categoryMap.get(item.category?.toLowerCase()) || null,
        // Keep original category name as fallback
        category: item.category,
      }));

      return {
        success: true,
        data: mappedData,
      };
    } catch (error) {
      console.error("❌ [SmartCategory] Error mapping categories:", error);
      return {
        success: false,
        error: error.message,
        data: importData,
      };
    }
  },
};

// ==========================================
// CATEGORY VALUE MONITORING SERVICE
// ==========================================
export const CategoryValueMonitor = {
  // Get comprehensive category analytics
  getCategoryValueAnalytics: async () => {
    try {
      console.log("📊 [CategoryValueMonitor] Generating category analytics...");

      const categoriesResult = await CategoryService.getAllCategories();
      if (!categoriesResult.success) {
        throw new Error("Failed to fetch categories");
      }

      const analytics = await Promise.all(
        categoriesResult.data.map(async (category) => {
          const valueData = await calculateCategoryValue(category.id);
          const trends = await calculateCategoryTrends(category.id);
          const alerts = await generateCategoryAlerts(category.id, valueData);

          return {
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon,
            ...valueData,
            trends,
            alerts,
            performanceScore: calculatePerformanceScore(valueData, trends),
          };
        })
      );

      // Sort by total value descending
      analytics.sort((a, b) => b.totalValue - a.totalValue);

      return {
        success: true,
        data: {
          categories: analytics,
          summary: {
            totalCategories: analytics.length,
            totalValue: analytics.reduce((sum, cat) => sum + cat.totalValue, 0),
            averageValue:
              analytics.length > 0
                ? analytics.reduce((sum, cat) => sum + cat.totalValue, 0) /
                  analytics.length
                : 0,
            topPerformer: analytics[0]?.name || "None",
            alertsCount: analytics.reduce(
              (sum, cat) => sum + cat.alerts.length,
              0
            ),
          },
        },
      };
    } catch (error) {
      console.error(
        "❌ [CategoryValueMonitor] Error generating analytics:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Get real-time category value tracking
  getRealtimeCategoryValues: async () => {
    try {
      console.log("⚡ [CategoryValueMonitor] Getting real-time values...");

      // This would typically connect to a real-time database subscription
      // For now, we'll simulate with current data + timestamps
      const analytics = await CategoryValueMonitor.getCategoryValueAnalytics();

      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const realtimeData = {
        ...analytics.data,
        lastUpdated: new Date().toISOString(),
        updateFrequency: "real-time",
        nextUpdate: new Date(Date.now() + 30000).toISOString(), // 30 seconds
      };

      return {
        success: true,
        data: realtimeData,
      };
    } catch (error) {
      console.error(
        "❌ [CategoryValueMonitor] Error getting real-time data:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  // Generate category performance dashboard
  generatePerformanceDashboard: async (timeframe = 30) => {
    try {
      console.log(
        "📈 [CategoryValueMonitor] Generating performance dashboard..."
      );

      const analytics = await CategoryValueMonitor.getCategoryValueAnalytics();
      if (!analytics.success) {
        throw new Error(analytics.error);
      }

      const dashboard = {
        overview: analytics.data.summary,
        topPerformers: analytics.data.categories.slice(0, 5),
        underperformers: analytics.data.categories
          .filter((cat) => cat.performanceScore < 60)
          .slice(0, 5),
        trends: {
          growing: analytics.data.categories.filter(
            (cat) => cat.trends.valueGrowth > 0
          ).length,
          declining: analytics.data.categories.filter(
            (cat) => cat.trends.valueGrowth < 0
          ).length,
          stable: analytics.data.categories.filter(
            (cat) => Math.abs(cat.trends.valueGrowth) < 5
          ).length,
        },
        alerts: {
          critical: analytics.data.categories.reduce(
            (sum, cat) =>
              sum +
              cat.alerts.filter((alert) => alert.severity === "critical")
                .length,
            0
          ),
          warning: analytics.data.categories.reduce(
            (sum, cat) =>
              sum +
              cat.alerts.filter((alert) => alert.severity === "warning").length,
            0
          ),
          info: analytics.data.categories.reduce(
            (sum, cat) =>
              sum +
              cat.alerts.filter((alert) => alert.severity === "info").length,
            0
          ),
        },
        recommendations: generateCategoryRecommendations(
          analytics.data.categories
        ),
      };

      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      console.error(
        "❌ [CategoryValueMonitor] Error generating dashboard:",
        error
      );
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

function generateCategoryColor() {
  const colors = [
    "#EF4444",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F97316",
    "#84CC16",
    "#6B7280",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function suggestCategoryIcon(categoryName) {
  const iconMap = {
    pain: "Heart",
    antibiotic: "Shield",
    vitamin: "Zap",
    cold: "Thermometer",
    flu: "Thermometer",
    digestive: "Stomach",
    skin: "Droplets",
    "first aid": "Cross",
    baby: "Baby",
    prescription: "FileText",
    supplement: "Zap",
    cream: "Droplets",
    tablet: "Package",
    capsule: "Package",
  };

  const name = categoryName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  return "Package"; // Default icon
}

async function calculateCategoryValue(categoryId) {
  // This would query the database for category-specific metrics
  // Placeholder implementation
  return {
    totalProducts: 0,
    totalValue: 0,
    averagePrice: 0,
    totalStock: 0,
    lowStockItems: 0,
    expiringItems: 0,
    margin: 0,
  };
}

async function calculateCategoryTrends(categoryId, days = 30) {
  // This would analyze historical data for trends
  // Placeholder implementation
  return {
    valueGrowth: 0, // Percentage
    stockMovement: 0,
    salesVelocity: 0,
    priceChanges: 0,
  };
}

async function generateCategoryAlerts(categoryId, valueData) {
  const alerts = [];

  if (valueData.lowStockItems > 0) {
    alerts.push({
      type: "low_stock",
      severity: "warning",
      message: `${valueData.lowStockItems} items running low`,
      action: "Review reorder levels",
    });
  }

  if (valueData.expiringItems > 0) {
    alerts.push({
      type: "expiring",
      severity: "critical",
      message: `${valueData.expiringItems} items expiring soon`,
      action: "Plan promotions or markdowns",
    });
  }

  if (valueData.margin < 20) {
    alerts.push({
      type: "low_margin",
      severity: "info",
      message: "Below target profit margin",
      action: "Review pricing strategy",
    });
  }

  return alerts;
}

function calculatePerformanceScore(valueData, trends) {
  // Weighted performance calculation
  const valueScore = Math.min((valueData.totalValue / 10000) * 30, 30);
  const marginScore = Math.min(valueData.margin * 0.5, 25);
  const trendScore =
    trends.valueGrowth > 0 ? 25 : trends.valueGrowth < -10 ? 0 : 15;
  const stockScore = valueData.lowStockItems === 0 ? 20 : 10;

  return Math.round(valueScore + marginScore + trendScore + stockScore);
}

function generateCategoryRecommendations(categories) {
  const recommendations = [];

  // Find underperforming categories
  const underperformers = categories.filter((cat) => cat.performanceScore < 60);
  if (underperformers.length > 0) {
    recommendations.push({
      type: "improvement",
      priority: "high",
      title: "Optimize Underperforming Categories",
      description: `${underperformers.length} categories need attention`,
      categories: underperformers.map((cat) => cat.name),
      actions: [
        "Review pricing",
        "Check supplier costs",
        "Analyze demand patterns",
      ],
    });
  }

  // Find high-performing categories
  const topPerformers = categories.filter((cat) => cat.performanceScore > 80);
  if (topPerformers.length > 0) {
    recommendations.push({
      type: "expansion",
      priority: "medium",
      title: "Expand High-Performing Categories",
      description: `${topPerformers.length} categories showing excellent performance`,
      categories: topPerformers.map((cat) => cat.name),
      actions: [
        "Increase inventory",
        "Add related products",
        "Negotiate better supplier terms",
      ],
    });
  }

  return recommendations;
}
