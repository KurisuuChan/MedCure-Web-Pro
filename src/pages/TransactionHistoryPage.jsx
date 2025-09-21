import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import unifiedTransactionService from "../services/domains/sales/transactionService";
import SimpleReceipt from "../components/ui/SimpleReceipt";
import { 
  Search,
  Eye,
  Edit,
  Undo,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User,
  Clock,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  X
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatting";

const TransactionHistoryPage = () => {
  // State Management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal States
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [undoConfirm, setUndoConfirm] = useState(null);
  
  const { user } = useAuth();

  // Fetch transactions with enhanced error handling
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filter options
      const options = {
        limit: 100, // Get more for client-side filtering
      };

      if (statusFilter !== "all") {
        options.status = statusFilter;
      }

      // Add date filtering
      const now = new Date();
      if (dateFilter === "today") {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        options.date_from = startOfDay.toISOString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        options.date_from = weekAgo.toISOString();
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        options.date_from = monthAgo.toISOString();
      }

      console.log("🔄 Fetching transactions with options:", options);
      const data = await unifiedTransactionService.getTransactions(options);
      
      if (Array.isArray(data)) {
        setTransactions(data);
        console.log(`✅ Loaded ${data.length} transactions`);
      } else {
        console.warn("⚠️ Unexpected data format:", data);
        setTransactions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
      setError(err.message || "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    
    return transactions.filter(transaction => {
      const matchesSearch = searchTerm === "" || 
        transaction.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.cashier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.payment_method?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [transactions, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "COMPLETED"
      },
      pending: {
        bg: "bg-yellow-100", 
        text: "text-yellow-800",
        icon: Clock,
        label: "PENDING"
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800", 
        icon: X,
        label: "CANCELLED"
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  // Action Handlers
  const handleViewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  const handleUndoTransaction = (transaction) => {
    setUndoConfirm(transaction);
  };

  const confirmUndo = async () => {
    if (!undoConfirm) return;
    
    try {
      setLoading(true);
      const reason = prompt("Please provide a reason for undoing this transaction:");
      if (!reason) return;

      const result = await unifiedTransactionService.undoTransaction(
        undoConfirm.id,
        reason,
        user?.id || "admin-user"
      );

      if (result.success) {
        alert("✅ Transaction undone successfully and stock restored!");
        await fetchTransactions(); // Refresh the list
      } else {
        throw new Error(result.message || "Failed to undo transaction");
      }
    } catch (error) {
      console.error("❌ Undo failed:", error);
      alert(`Undo failed: ${error.message}`);
    } finally {
      setLoading(false);
      setUndoConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Loading transactions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Transactions</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-sm text-gray-600">Complete transaction management and reports</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (filteredTransactions.length === 0) {
                    alert('No transactions to print');
                    return;
                  }
                  alert(`Print Report: ${filteredTransactions.length} transactions would be printed as a detailed report`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Print transaction report"
              >
                <Printer className="h-4 w-4" />
                Print Report
              </button>
              
              <button
                onClick={fetchTransactions}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
                <option value="all">All time</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
                    <p className="text-2xl font-bold text-blue-900">{filteredTransactions.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm text-green-600 font-medium">Completed</p>
                    <p className="text-2xl font-bold text-green-900">
                      {filteredTransactions.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {filteredTransactions.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(
                        filteredTransactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + (t.total_amount || 0), 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden backdrop-blur-sm">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600 max-w-sm mx-auto">Try adjusting your search or filter criteria to find transactions.</p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          Transaction
                        </div>
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          Customer
                        </div>
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden md:table-cell">
                        Cashier
                      </th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Date
                        </div>
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          Amount
                        </div>
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {paginatedTransactions.map((transaction, index) => (
                      <tr 
                        key={transaction.id} 
                        className={`border-b border-gray-100 hover:bg-blue-50/30 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                      >
                        {/* Transaction - Compact design */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {String(transaction.id).slice(-2)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                #{transaction.id?.slice(-6) || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {transaction.sale_items?.length || 0} items
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Customer - Compact */}
                        <td className="px-3 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                              {transaction.customer_name || 'Walk-in'}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {transaction.customer_type && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium ${
                                  transaction.customer_type === 'new' 
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : transaction.customer_type === 'old'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {transaction.customer_type === 'new' ? '🆕' : 
                                   transaction.customer_type === 'old' ? '🔄' : '👤'}
                                </span>
                              )}
                              {/* Show mobile info */}
                              <div className="text-xs text-gray-500 md:hidden">
                                {transaction.cashier_name?.slice(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cashier - Hidden on mobile */}
                        <td className="px-3 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-3 w-3 text-gray-600" />
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-20">
                              {transaction.cashier_name || 'Unknown'}
                            </span>
                          </div>
                        </td>

                        {/* Date - Hidden on tablet */}
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <div className="text-sm text-gray-700">
                            <div className="font-medium">
                              {new Date(transaction.created_at).toLocaleDateString('en-PH', { 
                                month: 'short', day: 'numeric' 
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.created_at).toLocaleTimeString('en-PH', { 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Amount - Right aligned */}
                        <td className="px-3 py-3 text-right">
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrency(transaction.total_amount || 0)}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {transaction.payment_method || 'Cash'}
                            </div>
                          </div>
                        </td>

                        {/* Status - Center aligned */}
                        <td className="px-3 py-3 text-center">
                          {getStatusBadge(transaction.status)}
                        </td>

                        {/* Actions - Compact buttons */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => handleViewReceipt(transaction)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1.5 rounded-md transition-all duration-150"
                              title="View Receipt"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            
                            {transaction.status === 'completed' && (
                              <>
                                <button
                                  onClick={() => handleEditTransaction(transaction)}
                                  className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 p-1.5 rounded-md transition-all duration-150"
                                  title="Edit"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => handleUndoTransaction(transaction)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1.5 rounded-md transition-all duration-150"
                                  title="Undo"
                                >
                                  <Undo className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Responsive Pagination */}
              <div className="bg-white px-3 sm:px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-gray-700 text-center sm:text-left">
                  <span className="hidden sm:inline">Showing </span>
                  {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredTransactions.length)} 
                  <span className="hidden sm:inline"> of </span>
                  <span className="sm:hidden">/</span>
                  {filteredTransactions.length}
                  <span className="hidden sm:inline"> transactions</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <SimpleReceipt 
        transaction={selectedTransaction} 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
      />

      {/* Edit Transaction Modal - Placeholder for now */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Transaction</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center py-8">
                <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Edit Transaction</h4>
                <p className="text-gray-600 mb-4">
                  Transaction ID: {editingTransaction.id?.slice(-8)}
                </p>
                <p className="text-sm text-gray-500">
                  Edit functionality is available in the enhanced transaction service.
                  This modal can be expanded with full editing capabilities.
                </p>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {undoConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Undo className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Undo Transaction</h3>
                  <p className="text-sm text-gray-600">This action cannot be reversed</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Transaction #{undoConfirm.id?.slice(-8)}</div>
                  <div className="text-gray-600">Customer: {undoConfirm.customer_name || 'Walk-in Customer'}</div>
                  <div className="text-gray-600">Amount: {formatCurrency(undoConfirm.total_amount)}</div>
                  <div className="text-gray-600">Date: {formatDate(undoConfirm.created_at)}</div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs font-bold">!</span>
                  </div>
                  <div className="text-sm text-amber-800">
                    <div className="font-medium mb-1">Warning: This will:</div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Restore product inventory</li>
                      <li>Cancel the transaction</li>
                      <li>Cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setUndoConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUndo}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Undo Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;
