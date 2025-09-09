// =====================================================
// UNIFIED TRANSACTION SERVICE ARCHITECTURE
// =====================================================
// Single source of truth for all transaction operations
// Eliminates conflicts between multiple service layers
// =====================================================

import { supabase } from "../config/supabase";

class UnifiedTransactionService {
  constructor() {
    this.serviceName = "UnifiedTransactionService";
    this.version = "1.0.0";
    console.log(`🚀 ${this.serviceName} v${this.version} initialized`);
  }

  // ========== CORE TRANSACTION OPERATIONS ==========

  /**
   * Create a pending transaction (no stock deduction)
   * @param {Object} saleData - Transaction data
   * @returns {Promise<Object>} Transaction result
   */
  async createTransaction(saleData) {
    console.log("🆕 Creating pending transaction:", saleData);

    try {
      // Map items to database format
      const mappedItems = saleData.items.map((item) => {
        const quantity =
          item.quantity_in_pieces || item.quantityInPieces || item.quantity;
        const total_price = item.total_price || item.totalPrice;

        // Calculate unit_price as price per piece (total_price / quantity_in_pieces)
        const unit_price =
          item.price_per_piece || item.pricePerPiece || total_price / quantity; // This gives us price per piece

        console.log("🔍 Item mapping debug:", {
          original: item,
          mapped: {
            product_id: item.product_id || item.productId,
            quantity,
            unit_type: "piece",
            unit_price,
            total_price,
            constraint_check: `${quantity} * ${unit_price} = ${
              quantity * unit_price
            }`,
            passes_constraint:
              Math.abs(total_price - quantity * unit_price) < 0.01,
          },
        });

        return {
          product_id: item.product_id || item.productId,
          quantity,
          unit_type: "piece", // Always use pieces for consistency
          unit_price,
          total_price,
        };
      });

      console.log("📦 Mapped items:", mappedItems);

      // Validate constraint before sending to database
      const constraintViolations = mappedItems.filter((item) => {
        const calculatedTotal = item.quantity * item.unit_price;
        return Math.abs(item.total_price - calculatedTotal) > 0.01; // Allow for floating point precision
      });

      if (constraintViolations.length > 0) {
        console.error(
          "❌ Constraint violations detected:",
          constraintViolations
        );
        throw new Error(
          `Price constraint violations: ${constraintViolations
            .map(
              (v) =>
                `Item ${v.product_id}: total_price(${v.total_price}) != quantity(${v.quantity}) * unit_price(${v.unit_price})`
            )
            .join(", ")}`
        );
      }

      const { data, error } = await supabase.rpc("create_sale_with_items", {
        sale_data: {
          user_id: saleData.cashierId || saleData.user_id,
          total_amount: saleData.total || saleData.total_amount,
          payment_method: saleData.paymentMethod || saleData.payment_method,
          customer_name:
            saleData.customer?.name || saleData.customer_name || null,
          customer_phone:
            saleData.customer?.phone || saleData.customer_phone || null,
          notes: saleData.notes || null,
          discount_type: saleData.discount_type || "none",
          discount_percentage: saleData.discount_percentage || 0,
          discount_amount: saleData.discount_amount || 0,
          subtotal_before_discount:
            saleData.subtotal_before_discount ||
            saleData.total ||
            saleData.total_amount,
          pwd_senior_id: saleData.pwd_senior_id || null,
        },
        sale_items: mappedItems,
      });

      if (error) throw error;

      console.log("✅ Transaction created successfully:", data);
      return {
        success: true,
        data: data,
        transaction_id: data.id,
        status: "pending",
      };
    } catch (error) {
      console.error("❌ Create transaction failed:", error);
      throw new Error(`Failed to create transaction: ${error.message}`);
    }
  }

  /**
   * Complete a pending transaction (deduct stock, mark completed)
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Completion result
   */
  async completeTransaction(transactionId) {
    console.log("💰 Completing transaction:", transactionId);

    try {
      const { data, error } = await supabase.rpc(
        "complete_transaction_with_stock",
        {
          p_transaction_id: transactionId,
        }
      );

      if (error) throw error;

      console.log("✅ Transaction completed successfully:", data);
      return {
        success: true,
        data: data,
        transaction_id: transactionId,
        status: "completed",
      };
    } catch (error) {
      console.error("❌ Complete transaction failed:", error);
      throw new Error(`Failed to complete transaction: ${error.message}`);
    }
  }

  /**
   * Undo a completed transaction (restore stock, mark cancelled)
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Undo result
   */
  async undoTransaction(transactionId) {
    console.log("↩️ Undoing transaction:", transactionId);

    try {
      const { data, error } = await supabase.rpc(
        "undo_transaction_completely",
        {
          p_transaction_id: transactionId,
        }
      );

      if (error) throw error;

      console.log("✅ Transaction undone successfully:", data);
      return {
        success: true,
        data: data,
        transaction_id: transactionId,
        status: "cancelled",
      };
    } catch (error) {
      console.error("❌ Undo transaction failed:", error);
      throw new Error(`Failed to undo transaction: ${error.message}`);
    }
  }

  /**
   * Edit a transaction (if edit function exists)
   * @param {string} transactionId - Transaction ID
   * @param {Object} editData - Edit data
   * @returns {Promise<Object>} Edit result
   */
  async editTransaction(transactionId, editData) {
    console.log("✏️ Editing transaction:", transactionId, editData);

    try {
      // Step 1: Edit the transaction (undos old version, creates new pending version)
      const { data: editResult, error: editError } = await supabase.rpc(
        "edit_transaction_with_stock_management",
        {
          p_edit_data: {
            transaction_id: transactionId,
            ...editData,
          },
        }
      );

      if (editError) throw editError;
      console.log("✅ Transaction edited (pending):", editResult);

      // Step 2: Complete the edited transaction to finalize new price and deduct stock
      const { data: completeResult, error: completeError } = await supabase.rpc(
        "complete_transaction_with_stock",
        {
          p_transaction_id: transactionId,
        }
      );

      if (completeError) throw completeError;
      console.log("✅ Edited transaction completed:", completeResult);

      // Step 3: Fetch the updated transaction to return current state
      const { data: updatedTransaction, error: fetchError } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            id,
            product_id,
            quantity,
            unit_type,
            unit_price,
            total_price,
            products (name, description)
          )
        `
        )
        .eq("id", transactionId)
        .single();

      if (fetchError) throw fetchError;

      console.log(
        "✅ Transaction edit and completion successful:",
        updatedTransaction
      );
      return {
        success: true,
        data: updatedTransaction,
        transaction_id: transactionId,
        status: "completed",
        message: "Transaction edited and price updated successfully",
      };
    } catch (error) {
      console.error("❌ Edit transaction failed:", error);
      throw new Error(`Failed to edit transaction: ${error.message}`);
    }
  }

  // ========== COMPLETE PAYMENT WORKFLOW ==========

  /**
   * Complete payment workflow (create + complete in one call)
   * @param {Object} saleData - Sale data
   * @returns {Promise<Object>} Complete workflow result
   */
  async processCompletePayment(saleData) {
    console.log("🎯 Processing complete payment workflow:", saleData);

    try {
      // Step 1: Create pending transaction
      const createResult = await this.createTransaction(saleData);

      if (!createResult.success) {
        throw new Error("Failed to create pending transaction");
      }

      // Step 2: Complete the transaction
      const completeResult = await this.completeTransaction(
        createResult.transaction_id
      );

      if (!completeResult.success) {
        throw new Error("Failed to complete transaction");
      }

      console.log("✅ Complete payment workflow successful");
      return {
        success: true,
        transaction_id: createResult.transaction_id,
        create_result: createResult.data,
        complete_result: completeResult.data,
        status: "completed",
      };
    } catch (error) {
      console.error("❌ Complete payment workflow failed:", error);
      throw new Error(`Complete payment failed: ${error.message}`);
    }
  }

  // ========== DATA RETRIEVAL OPERATIONS ==========

  /**
   * Get all transactions with filtering
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transactions list
   */
  async getTransactions(options = {}) {
    console.log("📊 Fetching transactions:", options);

    try {
      let query = supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (name, price_per_piece)
          )
        `
        )
        .order("created_at", { ascending: false });

      // Apply filters
      if (options.status) {
        query = query.eq("status", options.status);
      }

      if (options.date_from) {
        query = query.gte("created_at", options.date_from);
      }

      if (options.date_to) {
        query = query.lte("created_at", options.date_to);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match expected format
      const transformedData = data.map((transaction) => ({
        ...transaction,
        items: transaction.sale_items || [], // ✅ Map sale_items to items for compatibility
      }));

      console.log(`✅ Retrieved ${transformedData.length} transactions`);
      return transformedData;
    } catch (error) {
      console.error("❌ Get transactions failed:", error);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Get today's transactions
   * @returns {Promise<Array>} Today's transactions
   */
  async getTodaysTransactions() {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    return this.getTransactions({
      date_from: startOfDay.toISOString(),
      date_to: endOfDay.toISOString(),
    });
  }

  /**
   * Get transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionById(transactionId) {
    console.log("🔍 Fetching transaction:", transactionId);

    try {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (name, price_per_piece, stock_in_pieces)
          )
        `
        )
        .eq("id", transactionId)
        .single();

      if (error) throw error;

      console.log("✅ Transaction retrieved:", data);
      return data;
    } catch (error) {
      console.error("❌ Get transaction failed:", error);
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  // ========== REVENUE AND ANALYTICS ==========

  /**
   * Get revenue statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Revenue stats
   */
  async getRevenueStats(options = {}) {
    console.log("💰 Calculating revenue stats:", options);

    try {
      const transactions = await this.getTransactions(options);

      const stats = {
        total_transactions: transactions.length,
        completed_transactions: transactions.filter(
          (t) => t.status === "completed"
        ).length,
        cancelled_transactions: transactions.filter(
          (t) => t.status === "cancelled"
        ).length,
        pending_transactions: transactions.filter((t) => t.status === "pending")
          .length,
        total_revenue: transactions
          .filter((t) => t.status === "completed")
          .reduce((sum, t) => sum + (t.total_amount || 0), 0),
        cancelled_revenue: transactions
          .filter((t) => t.status === "cancelled")
          .reduce((sum, t) => sum + (t.total_amount || 0), 0),
      };

      console.log("✅ Revenue stats calculated:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Revenue stats calculation failed:", error);
      throw new Error(`Failed to calculate revenue stats: ${error.message}`);
    }
  }

  // ========== SYSTEM HEALTH AND DIAGNOSTICS ==========

  /**
   * Run system health check
   * @returns {Promise<Object>} Health check results
   */
  async runHealthCheck() {
    console.log("🔧 Running system health check...");

    try {
      const results = {
        timestamp: new Date().toISOString(),
        functions_available: {},
        data_integrity: {},
        performance_metrics: {},
      };

      // Check function availability
      const functions = [
        "create_sale_with_items",
        "complete_transaction_with_stock",
        "undo_transaction_completely",
        "edit_transaction_with_stock_management",
      ];

      for (const func of functions) {
        try {
          await supabase.rpc(func, {});
          results.functions_available[func] = true;
        } catch {
          results.functions_available[func] = false;
        }
      }

      // Check data integrity
      const { data: orphanedTransactions } = await supabase
        .from("sales")
        .select("id")
        .eq("status", "pending")
        .lt("created_at", new Date(Date.now() - 3600000).toISOString());

      results.data_integrity.orphaned_transactions =
        orphanedTransactions?.length || 0;

      console.log("✅ Health check completed:", results);
      return results;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      throw new Error(`Health check failed: ${error.message}`);
    }
  }
}

// Create and export the unified service instance
const unifiedTransactionService = new UnifiedTransactionService();

// Make service globally available for testing and debugging
if (typeof window !== "undefined") {
  window.unifiedTransactionService = unifiedTransactionService;
}

// Export both the instance and class for flexibility
export default unifiedTransactionService;
export { UnifiedTransactionService };

// Legacy compatibility - maintain existing interface
export const salesService = unifiedTransactionService;
export const enhancedSalesService = unifiedTransactionService;
export const salesServiceFixed = unifiedTransactionService;
