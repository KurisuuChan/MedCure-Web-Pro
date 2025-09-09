import React, { useState } from "react";
import { X, AlertTriangle, RotateCcw, DollarSign, Package } from "lucide-react";
import { formatCurrency } from "../../utils/formatting";
import { formatDate } from "../../utils/dateTime";

/**
 * Professional Transaction Undo Modal
 * Provides confirmation and audit trail for transaction cancellation
 */
export default function TransactionUndoModal({
  isOpen,
  onClose,
  transaction,
  onConfirm,
  isProcessing = false,
}) {
  const [undoReason, setUndoReason] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleFirstConfirm = () => {
    if (!undoReason.trim()) {
      alert("Please provide a reason for undoing this transaction.");
      return;
    }
    setShowConfirmation(true);
  };

  const handleFinalConfirm = () => {
    onConfirm(transaction.id, undoReason.trim());
    setShowConfirmation(false);
    setUndoReason("");
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setUndoReason("");
    onClose();
  };

  const totalItems =
    transaction.sale_items?.length || transaction.items?.length || 0;
  const isEdited = transaction.is_edited || false;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Undo Transaction
                </h3>
                <p className="text-sm text-red-600">
                  This action cannot be reversed
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-red-200 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <X className="h-5 w-5 text-red-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Summary */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Transaction Details</h4>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm font-medium">
                  #{transaction.id?.slice(-8) || "N/A"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium">
                  {formatDate(transaction.created_at)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(transaction.total_amount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Items:</span>
                <span className="text-sm font-medium">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="text-sm font-medium capitalize">
                  {transaction.payment_method || "Cash"}
                </span>
              </div>

              {isEdited && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                    Previously Edited
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">What happens when you undo:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    • Transaction will be marked as <strong>CANCELLED</strong>
                  </li>
                  <li>
                    • Stock will be <strong>RESTORED</strong> for all items
                  </li>
                  <li>
                    • Amount will be <strong>EXCLUDED</strong> from revenue
                    reports
                  </li>
                  <li>
                    • This action will be <strong>LOGGED</strong> for audit
                    trail
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {!showConfirmation ? (
            /* Reason Input */
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Reason for undoing this transaction *
              </label>
              <textarea
                value={undoReason}
                onChange={(e) => setUndoReason(e.target.value)}
                placeholder="e.g., Customer requested refund, Wrong items sold, Payment error..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={3}
                disabled={isProcessing}
                required
              />
              <p className="text-xs text-gray-500">
                This reason will be saved for audit and compliance purposes.
              </p>
            </div>
          ) : (
            /* Final Confirmation */
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-center space-y-2">
                <RotateCcw className="h-8 w-8 text-red-600 mx-auto" />
                <p className="font-medium text-red-800">Final Confirmation</p>
                <p className="text-sm text-red-600">
                  Are you absolutely sure you want to undo this transaction?
                </p>
                <p className="text-xs text-red-500 font-medium">
                  This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>

          {!showConfirmation ? (
            <button
              onClick={handleFirstConfirm}
              disabled={!undoReason.trim() || isProcessing}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Continue to Undo</span>
            </button>
          ) : (
            <button
              onClick={handleFinalConfirm}
              disabled={isProcessing}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>UNDO TRANSACTION</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
