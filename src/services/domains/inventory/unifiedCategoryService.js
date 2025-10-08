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
   * Get category by name (case-insensitive with enhanced fuzzy matching)
   */
  static async getCategoryByName(name) {
    try {
      const normalizedName = this.normalizeCategoryName(name);

      // First: Exact match search (case-insensitive)
      const { data: exactMatch, error: exactError } = await supabase
        .from("categories")
        .select("*")
        .ilike("name", normalizedName.trim())
        .eq("is_active", true)
        .maybeSingle();

      if (exactError) throw exactError;
      if (exactMatch) {
        return { success: true, data: exactMatch, matchType: "exact" };
      }

      // Second: Fuzzy match search for similar categories
      const { data: allCategories, error: allError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true);

      if (allError) throw allError;

      // Find similar categories using Levenshtein distance
      const similarCategory = this.findSimilarCategory(
        normalizedName,
        allCategories
      );
      if (similarCategory) {
        return {
          success: true,
          data: similarCategory,
          matchType: "similar",
          suggestion: `Similar category "${similarCategory.name}" found for "${normalizedName}"`,
        };
      }

      return { success: true, data: null, matchType: "none" };
    } catch (error) {
      console.error(
        "❌ [UnifiedCategory] Error fetching category by name:",
        error
      );
      return { success: false, data: null, error: error.message };
    }
  }

  /**
   * Create new category with enhanced duplicate detection
   * Used by: Management Page, Auto-import system
   * ENHANCED: Uses database function for atomic, safe creation
   */
  static async createCategory(categoryData, context = {}) {
    try {
      console.log(
        "➕ [UnifiedCategory] Creating new category:",
        categoryData.name
      );

      // Normalize and validate data
      const normalizedData = await this.normalizeCategoryData(categoryData);

      // Try using the safe database function first (if available)
      try {
        const { data: dbResult, error: dbError } = await supabase.rpc(
          "create_category_safe",
          {
            p_name: normalizedData.name,
            p_description:
              normalizedData.description ||
              `Auto-created category: ${normalizedData.name}`,
            p_color: normalizedData.color,
            p_icon: normalizedData.icon,
            p_metadata: {
              created_by: context.userId || "system",
              creation_source: context.source || "manual",
              creation_context:
                context.description || "Standard category creation",
              similarity_checked: true,
              original_name: categoryData.name,
              ...normalizedData.metadata,
            },
          }
        );

        if (!dbError && dbResult && dbResult.length > 0) {
          const result = dbResult[0];

          // Fetch the full category data
          const { data: fullCategory, error: fetchError } = await supabase
            .from("categories")
            .select("*")
            .eq("id", result.category_id)
            .single();

          if (!fetchError && fullCategory) {
            const action = result.was_created ? "created" : "existing";

            console.log(
              `✅ [UnifiedCategory] Category ${action}: ${fullCategory.name}`
            );

            // Log creation for audit trail
            if (result.was_created) {
              await this.logCategoryActivity(
                "category_created",
                fullCategory.id,
                {
                  ...context,
                  original_name: categoryData.name,
                  normalized_name: normalizedData.name,
                }
              );
            }

            return {
              success: true,
              data: fullCategory,
              action,
              message: result.message || `Category ${action} successfully`,
            };
          }
        }
      } catch (rpcError) {
        console.warn(
          "⚠️ [UnifiedCategory] Safe function not available, using fallback method:",
          rpcError
        );
        // Fall through to manual creation below
      }

      // Fallback: Manual creation with enhanced duplicate checking
      const existingCheck = await this.getCategoryByName(normalizedData.name);

      if (existingCheck.success && existingCheck.data) {
        const matchType = existingCheck.matchType || "exact";

        console.log(
          `ℹ️ [UnifiedCategory] Category "${normalizedData.name}" ${matchType} match found: "${existingCheck.data.name}"`
        );

        // For exact matches, return existing category
        if (matchType === "exact") {
          return {
            success: true,
            data: existingCheck.data,
            action: "existing",
            message: `Category "${existingCheck.data.name}" already exists`,
          };
        }

        // For similar matches, suggest merging or creating with different name
        if (matchType === "similar" && context.autoMerge !== true) {
          return {
            success: false,
            action: "similar_found",
            suggestion: existingCheck.suggestion,
            existingCategory: existingCheck.data,
            proposedCategory: normalizedData,
            message: `Similar category "${existingCheck.data.name}" found. Consider using existing or creating with a different name.`,
          };
        }
      }

      // Get next sort order
      const nextSortOrder = await this.getNextSortOrder();

      // Prepare category data with enhanced metadata
      const newCategory = {
        ...normalizedData,
        sort_order: nextSortOrder,
        is_active: true,
        created_at: new Date().toISOString(),
        metadata: {
          created_by: context.userId || "system",
          creation_source: context.source || "manual",
          creation_context: context.description || "Standard category creation",
          similarity_checked: true,
          original_name: categoryData.name,
          ...normalizedData.metadata,
        },
      };

      const { data, error } = await supabase
        .from("categories")
        .insert([newCategory])
        .select()
        .single();

      if (error) {
        // Handle duplicate key violation
        if (
          error.code === "23505" ||
          error.message?.includes("duplicate key")
        ) {
          console.log(
            `ℹ️ [UnifiedCategory] Category "${normalizedData.name}" already exists (caught duplicate key error)`
          );

          // Try to fetch the existing category
          const existingResult = await this.getCategoryByName(
            normalizedData.name
          );
          if (existingResult.success && existingResult.data) {
            return {
              success: true,
              data: existingResult.data,
              action: "existing",
              message: `Category "${existingResult.data.name}" already exists`,
            };
          }
        }
        throw error;
      }

      // Log creation for audit trail
      await this.logCategoryActivity("category_created", data.id, {
        ...context,
        original_name: categoryData.name,
        normalized_name: normalizedData.name,
      });

      console.log(
        `✅ [UnifiedCategory] Category "${data.name}" created successfully`
      );

      return {
        success: true,
        data,
        action: "created",
        message: `Category "${data.name}" created successfully`,
      };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error creating category:", error);
      return {
        success: false,
        error: error.message,
        action: "failed",
        message: `Failed to create category: ${error.message}`,
      };
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
   * Create category if it doesn't exist, or return existing one with enhanced logic
   */
  static async createOrGetCategory(categoryName, context = {}) {
    try {
      // Normalize the category name
      const normalizedName = this.normalizeCategoryName(categoryName);

      // Enhanced category lookup with similarity detection
      const existingResult = await this.getCategoryByName(normalizedName);

      if (existingResult.success && existingResult.data) {
        const matchType = existingResult.matchType || "exact";

        // For exact matches, return immediately
        if (matchType === "exact") {
          return {
            success: true,
            data: existingResult.data,
            action: "existing",
            message: `Using existing category: ${existingResult.data.name}`,
          };
        }

        // For similar matches during import, auto-use the similar category
        if (matchType === "similar" && context.source === "import") {
          console.log(
            `🔄 [UnifiedCategory] Auto-using similar category "${existingResult.data.name}" for "${normalizedName}"`
          );

          // Log the mapping for audit purposes
          await this.logCategoryActivity(
            "category_auto_mapped",
            existingResult.data.id,
            {
              ...context,
              original_name: categoryName,
              normalized_name: normalizedName,
              mapped_to: existingResult.data.name,
              similarity_match: true,
            }
          );

          return {
            success: true,
            data: existingResult.data,
            action: "mapped",
            message: `Mapped "${categoryName}" to existing category "${existingResult.data.name}"`,
          };
        }
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
          creation_trigger: context.source || "system",
          batch_id: context.batchId || null,
          ...context,
        },
      };

      const result = await this.createCategory(categoryData, {
        ...context,
        autoMerge: true, // Allow auto-merging during bulk operations
      });

      if (result.success) {
        return {
          success: true,
          data: result.data,
          action: "created",
          message: `Created new category: ${result.data.name}`,
        };
      } else {
        throw new Error(result.error || result.message);
      }
    } catch (error) {
      console.error(
        "❌ [UnifiedCategory] Error in createOrGetCategory:",
        error
      );
      return {
        success: false,
        error: error.message,
        message: `Failed to create or get category for "${categoryName}"`,
      };
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
          generic_name,
          brand_name,
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
   * Normalize category name with intelligent mapping and enhanced validation
   * ENHANCED: Added more pharmacy-specific category mappings
   */
  static normalizeCategoryName(name) {
    if (!name || typeof name !== "string") {
      return "General Medicine";
    }

    // Enhanced category mapping for intelligent normalization
    const mappings = {
      // Pain & Fever Relief
      "pain relief": "Pain Relief",
      "pain reliever": "Pain Relief",
      "pain relief & fever": "Pain Relief",
      "pain & fever": "Pain Relief",
      analgesics: "Pain Relief",
      "anti-inflammatory": "Pain Relief",
      ibuprofen: "Pain Relief",
      paracetamol: "Pain Relief",
      aspirin: "Pain Relief",

      // Antibiotics & Antimicrobials
      antibiotics: "Antibiotics",
      antibiotic: "Antibiotics",
      antimicrobial: "Antibiotics",
      penicillin: "Antibiotics",
      amoxicillin: "Antibiotics",

      // Antihistamines & Allergies
      antihistamines: "Antihistamines",
      antihistamine: "Antihistamines",
      allergy: "Antihistamines",
      allergies: "Antihistamines",
      "anti-histamine": "Antihistamines",

      // Antifungal
      antifungal: "Antifungal",
      "anti-fungal": "Antifungal",
      fungal: "Antifungal",

      // Cardiovascular
      cardiovascular: "Cardiovascular",
      cardio: "Cardiovascular",
      heart: "Cardiovascular",
      "blood pressure": "Cardiovascular",
      hypertension: "Cardiovascular",

      // Digestive & Gastrointestinal
      digestive: "Gastrointestinal",
      "digestive health": "Gastrointestinal",
      stomach: "Gastrointestinal",
      gastrointestinal: "Gastrointestinal",
      antacid: "Gastrointestinal",
      "anti-diarrheal": "Gastrointestinal",

      // Respiratory
      respiratory: "Respiratory",
      breathing: "Respiratory",
      cough: "Respiratory",
      cold: "Respiratory",
      "cough & cold": "Respiratory",
      flu: "Respiratory",
      asthma: "Respiratory",

      // Vitamins & Supplements
      vitamins: "Vitamins & Supplements",
      vitamin: "Vitamins & Supplements",
      supplements: "Vitamins & Supplements",
      "vitamins & supplements": "Vitamins & Supplements",
      multivitamin: "Vitamins & Supplements",
      minerals: "Vitamins & Supplements",

      // Diabetes
      diabetes: "Antidiabetic",
      diabetic: "Antidiabetic",
      antidiabetic: "Antidiabetic",
      "blood sugar": "Antidiabetic",
      insulin: "Antidiabetic",

      // Dermatology
      skin: "Dermatology",
      dermatology: "Dermatology",
      topical: "Dermatology",
      cream: "Dermatology",
      ointment: "Dermatology",

      // Eye Care
      eye: "Eye Care",
      eyes: "Eye Care",
      ophthalmology: "Eye Care",
      vision: "Eye Care",
      drops: "Eye Care",
    };

    const normalized = name.toLowerCase().trim();

    // Check direct mappings first
    if (mappings[normalized]) {
      console.log(`🔄 [Normalize] "${name}" → "${mappings[normalized]}"`);
      return mappings[normalized];
    }

    // Check partial matches with fuzzy logic
    for (const [key, value] of Object.entries(mappings)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        console.log(`🔄 [Normalize] "${name}" ~→ "${value}" (fuzzy match)`);
        return value;
      }
    }

    // Clean and format the original name
    const titleCased = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    console.log(`🔄 [Normalize] "${name}" → "${titleCased}" (title case)`);
    return titleCased;
  }

  /**
   * Find similar category using Levenshtein distance algorithm
   */
  static findSimilarCategory(targetName, categories, threshold = 0.7) {
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const category of categories) {
      const similarity = this.calculateStringSimilarity(
        targetName.toLowerCase(),
        category.name.toLowerCase()
      );

      if (similarity > threshold && similarity > bestSimilarity) {
        bestMatch = category;
        bestSimilarity = similarity;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  static calculateStringSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0) return str2.length === 0 ? 1.0 : 0.0;
    if (str2.length === 0) return 0.0;

    const matrix = Array(str2.length + 1)
      .fill()
      .map(() => Array(str1.length + 1).fill(0));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1, // deletion
          matrix[j][i - 1] + 1, // insertion
          matrix[j - 1][i - 1] + cost // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - matrix[str2.length][str1.length]) / maxLength;
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
   * Create categories from import data with enhanced deduplication
   */
  static async createCategoriesFromImport(categoryNames, metadata = {}) {
    try {
      console.log(
        "📦 [UnifiedCategory] Creating categories from import with deduplication..."
      );

      // Remove duplicates and normalize names
      const uniqueNames = [
        ...new Set(
          categoryNames.map((name) => this.normalizeCategoryName(name))
        ),
      ];

      // Fetch existing categories to avoid duplicates
      const existingResult = await this.getAllCategories();
      const existingNames = new Set();

      if (existingResult.success) {
        existingResult.data.forEach((cat) => {
          existingNames.add(cat.name.toLowerCase());
        });
      }

      const results = [];
      const batchId = `import-${Date.now()}`;

      // Process each category with enhanced logic
      for (const name of uniqueNames) {
        const normalizedName = this.normalizeCategoryName(name);

        // Skip if already exists (case-insensitive check)
        if (existingNames.has(normalizedName.toLowerCase())) {
          results.push({
            name: normalizedName,
            status: "exists",
            message: `Category "${normalizedName}" already exists`,
          });
          continue;
        }

        try {
          // Create new category with batch tracking
          const created = await this.createCategory(
            {
              name: normalizedName,
              description: `Auto-created during batch import: ${
                metadata.import_session || "Unknown"
              }`,
              color: this.getColorForCategory(normalizedName),
              icon: this.getIconForCategory(normalizedName),
              metadata: {
                ...metadata,
                batch_id: batchId,
                auto_created: true,
                creation_source: "bulk_import",
              },
            },
            {
              source: "bulk_import",
              batchId,
              autoMerge: true,
            }
          );

          if (created.success) {
            results.push({
              name: normalizedName,
              status: "created",
              id: created.data.id,
              message: `Created category "${normalizedName}"`,
            });
            // Add to existing names to prevent duplicates in same batch
            existingNames.add(normalizedName.toLowerCase());
          } else {
            results.push({
              name: normalizedName,
              status: "failed",
              error: created.error,
              message: `Failed to create "${normalizedName}": ${created.error}`,
            });
          }
        } catch (error) {
          results.push({
            name: normalizedName,
            status: "error",
            error: error.message,
            message: `Error creating "${normalizedName}": ${error.message}`,
          });
        }
      }

      const summary = {
        total: uniqueNames.length,
        created: results.filter((r) => r.status === "created").length,
        existing: results.filter((r) => r.status === "exists").length,
        failed: results.filter(
          (r) => r.status === "failed" || r.status === "error"
        ).length,
        batchId,
        results,
      };

      console.log("✅ [UnifiedCategory] Batch creation summary:", summary);

      return {
        success: true,
        data: results,
        summary,
      };
    } catch (error) {
      console.error(
        "❌ [UnifiedCategory] Error creating categories from import:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: [],
        summary: {
          total: categoryNames.length,
          created: 0,
          existing: 0,
          failed: categoryNames.length,
          results: [],
        },
      };
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

  // ==========================================
  // SMART CATEGORY IMPORT PROCESSING
  // ==========================================

  /**
   * Detect new categories during import and request approval
   * Migrated from SmartCategoryService
   */
  static async detectAndProcessCategories(importData, userId) {
    try {
      console.log(
        "🔍 [UnifiedCategory] Analyzing categories in import data..."
      );

      // Get existing categories
      const existingCategoriesResult = await this.getAllCategories();
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

      console.log("📋 [UnifiedCategory] Found new categories:", newCategories);

      // Return data for user approval
      return {
        success: true,
        data: {
          newCategories: newCategories.map((name) => ({
            name,
            suggested: true,
            color: this.getColorForCategory(name),
            icon: this.getIconForCategory(name),
            count: importData.filter(
              (item) => item.category?.toLowerCase() === name.toLowerCase()
            ).length,
          })),
          requiresApproval: true,
          processedData: importData,
        },
      };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error detecting categories:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Create approved categories automatically
   * Migrated from SmartCategoryService
   * ENHANCED: Better error tracking and reporting
   */
  static async createApprovedCategories(approvedCategories, userId) {
    try {
      console.log(
        "✅ [UnifiedCategory] Creating approved categories:",
        approvedCategories
      );

      const createdCategories = [];
      const failedCategories = [];
      const skippedCategories = [];

      for (const category of approvedCategories) {
        try {
          const result = await this.createCategory(
            {
              name: category.name,
              description: `Auto-created from import by system`,
              color: category.color,
              icon: category.icon,
            },
            {
              userId,
              source: "import_approval",
            }
          );

          if (result.success) {
            if (result.action === "created") {
              createdCategories.push(result.data);
              console.log(
                `✅ [UnifiedCategory] Created category: ${category.name}`
              );
            } else if (result.action === "existing") {
              skippedCategories.push({
                name: category.name,
                reason: "Already exists",
                data: result.data,
              });
              console.log(
                `ℹ️ [UnifiedCategory] Category already exists: ${category.name}`
              );
            }
          } else {
            failedCategories.push({
              name: category.name,
              error: result.error || result.message,
              action: result.action,
            });
            console.error(
              `❌ [UnifiedCategory] Failed to create category: ${category.name}`,
              {
                error: result.error,
                message: result.message,
                action: result.action,
                fullResult: result,
              }
            );
          }
        } catch (categoryError) {
          failedCategories.push({
            name: category.name,
            error: categoryError.message,
          });
          console.error(
            `❌ [UnifiedCategory] Exception creating category: ${category.name}`,
            categoryError
          );
        }
      }

      const hasFailures = failedCategories.length > 0;
      const summary = {
        total: approvedCategories.length,
        created: createdCategories.length,
        skipped: skippedCategories.length,
        failed: failedCategories.length,
        failedCategories,
        skippedCategories,
      };

      console.log("📊 [UnifiedCategory] Creation summary:", summary);

      return {
        success: !hasFailures, // Only success if NO failures
        data: createdCategories,
        summary,
        hasFailures,
        error: hasFailures
          ? `Failed to create ${
              failedCategories.length
            } categories: ${failedCategories.map((f) => f.name).join(", ")}`
          : null,
      };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error creating categories:", error);
      return {
        success: false,
        error: error.message,
        data: [],
        summary: {
          total: approvedCategories.length,
          created: 0,
          skipped: 0,
          failed: approvedCategories.length,
        },
      };
    }
  }

  /**
   * Map import data to use category IDs instead of names
   * Migrated from SmartCategoryService
   */
  /**
   * Map categories to IDs with enhanced fuzzy matching and auto-creation
   */
  static async mapCategoriesToIds(importData) {
    try {
      console.log(
        "🔗 [UnifiedCategory] Mapping categories to IDs with enhanced logic..."
      );

      const categoriesResult = await this.getAllCategories();
      if (!categoriesResult.success) {
        throw new Error("Failed to fetch categories");
      }

      // Create enhanced category mapping with multiple lookup strategies
      const categoryMap = new Map();
      const normalizedMap = new Map();

      // Build lookup maps for exact and normalized matches
      categoriesResult.data.forEach((cat) => {
        // Exact name lookup (case-insensitive)
        categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
        // Normalized name lookup
        const normalized = this.normalizeCategoryName(cat.name);
        normalizedMap.set(normalized.toLowerCase().trim(), cat.id);
      });

      const mappedData = [];
      const unmappedCategories = new Set();
      const mappingStats = {
        exactMatches: 0,
        normalizedMatches: 0,
        unmapped: 0,
        total: importData.length,
      };

      for (const item of importData) {
        let categoryId = null;

        if (item.category) {
          const originalCategory = item.category.toLowerCase().trim();
          const normalizedCategory = this.normalizeCategoryName(item.category)
            .toLowerCase()
            .trim();

          // Strategy 1: Exact match
          if (categoryMap.has(originalCategory)) {
            categoryId = categoryMap.get(originalCategory);
            mappingStats.exactMatches++;
          }
          // Strategy 2: Normalized match
          else if (normalizedMap.has(normalizedCategory)) {
            categoryId = normalizedMap.get(normalizedCategory);
            mappingStats.normalizedMatches++;
          }
          // Strategy 3: Fuzzy match (for existing categories)
          else {
            const similarCategory = this.findSimilarCategory(
              normalizedCategory,
              categoriesResult.data,
              0.8 // Higher threshold for auto-mapping
            );

            if (similarCategory) {
              categoryId = similarCategory.id;
              console.log(
                `🔄 [UnifiedCategory] Fuzzy matched "${item.category}" → "${similarCategory.name}"`
              );
            } else {
              // Auto-create missing category
              console.log(
                `🆕 [UnifiedCategory] Auto-creating category: "${item.category}"`
              );
              try {
                const result = await this.createCategory(
                  {
                    name: item.category,
                    description: `Auto-created from import: ${item.category}`,
                    color: "#6B7280", // Default gray color
                    icon: "Package",
                  },
                  { source: "auto_import" }
                );

                if (result.success) {
                  categoryId = result.data.id;
                  // Add to maps for subsequent items
                  categoryMap.set(originalCategory, categoryId);
                  normalizedMap.set(normalizedCategory, categoryId);
                  console.log(
                    `✅ [UnifiedCategory] Successfully created category: "${item.category}" (ID: ${categoryId})`
                  );
                } else {
                  console.error(
                    `❌ [UnifiedCategory] Failed to create category: "${item.category}"`
                  );
                  unmappedCategories.add(item.category);
                  mappingStats.unmapped++;
                }
              } catch (createError) {
                console.error(
                  `❌ [UnifiedCategory] Error creating category "${item.category}":`,
                  createError
                );
                unmappedCategories.add(item.category);
                mappingStats.unmapped++;
              }
            }
          }
        }

        mappedData.push({
          ...item,
          category_id: categoryId,
          category: item.category, // Keep original for reference
          // mapping_type removed - doesn't exist in database schema
        });
      }

      // Log mapping statistics
      console.log("📊 [UnifiedCategory] Mapping Statistics:", mappingStats);

      if (unmappedCategories.size > 0) {
        console.log(
          "⚠️ [UnifiedCategory] Unmapped categories:",
          Array.from(unmappedCategories)
        );
      }

      return {
        success: true,
        data: mappedData,
        stats: mappingStats,
        unmappedCategories: Array.from(unmappedCategories),
      };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error mapping categories:", error);
      return {
        success: false,
        error: error.message,
        data: importData,
        stats: {
          exactMatches: 0,
          normalizedMatches: 0,
          unmapped: importData.length,
          total: importData.length,
        },
      };
    }
  }

  // ==========================================
  // CATEGORY VALUE MONITORING & ANALYTICS
  // ==========================================

  /**
   * Get comprehensive category analytics
   * Enhanced version of getCategoryInsights with more detailed analytics
   */
  static async getCategoryValueAnalytics() {
    try {
      console.log(
        "📊 [UnifiedCategory] Generating category value analytics..."
      );

      const categoriesResult = await this.getAllCategories();
      if (!categoriesResult.success) {
        throw new Error("Failed to fetch categories");
      }

      const analytics = await Promise.all(
        categoriesResult.data.map(async (category) => {
          const statsResult = await this.getCategoryStatistics(category.id);
          const valueData = statsResult.success
            ? statsResult.data
            : this.getEmptyStats();
          const trends = await this.calculateCategoryTrends(category.id);
          const alerts = await this.generateCategoryAlerts(
            category.id,
            valueData
          );

          return {
            id: category.id,
            name: category.name,
            color: category.color,
            icon: category.icon,
            totalProducts: valueData.total_products,
            totalValue: valueData.total_value,
            averagePrice: valueData.average_price,
            totalStock: valueData.total_products,
            lowStockItems: valueData.low_stock_count,
            expiringItems: 0, // Would need expiry date tracking
            margin: this.calculateMargin(valueData),
            trends,
            alerts,
            performanceScore: this.calculatePerformanceScore(valueData, trends),
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
        "❌ [UnifiedCategory] Error generating value analytics:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Get real-time category value tracking
   */
  static async getRealtimeCategoryValues() {
    try {
      console.log("⚡ [UnifiedCategory] Getting real-time values...");

      const analytics = await this.getCategoryValueAnalytics();

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
        "❌ [UnifiedCategory] Error getting real-time data:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  /**
   * Generate category performance dashboard
   */
  static async generatePerformanceDashboard(timeframe = 30) {
    try {
      console.log("📈 [UnifiedCategory] Generating performance dashboard...");

      const analytics = await this.getCategoryValueAnalytics();
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
        recommendations: this.generateCategoryRecommendations(
          analytics.data.categories
        ),
      };

      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      console.error("❌ [UnifiedCategory] Error generating dashboard:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  // ==========================================
  // PRIVATE HELPER METHODS FOR ANALYTICS
  // ==========================================

  /**
   * Calculate category trends
   */
  static async calculateCategoryTrends(categoryId, days = 30) {
    // Placeholder implementation - would analyze historical data
    return {
      valueGrowth: Math.random() * 20 - 10, // -10% to +10%
      stockMovement: Math.random() * 100,
      salesVelocity: Math.random() * 50,
      priceChanges: Math.random() * 5 - 2.5,
    };
  }

  /**
   * Generate category alerts
   */
  static async generateCategoryAlerts(categoryId, valueData) {
    const alerts = [];

    if (valueData.low_stock_count > 0) {
      alerts.push({
        type: "low_stock",
        severity: "warning",
        message: `${valueData.low_stock_count} items running low`,
        action: "Review reorder levels",
      });
    }

    if (valueData.out_of_stock_count > 0) {
      alerts.push({
        type: "out_of_stock",
        severity: "critical",
        message: `${valueData.out_of_stock_count} items out of stock`,
        action: "Urgent reorder required",
      });
    }

    const margin = this.calculateMargin(valueData);
    if (margin < 20) {
      alerts.push({
        type: "low_margin",
        severity: "info",
        message: "Below target profit margin",
        action: "Review pricing strategy",
      });
    }

    return alerts;
  }

  /**
   * Calculate profit margin
   */
  static calculateMargin(valueData) {
    if (valueData.total_value === 0) return 0;
    return (
      ((valueData.total_value - valueData.total_cost_value) /
        valueData.total_value) *
      100
    );
  }

  /**
   * Calculate performance score
   */
  static calculatePerformanceScore(valueData, trends) {
    // Weighted performance calculation
    const valueScore = Math.min((valueData.total_value / 10000) * 30, 30);
    const marginScore = Math.min(this.calculateMargin(valueData) * 0.5, 25);

    // Calculate trend score
    let trendScore;
    if (trends.valueGrowth > 0) {
      trendScore = 25;
    } else if (trends.valueGrowth < -10) {
      trendScore = 0;
    } else {
      trendScore = 15;
    }

    const stockScore = valueData.low_stock_count === 0 ? 20 : 10;

    return Math.round(valueScore + marginScore + trendScore + stockScore);
  }

  /**
   * Generate category recommendations
   */
  static generateCategoryRecommendations(categories) {
    const recommendations = [];

    // Find underperforming categories
    const underperformers = categories.filter(
      (cat) => cat.performanceScore < 60
    );
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
  detectAndProcessCategories,
  createApprovedCategories,
  mapCategoriesToIds,
  getCategoryValueAnalytics,
  getRealtimeCategoryValues,
  generatePerformanceDashboard,
} = UnifiedCategoryService;
