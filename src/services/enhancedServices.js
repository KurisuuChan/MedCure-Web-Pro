/**
 * 🏥 **ENHANCED CATEGORY SERVICE FOR MEDCURE-PRO**
 * Professional category management with full CRUD operations
 * Created: Phase 4 Implementation
 * Version: 2.0
 */

import { supabase } from "../config/supabase";

export class CategoryService {
  /**
   * Get all categories with statistics
   */
  static async getAllCategories() {
    try {
      console.log("🔍 CategoryService: Fetching all categories...");

      const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      // Get statistics for each category
      const categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          const stats = await this.getCategoryStats(category.id);
          return {
            ...category,
            stats,
          };
        })
      );

      console.log(
        `✅ CategoryService: Retrieved ${categoriesWithStats.length} categories`
      );
      return {
        success: true,
        data: categoriesWithStats,
      };
    } catch (error) {
      console.error("❌ CategoryService: Error fetching categories:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get active categories only
   */
  static async getActiveCategories() {
    try {
      console.log("🔍 CategoryService: Fetching active categories...");

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      console.log(
        `✅ CategoryService: Retrieved ${data.length} active categories`
      );
      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error(
        "❌ CategoryService: Error fetching active categories:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(categoryId) {
    try {
      const { data, error } = await supabase.rpc("get_category_stats", {
        category_uuid: categoryId,
      });

      if (error) throw error;

      return data && data.length > 0
        ? data[0]
        : {
            total_products: 0,
            active_products: 0,
            archived_products: 0,
            total_value: 0,
            low_stock_count: 0,
          };
    } catch (error) {
      console.error(
        "❌ CategoryService: Error fetching category stats:",
        error
      );
      return {
        total_products: 0,
        active_products: 0,
        archived_products: 0,
        total_value: 0,
        low_stock_count: 0,
      };
    }
  }

  /**
   * Create new category
   */
  static async createCategory(categoryData) {
    try {
      console.log(
        "📝 CategoryService: Creating new category:",
        categoryData.name
      );

      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: categoryData.name,
            description: categoryData.description || "",
            color: categoryData.color || "#3B82F6",
            icon: categoryData.icon || "Package",
            sort_order: categoryData.sort_order || 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log("✅ CategoryService: Category created successfully");
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ CategoryService: Error creating category:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update existing category
   */
  static async updateCategory(categoryId, updates) {
    try {
      console.log("📝 CategoryService: Updating category:", categoryId);

      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", categoryId)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ CategoryService: Category updated successfully");
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("❌ CategoryService: Error updating category:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete category (only if no products are associated)
   */
  static async deleteCategory(categoryId) {
    try {
      console.log(
        "🗑️ CategoryService: Attempting to delete category:",
        categoryId
      );

      const { data, error } = await supabase.rpc("safe_delete_category", {
        category_uuid: categoryId,
      });

      if (error) throw error;

      if (data) {
        console.log("✅ CategoryService: Category deleted successfully");
        return {
          success: true,
          message: "Category deleted successfully",
        };
      } else {
        console.log(
          "⚠️ CategoryService: Cannot delete category with associated products"
        );
        return {
          success: false,
          error: "Cannot delete category that has associated products",
        };
      }
    } catch (error) {
      console.error("❌ CategoryService: Error deleting category:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(categoryUpdates) {
    try {
      console.log("🔄 CategoryService: Reordering categories...");

      const updates = categoryUpdates.map(({ id, sort_order }) =>
        supabase.from("categories").update({ sort_order }).eq("id", id)
      );

      await Promise.all(updates);

      console.log("✅ CategoryService: Categories reordered successfully");
      return {
        success: true,
        message: "Categories reordered successfully",
      };
    } catch (error) {
      console.error("❌ CategoryService: Error reordering categories:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * 🗃️ **ENHANCED ARCHIVE SERVICE FOR MEDCURE-PRO**
 * Professional archive management with restore functionality
 */

export class ArchiveService {
  /**
   * Get all archived products
   */
  static async getArchivedProducts() {
    try {
      console.log("🔍 ArchiveService: Fetching archived products...");

      const { data, error } = await supabase
        .from("archived_products")
        .select("*")
        .order("archived_at", { ascending: false });

      if (error) throw error;

      console.log(
        `✅ ArchiveService: Retrieved ${data.length} archived products`
      );
      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error(
        "❌ ArchiveService: Error fetching archived products:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  /**
   * Archive a product
   */
  static async archiveProduct(productId, userId) {
    try {
      console.log("📦 ArchiveService: Archiving product:", productId);

      const { data, error } = await supabase.rpc("archive_product", {
        product_uuid: productId,
        user_uuid: userId,
      });

      if (error) throw error;

      if (data) {
        console.log("✅ ArchiveService: Product archived successfully");
        return {
          success: true,
          message: "Product archived successfully",
        };
      } else {
        return {
          success: false,
          error: "Product not found or already archived",
        };
      }
    } catch (error) {
      console.error("❌ ArchiveService: Error archiving product:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Restore an archived product
   */
  static async restoreProduct(productId) {
    try {
      console.log("♻️ ArchiveService: Restoring product:", productId);

      const { data, error } = await supabase.rpc("restore_product", {
        product_uuid: productId,
      });

      if (error) throw error;

      if (data) {
        console.log("✅ ArchiveService: Product restored successfully");
        return {
          success: true,
          message: "Product restored successfully",
        };
      } else {
        return {
          success: false,
          error: "Product not found or not archived",
        };
      }
    } catch (error) {
      console.error("❌ ArchiveService: Error restoring product:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Permanently delete an archived product (admin only)
   */
  static async permanentlyDeleteProduct(productId) {
    try {
      console.log(
        "🗑️ ArchiveService: Permanently deleting product:",
        productId
      );

      // First check if product is archived
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("is_archived")
        .eq("id", productId)
        .single();

      if (fetchError) throw fetchError;

      if (!product.is_archived) {
        return {
          success: false,
          error: "Only archived products can be permanently deleted",
        };
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      console.log("✅ ArchiveService: Product permanently deleted");
      return {
        success: true,
        message: "Product permanently deleted",
      };
    } catch (error) {
      console.error(
        "❌ ArchiveService: Error permanently deleting product:",
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * 💰 **ENHANCED PRICING SERVICE FOR MEDCURE-PRO**
 * Professional pricing management with profit calculations
 */

export class PricingService {
  /**
   * Calculate profit margin
   */
  static calculateMargin(costPrice, sellPrice) {
    if (!costPrice || costPrice <= 0) return 0;
    return ((sellPrice - costPrice) / costPrice) * 100;
  }

  /**
   * Calculate sell price from cost and desired margin
   */
  static calculateSellPrice(costPrice, marginPercentage) {
    if (!costPrice || costPrice <= 0) return 0;
    return costPrice * (1 + marginPercentage / 100);
  }

  /**
   * Update product pricing
   */
  static async updateProductPricing(productId, pricingData) {
    try {
      console.log("💰 PricingService: Updating product pricing:", productId);

      const updates = {
        cost_price: pricingData.cost_price,
        base_price: pricingData.base_price,
        price_per_piece: pricingData.price_per_piece,
        margin_percentage: pricingData.margin_percentage,
      };

      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ PricingService: Product pricing updated successfully");
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(
        "❌ PricingService: Error updating product pricing:",
        error
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get pricing analytics
   */
  static async getPricingAnalytics() {
    try {
      console.log("📊 PricingService: Fetching pricing analytics...");

      const { data, error } = await supabase
        .from("products_with_category")
        .select(
          `
          id, name, category_name,
          cost_price, price_per_piece, stock_in_pieces,
          actual_margin_percentage
        `
        )
        .eq("is_active", true)
        .eq("is_archived", false);

      if (error) throw error;

      // Calculate analytics
      const analytics = {
        totalProducts: data.length,
        averageMargin:
          data.length > 0
            ? data.reduce(
                (sum, p) => sum + (p.actual_margin_percentage || 0),
                0
              ) / data.length
            : 0,
        totalInventoryValue: data.reduce(
          (sum, p) => sum + p.stock_in_pieces * p.price_per_piece,
          0
        ),
        totalCostValue: data.reduce(
          (sum, p) => sum + p.stock_in_pieces * (p.cost_price || 0),
          0
        ),
        lowMarginProducts: data.filter(
          (p) => (p.actual_margin_percentage || 0) < 20
        ).length,
        highMarginProducts: data.filter(
          (p) => (p.actual_margin_percentage || 0) > 50
        ).length,
      };

      console.log("✅ PricingService: Pricing analytics calculated");
      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      console.error(
        "❌ PricingService: Error fetching pricing analytics:",
        error
      );
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }
}

// Export all services
export default {
  CategoryService,
  ArchiveService,
  PricingService,
};
