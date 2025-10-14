/**
 * Robust Undo Transaction Function
 * Uses database function for reliable product handling
 */

import { supabase } from "../../supabaseClient";

/**
 * Robust undo transaction that handles missing products gracefully
 * @param {string} transactionId - Transaction ID
 * @param {string} reason - Reason for undo (optional)
 * @param {string} userId - User performing the undo (optional)
 * @returns {Promise<Object>} Undo result
 */
export async function robustUndoTransaction(
  transactionId,
  reason = "Transaction undone",
  userId = null
) {
  console.log("↩️ [RobustUndo] Starting transaction undo:", { 
    transactionId, 
    reason, 
    userId 
  });

  try {
    // First validate that the transaction exists
    const { data: transaction, error: fetchError } = await supabase
      .from("sales")
      .select("id, status, created_at, total_amount")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status === "cancelled") {
      throw new Error("Transaction is already cancelled");
    }

    if (transaction.status !== "completed") {
      throw new Error("Only completed transactions can be undone");
    }

    // Check time limit (24 hours)
    const ageInHours = Math.abs(new Date() - new Date(transaction.created_at)) / 36e5;
    if (ageInHours > 24) {
      throw new Error("Cannot undo transactions older than 24 hours");
    }

    console.log("✅ [RobustUndo] Transaction validation passed");

    // Use the robust database function for undo
    console.log("🔄 [RobustUndo] Calling database undo function...");
    
    const { data: undoResult, error: undoError } = await supabase.rpc(
      'undo_transaction_completely',
      { p_transaction_id: transactionId }
    );

    if (undoError) {
      console.error("❌ [RobustUndo] Database undo function failed:", undoError);
      throw new Error(`Database undo failed: ${undoError.message}`);
    }

    if (!undoResult || !undoResult.success) {
      const errorMessage = undoResult?.message || undoResult?.error || "Unknown error";
      console.error("❌ [RobustUndo] Undo operation failed:", errorMessage);
      throw new Error(`Undo failed: ${errorMessage}`);
    }

    console.log("✅ [RobustUndo] Database function completed:", undoResult);

    // Update the reason and user info if provided
    if (reason && reason !== "Transaction undone") {
      const { error: updateError } = await supabase
        .from("sales")
        .update({
          edit_reason: reason,
          edited_by: userId,
        })
        .eq("id", transactionId);

      if (updateError) {
        console.warn("⚠️ [RobustUndo] Could not update reason:", updateError);
        // Don't fail the whole operation for this
      }
    }

    // Prepare success response
    const response = {
      success: true,
      data: {
        transaction_id: transactionId,
        status: "cancelled",
        reason: reason,
        undone_by: userId,
        undone_at: new Date().toISOString(),
        database_result: undoResult,
      },
      message: undoResult.message,
    };

    // Add warning if some products were missing
    if (undoResult.products_not_found > 0) {
      response.warning = `${undoResult.products_not_found} products were not found and could not have stock restored`;
      response.data.missing_products = undoResult.missing_product_ids;
    }

    console.log("✅ [RobustUndo] Transaction undone successfully:", response);
    return response;

  } catch (error) {
    console.error("❌ [RobustUndo] Undo transaction failed:", error);
    throw new Error(`Failed to undo transaction: ${error.message}`);
  }
}
