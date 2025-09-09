import React from "react";

// Debug component to help diagnose edit button issues
const TransactionEditDebugger = ({ transaction, onEditClick }) => {
  const debugInfo = {
    hasTransaction: !!transaction,
    transactionId: transaction?.id,
    createdAt: transaction?.created_at,
    isRecent: transaction
      ? (new Date() - new Date(transaction.created_at)) / (1000 * 60 * 60) <= 24
      : false,
    hoursOld: transaction
      ? (new Date() - new Date(transaction.created_at)) / (1000 * 60 * 60)
      : 0,
    hasItems: transaction?.items?.length > 0,
    isEdited: transaction?.is_edited,
  };

  const handleDebugClick = () => {
    console.log("🔍 Edit Button Debug Info:", debugInfo);
    console.log("📋 Full Transaction Data:", transaction);

    if (debugInfo.isRecent) {
      console.log("✅ Transaction can be edited (within 24 hours)");
      onEditClick?.(transaction);
    } else {
      console.log("❌ Transaction cannot be edited (older than 24 hours)");
      alert(
        `Transaction is ${debugInfo.hoursOld.toFixed(
          1
        )} hours old and cannot be edited`
      );
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
        🔧 Transaction Edit Debugger
      </h3>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Has Transaction:</strong>{" "}
          {debugInfo.hasTransaction ? "✅" : "❌"}
        </div>
        <div>
          <strong>Transaction ID:</strong> {debugInfo.transactionId || "N/A"}
        </div>
        <div>
          <strong>Can Edit:</strong> {debugInfo.isRecent ? "✅" : "❌"}
        </div>
        <div>
          <strong>Hours Old:</strong> {debugInfo.hoursOld.toFixed(1)}
        </div>
        <div>
          <strong>Has Items:</strong> {debugInfo.hasItems ? "✅" : "❌"}
        </div>
        <div>
          <strong>Already Edited:</strong> {debugInfo.isEdited ? "✅" : "❌"}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDebugClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔍 Debug Edit Click
        </button>

        <button
          onClick={() => console.log("📋 Transaction Data:", transaction)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          📋 Log Transaction Data
        </button>
      </div>

      {!debugInfo.isRecent && debugInfo.hasTransaction && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          ⚠️ This transaction is too old to edit (
          {debugInfo.hoursOld.toFixed(1)} hours old). Only transactions within
          24 hours can be edited.
        </div>
      )}
    </div>
  );
};

export default TransactionEditDebugger;
