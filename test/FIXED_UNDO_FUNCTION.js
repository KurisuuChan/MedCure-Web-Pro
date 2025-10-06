/**
 * FIXED UNDO TRANSACTION FUNCTION
 * Replace the existing undoTransaction function in transactionService.js with this version
 */

/**
 * Undo a completed transaction (restore stock, mark cancelled)
 * Uses robust database function to handle missing products gracefully
 * @param {string} transactionId - Transaction ID
 * @param {string} reason - Reason for undo (optional)
 * @param {string} userId - User performing the undo (optional)
 * @returns {Promise<Object>} Undo result
 */
async undoTransaction(
  transactionId,
  reason = "Transaction undone",
  userId = null
) {
  console.log("↩️ Undoing transaction:", { transactionId, reason, userId });

  try {
    // First validate that the transaction can be undone
    const transaction = await this.getTransactionById(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.status === "cancelled") {
      throw new Error("Transaction is already cancelled");
    }

    if (transaction.status !== "completed") {
      throw new Error("Only completed transactions can be undone");
    }

    // Check time limit (24 hours)
    const ageInHours = this.getTransactionAgeHours(transaction.created_at);
    if (ageInHours > 24) {
      throw new Error("Cannot undo transactions older than 24 hours");
    }

    // Use the robust database function for undo operations
    // This handles missing products gracefully without manual product lookups
    console.log("🔄 Calling robust database undo function...");
    
    const { data: undoResult, error: undoError } = await supabase.rpc(
      'undo_transaction_completely',
      { p_transaction_id: transactionId }
    );

    if (undoError) {
      console.error("❌ Database undo function failed:", undoError);
      throw new Error(`Database undo failed: ${undoError.message}`);
    }

    if (!undoResult || !undoResult.success) {
      const errorMessage = undoResult?.message || undoResult?.error || "Unknown error";
      console.error("❌ Undo operation failed:", errorMessage);
      throw new Error(`Undo failed: ${errorMessage}`);
    }

    console.log("✅ Database undo function completed:", undoResult);

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
        console.warn("⚠️ Could not update reason:", updateError);
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
      console.warn("⚠️ Some products were missing during undo:", undoResult.missing_product_ids);
    }

    console.log("✅ Transaction undone successfully:", response);
    return response;

  } catch (error) {
    console.error("❌ Undo transaction failed:", error);
    throw new Error(`Failed to undo transaction: ${error.message}`);
  }
}
