// 💊 **PRODUCT SERVICE**
// Handles all pharmaceutical product operations
// Professional database-only implementation with Supabase

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";
import { UnifiedCategoryService } from "./unifiedCategoryService.js";
import { EnhancedProductSearchService } from "./enhancedProductSearchService.js";

export class ProductService {
  // Enhanced search methods
  static async searchProducts(searchTerm = "") {
    try {
      console.log(
        "🔍 ProductService.searchProducts() called with term:",
        searchTerm
      );
      const result = await EnhancedProductSearchService.searchProducts(
        searchTerm
      );

      if (result.success) {
        console.log(`✅ Search returned ${result.data.length} products`);
        return result.data;
      } else {
        console.warn("⚠️ Search failed, falling back to regular getProducts");
        return await this.getProducts();
      }
    } catch (error) {
      console.error(
        "❌ Search error, falling back to regular getProducts:",
        error
      );
      return await this.getProducts();
    }
  }

  static async searchProductsFiltered(filters = {}) {
    try {
      console.log(
        "🔍 ProductService.searchProductsFiltered() called with filters:",
        filters
      );
      const result = await EnhancedProductSearchService.searchProductsFiltered(
        filters
      );

      if (result.success) {
        console.log(
          `✅ Filtered search returned ${result.data.length} products`
        );
        return result.data;
      } else {
        console.warn(
          "⚠️ Filtered search failed, falling back to regular getProducts"
        );
        return await this.getProducts();
      }
    } catch (error) {
      console.error(
        "❌ Filtered search error, falling back to regular getProducts:",
        error
      );
      return await this.getProducts();
    }
  }

  static async getFilterOptions() {
    try {
      const result = await EnhancedProductSearchService.getFilterOptions();
      return result.success
        ? result.data
        : {
            drugClassifications: [],
            categories: [],
            dosageStrengths: [],
            dosageForms: [],
          };
    } catch (error) {
      console.error("❌ Error getting filter options:", error);
      return {
        drugClassifications: [],
        categories: [],
        dosageStrengths: [],
        dosageForms: [],
      };
    }
  }

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
        .select(
          `
          id,
          generic_name,
          brand_name,
          category,
          description,
          dosage_form,
          dosage_strength,
          drug_classification,
          price_per_piece,
          pieces_per_sheet,
          sheets_per_box,
          stock_in_pieces,
          reorder_level,
          expiry_date,
          supplier,
          batch_number,
          is_active,
          created_at,
          updated_at,
          is_archived,
          archived_at,
          archived_by,
          cost_price,
          base_price,
          margin_percentage,
          category_id,
          archive_reason,
          import_metadata,
          status,
          expiry_status,
          expiry_alert_days,
          last_reorder_date,
          reorder_frequency_days,
          is_critical_medicine,
          supplier_lead_time_days,
          sku,
          stock_quantity,
          unit_type,
          price,
          supplier_id
        `
        )
        .order("generic_name");

      // Also check total count without filters for debugging
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      console.log("📊 Total products in database (including inactive):", count);

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
      console.log("🔍 Raw database response:", { data, error });

      if (data && data.length > 0) {
        console.log("📦 Sample product:", data[0]);
        console.log("🔍 Stock field check for first 5 products:");
        data.slice(0, 5).forEach((p, i) => {
          console.log(
            `  ${i + 1}. ${p.generic_name}: stock_in_pieces=${
              p.stock_in_pieces
            }, stock_quantity=${p.stock_quantity}`
          );
        });

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
            `• ${product.generic_name || product.name}: ${
              product.stock_in_pieces
            }/${product.reorder_level}`
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
        .select(
          `
          id,
          generic_name,
          brand_name,
          category,
          description,
          dosage_form,
          dosage_strength,
          drug_classification,
          price_per_piece,
          pieces_per_sheet,
          sheets_per_box,
          stock_in_pieces,
          reorder_level,
          expiry_date,
          supplier,
          batch_number,
          is_active,
          created_at,
          updated_at,
          is_archived,
          archived_at,
          archived_by,
          cost_price,
          base_price,
          margin_percentage,
          category_id,
          archive_reason,
          import_metadata,
          status,
          expiry_status,
          expiry_alert_days,
          last_reorder_date,
          reorder_frequency_days,
          is_critical_medicine,
          supplier_lead_time_days,
          sku,
          stock_quantity,
          unit_type,
          price,
          supplier_id
        `
        )
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
      logDebug(`Updating product ${id} with enhanced medicine schema`, updates);

      // Ensure proper data structure for updates
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Validate critical medicine fields if they're being updated
      if (updateData.generic_name === "") {
        throw new Error("Generic name cannot be empty for medicine products");
      }
      if (updateData.brand_name === "") {
        throw new Error("Brand name cannot be empty for medicine products");
      }

      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select();

      if (error) throw error;

      logDebug(
        "Successfully updated product with new medicine schema",
        data[0]
      );
      return data[0];
    } catch (error) {
      console.error("❌ ProductService.updateProduct() failed:", error);
      handleError(error, "Update product");
      throw error;
    }
  }

  static async addProduct(product) {
    try {
      logDebug("Adding new product with enhanced medicine schema", product);

      // Validate required medicine fields
      if (!product.generic_name) {
        throw new Error("Generic name is required for medicine products");
      }
      // Make brand_name optional - use generic_name as fallback
      const brandName = product.brand_name || product.generic_name;

      // Auto-create enum values if they don't exist
      if (product.dosage_form) {
        console.log(
          `🔧 Auto-creating dosage form if needed: ${product.dosage_form}`
        );
        try {
          await supabase.rpc("add_dosage_form_value", {
            new_value: product.dosage_form,
          });
        } catch (enumError) {
          console.warn(
            `⚠️ Could not auto-create dosage form "${product.dosage_form}":`,
            enumError
          );
        }
      }

      if (product.drug_classification) {
        console.log(
          `🔧 Auto-creating drug classification if needed: ${product.drug_classification}`
        );
        try {
          await supabase.rpc("add_drug_classification_value", {
            new_value: product.drug_classification,
          });
        } catch (enumError) {
          console.warn(
            `⚠️ Could not auto-create drug classification "${product.drug_classification}":`,
            enumError
          );
        }
      }

      // Ensure proper data structure for new schema
      const productData = {
        // Copy all fields from product except old ones
        ...product,
        // Remove old field names that might conflict
        brand: undefined,
        name: undefined,
        // Ensure we're using the new column structure
        generic_name: product.generic_name,
        brand_name: brandName, // Use fallback if not provided
        dosage_form: product.dosage_form || null,
        dosage_strength: product.dosage_strength || null,
        drug_classification: product.drug_classification || null,
        // Set defaults
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_archived:
          product.is_archived !== undefined ? product.is_archived : false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 🔧 CRITICAL FIX: Sync stock_quantity with stock_in_pieces AFTER spread
      // This ensures stock_quantity matches stock_in_pieces for all imports
      if (
        productData.stock_in_pieces !== undefined &&
        productData.stock_in_pieces !== null
      ) {
        productData.stock_quantity = productData.stock_in_pieces;
        console.log(
          `📦 Syncing stock fields: stock_in_pieces=${productData.stock_in_pieces} → stock_quantity=${productData.stock_quantity}`
        );
      }

      // Clean up undefined fields to avoid sending them to database
      Object.keys(productData).forEach((key) => {
        if (productData[key] === undefined) {
          delete productData[key];
        }
      });

      console.log("🚀 About to insert product data:", productData);

      const { data, error } = await supabase
        .from("products")
        .insert([productData])
        .select();

      if (error) {
        console.error("❌ Supabase insert error:", error);
        throw error;
      }

      logDebug(
        "✅ Successfully added product with new medicine schema",
        data[0]
      );
      return data[0];
    } catch (error) {
      console.error("❌ ProductService.addProduct() failed:", error);
      handleError(error, "Add product");
      throw error;
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
          `generic_name.ilike.%${query}%,brand_name.ilike.%${query}%,description.ilike.%${query}%`
        )
        .order("generic_name");

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

  // ============================================
  // BATCH TRACKING SYSTEM METHODS
  // ============================================

  /**
   * Add a new product batch with quantity and expiry date
   * @param {Object} batchData - The batch information
   * @param {string} batchData.productId - UUID of the product
   * @param {number} batchData.quantity - Quantity to add
   * @param {string} batchData.batchNumber - Optional batch number
   * @param {string} batchData.expiryDate - Optional expiry date (YYYY-MM-DD)
   * @param {number} batchData.costPerUnit - Optional cost per unit (defaults to 0)
   * @returns {Promise<Object>} Result of the batch addition
   */
  static async addProductBatch(batchData) {
    try {
      logDebug("Adding new product batch:", batchData);

      const { productId, quantity, batchNumber, expiryDate } = batchData;

      // Validate required fields
      if (!productId || !quantity || quantity <= 0) {
        throw new Error("Product ID and positive quantity are required");
      }

      const { data, error } = await supabase.rpc("add_product_batch", {
        p_product_id: productId,
        p_quantity: parseInt(quantity),
        p_expiry_date: expiryDate || null,
      });

      if (error) {
        console.error(
          "❌ ProductService.addProductBatch() Supabase error:",
          error
        );
        throw error;
      }

      console.log("✅ Successfully added product batch:", data);
      logDebug("Batch addition result:", data);

      return data;
    } catch (error) {
      console.error("❌ ProductService.addProductBatch() failed:", error);
      handleError(error, "Add product batch");
      throw error;
    }
  }

  /**
   * Get all batches for a specific product
   * @param {string} productId - UUID of the product
   * @returns {Promise<Array>} List of batches for the product
   */
  static async getBatchesForProduct(productId) {
    try {
      logDebug("Fetching batches for product:", productId);

      if (!productId) {
        throw new Error("Product ID is required");
      }

      const { data, error } = await supabase.rpc("get_batches_for_product", {
        p_product_id: productId,
      });

      if (error) {
        console.error(
          "❌ ProductService.getBatchesForProduct() Supabase error:",
          error
        );
        throw error;
      }

      console.log(
        `✅ Successfully fetched ${
          data?.length || 0
        } batches for product ${productId}`
      );
      logDebug("Product batches:", data);

      return data || [];
    } catch (error) {
      console.error("❌ ProductService.getBatchesForProduct() failed:", error);
      handleError(error, "Get product batches");
      return [];
    }
  }

  /**
   * Get all batches across all products (for Batch Management page)
   * @returns {Promise<Array>} List of all batches with product information
   */
  static async getAllBatches() {
    try {
      logDebug("Fetching all product batches");

      const { data, error } = await supabase.rpc("get_all_batches");

      if (error) {
        console.error(
          "❌ ProductService.getAllBatches() Supabase error:",
          error
        );
        throw error;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} total batches`);
      logDebug("All batches:", data);

      return data || [];
    } catch (error) {
      console.error("❌ ProductService.getAllBatches() failed:", error);
      handleError(error, "Get all batches");
      return [];
    }
  }

  /**
   * Update batch quantity (for manual adjustments)
   * @param {number} batchId - ID of the batch to update
   * @param {number} newQuantity - New quantity for the batch
   * @param {string} reason - Reason for the adjustment
   * @returns {Promise<Object>} Result of the batch update
   */
  static async updateBatchQuantity(
    batchId,
    newQuantity,
    reason = "Manual adjustment"
  ) {
    try {
      logDebug("Updating batch quantity:", { batchId, newQuantity, reason });

      if (!batchId || newQuantity < 0) {
        throw new Error(
          "Valid batch ID and non-negative quantity are required"
        );
      }

      const { data, error } = await supabase.rpc("update_batch_quantity", {
        p_batch_id: batchId,
        p_new_quantity: parseInt(newQuantity),
        p_reason: reason,
      });

      if (error) {
        console.error(
          "❌ ProductService.updateBatchQuantity() Supabase error:",
          error
        );
        throw error;
      }

      console.log("✅ Successfully updated batch quantity:", data);
      logDebug("Batch update result:", data);

      return data;
    } catch (error) {
      console.error("❌ ProductService.updateBatchQuantity() failed:", error);
      handleError(error, "Update batch quantity");
      throw error;
    }
  }

  /**
   * Get inventory logs for audit trail
   * @param {string} productId - Optional product ID to filter logs
   * @param {number} limit - Number of logs to fetch (default 100)
   * @returns {Promise<Array>} List of inventory log entries
   */
  static async getInventoryLogs(productId = null, limit = 100) {
    try {
      logDebug("Fetching inventory logs:", { productId, limit });

      let query = supabase
        .from("inventory_logs")
        .select(
          `
          *,
          products:product_id (
            name,
            category
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq("product_id", productId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "❌ ProductService.getInventoryLogs() Supabase error:",
          error
        );
        throw error;
      }

      console.log(
        `✅ Successfully fetched ${data?.length || 0} inventory logs`
      );
      logDebug("Inventory logs:", data);

      return data || [];
    } catch (error) {
      console.error("❌ ProductService.getInventoryLogs() failed:", error);
      handleError(error, "Get inventory logs");
      return [];
    }
  }

  // 👤 **USER OPERATIONS**
  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        console.warn("⚠️ No authenticated user found");
        return null;
      }

      // Get additional user details from users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.warn("⚠️ Could not fetch user details, using auth data only");
        return user;
      }

      return userData || user;
    } catch (error) {
      console.error("❌ ProductService.getCurrentUser() failed:", error);
      handleError(error, "Get current user");
      return null;
    }
  }
}

export default ProductService;
