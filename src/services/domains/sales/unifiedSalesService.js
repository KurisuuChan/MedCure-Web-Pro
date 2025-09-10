// =====================================================
// 🚀 UNIFIED SALES SERVICE - PROFESSIONAL SOLUTION
// =====================================================
// Single source of truth for all transaction operations
// Eliminates conflicting service layers and logical errors
// =====================================================

import { supabase } from "\.\.\/\.\.\/\.\.\/config\/supabase";

/**
 * 🎯 UNIFIED SALES SERVICE
 * - Single service for all POS operations
 * - Consistent error handling
 * - Proper stock management
 * - Complete audit trail
 */
export class UnifiedSalesService {
  // ============================================
  // 💳 PAYMENT WORKFLOW (Two-Step Process)
  // ============================================

  /**
   * Step 1: Create pending transaction (NO stock deduction)
   * @param {Object} saleData - Complete sale information
   * @returns {Object} Pending transaction
   */
  static async createPendingTransaction(saleData) {
    try {
      console.log(
        "🔧 [UnifiedService] Creating pending transaction:",
        saleData
      );

      // Map items to correct format
      const mappedItems = saleData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity_in_pieces || item.quantityInPieces,
        unit_type: "piece", // Always pieces for database
        unit_price: item.price_per_unit || item.pricePerUnit,
        total_price: item.total_price || item.totalPrice,
      }));

      console.log(
        "🔧 [UnifiedService] Mapped items for database:",
        mappedItems
      );

      const { data, error } = await supabase.rpc("create_sale_with_items", {
        sale_data: {
          user_id: saleData.cashierId,
          total_amount: saleData.total,
          payment_method: saleData.paymentMethod,
          customer_name: saleData.customer?.name || null,
          customer_phone: saleData.customer?.phone || null,
          notes: saleData.notes || null,
          discount_type: saleData.discount_type || "none",
          discount_percentage: saleData.discount_percentage || 0,
          discount_amount: saleData.discount_amount || 0,
          subtotal_before_discount:
            saleData.subtotal_before_discount || saleData.total,
          pwd_senior_id: saleData.pwd_senior_id || null,
        },
        sale_items: mappedItems,
      });

      if (error) {
        console.error(
          "❌ [UnifiedService] Failed to create pending transaction:",
          error
        );
        throw error;
      }

      console.log("✅ [UnifiedService] Pending transaction created:", data);
      return data;
    } catch (error) {
      console.error(
        "❌ [UnifiedService] createPendingTransaction error:",
        error
      );
      throw new Error(`Failed to create pending transaction: ${error.message}`);
    }
  }

  /**
   * Step 2: Complete transaction (SINGLE stock deduction)
   * @param {string} transactionId - Transaction ID to complete
   * @returns {Object} Completed transaction result
   */
  static async completeTransaction(transactionId) {
    try {
      console.log("🔧 [UnifiedService] Completing transaction:", transactionId);

      const { data, error } = await supabase.rpc(
        "complete_transaction_with_stock",
        {
          p_transaction_id: transactionId,
        }
      );

      if (error) {
        console.error(
          "❌ [UnifiedService] Failed to complete transaction:",
          error
        );
        throw error;
      }

      console.log(
        "✅ [UnifiedService] Transaction completed with stock deduction:",
        data
      );
      return data;
    } catch (error) {
      console.error("❌ [UnifiedService] completeTransaction error:", error);
      throw new Error(`Failed to complete transaction: ${error.message}`);
    }
  }

  // ============================================
  // ✏️ TRANSACTION EDITING WORKFLOW
  // ============================================

  /**
   * Edit existing transaction with proper stock management
   * @param {string} transactionId - Transaction to edit
   * @param {Object} editData - New transaction data
   * @returns {Object} Updated transaction
   */
  static async editTransaction(transactionId, editData) {
    try {
      console.log("🔧 [UnifiedService] Editing transaction:", {
        transactionId,
        editData,
      });

      // Prepare edit payload for database function
      const editPayload = {
        edited_by: editData.currentUser?.id,
        edit_reason: editData.editReason,
        total_amount: editData.total_amount,
        subtotal_before_discount: editData.subtotal_before_discount,
        discount_type: editData.discount_type || "none",
        discount_percentage: editData.discount_percentage || 0,
        discount_amount: editData.discount_amount || 0,
        pwd_senior_id: editData.pwd_senior_id || null,
      };

      // Map items to database format
      const mappedItems = editData.items.map((item) => ({
        product_id: item.product_id || item.id,
        quantity: item.quantity,
        unit_type: "piece", // Always pieces for database
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      console.log("🔧 [UnifiedService] Edit payload:", editPayload);
      console.log("🔧 [UnifiedService] Mapped edit items:", mappedItems);

      const { data, error } = await supabase.rpc(
        "edit_transaction_with_stock_management",
        {
          p_transaction_id: transactionId,
          p_new_items: mappedItems,
          p_edit_data: editPayload,
        }
      );

      if (error) {
        console.error("❌ [UnifiedService] Failed to edit transaction:", error);
        throw error;
      }

      console.log("✅ [UnifiedService] Transaction edited successfully:", data);

      // Return updated transaction with proper structure
      return await this.getTransactionById(transactionId);
    } catch (error) {
      console.error("❌ [UnifiedService] editTransaction error:", error);
      throw new Error(`Failed to edit transaction: ${error.message}`);
    }
  }

  // ============================================
  // 🔄 UNDO OPERATIONS
  // ============================================

  /**
   * Completely undo/cancel a transaction
   * @param {string} transactionId - Transaction to undo
   * @param {string} reason - Reason for undo
   * @returns {Object} Undo result
   */
  static async undoTransaction(
    transactionId,
    reason = "Transaction cancelled"
  ) {
    try {
      console.log("🔧 [UnifiedService] Undoing transaction:", {
        transactionId,
        reason,
      });

      const { data, error } = await supabase.rpc(
        "undo_transaction_completely",
        {
          p_transaction_id: transactionId,
          p_reason: reason,
        }
      );

      if (error) {
        console.error("❌ [UnifiedService] Failed to undo transaction:", error);
        throw error;
      }

      console.log("✅ [UnifiedService] Transaction undone successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ [UnifiedService] undoTransaction error:", error);
      throw new Error(`Failed to undo transaction: ${error.message}`);
    }
  }

  // ============================================
  // 📊 TRANSACTION QUERIES
  // ============================================

  /**
   * Get today's transactions for history display
   * @returns {Array} Today's transactions with items
   */
  static async getTodaysTransactions() {
    try {
      console.log("🔧 [UnifiedService] Getting today's transactions");

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

      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (name, brand, category)
          ),
          users!user_id (first_name, last_name)
        `
        )
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ [UnifiedService] Failed to get today's transactions:",
          error
        );
        throw error;
      }

      // Transform data for frontend consistency
      const transformedTransactions = data.map((transaction) => ({
        ...transaction,
        items:
          transaction.sale_items?.map((saleItem) => ({
            id: saleItem.product_id,
            product_id: saleItem.product_id,
            name: saleItem.products?.name || "Unknown Product",
            quantity: saleItem.quantity,
            unit_type: saleItem.unit_type,
            unit_price: saleItem.unit_price,
            subtotal: saleItem.total_price,
            total_price: saleItem.total_price,
          })) || [],
        subtotal: transaction.total_amount
          ? transaction.total_amount / 1.12
          : 0,
        tax: transaction.total_amount
          ? (transaction.total_amount * 0.12) / 1.12
          : 0,
        total: transaction.total_amount || 0,
      }));

      console.log(
        "✅ [UnifiedService] Retrieved",
        transformedTransactions.length,
        "transactions"
      );
      return transformedTransactions;
    } catch (error) {
      console.error("❌ [UnifiedService] getTodaysTransactions error:", error);
      throw new Error(`Failed to get today's transactions: ${error.message}`);
    }
  }

  /**
   * Get single transaction by ID
   * @param {string} transactionId - Transaction ID
   * @returns {Object} Transaction with items
   */
  static async getTransactionById(transactionId) {
    try {
      console.log(
        "🔧 [UnifiedService] Getting transaction by ID:",
        transactionId
      );

      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (name, brand, category)
          ),
          users!user_id (first_name, last_name)
        `
        )
        .eq("id", transactionId)
        .single();

      if (error) {
        console.error("❌ [UnifiedService] Failed to get transaction:", error);
        throw error;
      }

      console.log("✅ [UnifiedService] Retrieved transaction:", data);
      return data;
    } catch (error) {
      console.error("❌ [UnifiedService] getTransactionById error:", error);
      throw new Error(`Failed to get transaction: ${error.message}`);
    }
  }

  // ============================================
  // 📈 ANALYTICS & REPORTING
  // ============================================

  /**
   * Get sales by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Sales in date range
   */
  static async getSalesByDateRange(startDate, endDate) {
    try {
      console.log("🔧 [UnifiedService] Getting sales by date range:", {
        startDate,
        endDate,
      });

      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (id, name, brand, category)
          ),
          users!user_id (first_name, last_name)
        `
        )
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ [UnifiedService] Failed to get sales by date range:",
          error
        );
        throw error;
      }

      console.log(
        "✅ [UnifiedService] Retrieved",
        data.length,
        "sales in date range"
      );
      return data;
    } catch (error) {
      console.error("❌ [UnifiedService] getSalesByDateRange error:", error);
      throw new Error(`Failed to get sales by date range: ${error.message}`);
    }
  }

  /**
   * Get daily sales summary
   * @param {Date} date - Target date
   * @returns {Object} Daily summary
   */
  static async getDailySalesSummary(date) {
    try {
      console.log("🔧 [UnifiedService] Getting daily sales summary for:", date);

      const { data, error } = await supabase.rpc("get_daily_sales_summary", {
        target_date: date,
      });

      if (error) {
        console.error(
          "❌ [UnifiedService] Failed to get daily summary:",
          error
        );
        throw error;
      }

      console.log("✅ [UnifiedService] Retrieved daily summary:", data);
      return data;
    } catch (error) {
      console.error("❌ [UnifiedService] getDailySalesSummary error:", error);
      throw new Error(`Failed to get daily sales summary: ${error.message}`);
    }
  }
}

// ============================================
// 🚀 SIMPLIFIED EXPORT FOR EASY INTEGRATION
// ============================================

export const unifiedSalesService = {
  // Payment workflow
  processSale: UnifiedSalesService.createPendingTransaction,
  completeTransaction: UnifiedSalesService.completeTransaction,

  // Transaction management
  editTransaction: UnifiedSalesService.editTransaction,
  undoTransaction: UnifiedSalesService.undoTransaction,

  // Queries
  getTodaysTransactions: UnifiedSalesService.getTodaysTransactions,
  getTransactionById: UnifiedSalesService.getTransactionById,
  getSalesByDateRange: UnifiedSalesService.getSalesByDateRange,
  getDailySalesSummary: UnifiedSalesService.getDailySalesSummary,
};

export default unifiedSalesService;

/* 
=================================================
📋 INTEGRATION GUIDE:
=================================================

REPLACE ALL IMPORTS WITH:
```javascript
import { unifiedSalesService } from '../services/unifiedSalesService';
```

PAYMENT WORKFLOW:
```javascript
// Step 1: Create pending transaction
const pending = await unifiedSalesService.processSale(saleData);

// Step 2: Complete with stock deduction  
const completed = await unifiedSalesService.completeTransaction(pending.id);
```

EDITING WORKFLOW:
```javascript
const updated = await unifiedSalesService.editTransaction(transactionId, editData);
```

UNDO WORKFLOW:
```javascript
const undoResult = await unifiedSalesService.undoTransaction(transactionId, reason);
```

TRANSACTION HISTORY:
```javascript
const todaysTransactions = await unifiedSalesService.getTodaysTransactions();
```

=================================================
✅ BENEFITS:
=================================================

1. Single source of truth
2. Consistent error handling  
3. Proper stock management
4. Complete audit trail
5. No conflicting service layers
6. Professional logging
7. Type-safe operations
8. Unified data structures

=================================================
*/
