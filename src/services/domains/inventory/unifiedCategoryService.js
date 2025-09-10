/**
 * 🎯 **UNIFIED CATEGORY MANAGEMENT SERVICE FOR MEDCURE-PRO**
 *
 * Professional enterprise-grade category management system that provides:
 * ✅ Automatic category creation during imports
 * ✅ Manual category management from Management Page
 * ✅ Consistent category fetching across Inventory, POS, and all components
 * ✅ Real-time statistics and auditing
 * ✅ Category validation and normalization
 *
 * @author Senior Developer
 * @version 2.0.0
 * @created September 2025
 */

import { supabase, isProductionSupabase } from "../../../config/supabase.js";

// ==========================================
// CORE CATEGORY MANAGEMENT SERVICE
// ==========================================
export class UnifiedCategoryService {
  // 🏷️ **CATEGORY CRUD OPERATIONS**

  /**
   * Get all categories for system-wide use
   * Used by: Inventory, POS, Management, Reports, Analytics
   */
  static async getAllCategories(options = {}) {
    try {
      console.log("🏷️ [UnifiedCategory] Fetching all categories...");

      let query = supabase.from("categories").select("*");

      // Apply filters
      if (options.activeOnly !== false) {
        query = query.eq("is_active", true);
      }

      // Apply sorting
      const orderBy = options.orderBy || "sort_order";
      const ascending = options.ascending !== false;
      query = query.order(orderBy, { ascending });

      const { data, error } = await query;

      if (error) {
        // Fallback to mock data if table doesn't exist
        if (error.code === "42P01" || !isProductionSupabase) {
          console.warn(
            "⚠️ [UnifiedCategory] Using mock categories for development"
          );
          return {
            success: true,
            data: this.getMockCategories(),
            source: "mock",
          };
        }
        throw error;
      }

      console.log(`✅ [UnifiedCategory] Retrieved ${data.length} categories`);
      return {
        success: true,
        data: data || [],
        source: "database",
      };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error fetching categories:", error);
      return {
        success: false,
        data: this.getMockCategories(),
        error: error.message,
        source: "fallback",
      };
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId) {
    try {
      console.log(`🔍 [UnifiedCategory] Fetching category ${categoryId}`);

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", categoryId)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error fetching category:", error);
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Get category by name (case-insensitive)
   */
  static async getCategoryByName(name) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .ilike("name", name.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error(
        "❌ [UnifiedCategory] Error fetching category by name:",
        error
      );
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Create new category
   * Used by: Management Page, Auto-import system
   */
  static async createCategory(categoryData, context = {}) {
    try {
      console.log(
        "➕ [UnifiedCategory] Creating new category:",
        categoryData.name
      );

      // Normalize and validate data
      const normalizedData = await this.normalizeCategoryData(categoryData);

      // Check for duplicates
      const existingCheck = await this.getCategoryByName(normalizedData.name);
      if (existingCheck.success && existingCheck.data) {
        console.log(
          `ℹ️ [UnifiedCategory] Category "${normalizedData.name}" already exists`
        );
        return {
          success: true,
          data: existingCheck.data,
          action: "existing",
        };
      }

      // Get next sort order
      const nextSortOrder = await this.getNextSortOrder();

      // Prepare category data
      const newCategory = {
        ...normalizedData,
        sort_order: nextSortOrder,
        is_active: true,
        created_at: new Date().toISOString(),
        metadata: {
          created_by: context.userId || "system",
          creation_source: context.source || "manual",
          ...normalizedData.metadata,
        },
      };

      const { data, error } = await supabase
        .from("categories")
        .insert([newCategory])
        .select()
        .single();

      if (error) throw error;

      // Log creation for audit
      await this.logCategoryActivity("category_created", data.id, context);

      console.log(
        `✅ [UnifiedCategory] Category "${data.name}" created successfully`
      );
      return {
        success: true,
        data,
        action: "created",
      };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error creating category:", error);
      return { success: false, error: error.message, action: "failed" };
    }
  }

  /**
   * Update existing category
   */
  static async updateCategory(categoryId, updateData, context = {}) {
    try {
      console.log(`📝 [UnifiedCategory] Updating category ${categoryId}`);

      const normalizedData = await this.normalizeCategoryData(
        updateData,
        false
      );

      const { data, error } = await supabase
        .from("categories")
        .update({
          ...normalizedData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", categoryId)
        .select()
        .single();

      if (error) throw error;

      // Log update for audit
      await this.logCategoryActivity("category_updated", categoryId, context);

      console.log(`✅ [UnifiedCategory] Category updated successfully`);
      return { success: true, data };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error updating category:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete category (soft delete)
   */
  static async deleteCategory(categoryId, context = {}) {
    try {
      console.log(`🗑️ [UnifiedCategory] Soft deleting category ${categoryId}`);

      // Check if category has products
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("category_id", categoryId)
        .eq("is_active", true);

      if (products && products.length > 0) {
        return {
          success: false,
          error: `Cannot delete category. ${products.length} products are still assigned to this category.`,
          hasProducts: true,
          productCount: products.length,
        };
      }

      const { data, error } = await supabase
        .from("categories")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
          deleted_by: context.userId,
        })
        .eq("id", categoryId)
        .select()
        .single();

      if (error) throw error;

      // Log deletion for audit
      await this.logCategoryActivity("category_deleted", categoryId, context);

      console.log(`✅ [UnifiedCategory] Category soft deleted successfully`);
      return { success: true, data };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error deleting category:", error);
      return { success: false, error: error.message };
    }
  }

  // 🤖 **AUTOMATIC CATEGORY CREATION DURING IMPORTS**

  /**
   * Process categories during import with intelligent mapping
   */
  static async processImportCategories(importData, context = {}) {
    try {
      console.log("🤖 [UnifiedCategory] Processing import categories...");

      // Extract unique category names from import data
      const categoryNames = [
        ...new Set(
          importData.map((item) => item.category?.trim()).filter(Boolean)
        ),
      ];

      if (categoryNames.length === 0) {
        return {
          success: true,
          data: importData,
          categoriesProcessed: 0,
        };
      }

      console.log(
        `📋 [UnifiedCategory] Found ${categoryNames.length} unique categories in import`
      );

      // Process each category
      const processedCategories = new Map();
      for (const categoryName of categoryNames) {
        const result = await this.createOrGetCategory(categoryName, {
          ...context,
          source: "import",
        });

        if (result.success) {
          processedCategories.set(categoryName.toLowerCase(), result.data);
        }
      }

      // Map category IDs to import data
      const processedData = importData.map((item) => ({
        ...item,
        category_id: item.category
          ? processedCategories.get(item.category.toLowerCase())?.id
          : null,
        category_name: item.category,
      }));

      console.log(
        `✅ [UnifiedCategory] Processed ${processedCategories.size} categories`
      );

      return {
        success: true,
        data: processedData,
        categoriesProcessed: processedCategories.size,
        categories: Array.from(processedCategories.values()),
      };
    } catch (error) {
      console.error(
        "❌ [UnifiedCategory] Error processing import categories:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Create category if it doesn't exist, or return existing one
   */
  static async createOrGetCategory(categoryName, context = {}) {
    try {
      // Normalize the category name
      const normalizedName = this.normalizeCategoryName(categoryName);

      // Check if category exists
      const existingResult = await this.getCategoryByName(normalizedName);
      if (existingResult.success && existingResult.data) {
        return {
          success: true,
          data: existingResult.data,
          action: "existing",
        };
      }

      // Create new category with intelligent defaults
      const categoryData = {
        name: normalizedName,
        description: `Auto-created during ${
          context.source || "import"
        } for ${normalizedName} products`,
        color: this.getColorForCategory(normalizedName),
        icon: this.getIconForCategory(normalizedName),
        metadata: {
          auto_created: true,
          original_name: categoryName,
          ...context,
        },
      };

      return await this.createCategory(categoryData, context);
    } catch (error) {
      console.error(
        "❌ [UnifiedCategory] Error in createOrGetCategory:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  // 📊 **CATEGORY STATISTICS AND ANALYTICS**

  /**
   * Get comprehensive category statistics
   */
  static async getCategoryStatistics(categoryId) {
    try {
      console.log(
        `📊 [UnifiedCategory] Calculating statistics for category ${categoryId}`
      );

      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          stock_in_pieces,
          price_per_piece,
          cost_price,
          reorder_level,
          is_active
        `
        )
        .eq("category_id", categoryId)
        .eq("is_active", true);

      if (error) throw error;

      if (!products || products.length === 0) {
        return {
          success: true,
          data: this.getEmptyStats(),
        };
      }

      const stats = this.calculateProductStats(products);

      return { success: true, data: stats };
    } catch (error) {
      console.error(
        "❌ [UnifiedCategory] Error calculating statistics:",
        error
      );
      return {
        success: false,
        data: this.getEmptyStats(),
        error: error.message,
      };
    }
  }

  /**
   * Get category insights for management dashboard
   */
  static async getCategoryInsights() {
    try {
      console.log("📈 [UnifiedCategory] Generating category insights...");

      const categoriesResult = await this.getAllCategories();
      if (!categoriesResult.success) {
        throw new Error(categoriesResult.error);
      }

      const categories = categoriesResult.data;

      // Calculate insights for each category
      const categoryInsights = await Promise.all(
        categories.map(async (category) => {
          const statsResult = await this.getCategoryStatistics(category.id);
          return {
            ...category,
            statistics: statsResult.data,
          };
        })
      );

      // Generate summary insights
      const insights = {
        total_categories: categoryInsights.length,
        active_categories: categoryInsights.filter((cat) => cat.is_active)
          .length,
        total_products: categoryInsights.reduce(
          (sum, cat) => sum + cat.statistics.total_products,
          0
        ),
        total_value: categoryInsights.reduce(
          (sum, cat) => sum + cat.statistics.total_value,
          0
        ),
        top_value_categories: categoryInsights
          .sort((a, b) => b.statistics.total_value - a.statistics.total_value)
          .slice(0, 5),
        categories_with_low_stock: categoryInsights.filter(
          (cat) => cat.statistics.low_stock_count > 0
        ),
        auto_created_categories: categoryInsights.filter(
          (cat) => cat.metadata?.auto_created
        ),
        categories: categoryInsights,
      };

      console.log("✅ [UnifiedCategory] Category insights generated");
      return { success: true, data: insights };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error generating insights:", error);
      return { success: false, error: error.message };
    }
  }

  // 🛠️ **UTILITY METHODS**

  /**
   * Normalize category data with validation
   */
  static async normalizeCategoryData(categoryData, validateRequired = true) {
    const normalized = {
      name: categoryData.name?.trim(),
      description: categoryData.description?.trim() || "",
      color: categoryData.color || this.getRandomColor(),
      icon: categoryData.icon || "Package",
      sort_order: categoryData.sort_order || (await this.getNextSortOrder()),
      metadata: categoryData.metadata || {},
    };

    // Validation
    if (validateRequired && !normalized.name) {
      throw new Error("Category name is required");
    }

    // Normalize name
    if (normalized.name) {
      normalized.name = this.normalizeCategoryName(normalized.name);
    }

    return normalized;
  }

  /**
   * Normalize category name with intelligent mapping
   */
  static normalizeCategoryName(name) {
    if (!name || typeof name !== "string") {
      return "General Medicine";
    }

    // Category mapping for intelligent normalization
    const mappings = {
      "pain relief": "Pain Relief",
      analgesics: "Pain Relief",
      "anti-inflammatory": "Pain Relief",
      antibiotics: "Antibiotics",
      antibiotic: "Antibiotics",
      cardiovascular: "Cardiovascular",
      heart: "Cardiovascular",
      digestive: "Digestive Health",
      stomach: "Digestive Health",
      respiratory: "Respiratory",
      cough: "Respiratory",
      vitamins: "Vitamins & Supplements",
      vitamin: "Vitamins & Supplements",
      supplements: "Vitamins & Supplements",
      diabetes: "Diabetes Care",
      diabetic: "Diabetes Care",
      skin: "Dermatology",
      dermatology: "Dermatology",
      eye: "Eye Care",
      ophthalmology: "Eye Care",
    };

    const normalized = name.toLowerCase().trim();

    // Check direct mappings
    if (mappings[normalized]) {
      return mappings[normalized];
    }

    // Check partial matches
    for (const [key, value] of Object.entries(mappings)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }

    // Clean and format the original name
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Get appropriate color for category
   */
  static getColorForCategory(categoryName) {
    const name = categoryName.toLowerCase();

    const colorMap = {
      pain: "#EF4444", // Red
      heart: "#EC4899", // Pink
      vitamin: "#10B981", // Green
      digestive: "#F59E0B", // Amber
      respiratory: "#3B82F6", // Blue
      antibiotic: "#8B5CF6", // Violet
      diabetes: "#6366F1", // Indigo
      skin: "#F97316", // Orange
      eye: "#06B6D4", // Cyan
    };

    for (const [key, color] of Object.entries(colorMap)) {
      if (name.includes(key)) {
        return color;
      }
    }

    return this.getRandomColor();
  }

  /**
   * Get appropriate icon for category
   */
  static getIconForCategory(categoryName) {
    const name = categoryName.toLowerCase();

    const iconMap = {
      pain: "Zap",
      heart: "Heart",
      vitamin: "Shield",
      digestive: "Apple",
      respiratory: "Wind",
      antibiotic: "Cross",
      diabetes: "Activity",
      skin: "Sun",
      eye: "Eye",
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key)) {
        return icon;
      }
    }

    return "Package";
  }

  /**
   * Get random color from predefined palette
   */
  static getRandomColor() {
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
      "#06B6D4",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Get next sort order
   */
  static async getNextSortOrder() {
    try {
      const { data } = await supabase
        .from("categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        return data[0].sort_order + 10;
      }

      return 10;
    } catch (error) {
      return 10;
    }
  }

  /**
   * Calculate product statistics
   */
  static calculateProductStats(products) {
    return products.reduce(
      (stats, product) => {
        const stockValue =
          (product.stock_in_pieces || 0) * (product.price_per_piece || 0);
        const costValue =
          (product.stock_in_pieces || 0) * (product.cost_price || 0);

        stats.total_products++;
        if (product.is_active) stats.active_products++;

        stats.total_value += stockValue;
        stats.total_cost_value += costValue;
        stats.total_profit_potential += stockValue - costValue;

        if (product.stock_in_pieces <= product.reorder_level) {
          stats.low_stock_count++;
        }

        if (product.stock_in_pieces === 0) {
          stats.out_of_stock_count++;
        }

        stats.price_sum += product.price_per_piece || 0;

        return stats;
      },
      {
        total_products: 0,
        active_products: 0,
        total_value: 0,
        total_cost_value: 0,
        total_profit_potential: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        price_sum: 0,
        average_price: 0,
      }
    );
  }

  /**
   * Get empty statistics object
   */
  static getEmptyStats() {
    return {
      total_products: 0,
      active_products: 0,
      total_value: 0,
      total_cost_value: 0,
      total_profit_potential: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      average_price: 0,
    };
  }

  /**
   * Get mock categories for development
   */
  static getMockCategories() {
    return [
      {
        id: "mock-1",
        name: "Pain Relief",
        description: "Pain management and relief medications",
        color: "#EF4444",
        icon: "Zap",
        sort_order: 10,
        is_active: true,
      },
      {
        id: "mock-2",
        name: "Antibiotics",
        description: "Antibiotic medications",
        color: "#8B5CF6",
        icon: "Cross",
        sort_order: 20,
        is_active: true,
      },
      {
        id: "mock-3",
        name: "Vitamins & Supplements",
        description: "Vitamins and dietary supplements",
        color: "#10B981",
        icon: "Shield",
        sort_order: 30,
        is_active: true,
      },
      {
        id: "mock-4",
        name: "Cardiovascular",
        description: "Heart and cardiovascular medications",
        color: "#EC4899",
        icon: "Heart",
        sort_order: 40,
        is_active: true,
      },
      {
        id: "mock-5",
        name: "Digestive Health",
        description: "Digestive system medications",
        color: "#F59E0B",
        icon: "Apple",
        sort_order: 50,
        is_active: true,
      },
    ];
  }

  /**
   * Log category activity for audit trail
   */
  static async logCategoryActivity(action, categoryId, context = {}) {
    try {
      if (!isProductionSupabase) return; // Skip logging in development

      await supabase.from("user_activity_logs").insert([
        {
          user_id: context.userId || null,
          action_type: action,
          metadata: {
            category_id: categoryId,
            context: context,
            timestamp: new Date().toISOString(),
          },
        },
      ]);
    } catch (error) {
      console.warn("⚠️ [UnifiedCategory] Failed to log activity:", error);
    }
  }

  /**
   * Check if categories exist (for import compatibility)
   */
  static async checkCategoriesExist(categoryNames) {
    try {
      const existing = await this.getAllCategories();
      const existingNames = existing.map((cat) => cat.name.toLowerCase());

      const results = categoryNames.map((name) => {
        const normalizedName = this.normalizeCategoryName(name);
        const exists = existingNames.includes(normalizedName.toLowerCase());
        return {
          name,
          normalizedName,
          exists,
        };
      });

      return {
        exists: results.every((r) => r.exists),
        results,
      };
    } catch (error) {
      console.error("Error checking categories existence:", error);
      return { exists: false, results: [] };
    }
  }

  /**
   * Create categories from import data
   */
  static async createCategoriesFromImport(categoryNames, metadata = {}) {
    try {
      const createPromises = categoryNames.map(async (name) => {
        const normalizedName = this.normalizeCategoryName(name);

        // Check if it already exists
        const existing = await this.getCategoryByName(normalizedName);
        if (existing) {
          return { name: normalizedName, status: "exists", id: existing.id };
        }

        // Create new category
        const created = await this.createCategory({
          name: normalizedName,
          description: `Auto-created during import: ${
            metadata.import_session || "Unknown"
          }`,
          color: this.getRandomColor(),
          icon: "Package",
        });

        return { name: normalizedName, status: "created", id: created.id };
      });

      const results = await Promise.all(createPromises);

      return {
        success: true,
        summary: {
          total: categoryNames.length,
          created: results.filter((r) => r.status === "created").length,
          existing: results.filter((r) => r.status === "exists").length,
          results,
        },
      };
    } catch (error) {
      console.error("Error creating categories from import:", error);
      throw error;
    }
  }

  /**
   * Update all category stats (for import compatibility)
   */
  static async updateAllCategoryStats() {
    try {
      console.log("📊 [UnifiedCategory] Updating all category statistics...");
      const categories = await this.getAllCategories();

      const updatePromises = categories.map((category) =>
        this.getCategoryStatistics(category.id)
      );

      await Promise.all(updatePromises);
      console.log("✅ [UnifiedCategory] All category statistics updated");

      return { success: true, updated: categories.length };
    } catch (error) {
      console.error("Error updating category stats:", error);
      throw error;
    }
  }
}

// ==========================================
// CONVENIENCE EXPORTS FOR BACKWARD COMPATIBILITY
// ==========================================

// Export as default and named export
export default UnifiedCategoryService;

// Export specific methods for easy import
export const {
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  processImportCategories,
  getCategoryStatistics,
  getCategoryInsights,
} = UnifiedCategoryService;
