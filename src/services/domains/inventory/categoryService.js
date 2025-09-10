/**
 * 🧠 **INTELLIGENT CATEGORY SERVICE FOR MEDCURE-PRO**
 * Professional category auto-creation and management system
 * Handles smart category creation during imports and real-time calculations
 * Created: Professional System Enhancement
 * Version: 1.0
 */

import { supabase } from "\.\.\/\.\.\/\.\.\/config\/supabase";

export class IntelligentCategoryService {
  /**
   * Category mapping for intelligent normalization
   * Maps various category names to standardized categories
   */
  static categoryMappings = {
    // Pain & Inflammation
    "pain relief": "Pain Relief",
    analgesics: "Pain Relief",
    "anti-inflammatory": "Pain Relief",
    painkiller: "Pain Relief",
    nsaid: "Pain Relief",

    // Antibiotics & Infection
    antibiotics: "Antibiotics",
    antibiotic: "Antibiotics",
    infection: "Antibiotics",
    antimicrobial: "Antibiotics",

    // Heart & Circulation
    cardiovascular: "Cardiovascular",
    heart: "Cardiovascular",
    "blood pressure": "Cardiovascular",
    hypertension: "Cardiovascular",
    circulation: "Cardiovascular",

    // Digestive System
    digestive: "Digestive Health",
    stomach: "Digestive Health",
    antacid: "Digestive Health",
    gastro: "Digestive Health",
    laxative: "Digestive Health",

    // Respiratory
    respiratory: "Respiratory",
    cough: "Respiratory",
    cold: "Respiratory",
    asthma: "Respiratory",
    bronchial: "Respiratory",

    // Vitamins & Supplements
    vitamins: "Vitamins & Supplements",
    vitamin: "Vitamins & Supplements",
    supplements: "Vitamins & Supplements",
    mineral: "Vitamins & Supplements",
    multivitamin: "Vitamins & Supplements",

    // Diabetes
    diabetes: "Diabetes Care",
    diabetic: "Diabetes Care",
    insulin: "Diabetes Care",
    "blood sugar": "Diabetes Care",

    // Skin Care
    dermatology: "Dermatology",
    skin: "Dermatology",
    topical: "Dermatology",
    cream: "Dermatology",
    ointment: "Dermatology",

    // Eye Care
    ophthalmology: "Eye Care",
    eye: "Eye Care",
    vision: "Eye Care",
    drops: "Eye Care",

    // General
    general: "General Medicine",
    misc: "General Medicine",
    other: "General Medicine",
    otc: "Over-the-Counter",
  };

  /**
   * Default category colors for auto-created categories
   */
  static defaultColors = [
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#F97316", // Orange
    "#84CC16", // Lime
    "#06B6D4", // Cyan
  ];

  /**
   * Intelligently process and normalize category name
   */
  static normalizeCategoryName(categoryName) {
    if (!categoryName || typeof categoryName !== "string") {
      return "General Medicine";
    }

    const normalized = categoryName.toLowerCase().trim();

    // Check direct mappings first
    if (this.categoryMappings[normalized]) {
      return this.categoryMappings[normalized];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(this.categoryMappings)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }

    // Clean and format the original name
    return categoryName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  /**
   * Check if category exists (case-insensitive)
   */
  static async categoryExists(categoryName) {
    try {
      const normalizedName = this.normalizeCategoryName(categoryName);

      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .ilike("name", normalizedName);

      if (error) throw error;

      return {
        exists: data && data.length > 0,
        category: data && data.length > 0 ? data[0] : null,
        normalizedName,
      };
    } catch (error) {
      console.error("❌ Error checking category existence:", error);
      return { exists: false, category: null, normalizedName: categoryName };
    }
  }

  /**
   * Intelligently create category during import
   */
  static async createCategoryDuringImport(categoryName, context = {}) {
    try {
      console.log(`🧠 Creating category intelligently: "${categoryName}"`);

      // Normalize the category name
      const normalizedName = this.normalizeCategoryName(categoryName);

      // Check if category already exists
      const existsCheck = await this.categoryExists(normalizedName);
      if (existsCheck.exists) {
        console.log(`✅ Category "${normalizedName}" already exists`);
        return {
          success: true,
          category: existsCheck.category,
          action: "existing",
        };
      }

      // Get next sort order
      const { data: lastCategory } = await supabase
        .from("categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextSortOrder =
        lastCategory && lastCategory.length > 0
          ? lastCategory[0].sort_order + 10
          : 10;

      // Select color for new category
      const { data: existingCategories } = await supabase
        .from("categories")
        .select("color");

      const usedColors = existingCategories
        ? existingCategories.map((c) => c.color)
        : [];
      const availableColors = this.defaultColors.filter(
        (color) => !usedColors.includes(color)
      );
      const selectedColor =
        availableColors.length > 0
          ? availableColors[0]
          : this.defaultColors[
              Math.floor(Math.random() * this.defaultColors.length)
            ];

      // Create the new category
      const newCategory = {
        name: normalizedName,
        description: `Auto-created during import for ${normalizedName} products`,
        color: selectedColor,
        icon: this.getIconForCategory(normalizedName),
        sort_order: nextSortOrder,
        is_active: true,
        metadata: {
          auto_created: true,
          created_during: "import",
          original_name: categoryName,
          ...context,
        },
      };

      const { data: createdCategory, error } = await supabase
        .from("categories")
        .insert([newCategory])
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Category "${normalizedName}" created successfully`);

      // Log the category creation for audit
      await this.logCategoryCreation(createdCategory, context);

      return {
        success: true,
        category: createdCategory,
        action: "created",
      };
    } catch (error) {
      console.error("❌ Error creating category during import:", error);
      return {
        success: false,
        error: error.message,
        action: "failed",
      };
    }
  }

  /**
   * Get appropriate icon for category
   */
  static getIconForCategory(categoryName) {
    const name = categoryName.toLowerCase();

    if (name.includes("pain") || name.includes("relief")) return "Zap";
    if (name.includes("heart") || name.includes("cardio")) return "Heart";
    if (name.includes("vitamin") || name.includes("supplement"))
      return "Shield";
    if (name.includes("digestive") || name.includes("stomach"))
      return "Stomach";
    if (name.includes("respiratory") || name.includes("cough"))
      return "Droplets";
    if (name.includes("skin") || name.includes("dermatology")) return "Sun";
    if (name.includes("eye") || name.includes("vision")) return "Eye";
    if (name.includes("diabetes") || name.includes("blood")) return "Activity";
    if (name.includes("antibiotic") || name.includes("infection"))
      return "Cross";

    return "Package"; // Default icon
  }

  /**
   * Log category creation for audit trail
   */
  static async logCategoryCreation(category, context) {
    try {
      const logEntry = {
        action: "category_auto_created",
        category_id: category.id,
        category_name: category.name,
        metadata: {
          ...context,
          auto_created: true,
          timestamp: new Date().toISOString(),
        },
      };

      // Insert into audit log or activity log
      await supabase.from("user_activity_logs").insert([
        {
          user_id: context.user_id || null,
          action_type: "category_created",
          metadata: logEntry,
        },
      ]);
    } catch (error) {
      console.warn("⚠️ Failed to log category creation:", error);
    }
  }

  /**
   * Calculate real-time category statistics and values
   */
  static async calculateCategoryStats(categoryId) {
    try {
      console.log(`📊 Calculating stats for category: ${categoryId}`);

      // Get all products in this category
      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          category,
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

      // Calculate comprehensive statistics
      const stats = products.reduce(
        (acc, product) => {
          const stockValue =
            (product.stock_in_pieces || 0) * (product.price_per_piece || 0);
          const costValue =
            (product.stock_in_pieces || 0) * (product.cost_price || 0);
          const profitPotential = stockValue - costValue;

          acc.total_products++;
          if (product.is_active) acc.active_products++;

          acc.total_value += stockValue;
          acc.total_cost_value += costValue;
          acc.total_profit_potential += profitPotential;

          if (product.stock_in_pieces <= product.reorder_level) {
            acc.low_stock_count++;
          }
          if (product.stock_in_pieces === 0) {
            acc.out_of_stock_count++;
          }

          acc.price_sum += product.price_per_piece || 0;

          return acc;
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
        }
      );

      stats.average_price =
        stats.active_products > 0 ? stats.price_sum / stats.active_products : 0;

      delete stats.price_sum; // Remove temporary field

      console.log(`✅ Category stats calculated:`, stats);
      return stats;
    } catch (error) {
      console.error("❌ Error calculating category stats:", error);
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
  }

  /**
   * Update category statistics in database (with fallback for missing columns)
   */
  static async updateCategoryStats(categoryId) {
    try {
      const stats = await this.calculateCategoryStats(categoryId);

      // Try to update with both stats and last_calculated columns
      const { error } = await supabase
        .from("categories")
        .update({
          stats: stats,
          last_calculated: new Date().toISOString(),
        })
        .eq("id", categoryId);

      if (error) {
        // If stats/last_calculated columns don't exist, skip the database update
        if (error.code === "PGRST204" || error.code === "42703") {
          console.warn(
            `⚠️ Category stats columns not yet created in database. Skipping update for ${categoryId}`
          );
          return { success: true, stats, skipped: true };
        }
        throw error;
      }

      console.log(`✅ Category ${categoryId} stats updated in database`);
      return { success: true, stats };
    } catch (error) {
      console.error("❌ Error updating category stats:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch update all category statistics
   */
  static async updateAllCategoryStats() {
    try {
      console.log("🔄 Updating all category statistics...");

      const { data: categories, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true);

      if (error) throw error;

      const results = await Promise.all(
        categories.map((category) => this.updateCategoryStats(category.id))
      );

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(
        `✅ Category stats update complete: ${successful} successful, ${failed} failed`
      );

      return {
        success: failed === 0,
        updated: successful,
        failed: failed,
        results,
      };
    } catch (error) {
      console.error("❌ Error updating all category stats:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive category insights for management dashboard (with fallback)
   */
  static async getCategoryInsights() {
    try {
      console.log("📈 Getting category insights...");

      // Try the enhanced query first
      let categories;
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("stats->total_value", { ascending: false });

        if (error && (error.code === "42703" || error.code === "PGRST204")) {
          // Fallback to basic query if stats column doesn't exist
          console.warn("⚠️ Stats column not found, using fallback query");
          const fallbackResult = await supabase
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("name");

          if (fallbackResult.error) throw fallbackResult.error;
          categories = fallbackResult.data;
        } else if (error) {
          throw error;
        } else {
          categories = data;
        }
      } catch (queryError) {
        // Ultimate fallback - basic query
        console.warn(
          "⚠️ Using basic fallback query for categories",
          queryError.message
        );
        const { data, error: fallbackError } = await supabase
          .from("categories")
          .select("*")
          .eq("is_active", true);

        if (fallbackError) throw fallbackError;
        categories = data;
      }

      // Calculate insights with fallback values
      const insights = {
        total_categories: categories.length,
        total_value: categories.reduce(
          (sum, cat) => sum + (cat.stats?.total_value || 0),
          0
        ),
        total_products: categories.reduce(
          (sum, cat) => sum + (cat.stats?.total_products || 0),
          0
        ),
        total_low_stock: categories.reduce(
          (sum, cat) => sum + (cat.stats?.low_stock_count || 0),
          0
        ),
        top_value_categories: categories
          .sort(
            (a, b) => (b.stats?.total_value || 0) - (a.stats?.total_value || 0)
          )
          .slice(0, 5),
        low_performing_categories: categories.filter(
          (cat) => (cat.stats?.total_value || 0) < 1000
        ),
        auto_created_categories: categories.filter(
          (cat) => cat.metadata?.auto_created
        ),
        categories_needing_attention: categories.filter(
          (cat) => (cat.stats?.low_stock_count || 0) > 0
        ),
      };

      console.log("✅ Category insights generated:", insights);
      return { success: true, data: insights };
    } catch (error) {
      console.error("❌ Error getting category insights:", error);
      return {
        success: false,
        error: error.message,
        data: {
          total_categories: 0,
          total_value: 0,
          total_products: 0,
          total_low_stock: 0,
          top_value_categories: [],
          low_performing_categories: [],
          auto_created_categories: [],
          categories_needing_attention: [],
        },
      };
    }
  }

  /**
   * Process multiple categories during bulk import
   */
  static async processBulkCategoryCreation(categories, context = {}) {
    try {
      console.log(
        `🔄 Processing bulk category creation for ${categories.length} categories`
      );

      const results = await Promise.all(
        categories.map(async (categoryName) => {
          const result = await this.createCategoryDuringImport(
            categoryName,
            context
          );
          return {
            original_name: categoryName,
            normalized_name: result.category?.name,
            action: result.action,
            success: result.success,
            category_id: result.category?.id,
          };
        })
      );

      const created = results.filter((r) => r.action === "created").length;
      const existing = results.filter((r) => r.action === "existing").length;
      const failed = results.filter((r) => !r.success).length;

      console.log(
        `✅ Bulk category processing complete: ${created} created, ${existing} existing, ${failed} failed`
      );

      return {
        success: failed === 0,
        summary: { created, existing, failed },
        results,
      };
    } catch (error) {
      console.error("❌ Error in bulk category processing:", error);
      return { success: false, error: error.message };
    }
  }
}

// Export for use in other services
export default IntelligentCategoryService;
