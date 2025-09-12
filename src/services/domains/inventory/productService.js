// 💊 **PRODUCT SERVICE**
// Handles all pharmaceutical product operations
// Professional database-only implementation with Supabase

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";
import { UnifiedCategoryService } from "./unifiedCategoryService.js";

export class ProductService {
  static async getProducts() {
    try {
      console.log("🔍 ProductService.getProducts() called");
      console.log("📡 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
      console.log(
        "🔑 Has Supabase Key:",
        !!import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      console.log("🧪 Use Mock Data:", import.meta.env.VITE_USE_MOCK_DATA);

      logDebug("Fetching all products from Supabase database");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true) // Only get active products
        .order("name");

      if (error) {
        console.error("❌ ProductService.getProducts() Supabase error:", error);
        console.error(
          "Error details:",
          error.message,
          error.details,
          error.hint
        );
        throw error;
      }

      console.log(
        `✅ Successfully fetched ${data?.length || 0} products from database`
      );
      if (data && data.length > 0) {
        console.log("📦 Sample product:", data[0]);
        // Log low stock items
        const lowStockItems = data.filter((product) => {
          const stockLevel = product.stock_in_pieces || 0;
          const reorderLevel = product.reorder_level || 10;
          return stockLevel <= reorderLevel;
        });
        console.log(
          `🎯 Found ${lowStockItems.length} low stock items in database`
        );
        lowStockItems.forEach((product) => {
          console.log(
            `• ${product.name}: ${product.stock_in_pieces}/${product.reorder_level}`
          );
        });
      }

      logDebug(
        `Successfully fetched ${data?.length || 0} products from database`
      );
      console.log(
        "📦 ProductService.getProducts() result:",
        data?.length || 0,
        "products from real database"
      );
      return data || [];
    } catch (error) {
      console.error("❌ ProductService.getProducts() failed:", error);
      handleError(error, "Get products");
      return [];
    }
  }

  static async getProductById(id) {
    try {
      logDebug(`Fetching product by ID: ${id}`);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      logDebug("Successfully fetched product", data);
      return data;
    } catch (error) {
      handleError(error, "Get product by ID");
    }
  }

  static async updateProduct(id, updates) {
    try {
      logDebug(`Updating product ${id}`, updates);

      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;

      logDebug("Successfully updated product", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Update product");
    }
  }

  static async addProduct(product) {
    try {
      logDebug("Adding new product", product);

      const { data, error } = await supabase
        .from("products")
        .insert([product])
        .select();

      if (error) throw error;

      logDebug("Successfully added product", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Add product");
    }
  }

  static async deleteProduct(id) {
    try {
      logDebug(`Safely deleting product ${id}`);

      const { data, error } = await supabase.rpc("safe_delete_product", {
        product_id: id,
      });

      if (error) throw error;

      logDebug("Successfully processed product deletion", data);
      return data;
    } catch (error) {
      handleError(error, "Delete product");
    }
  }

  /**
   * Get products with low stock (using individual reorder levels)
   * @param {boolean} useIndividualLevels - Whether to use product-specific reorder levels
   * @param {number} fallbackThreshold - Default threshold if product has no reorder level
   * @returns {Promise<Array>} Low stock products
   */
  static async getLowStockProducts(
    useIndividualLevels = true,
    fallbackThreshold = 10
  ) {
    try {
      logDebug(
        `Fetching low stock products with ${
          useIndividualLevels
            ? "individual reorder levels"
            : `threshold ${fallbackThreshold}`
        }`
      );

      if (useIndividualLevels) {
        // Get all active products and filter by individual reorder levels
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("stock_in_pieces", { ascending: true });

        if (error) throw error;

        // Filter using individual reorder levels with fallback
        const lowStockProducts = (data || []).filter((product) => {
          const stockLevel = product.stock_in_pieces || 0;
          const reorderLevel = product.reorder_level || fallbackThreshold;
          return stockLevel <= reorderLevel;
        });

        logDebug(
          `Found ${lowStockProducts.length} low stock products using individual reorder levels`
        );
        return lowStockProducts;
      } else {
        // Original method - use fixed threshold
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .lt("stock_in_pieces", fallbackThreshold)
          .eq("is_active", true)
          .order("stock_in_pieces", { ascending: true });

        if (error) throw error;

        logDebug(
          `Found ${
            data?.length || 0
          } low stock products using fixed threshold ${fallbackThreshold}`
        );
        return data || [];
      }
    } catch (error) {
      handleError(error, "Get low stock products");
      return [];
    }
  }

  // 📦 **ARCHIVE OPERATIONS**
  static async archiveProduct(
    productId,
    reason = "Manual archive",
    userId = null
  ) {
    try {
      logDebug(`Archiving product ${productId}`);

      const { data, error } = await supabase
        .from("products")
        .update({
          is_archived: true,
          archived_at: new Date().toISOString(),
          archived_by: userId,
          archive_reason: reason,
        })
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      logDebug("Product archived successfully", data);
      return data;
    } catch (error) {
      handleError(error, "Archive product");
    }
  }

  static async unarchiveProduct(productId) {
    try {
      logDebug(`Unarchiving product ${productId}`);

      const { data, error } = await supabase
        .from("products")
        .update({
          is_archived: false,
          archived_at: null,
          archived_by: null,
          archive_reason: null,
        })
        .eq("id", productId)
        .select()
        .single();

      if (error) throw error;
      logDebug("Product unarchived successfully", data);
      return data;
    } catch (error) {
      handleError(error, "Unarchive product");
    }
  }

  // 🏷️ **CATEGORY OPERATIONS**
  static async getProductCategories() {
    try {
      logDebug("Fetching categories from unified category service");

      // Get all active categories
      const result = await UnifiedCategoryService.getAllCategories({
        activeOnly: true,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const categories = result.data || [];
      logDebug(`Found ${categories.length} categories from unified service`);

      // Return categories in the format expected by components
      return categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        sort_order: cat.sort_order,
        is_active: cat.is_active,
      }));
    } catch (error) {
      handleError(error, "Get product categories");

      // Fallback to basic query if unified service fails
      try {
        logDebug("Falling back to basic category query");

        const { data, error: fallbackError } = await supabase
          .from("categories")
          .select("id, name, description, color, icon, sort_order, is_active")
          .eq("is_active", true)
          .order("sort_order");

        if (fallbackError) throw fallbackError;

        return data || [];
      } catch (fallbackError) {
        handleError(fallbackError, "Get product categories fallback");

        // Final fallback to mock data
        return [
          {
            id: "mock-1",
            name: "General Medicine",
            description: "General medications",
            color: "#6B7280",
            icon: "Package",
            sort_order: 10,
            is_active: true,
          },
          {
            id: "mock-2",
            name: "Pain Relief",
            description: "Pain management",
            color: "#EF4444",
            icon: "Zap",
            sort_order: 20,
            is_active: true,
          },
          {
            id: "mock-3",
            name: "Antibiotics",
            description: "Antibiotic medications",
            color: "#8B5CF6",
            icon: "Cross",
            sort_order: 30,
            is_active: true,
          },
        ];
      }
    }
  }

  static async searchProducts(query) {
    try {
      logDebug(`Searching products with query: ${query}`);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(
          `name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`
        )
        .order("name");

      if (error) throw error;

      logDebug(`Successfully found ${data?.length || 0} products`);
      return data || [];
    } catch (error) {
      console.error("❌ ProductService.searchProducts() failed:", error);
      handleError(error, "Search products");
      return [];
    }
  }

  static async getExpiringProducts(days = 30) {
    try {
      logDebug(`Fetching products expiring in ${days} days`);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .lte("expiry_date", futureDate.toISOString())
        .gte("expiry_date", new Date().toISOString())
        .eq("is_active", true)
        .order("expiry_date");

      if (error) throw error;

      logDebug(`Successfully fetched ${data?.length || 0} expiring products`);
      return data || [];
    } catch (error) {
      console.error("❌ ProductService.getExpiringProducts() failed:", error);
      handleError(error, "Get expiring products");
      return [];
    }
  }
}

export default ProductService;
