// 💰 **SALES SERVICE**
// Handles all sales transaction operations
// Original simple implementation (pre-FEFO)

import { supabase } from "../../../config/supabase";
import { logDebug, handleError } from "../../core/serviceUtils";

export class SalesService {

  static async processSale(saleData) {
    try {
      logDebug("Processing sale transaction with discount support", saleData);

      // Debug: Log the mapped sale items
      const mappedItems = saleData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.unit_quantity, // Use unit_quantity for the actual sale quantity
        unit_type: item.unit_type,
        unit_price: item.price_per_unit,
        total_price: item.total_price,
      }));

      console.log("🔍 Sales Service - Mapped sale items:", mappedItems);
      console.log("🔍 Sales Service - Original items:", saleData.items);
      console.log("🔍 Sales Service - Discount data:", {
        discount_type: saleData.discount_type,
        discount_percentage: saleData.discount_percentage,
        discount_amount: saleData.discount_amount,
        subtotal_before_discount: saleData.subtotal_before_discount,
        pwd_senior_id: saleData.pwd_senior_id,
      });

      // Use stored procedure for atomic operation
      const { data, error } = await supabase.rpc("create_sale_with_items", {
        sale_data: {
          user_id: saleData.cashierId,
          total_amount: saleData.total,
          payment_method: saleData.paymentMethod,
          customer_name: saleData.customer?.name || null,
          customer_phone: saleData.customer?.phone || null,
          notes: saleData.notes || null,
          // Add discount fields
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

      logDebug("Successfully processed sale with discount", data);
      return data;
    } catch (error) {
      handleError(error, "Process sale");
    }
  }

  static async getSales(limit = 100) {
    try {
      logDebug(`Fetching ${limit} sales from database`);

      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (*)
          ),
          users!user_id (first_name, last_name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("❌ SalesService.getSales() error:", error);
        throw error;
      }

      logDebug(`Successfully fetched ${data?.length || 0} sales`);
      console.log(
        "💰 SalesService.getSales() result:",
        data?.length || 0,
        "sales"
      );
      return data || [];
    } catch (error) {
      console.error("❌ SalesService.getSales() failed:", error);
      handleError(error, "Get sales");
    }
  }

  static async createSale(saleData) {
    try {
      logDebug("Creating sale", saleData);

      const { data, error } = await supabase
        .from("sales")
        .insert([saleData])
        .select();

      if (error) throw error;

      logDebug("Successfully created sale", data[0]);
      return data[0];
    } catch (error) {
      handleError(error, "Create sale");
    }
  }

  static async getSalesByDateRange(startDate, endDate) {
    try {
      logDebug(`Fetching sales from ${startDate} to ${endDate}`);

      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (
            *,
            products (
              id,
              name,
              brand,
              category
            )
          ),
          users!user_id (first_name, last_name)
        `
        )
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      logDebug(`Successfully fetched ${data?.length || 0} sales in date range`);
      return data || [];
    } catch (error) {
      handleError(error, "Get sales by date range");
    }
  }

  static async voidSale(saleId, reason) {
    try {
      logDebug(`Voiding sale ${saleId} with reason: ${reason}`);

      const { data, error } = await supabase.rpc("void_sale_transaction", {
        sale_id: saleId,
        void_reason: reason,
      });

      if (error) throw error;

      logDebug("Successfully voided sale", data);
      return data;
    } catch (error) {
      handleError(error, "Void sale");
    }
  }

  static async getDailySalesSummary(date) {
    try {
      logDebug(`Fetching daily sales summary for ${date}`);

      const { data, error } = await supabase.rpc("get_daily_sales_summary", {
        target_date: date,
      });

      if (error) throw error;

      logDebug("Successfully fetched daily sales summary", data);
      return data;
    } catch (error) {
      handleError(error, "Get daily sales summary");
    }
  }

  static async getSalesAnalytics(startDate, endDate) {
    try {
      logDebug(`Fetching sales analytics from ${startDate} to ${endDate}`);

      const { data, error } = await supabase.rpc("get_sales_analytics", {
        start_date: startDate,
        end_date: endDate,
      });

      if (error) throw error;

      logDebug("Successfully fetched sales analytics", data);
      return data;
    } catch (error) {
      handleError(error, "Get sales analytics");
    }
  }

  static async editTransaction(transactionId, editData) {
    try {
      logDebug(`Editing transaction ${transactionId}`, editData);

      // Update the main sales record
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .update({
          total_amount: editData.total_amount,
          subtotal_before_discount: editData.subtotal_before_discount,
          discount_type: editData.discount_type || "none",
          discount_percentage: editData.discount_percentage || 0,
          discount_amount: editData.discount_amount || 0,
          pwd_senior_id: editData.pwd_senior_id || null,
          is_edited: true,
          edited_at: editData.edited_at,
          edited_by: editData.edited_by,
          edit_reason: editData.edit_reason,
          original_total: editData.original_total,
        })
        .eq("id", transactionId)
        .select();

      if (salesError) throw salesError;

      // Delete existing sale items
      const { error: deleteError } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", transactionId);

      if (deleteError) throw deleteError;

      // Insert updated sale items
      if (editData.items && editData.items.length > 0) {
        const saleItems = editData.items.map((item) => ({
          sale_id: transactionId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_type: item.unit_type,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

        const { error: itemsError } = await supabase
          .from("sale_items")
          .insert(saleItems);

        if (itemsError) throw itemsError;
      }

      logDebug("Successfully edited transaction", salesData[0]);

      // Return the updated transaction with items
      const { data: fullTransaction, error: fetchError } = await supabase
        .from("sales")
        .select(
          `
          *,
          sale_items (*),
          users!user_id (first_name, last_name)
        `
        )
        .eq("id", transactionId)
        .single();

      if (fetchError) throw fetchError;

      return fullTransaction;
    } catch (error) {
      handleError(error, "Edit transaction");
    }
  }

  // Original simple methods that your POS system expects
}

export default SalesService;
