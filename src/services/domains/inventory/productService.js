// 💊 **PRODUCT SERVICE**
// Handles all pharmaceutical product operations
// Professional database-only implementation with Supabase

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";
import { UnifiedCategoryService } from "./unifiedCategoryService.js";

export class ProductService {
  static async getProducts() {
    try {
      logDebug("Fetching all products from database");

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) {
        console.error("❌ ProductService.getProducts() error:", error);
        throw error;
      }

      logDebug(`Successfully fetched ${data?.length || 0} products`);
      console.log(
        "📦 ProductService.getProducts() result:",
        data?.length || 0,
        "products"
      );
      return data || [];
    } catch (error) {
      console.error("❌ ProductService.getProducts() failed:", error);
      handleError(error, "Get products");
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

  static async getLowStockProducts(threshold = 10) {
    try {
      logDebug(`Fetching products with stock below ${threshold}`);

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .lt("stock_in_pieces", threshold)
        .eq("is_active", true)
        .order("stock_in_pieces", { ascending: true });

      if (error) throw error;

      logDebug(`Found ${data?.length || 0} low stock products`);
      return data || [];
    } catch (error) {
      handleError(error, "Get low stock products");
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
