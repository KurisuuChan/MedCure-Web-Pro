import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { UnifiedTransactionService } from "../../../services/domains/sales/transactionService";
import { useAuth } from "../../../hooks/useAuth";
import SimpleReceipt from "../../ui/SimpleReceipt";

// Enhanced scrollbar styles matching inventory page
const scrollbarStyles = `
  .modal-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  .modal-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .modal-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .modal-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }
  
  .modal-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

const EnhancedTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: "today",
    status: "all",
    sortBy: "newest",
  });
  const [undoConfirm, setUndoConfirm] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState(null);
  const [notification, setNotification] = useState(null); // Toast notification state

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [compactView, setCompactView] = useState(false);
  const itemsPerPage = compactView ? 12 : 8;

  const { user } = useAuth();

  const transactionService = useMemo(() => new UnifiedTransactionService(), []);

  // Toast notification function
  const showNotification = (message, type = "info") => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  // Get notification styles based on type
  const getNotificationStyles = (type) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-500 text-green-800";
      case "error":
        return "bg-red-50 border-red-500 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-500 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-500 text-blue-800";
    }
  };

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const options = {
        limit: 50,
        sortBy:
          filters.sortBy === "newest" ? "created_at:desc" : "created_at:asc",
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.dateRange !== "all" && { dateRange: filters.dateRange }),
      };

      console.log("🔄 Loading transactions with options:", options);
      const result = await transactionService.getTransactions(options);

      setTransactions(result || []);
      setCurrentPage(1); // Reset to first page when data loads
      console.log("📊 Loaded enhanced transactions:", result);
    } catch (err) {
      console.error("❌ Failed to load transactions:", err);
      setError(`Failed to load transactions: ${err.message}`);

      // Show user-friendly error message
      if (err.message.includes("unit_types")) {
        setError(
          "Database schema issue detected. Please contact system administrator."
        );
      } else if (err.message.includes("permission")) {
        setError("You don't have permission to view transactions.");
      } else {
        setError("Unable to load transactions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [filters, transactionService]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleUndoTransaction = async (transactionId) => {
    try {
      const reason = prompt(
        "Please provide a reason for undoing this transaction:"
      );
      if (!reason) return;

      // Show loading state
      setUndoConfirm(null);
      setLoading(true);
      showNotification("Processing undo request...", "info");

      const result = await transactionService.undoTransaction(
        transactionId,
        reason,
        user?.id || "admin-user"
      );

      if (result.success) {
        showNotification(
          "✅ Transaction successfully undone and stock restored!",
          "success"
        );
        await loadTransactions(); // Reload transactions
      } else {
        showNotification(
          "❌ Failed to undo transaction: " +
            (result.message || "Unknown error"),
          "error"
        );
      }
    } catch (err) {
      console.error("❌ Undo transaction error:", err);
      showNotification("❌ Error undoing transaction: " + err.message, "error");
    } finally {
      setLoading(false);
      setUndoConfirm(null);
    }
  };

  const handleEditTransaction = (transaction) => {
    console.log("🔧 Edit button clicked for transaction:", transaction);

    // Validate transaction can be edited
    if (!transaction) {
      showNotification("❌ No transaction data available", "error");
      return;
    }

    // Check if transaction is within edit time window (24 hours)
    const transactionDate = new Date(transaction.created_at);
    const now = new Date();
    const hoursDiff = (now - transactionDate) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      showNotification(
        "❌ Cannot edit transactions older than 24 hours",
        "error"
      );
      return;
    }

    if (transaction.status !== "completed") {
      showNotification("❌ Only completed transactions can be edited", "error");
      return;
    }

    // Prepare transaction data for editing
    const editableTransaction = {
      ...transaction,
      sale_items: transaction.sale_items || [],
    };

    console.log("✅ Opening edit modal for transaction:", editableTransaction);
    setEditingTransaction(editableTransaction);
  };

  const handlePrintReceipt = (transaction) => {
    try {
      console.log("🖨️ Opening receipt for transaction:", transaction.id);
      setReceiptTransaction(transaction);
      setShowReceipt(true);
    } catch (error) {
      console.error("❌ Receipt error:", error);
      alert("Failed to open receipt: " + error.message);
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setReceiptTransaction(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status?.toUpperCase()}
      </span>
    );
  };

  const getActionButtons = (transaction) => {
    const canEdit =
      transaction.metadata?.can_edit ||
      (transaction.status === "completed" &&
        transaction.created_at &&
        new Date() - new Date(transaction.created_at) < 24 * 60 * 60 * 1000); // 24 hours

    const canUndo =
      transaction.metadata?.can_undo ||
      (transaction.status === "completed" &&
        transaction.created_at &&
        new Date() - new Date(transaction.created_at) < 2 * 60 * 60 * 1000); // 2 hours

    const timeLeft = transaction.metadata?.time_remaining_hours;

    return (
      <div className="flex flex-col gap-1 items-end">
        {timeLeft !== undefined && timeLeft > 0 && (
          <span className="text-xs text-gray-500">
            {Math.floor(timeLeft)}h left
          </span>
        )}

        <div className="flex gap-2">
          {/* Print Receipt - Always available */}
          <button
            onClick={() => handlePrintReceipt(transaction)}
            className="group px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center space-x-2"
            title="Print Receipt"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-10.326 0c-1.069.16-1.837 1.094-1.837 2.175v6.294a2.25 2.25 0 002.25 2.25h1.091m-4.182-15.75h4.5m0 0h4.5m-4.5 0V3.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v.75m-9 7.5h6.75"
              />
            </svg>
            <span>Print</span>
          </button>

          {canEdit && (
            <button
              onClick={() => {
                console.log(
                  "� Refund button clicked for transaction:",
                  transaction
                );
                handleRefundTransaction(transaction);
              }}
              className="group p-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Process Refund"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
          )}

          {canUndo && (
            <button
              onClick={() => setUndoConfirm(transaction.id)}
              className="group px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center space-x-2"
              title="Undo Transaction"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                />
              </svg>
              <span>Undo</span>
            </button>
          )}
        </div>

        {!canEdit && !canUndo && timeLeft <= 0 && (
          <span className="text-xs text-gray-400">Actions expired</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={`skeleton-item-${index}`}
                className="h-16 bg-gray-200 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 mb-4">
          <h3 className="font-medium">Error Loading Transactions</h3>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={loadTransactions}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="bg-white h-full max-h-[85vh] lg:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Filters Only - No duplicate header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCompactView(!compactView)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                  compactView
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
                title="Toggle compact view"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                <span>{compactView ? "Detail" : "Compact"}</span>
              </button>
              <button
                onClick={loadTransactions}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 hover:scale-105 active:scale-95"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.dateRange}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, dateRange: e.target.value }));
                setCurrentPage(1); // Reset to first page
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
                setCurrentPage(1); // Reset to first page
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, sortBy: e.target.value }));
                setCurrentPage(1); // Reset to first page
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Calculate pagination */}
        {(() => {
          const totalPages = Math.ceil(transactions.length / itemsPerPage);
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedTransactions = transactions.slice(
            startIndex,
            endIndex
          );

          return (
            <>
              {/* Transaction List - Scrollable with better height management */}
              <div className="flex-1 overflow-y-auto modal-scrollbar min-h-0 max-h-[50vh] lg:max-h-[60vh]">
                <div className="divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No transactions found for the selected filters.
                    </div>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`${
                          compactView ? "p-4" : "p-6"
                        } hover:bg-gray-50 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="p-2 bg-blue-100 rounded-xl">
                                  <svg
                                    className="h-5 w-5 text-blue-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                    />
                                  </svg>
                                </div>
                                <span className="font-semibold text-gray-900 text-base">
                                  #
                                  {transaction.transaction_number ||
                                    transaction.id.slice(-8)}
                                </span>
                              </div>
                              {getStatusBadge(transaction.status)}
                              {transaction.is_edited && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                  EDITED
                                </span>
                              )}
                            </div>

                            <div
                              className={`${
                                compactView
                                  ? "grid grid-cols-3 lg:grid-cols-6 gap-2"
                                  : "grid grid-cols-2 lg:grid-cols-4 gap-4"
                              } mb-4`}
                            >
                              <div
                                className={`bg-gray-50 rounded-xl ${
                                  compactView ? "p-2" : "p-3"
                                } border border-gray-100`}
                              >
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Customer
                                </span>
                                <div className="mt-1 space-y-1">
                                  <p
                                    className={`${
                                      compactView ? "text-xs" : "text-sm"
                                    } font-medium text-gray-900`}
                                  >
                                    {transaction.customer_name || "Walk-in Customer"}
                                  </p>
                                  {/* Customer Type Badge */}
                                  <div className="flex items-center space-x-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      transaction.customer_type === 'new' 
                                        ? 'bg-green-100 text-green-700' 
                                        : transaction.customer_type === 'old'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {transaction.customer_type === 'new' ? 'New' : 
                                       transaction.customer_type === 'old' ? 'Returning' : 'Guest'}
                                    </span>
                                    {transaction.customer_phone && (
                                      <span className="text-xs text-gray-500">
                                        📞 {transaction.customer_phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`bg-gray-50 rounded-xl ${
                                  compactView ? "p-2" : "p-3"
                                } border border-gray-100`}
                              >
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Date
                                </span>
                                <p
                                  className={`${
                                    compactView ? "text-xs" : "text-sm"
                                  } font-medium text-gray-900 mt-1`}
                                >
                                  {formatDate(transaction.created_at)}
                                </p>
                              </div>
                              <div
                                className={`bg-gray-50 rounded-xl ${
                                  compactView ? "p-2" : "p-3"
                                } border border-gray-100`}
                              >
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Cashier
                                </span>
                                <p
                                  className={`${
                                    compactView ? "text-xs" : "text-sm"
                                  } font-medium text-gray-900 mt-1`}
                                >
                                  {transaction.cashier
                                    ? `${transaction.cashier.first_name} ${transaction.cashier.last_name}`
                                    : "Unknown"}
                                </p>
                              </div>
                              <div
                                className={`bg-gray-50 rounded-xl ${
                                  compactView ? "p-2" : "p-3"
                                } border border-gray-100`}
                              >
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                  Amount
                                </span>
                                <p
                                  className={`${
                                    compactView ? "text-xs" : "text-sm"
                                  } font-bold text-green-600 mt-1`}
                                >
                                  {formatCurrency(
                                    transaction.total_amount ||
                                      transaction.total ||
                                      0
                                  )}
                                </p>
                              </div>
                              {compactView && (
                                <div className="bg-blue-50 rounded-xl p-2 border border-blue-100">
                                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                    Items
                                  </span>
                                  <p className="text-xs font-medium text-blue-900 mt-1">
                                    {transaction.sale_items?.length || 0}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Transaction Items - Hidden in compact view */}
                            {!compactView && (
                              <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center mb-3">
                                  <span className="text-sm font-semibold text-gray-700">
                                    Items
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({transaction.sale_items?.length || 0}{" "}
                                    items)
                                  </span>
                                </div>
                                <div className="space-y-2 max-h-24 overflow-y-auto">
                                  {transaction.sale_items?.map((item) => (
                                    <div
                                      key={`${transaction.id}-${
                                        item.id || item.product_id
                                      }`}
                                      className="bg-white rounded-lg p-3 shadow-sm flex justify-between items-center"
                                    >
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {item.products?.name ||
                                            `Product ID: ${item.product_id}`}
                                        </span>
                                        <div className="text-xs text-gray-600 mt-1">
                                          Qty: {item.quantity}{" "}
                                          {item.metadata?.unit_display ||
                                            item.unit_type}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-gray-900">
                                          {formatCurrency(item.total_price)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          @
                                          {formatCurrency(item.unit_price || 0)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Edit History */}
                            {transaction.is_edited && (
                              <div
                                className={`mt-4 ${
                                  compactView ? "p-3" : "p-4"
                                } bg-orange-50 rounded-xl border border-orange-200`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div
                                    className={`${
                                      compactView ? "p-1.5" : "p-2"
                                    } bg-orange-100 rounded-xl`}
                                  >
                                    <svg
                                      className={`${
                                        compactView ? "h-3 w-3" : "h-4 w-4"
                                      } text-orange-600`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <span
                                      className={`${
                                        compactView ? "text-xs" : "text-sm"
                                      } font-semibold text-orange-800`}
                                    >
                                      Edit History
                                    </span>
                                    <p
                                      className={`text-orange-700 ${
                                        compactView ? "text-xs" : "text-sm"
                                      } mt-1`}
                                    >
                                      {transaction.edit_reason ||
                                        "No reason provided"}
                                    </p>
                                    {transaction.edited_at && (
                                      <p className="text-orange-600 text-xs mt-1">
                                        Modified:{" "}
                                        {formatDate(transaction.edited_at)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="ml-4">
                            {getActionButtons(transaction)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pagination Controls - Compact */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-600">
                      <span>
                        {startIndex + 1}-
                        {Math.min(endIndex, transactions.length)} of{" "}
                        {transactions.length}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        ‹
                      </button>
                      {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else {
                          // Show current page and surrounding pages
                          const start = Math.max(1, currentPage - 2);
                          pageNum = start + index;
                          if (pageNum > totalPages) return null;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* Transaction Summary - Compact */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  {transactions.length} transactions
                </span>
              </div>
              {transactions.length > 0 && (
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total:
                  </span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    {formatCurrency(
                      transactions.reduce(
                        (sum, t) =>
                          sum +
                          (t.status === "completed"
                            ? t.total_amount || t.total || 0
                            : 0),
                        0
                      )
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Undo Confirmation Modal */}
        {undoConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-xl">
                    <svg
                      className="h-6 w-6 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Confirm Undo Transaction
                    </h3>
                    <p className="text-sm text-gray-600">
                      Reverse this transaction permanently
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-amber-900">
                        Warning
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        This action will restore the stock and mark the
                        transaction as cancelled. This cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setUndoConfirm(null)}
                    className="group px-6 py-2.5 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUndoTransaction(undoConfirm)}
                    className="group px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center space-x-2">
                      <span>Undo Transaction</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Transaction Modal */}
        {editingTransaction && (
          <RefundTransactionModal
            transaction={editingTransaction}
            onClose={() => setEditingTransaction(null)}
            onSave={loadTransactions}
            transactionService={transactionService}
            currentUser={user}
            showNotification={showNotification}
          />
        )}

        {/* Receipt Modal */}
        <SimpleReceipt
          transaction={receiptTransaction}
          isOpen={showReceipt}
          onClose={closeReceipt}
        />

        {/* Toast Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-[60] max-w-md">
            <div
              className={`p-4 rounded-xl shadow-2xl border-l-4 transform transition-all duration-300 ${getNotificationStyles(
                notification.type
              )}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === "success" && (
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  {notification.type === "error" && (
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  )}
                  {notification.type === "warning" && (
                    <svg
                      className="h-5 w-5 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  )}
                  {notification.type === "info" && (
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{notification.message}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setNotification(null)}
                    className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Refund Transaction Modal Component
const RefundTransactionModal = ({
  transaction,
  onClose,
  onSave,
  transactionService,
  currentUser,
  showNotification,
}) => {
  const [items, setItems] = useState(transaction.sale_items || []);
  const [customerName, setCustomerName] = useState(
    transaction.customer_name || ""
  );
  const [editReason, setEditReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Common refund reasons
  const refundReasons = [
    "Customer changed mind",
    "Product defective/damaged",
    "Wrong product ordered",
    "Product expired",
    "Pricing error",
    "Duplicate transaction",
    "Customer not satisfied",
    "Medical reasons",
    "Doctor changed prescription",
    "Insurance coverage issue",
    "Others"
  ];

  // Initialize items with proper structure
  useEffect(() => {
    if (transaction.sale_items) {
      const processedItems = transaction.sale_items.map((item) => ({
        ...item,
        // Ensure all required fields exist
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || item.quantity * item.unit_price,
        unit_type: item.unit_type || "piece",
        // Handle product name from nested product object or fallback
        product_name:
          item.products?.name ||
          item.product_name ||
          `Product ${item.product_id}`,
      }));

      console.log("🔧 Processed items for editing:", processedItems);
      setItems(processedItems);
    }
  }, [transaction]);

  const updateItemQuantity = (itemId, newQuantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, parseInt(newQuantity) || 1),
              total_price:
                Math.max(1, parseInt(newQuantity) || 1) *
                (item.unit_price || 0),
            }
          : item
      )
    );
  };

  const removeItem = (itemId) => {
    if (items.length <= 1) {
      showNotification(
        "⚠️ Cannot remove the last item from transaction",
        "warning"
      );
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const calculateNewTotal = () => {
    return items.reduce((total, item) => total + (item.total_price || 0), 0);
  };

  const calculateStockChanges = () => {
    const originalItems = transaction.sale_items || [];
    const stockChanges = [];

    // Create a map of product changes
    const changeMap = new Map();

    // Process original items (these were deducted)
    originalItems.forEach((item) => {
      const productId = item.product_id;
      const quantity = item.quantity || 0;
      changeMap.set(productId, {
        product_id: productId,
        product_name:
          item.products?.name || item.product_name || `Product ${productId}`,
        original_quantity: quantity,
        new_quantity: 0,
        change: 0,
      });
    });

    // Process new items
    items.forEach((item) => {
      const productId = item.product_id;
      const quantity = item.quantity || 0;

      if (changeMap.has(productId)) {
        changeMap.get(productId).new_quantity = quantity;
      } else {
        changeMap.set(productId, {
          product_id: productId,
          product_name: item.product_name || `Product ${productId}`,
          original_quantity: 0,
          new_quantity: quantity,
          change: 0,
        });
      }
    });

    // Calculate changes
    changeMap.forEach((change) => {
      change.change = change.new_quantity - change.original_quantity;
    });

    return Array.from(changeMap.values()).filter(
      (change) => change.change !== 0
    );
  };

  const stockChanges = calculateStockChanges();
  const newTotal = calculateNewTotal();
  const originalTotal = transaction.total_amount || 0;
  const totalDifference = newTotal - originalTotal;

  const handleSaveEdit = async () => {
    if (!editReason.trim()) {
      showNotification(
        "⚠️ Please provide a reason for editing this transaction.",
        "warning"
      );
      return;
    }

    if (items.length === 0) {
      showNotification(
        "⚠️ Transaction must have at least one item.",
        "warning"
      );
      return;
    }

    setSaving(true);
    showNotification("Processing transaction edit...", "info");
    try {
      const validatedItems = items.map((item) => ({
        ...item,
        id: item.id, // Ensure we keep the original item ID for updates
        quantity: Math.max(1, parseInt(item.quantity) || 1),
        unit_price: parseFloat(item.unit_price) || 0,
        total_price: parseFloat(item.total_price) || 0,
        product_id: item.product_id || item.id,
        unit_type: item.unit_type || "piece"
      }));

      const newTotal = calculateNewTotal();

      const editData = {
        sale_items: validatedItems,
        customer_name: customerName.trim() || null,
        total_amount: newTotal,
        subtotal_before_discount: newTotal, // For now, assume no complex discounts
        discount_type: transaction.discount_type || "none",
        discount_percentage: transaction.discount_percentage || 0,
        discount_amount: transaction.discount_amount || 0,
        edit_reason: editReason.trim(),
        edited_by: currentUser?.id || "admin-user",
        edited_at: new Date().toISOString(),
      };

      console.log("🔄 Submitting edit data:", editData);
      console.log("🔄 Transaction ID:", transaction.id);
      console.log("🔄 Edit reason:", editReason.trim());
      console.log("🔄 Current user:", currentUser?.id || "admin-user");

      const result = await transactionService.editTransaction(
        transaction.id,
        editData,
        editReason.trim(),
        currentUser?.id || "admin-user"
      );

      console.log("📊 Edit result:", result);

      if (result && result.success !== false) {
        // Show detailed success message with stock information
        const stockMovements = result.stock_movements || [];
        let successMessage = "✅ Transaction updated successfully!";

        if (stockMovements.length > 0) {
          const stockSummary = stockMovements
            .map(
              (movement) =>
                `${movement.product_name}: ${movement.change > 0 ? "+" : ""}${
                  movement.change
                } stock`
            )
            .join(", ");
          successMessage += ` Stock changes: ${stockSummary}`;
        }

        showNotification(successMessage, "success");
        onSave(); // Reload transactions
        onClose(); // Close modal
      } else {
        const errorMessage =
          result?.message || result?.error || "Unknown error";
        showNotification(
          "❌ Failed to update transaction: " + errorMessage,
          "error"
        );
      }
    } catch (error) {
      console.error("❌ Edit transaction error:", error);
      showNotification(
        "❌ Error updating transaction: " + (error.message || error),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Process Refund #
                {transaction.transaction_number || transaction.id.slice(-8)}
              </h3>
              <p className="text-sm text-gray-600">
                Review transaction details and confirm refund
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <svg
              className="h-6 w-6 group-hover:scale-110 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto modal-scrollbar min-h-0 p-6">
          <div className="space-y-6">
            {/* Transaction Information */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="text-base font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Transaction Details
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2 font-semibold text-blue-900">
                    ${typeof transaction.total_amount === 'number' ? transaction.total_amount.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <span className="ml-2 font-semibold text-blue-900">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Payment:</span>
                  <span className="ml-2 font-semibold text-blue-900 capitalize">
                    {transaction.payment_method || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-semibold text-blue-900 capitalize">
                    {transaction.status || 'Completed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <h5 className="font-semibold text-amber-800 mb-1">Refund Consequences</h5>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• This action will reverse the entire transaction</li>
                    <li>• Inventory quantities will be restored</li>
                    <li>• Payment will be refunded to the customer</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                Customer Information
              </h4>
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Customer Name
                </label>
                <input
                  id="customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                  placeholder="Walk-in Customer"
                />
              </div>
            </div>

            {/* Transaction Items Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.75 7.5h16.5-1.25a1.125 1.125 0 00-1.125-1.125H5.625c-.621 0-1.125.504-1.125 1.125v0z"
                  />
                </svg>
                Transaction Items
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                  {items.length} items
                </span>
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto modal-scrollbar border border-gray-200 rounded-lg p-3 bg-white">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 hover:border-gray-200 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">
                          {item.product_name ||
                            item.products?.name ||
                            `Product ${item.product_id}`}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          ₱{(item.unit_price || 0).toFixed(2)} per{" "}
                          {item.unit_type || "piece"}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label
                            htmlFor={`qty-${item.id}`}
                            className="text-sm font-medium text-gray-700"
                          >
                            Qty:
                          </label>
                          <input
                            id={`qty-${item.id}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(item.id, e.target.value)
                            }
                            className="w-20 px-3 py-2 border-2 border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          />
                        </div>
                        <div className="w-24 text-right">
                          <div className="font-semibold text-gray-900">
                            ₱{(item.total_price || 0).toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="group p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                          title="Remove item"
                        >
                          <svg
                            className="h-4 w-4 group-hover:scale-110 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Impact Analysis Section */}
            {stockChanges.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-100">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l-1-3m1 3l-1-3m-16.5 0h16.5"
                    />
                  </svg>
                  Stock Impact Analysis
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {stockChanges.length} product
                    {stockChanges.length !== 1 ? "s" : ""} affected
                  </span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {stockChanges.map((change, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-3 border border-blue-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {change.product_name}
                          </span>
                          <div className="text-xs text-gray-600 mt-1">
                            {change.original_quantity} → {change.new_quantity}{" "}
                            pieces
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold text-sm ${
                              change.change > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {change.change > 0 ? "-" : "+"}
                            {Math.abs(change.change)} stock
                          </div>
                          <div className="text-xs text-gray-500">
                            {change.change > 0 ? "Deduct" : "Restore"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <span className="font-semibold">
                      Stock changes will be applied automatically.
                    </span>{" "}
                    Increases will deduct additional stock, decreases will
                    restore stock to inventory.
                  </p>
                </div>
              </div>
            )}

            {/* Updated Total Section */}
            <div
              className={`rounded-xl p-4 border-2 ${
                totalDifference === 0
                  ? "bg-gray-50 border-gray-100"
                  : totalDifference > 0
                  ? "bg-green-50 border-green-100"
                  : "bg-orange-50 border-orange-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900 flex items-center">
                  <svg
                    className={`h-5 w-5 mr-2 ${
                      totalDifference === 0
                        ? "text-gray-600"
                        : totalDifference > 0
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Transaction Total
                </h4>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      ₱{originalTotal.toFixed(2)}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span
                      className={`text-lg font-bold ${
                        totalDifference === 0
                          ? "text-gray-900"
                          : totalDifference > 0
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      ₱{newTotal.toFixed(2)}
                    </span>
                  </div>
                  {totalDifference !== 0 && (
                    <div
                      className={`text-sm font-medium ${
                        totalDifference > 0
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {totalDifference > 0 ? "+" : ""}₱
                      {totalDifference.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Refund Reason Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Reason for Refund <span className="text-red-500">*</span>
              </h4>
              
              {/* Predefined Reason Choices */}
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {refundReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setSelectedReason(reason);
                        if (reason !== "Others") {
                          setEditReason(reason);
                          setCustomReason("");
                        } else {
                          setEditReason("");
                        }
                      }}
                      className={`p-3 text-left text-sm border-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
                        selectedReason === reason
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{reason}</span>
                        {selectedReason === reason && (
                          <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason Input (shown when "Others" is selected) */}
              {selectedReason === "Others" && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify the reason:
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setEditReason(e.target.value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-300 resize-none text-sm"
                    rows="3"
                    placeholder="Please provide a detailed explanation for this refund..."
                    required
                  />
                </div>
              )}

              {/* Additional Details (always shown for selected predefined reasons) */}
              {selectedReason && selectedReason !== "Others" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional details (optional):
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      setEditReason(selectedReason + (e.target.value.trim() ? ` - ${e.target.value}` : ""));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-300 resize-none text-sm"
                    rows="2"
                    placeholder="Add any additional details or context..."
                  />
                </div>
              )}
              
              {/* Show selected reason preview */}
              {editReason && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <div>
                      <h6 className="text-sm font-medium text-orange-800 mb-1">Refund Reason:</h6>
                      <p className="text-sm text-orange-700">{editReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="group px-5 py-2 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving || !selectedReason || (selectedReason === "Others" && !customReason.trim())}
              className="group px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-orange-800 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {saving ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing Refund...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                  <span>Process Refund</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

// PropTypes for RefundTransactionModal
RefundTransactionModal.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.string.isRequired,
    transaction_number: PropTypes.string,
    sale_items: PropTypes.array,
    customer_name: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  transactionService: PropTypes.shape({
    editTransaction: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    id: PropTypes.string,
  }),
  showNotification: PropTypes.func.isRequired,
};

}

export default EnhancedTransactionHistory;
