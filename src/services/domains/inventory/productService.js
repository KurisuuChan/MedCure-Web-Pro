// 💊 **PRODUCT SERVICE**
// Handles all pharmaceutical product operations
// Professional database-only implementation with Supabase

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";

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
      logDebug("Fetching distinct product categories");

      const { data, error } = await supabase
        .from("products")
        .select("category")
        .not("category", "is", null);

      if (error) throw error;

      // Extract unique categories
      const categories = [...new Set(data.map((item) => item.category))].sort();
      logDebug(`Found ${categories.length} unique categories`, categories);
      return categories;
    } catch (error) {
      handleError(error, "Get product categories");
    }
  }
}

export default ProductService;
