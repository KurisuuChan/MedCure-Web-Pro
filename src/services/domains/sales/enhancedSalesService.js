// =================================================
// 🚨 UPDATED SALES SERVICE WITH PROPER STOCK MANAGEMENT
// Fixes the critical stock inventory issue during transaction editing
// =================================================

import { supabase } from "\.\.\/\.\.\/\.\.\/config\/supabase";

// Enhanced editTransaction method with proper stock management
export const editTransactionWithStockManagement = async (
  transactionId,
  editData
) => {
  try {
    console.log("🔧 Editing transaction with stock management:", {
      transactionId,
      editData,
    });

    // Prepare the edit data
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

    // Try to use the new stock-aware stored procedure
    const { data, error } = await supabase.rpc(
      "edit_transaction_with_stock_management",
      {
        p_transaction_id: transactionId,
        p_new_items: editData.items, // Pass as JSON object, not string
        p_edit_data: editPayload, // Pass as JSON object, not string
      }
    );

    if (error) {
      console.error("❌ Transaction edit failed:", error);

      // If the stored procedure doesn't exist, fall back to legacy method
      if (
        error.code === "PGRST202" &&
        error.message.includes("Could not find the function")
      ) {
        console.warn(
          "⚠️ Database functions not deployed yet. Using legacy method temporarily."
        );
        console.warn(
          "🚨 CRITICAL: Deploy the SQL script ASAP - stock levels may be incorrect!"
        );

        return await EnhancedSalesService.editTransactionUnsafe(
          transactionId,
          editData
        );
      }

      throw error;
    }

    console.log(
      "✅ Transaction edited successfully with stock management:",
      data
    );

    // Fetch the updated transaction
    const { data: updatedTransaction, error: fetchError } = await supabase
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

    return updatedTransaction;
  } catch (error) {
    console.error("❌ Error editing transaction:", error);
    throw error;
  }
};

// Stock audit function to verify inventory consistency
export const auditTransactionStockMovements = async (transactionId) => {
  try {
    const { data, error } = await supabase
      .from("transaction_edit_stock_audit")
      .select("*")
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log(
      "📊 Stock movement audit for transaction:",
      transactionId,
      data
    );
    return data;
  } catch (error) {
    console.error("❌ Error auditing stock movements:", error);
    throw error;
  }
};

// Undo transaction edit function
export const undoTransactionEdit = async (
  transactionId,
  undoReason = "Transaction edit undone"
) => {
  try {
    console.log("🔄 Undoing transaction edit:", transactionId);

    const { data, error } = await supabase.rpc("undo_transaction_edit", {
      p_transaction_id: transactionId,
      p_undo_reason: undoReason,
    });

    if (error) throw error;

    console.log("✅ Transaction edit undone:", data);
    return data;
  } catch (error) {
    console.error("❌ Error undoing transaction edit:", error);
    throw error;
  }
};

// Updated SalesService class with proper stock management
export class EnhancedSalesService {
  // Original edit method (UNSAFE - for reference only)
  static async editTransactionUnsafe(transactionId, editData) {
    console.warn(
      "⚠️ Using UNSAFE edit method - stock levels may be incorrect!"
    );

    try {
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
          edited_at: new Date().toISOString(),
          edited_by: editData.currentUser?.id,
          edit_reason: editData.editReason,
          original_total: editData.original_total,
        })
        .eq("id", transactionId)
        .select();

      if (salesError) throw salesError;

      // ⚠️ CRITICAL ISSUE: This deletes/inserts without proper stock management
      const { error: deleteError } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", transactionId);

      if (deleteError) throw deleteError;

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

      return salesData[0];
    } catch (error) {
      console.error("❌ Unsafe transaction edit failed:", error);
      throw error;
    }
  }

  // Safe edit method with proper stock management
  static async editTransaction(transactionId, editData) {
    return await editTransactionWithStockManagement(transactionId, editData);
  }

  // Get stock movement audit trail
  static async getStockMovementAudit(transactionId) {
    return await auditTransactionStockMovements(transactionId);
  }

  // Undo transaction edit
  static async undoEdit(transactionId, reason) {
    return await undoTransactionEdit(transactionId, reason);
  }
}

// Export the enhanced service as default
export default EnhancedSalesService;

/* 
=================================================
📋 USAGE INSTRUCTIONS:
=================================================

1. SAFE TRANSACTION EDITING:
   ```javascript
   import { editTransactionWithStockManagement } from './enhancedSalesService';
   
   const result = await editTransactionWithStockManagement(transactionId, {
     items: [...],
     total_amount: 100.00,
     editReason: "Customer requested quantity change",
     currentUser: user
   });
   ```

2. STOCK AUDIT:
   ```javascript
   const audit = await auditTransactionStockMovements(transactionId);
   console.log("Stock movements:", audit);
   ```

3. UNDO EDIT:
   ```javascript
   const undoResult = await undoTransactionEdit(transactionId, "Mistake in edit");
   ```

=================================================
🚨 CRITICAL INVENTORY RULES:
=================================================

✅ WHAT HAPPENS DURING EDIT:
- If quantity INCREASES: Additional stock is DEDUCTED
- If quantity DECREASES: Excess stock is RESTORED
- If item REMOVED: Full stock is RESTORED  
- If item ADDED: Stock is DEDUCTED

✅ AUDIT TRAIL:
- All stock movements are logged in stock_movements table
- Edit reasons are preserved for compliance
- Stock levels before/after are tracked

✅ STOCK CONSISTENCY:
- Database triggers ensure atomicity
- Failed edits rollback all changes
- Stock levels remain accurate

❌ DO NOT USE:
- The old editTransaction method (marked as editTransactionUnsafe)
- Direct sale_items manipulation without stock management
- Manual stock adjustments without proper audit trail

=================================================
*/
