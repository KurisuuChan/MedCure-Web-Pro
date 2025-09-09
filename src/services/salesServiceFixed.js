// =====================================================
// PROFESSIONAL FRONTEND STOCK FIX
// =====================================================
// Updated services to work with the new stock management system
// =====================================================

import { supabase } from "../config/supabase";

// Enhanced sales service with proper stock management
export const salesServiceFixed = {
  // Process initial sale (no stock deduction yet)
  processSale: async (saleData) => {
    console.log("🔧 Processing sale with NO stock deduction (pending status)");

    const mappedItems = saleData.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity_in_pieces, // ✅ Use pre-calculated pieces, not display quantity
      unit_type: "piece", // ✅ Always use "piece" since we're sending pieces
      unit_price: item.price_per_unit,
      total_price: item.total_price,
    }));

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

    if (error) throw error;

    console.log("✅ Sale created in pending status:", data);
    return data;
  },

  // Complete the transaction and deduct stock
  completeTransaction: async (transactionId) => {
    console.log(
      "🔧 Completing transaction and deducting stock:",
      transactionId
    );

    const { data, error } = await supabase.rpc(
      "complete_transaction_with_stock",
      {
        p_transaction_id: transactionId,
      }
    );

    if (error) throw error;

    console.log("✅ Transaction completed with stock deducted:", data);
    return data;
  },

  // Edit transaction with proper stock restoration
  editTransaction: async (transactionId, editData) => {
    console.log("🔧 Editing transaction with stock management:", transactionId);

    const { data, error } = await supabase.rpc(
      "edit_transaction_with_stock_management",
      {
        p_edit_data: {
          transaction_id: transactionId,
          ...editData,
        },
      }
    );

    if (error) throw error;

    console.log("✅ Transaction edited successfully:", data);
    return data;
  },

  // Undo transaction completely
  undoTransaction: async (transactionId) => {
    console.log("🔧 Undoing transaction completely:", transactionId);

    const { data, error } = await supabase.rpc("undo_transaction_completely", {
      p_transaction_id: transactionId,
    });

    if (error) throw error;

    console.log("✅ Transaction undone and stock restored:", data);
    return data;
  },

  // Get all sales (unchanged)
  getSales: async (page = 1, limit = 50) => {
    const { data, error } = await supabase
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
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return data;
  },

  // Get today's transactions (unchanged)
  getTodaysTransactions: async () => {
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
          products (name, price_per_piece)
        )
      `
      )
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data to match expected format
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
      subtotal: transaction.total_amount ? transaction.total_amount / 1.12 : 0,
      tax: transaction.total_amount
        ? (transaction.total_amount * 0.12) / 1.12
        : 0,
      total: transaction.total_amount || 0,
    }));

    return transformedTransactions;
  },
};

// Export the fixed service
export default salesServiceFixed;
