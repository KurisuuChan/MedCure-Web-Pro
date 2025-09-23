import React, { useState, useEffect } from "react";
import {
  Edit3,
  Save,
  X,
  AlertCircle,
  History,
  User,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "../../utils/formatting";
import { formatDate } from "../../utils/dateTime";

const TransactionEditor = ({ transaction, onSave, onCancel, currentUser }) => {
  const [editedTransaction, setEditedTransaction] = useState(null);
  const [editReason, setEditReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize edited transaction state
  useEffect(() => {
    console.log(
      "🔧 [TransactionEditor] Initializing with transaction:",
      transaction
    );

    if (transaction) {
      const editedTx = {
        ...transaction,
        items:
          transaction.items?.map((item) => ({
            ...item,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || item.pricePerUnit || 0,
            total_price: item.total_price || item.totalPrice || 0,
          })) || [],
      };

      console.log(
        "🔧 [TransactionEditor] Prepared edited transaction:",
        editedTx
      );
      setEditedTransaction(editedTx);
    }
  }, [transaction]);

  // Calculate totals from edited items
  const calculateTotals = (items, discount = null) => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0
    );
    const discountAmount = discount?.amount || 0;
    const total = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      total: Math.max(0, total),
    };
  };

  // Handle item quantity change
  const handleItemQuantityChange = (itemIndex, newQuantity) => {
    if (!editedTransaction) return;

    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    const updatedItems = [...editedTransaction.items];
    const item = updatedItems[itemIndex];

    // Update quantity and recalculate total
    item.quantity = quantity;
    item.total_price = quantity * item.unit_price;

    setEditedTransaction({
      ...editedTransaction,
      items: updatedItems,
    });
  };

  // Handle item removal
  const handleRemoveItem = (itemIndex) => {
    if (!editedTransaction) return;

    const updatedItems = editedTransaction.items.filter(
      (_, index) => index !== itemIndex
    );
    setEditedTransaction({
      ...editedTransaction,
      items: updatedItems,
    });
  };

  // Handle revert to original
  const handleRevertToOriginal = () => {
    if (!transaction) return;

    // Restore original transaction data
    const originalTransaction = {
      ...transaction,
      items:
        transaction.items?.map((item) => ({
          ...item,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || item.pricePerUnit || 0,
          total_price: item.total_price || item.totalPrice || 0,
        })) || [],
    };

    setEditedTransaction(originalTransaction);
    setEditReason("Reverted to original transaction values");

    console.log("🔄 Reverted to original transaction:", originalTransaction);
  };

  // Handle save with enhanced validation
  const handleSave = async () => {
    if (!editedTransaction) {
      setError("No transaction data available");
      return;
    }

    if (!editReason.trim() || editReason.trim().length < 10) {
      setError("Edit reason is required and must be at least 10 characters");
      return;
    }

    if (!hasChanges()) {
      setError("No changes detected. Please make changes before saving.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const totals = calculateTotals(editedTransaction.items, {
        amount: editedTransaction.discount_amount || 0,
      });

      console.log(
        "🔧 [TransactionEditor] Items for calculation:",
        editedTransaction.items
      );
      console.log("🔧 [TransactionEditor] Calculated totals:", totals);

      // Prepare edit data for enhanced stock-aware editing
      const editData = {
        // Transaction metadata
        transaction_id: transaction.id,
        total_amount: totals.total,
        subtotal_before_discount: totals.subtotal,

        // Payment information
        payment_method:
          editedTransaction.payment_method || transaction.payment_method,

        // Discount information
        discount_type: editedTransaction.discount_type || "none",
        discount_percentage: editedTransaction.discount_percentage || 0,
        discount_amount: editedTransaction.discount_amount || 0,
        pwd_senior_id: editedTransaction.pwd_senior_id || null,

        // Edit metadata for audit trail
        editReason: editReason.trim(),
        currentUser: currentUser,
        original_total: transaction.total_amount,

        // Items with proper product_id mapping (quantity is already in pieces from DB)
        items: editedTransaction.items.map((item) => ({
          product_id: item.product_id || item.id,
          quantity: item.quantity, // ✅ Database quantity is already in pieces
          unit_type: "piece", // ✅ Always use "piece" since DB quantity is in pieces
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
      };

      console.log(
        "🔧 [TransactionEditor] Prepared edit data for enhanced editing:",
        editData
      );

      await onSave(editData);
    } catch (err) {
      console.error("❌ [TransactionEditor] Save failed:", err);
      setError(err.message || "Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if transaction can be edited (within time limit)
  const canEdit = () => {
    if (!transaction) return false;

    // TEMP: Always allow editing for debugging
    return true;

    // Original logic (commented for debugging):
    // const transactionDate = new Date(transaction.created_at);
    // const now = new Date();
    // const timeDiff = now - transactionDate;
    // const hoursDiff = timeDiff / (1000 * 60 * 60);
    // return hoursDiff <= 24;
  };

  // Check if there are changes
  const hasChanges = () => {
    if (!editedTransaction || !transaction) return false;

    // Check if items changed
    const itemsChanged =
      JSON.stringify(editedTransaction.items) !==
      JSON.stringify(transaction.items);

    // Check if discount changed
    const discountChanged =
      editedTransaction.discount_type !== transaction.discount_type ||
      editedTransaction.discount_amount !== transaction.discount_amount ||
      editedTransaction.pwd_senior_id !== transaction.pwd_senior_id;

    return itemsChanged || discountChanged;
  };

  if (!transaction) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No transaction selected</p>
      </div>
    );
  }

  if (!canEdit()) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 font-medium">Transaction cannot be edited</p>
        <p className="text-gray-600 text-sm mt-2">
          Transactions can only be edited within 24 hours of creation
        </p>
      </div>
    );
  }

  if (!editedTransaction) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading transaction...</p>
      </div>
    );
  }

  const totals = calculateTotals(editedTransaction.items, {
    amount: editedTransaction.discount_amount || 0,
  });

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Edit3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Process Refund
            </h2>
            <p className="text-gray-600 text-sm">
              Transaction #{transaction.id?.slice(0, 8)} •{" "}
              {formatDate(transaction.created_at)}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Transaction Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Cashier:</span>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium">
                  {transaction.cashier_name || "Unknown"}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-600">Payment Method:</span>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="font-medium capitalize">
                  {transaction.payment_method}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Items */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Transaction Items
          </h3>
          <div className="space-y-3">
            {editedTransaction.items.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-gray-50 rounded-lg p-4 border"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">
                      Unit Price: {formatCurrency(item.unit_price)} • Unit:{" "}
                      {item.unit_type}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity Input */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Qty:</label>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemQuantityChange(index, e.target.value)
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </div>

                    {/* Total Price */}
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.total_price)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Updated Totals
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-600">
                  Discount ({editedTransaction.discount_percentage}%):
                </span>
                <span className="font-medium text-green-600">
                  -{formatCurrency(totals.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>New Total:</span>
              <span className="text-blue-600">
                {formatCurrency(totals.total)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Original Total:</span>
              <span>{formatCurrency(transaction.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Difference:</span>
              <span
                className={
                  totals.total > transaction.total_amount
                    ? "text-red-600"
                    : "text-green-600"
                }
              >
                {totals.total > transaction.total_amount ? "+" : ""}
                {formatCurrency(totals.total - transaction.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Reason - Enhanced Professional Input */}
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">
                Edit Justification Required
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                All transaction modifications must be documented for audit
                compliance and business transparency.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Modification <span className="text-red-500">*</span>
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Required: Provide specific reason (e.g., 'Customer requested quantity change', 'Price correction needed', 'Added additional items')..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                required
                minLength="10"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  Minimum 10 characters required
                </span>
                <span
                  className={`text-xs ${
                    editReason.length >= 10 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {editReason.length}/10+
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          {hasChanges() ? (
            <span className="text-orange-600 font-medium">
              ⚠ Unsaved changes
            </span>
          ) : (
            <span>No changes made</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          {/* Revert to Original Button */}
          {transaction.is_edited && (
            <button
              onClick={handleRevertToOriginal}
              className="px-4 py-2 text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-2"
              title="Restore original transaction values"
            >
              <RotateCcw className="w-4 h-4" />
              Revert to Original
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!hasChanges() || !editReason.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionEditor;
