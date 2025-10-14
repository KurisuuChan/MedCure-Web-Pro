import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDebounce } from "../hooks/useDebounce";
import unifiedTransactionService from "../services/domains/sales/transactionService";
import SimpleReceipt from "../components/ui/SimpleReceipt";
import { UnifiedSpinner } from "../components/ui/loading/UnifiedSpinner";
import { LoadingTransactionTable } from "../components/ui/loading/PharmacyLoadingStates";
import {
  Search,
  Eye,
  RotateCcw,
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
  Receipt,
  X,
} from "lucide-react";
import { formatCurrency, formatDate } from "../utils/formatting";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const TransactionHistoryPage = () => {
  const navigate = useNavigate();

  // State Management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search for better performance
  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal States
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showRefundSuccess, setShowRefundSuccess] = useState(false);
  const [refundedTransaction, setRefundedTransaction] = useState(null);

  // Refund reason states
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [finalReason, setFinalReason] = useState("");

  // Common refund reasons - reduced for faster processing
  const refundReasons = [
    "Product defective/damaged",
    "Wrong product ordered",
    "Product expired",
    "Customer changed mind",
    "Medical reasons",
  ];

  const { user } = useAuth();

  // Check if transaction is within 7-day refund policy
  const isWithinRefundPolicy = (transactionDate) => {
    const now = new Date();
    const transactionTime = new Date(transactionDate);
    const diffInDays = (now - transactionTime) / (1000 * 60 * 60 * 24);
    return diffInDays <= 7;
  };

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

    return transactions.filter((transaction) => {
      const matchesSearch =
        debouncedSearchTerm === "" ||
        transaction.id
          ?.toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.customer_name
          ?.toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.cashier_name
          ?.toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.payment_method
          ?.toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [transactions, debouncedSearchTerm]);

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
        label: "COMPLETED",
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "PENDING",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: X,
        label: "CANCELLED",
      },
      refunded: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: RotateCcw,
        label: "REFUNDED",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  // Print Transaction Report to PDF
  const handlePrintReport = () => {
    try {
      if (filteredTransactions.length === 0) {
        alert("No transactions to print");
        return;
      }

      console.log(
        "📊 [Print Report] Generating PDF for",
        filteredTransactions.length,
        "transactions"
      );

      const doc = new jsPDF();
      doc.setLanguage("en-US");

      const pageWidth = doc.internal.pageSize.getWidth();

      // Professional color scheme
      const colors = {
        primary: [37, 99, 235], // Blue-600
        text: [17, 24, 39], // Gray-900
        lightGray: [243, 244, 246], // Gray-100
        success: [34, 197, 94], // Green-500
        warning: [234, 179, 8], // Yellow-500
        danger: [239, 68, 68], // Red-500
      };

      // Header Section
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 35, "F");

      // Company Logo/Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont(undefined, "bold");
      doc.text("MedCure Pharmacy", 14, 15);

      // Report Title
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text("TRANSACTION HISTORY REPORT", 14, 25);

      // Generation Date and Filters
      doc.setFontSize(9);
      doc.text(
        `Generated: ${format(new Date(), "MMM dd, yyyy HH:mm")}`,
        pageWidth - 14,
        15,
        { align: "right" }
      );
      doc.text(
        `Filter: ${dateFilter.toUpperCase()} | Status: ${statusFilter.toUpperCase()}`,
        pageWidth - 14,
        22,
        { align: "right" }
      );

      let yPosition = 45;

      // Summary Section
      doc.setFillColor(...colors.lightGray);
      doc.rect(14, yPosition, pageWidth - 28, 8, "F");
      doc.setTextColor(...colors.text);
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("SUMMARY", 16, yPosition + 5.5);
      yPosition += 12;

      // Calculate summary metrics
      const completedTransactions = filteredTransactions.filter(
        (t) => t.status === "completed"
      );
      const totalRevenue = completedTransactions.reduce(
        (sum, t) => sum + (t.total_amount || 0),
        0
      );
      const totalDiscount = completedTransactions.reduce(
        (sum, t) => sum + (t.discount_amount || 0),
        0
      );
      const totalRefunded = filteredTransactions.filter(
        (t) => t.status === "refunded"
      ).length;

      const summaryMetrics = [
        ["Total Transactions", filteredTransactions.length],
        ["Completed Transactions", completedTransactions.length],
        [
          "Total Revenue",
          `P ${totalRevenue
            .toFixed(2)
            .replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")}`,
        ],
        [
          "Total Discounts",
          `P ${totalDiscount
            .toFixed(2)
            .replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")}`,
        ],
        ["Refunded Transactions", totalRefunded],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: summaryMetrics,
        theme: "plain",
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: colors.text,
        },
        alternateRowStyles: {
          fillColor: colors.lightGray,
        },
        margin: { left: 14, right: 14 },
      });

      // Transaction Details Table
      yPosition = doc.lastAutoTable.finalY + 10;

      doc.setFillColor(...colors.lightGray);
      doc.rect(14, yPosition, pageWidth - 28, 8, "F");
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("TRANSACTION DETAILS", 16, yPosition + 5.5);
      yPosition += 10;

      const transactionData = filteredTransactions.map((t) => [
        format(new Date(t.created_at), "MMM dd, yyyy HH:mm"),
        t.id.substring(0, 8).toUpperCase(),
        t.customer_name || "Walk-in",
        t.sale_items?.length || 0,
        `P ${(t.total_amount || 0).toFixed(2)}`,
        t.status.charAt(0).toUpperCase() + t.status.slice(1),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Date/Time", "ID", "Customer", "Items", "Amount", "Status"]],
        body: transactionData,
        theme: "plain",
        headStyles: {
          fillColor: colors.primary,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: colors.text,
        },
        alternateRowStyles: {
          fillColor: colors.lightGray,
        },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 35 },
          3: { cellWidth: 15 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
        },
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          "MedCure Pharmacy - Transaction History Report",
          14,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      // Save the PDF
      const fileName = `Transaction_Report_${format(
        new Date(),
        "yyyy-MM-dd_HHmm"
      )}.pdf`;
      doc.save(fileName);

      console.log("✅ [Print Report] PDF generated successfully:", fileName);
    } catch (error) {
      console.error("❌ [Print Report] Error generating PDF:", error);
      alert("Failed to generate report. Please try again.");
    }
  };

  // Action Handlers
  const handleViewReceipt = (transaction) => {
    console.log(
      "🧾 [TransactionHistory] Opening receipt for transaction:",
      transaction.id
    );
    console.log("🔍 [TransactionHistory] Transaction data:", transaction);
    console.log(
      "🏷️ [TransactionHistory] Transaction status:",
      transaction.status
    );
    console.log(
      "🔍 [TransactionHistory] Current showReceipt state:",
      showReceipt
    );
    console.log(
      "📋 [TransactionHistory] Current selectedTransaction:",
      selectedTransaction?.id
    );
    console.log(
      "🔍 [TransactionHistory] Raw transaction from database:",
      transaction
    );
    console.log("🔍 [TransactionHistory] PWD fields in raw transaction:", {
      pwd_senior_id: transaction.pwd_senior_id,
      pwd_senior_holder_name: transaction.pwd_senior_holder_name,
      discount_type: transaction.discount_type,
      discount_percentage: transaction.discount_percentage,
      discount_amount: transaction.discount_amount,
    });

    try {
      // Clear any existing selection first
      setSelectedTransaction(null);
      setShowReceipt(false);

      // ✅ ENHANCE TRANSACTION - Add missing discount data for proper receipt display
      const enhancedTransaction = {
        ...transaction,
        // Ensure discount fields are properly set
        discount_type:
          transaction.discount_type ||
          (transaction.discount_amount > 0 &&
          transaction.discount_percentage === 20
            ? "pwd"
            : transaction.discount_amount > 0 &&
              transaction.discount_percentage === 20
            ? "senior"
            : "none"),
        discount_percentage:
          transaction.discount_percentage ||
          (transaction.discount_amount > 0 ? 20 : 0),
        // For PWD/Senior fields, if missing but discount exists, show appropriate message
        pwd_senior_id:
          transaction.pwd_senior_id ||
          (transaction.discount_amount > 0 ? "ID Not Recorded" : null),
        pwd_senior_holder_name:
          transaction.pwd_senior_holder_name ||
          (transaction.discount_amount > 0 ? "Holder Name Not Recorded" : null),
      };

      console.log(
        "🔄 [TransactionHistory] Enhanced transaction:",
        enhancedTransaction
      );

      // Then set the enhanced transaction
      setTimeout(() => {
        setSelectedTransaction(enhancedTransaction);
        setShowReceipt(true);
        console.log(
          "✅ [TransactionHistory] Receipt modal should now be open for:",
          transaction.id
        );
      }, 100);
    } catch (error) {
      console.error("❌ [TransactionHistory] Error opening receipt:", error);
      alert("Error opening receipt. Please try again.");
    }
  };

  const handleRefundTransaction = (transaction) => {
    // Check 7-day refund policy
    if (!isWithinRefundPolicy(transaction.created_at)) {
      alert(
        "❌ Refund not allowed: This transaction is older than 7 days. Our refund policy allows refunds only within 7 days of purchase."
      );
      return;
    }

    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Transaction History
            </h1>
            <p className="text-gray-600">Loading transaction records...</p>
          </div>
          <LoadingTransactionTable rows={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md animate-shake">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4 animate-wiggle" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Transactions
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/pos")}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to POS"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Transaction History
                </h1>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Complete transaction management and reports
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrintReport}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="Print transaction report"
            >
              <Printer className="h-4 w-4" />
              <span>Print Report</span>
            </button>

            <button
              onClick={fetchTransactions}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm text-blue-600 font-medium">
                    Total Transactions
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {filteredTransactions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm text-green-600 font-medium">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {
                      filteredTransactions.filter(
                        (t) => t.status === "completed"
                      ).length
                    }
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
                    {
                      filteredTransactions.filter((t) => t.status === "pending")
                        .length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <RotateCcw className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm text-orange-600 font-medium">
                    Refunded
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {
                      filteredTransactions.filter(
                        (t) => t.status === "refunded"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm text-purple-600 font-medium">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(
                      filteredTransactions
                        .filter((t) => t.status === "completed")
                        .reduce((sum, t) => sum + (t.total_amount || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              Try adjusting your search or filter criteria to find transactions.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
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
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
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
                              #{transaction.id?.slice(-6) || "N/A"}
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
                            {transaction.customer_name || "Walk-in"}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {transaction.customer_id && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                                #{transaction.customer_id.slice(-8)}
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
                            {transaction.cashier_name || "Unknown"}
                          </span>
                        </div>
                      </td>

                      {/* Date - Hidden on tablet */}
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">
                            {new Date(
                              transaction.created_at
                            ).toLocaleDateString("en-PH", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(
                              transaction.created_at
                            ).toLocaleTimeString("en-PH", {
                              hour: "2-digit",
                              minute: "2-digit",
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
                            {transaction.payment_method || "Cash"}
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(
                                "👆 [TransactionHistory] View button clicked for:",
                                transaction.id
                              );
                              console.log(
                                "🏷️ [TransactionHistory] Transaction status:",
                                transaction.status
                              );
                              console.log(
                                "📋 [TransactionHistory] Transaction data keys:",
                                Object.keys(transaction)
                              );
                              handleViewReceipt(transaction);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1.5 rounded-md transition-all duration-150"
                            title="View Receipt"
                            type="button"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {transaction.status === "completed" && (
                            <>
                              <button
                                onClick={() =>
                                  handleRefundTransaction(transaction)
                                }
                                className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 p-1.5 rounded-md transition-all duration-150"
                                title="Process Refund"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
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
                {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredTransactions.length
                )}
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-3 py-1.5 text-sm text-gray-700 font-medium">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
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

      {/* Receipt Modal */}
      <SimpleReceipt
        transaction={selectedTransaction}
        isOpen={showReceipt}
        onClose={() => {
          console.log("🧾 [TransactionHistory] Closing receipt modal");
          setShowReceipt(false);
          setSelectedTransaction(null);
        }}
      />

      {/* Refund Transaction Modal - Scrollable */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Process Refund
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {/* Transaction Info Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <RotateCcw className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      Transaction Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Transaction ID:
                        </span>
                        <p className="text-gray-900">
                          #{editingTransaction.id?.slice(-8)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Customer:
                        </span>
                        <p className="text-gray-900">
                          {editingTransaction.customer_name ||
                            "Walk-in Customer"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Amount:
                        </span>
                        <p className="text-gray-900 font-semibold">
                          {formatCurrency(editingTransaction.total_amount)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Date:</span>
                        <p className="text-gray-900">
                          {formatDate(editingTransaction.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Section */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-amber-800 mb-1">
                      Refund Warning
                    </h5>
                    <div className="text-sm text-amber-700">
                      <p className="mb-2">Processing this refund will:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Cancel this transaction permanently</li>
                        <li>Restore all product inventory</li>
                        <li>Refunds must be processed within 7 days</li>
                        <li>Cannot be undone once confirmed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Refund Reason Selection */}
              <div className="mb-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                  <RotateCcw className="h-4 w-4 mr-2 text-gray-600" />
                  Reason for Refund <span className="text-red-500">*</span>
                </h4>

                {/* Predefined Reason Choices */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {refundReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setSelectedReason(reason);
                        if (reason !== "Others") {
                          setFinalReason(reason);
                          setCustomReason("");
                        } else {
                          setFinalReason("");
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
                          <CheckCircle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Reason Input (shown when "Others" is selected) */}
                {selectedReason === "Others" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Please specify the reason:
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => {
                        setCustomReason(e.target.value);
                        setFinalReason(e.target.value);
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-300 resize-none text-sm"
                      rows="3"
                      placeholder="Please provide a detailed explanation for this refund..."
                      required
                    />
                  </div>
                )}

                {/* Additional Details (always shown for selected predefined reasons) */}
                {selectedReason && selectedReason !== "Others" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional details (optional):
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => {
                        setCustomReason(e.target.value);
                        setFinalReason(
                          selectedReason +
                            (e.target.value.trim()
                              ? ` - ${e.target.value}`
                              : "")
                        );
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-300 resize-none text-sm"
                      rows="2"
                      placeholder="Add any additional details or context..."
                    />
                  </div>
                )}

                {/* Show selected reason preview */}
                {finalReason && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h6 className="text-sm font-medium text-orange-800 mb-1">
                          Refund Reason:
                        </h6>
                        <p className="text-sm text-orange-700">{finalReason}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedReason("");
                    setCustomReason("");
                    setFinalReason("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (!finalReason.trim()) {
                        alert("Please select a refund reason.");
                        return;
                      }

                      // Process the refund using the transaction service
                      const result =
                        await unifiedTransactionService.undoTransaction(
                          editingTransaction.id,
                          `Refund: ${finalReason}`,
                          user?.id
                        );

                      if (result.success) {
                        // Store refunded transaction for success modal
                        setRefundedTransaction({
                          ...editingTransaction,
                          refund_reason: finalReason,
                          refunded_at: new Date().toISOString(),
                          status: "refunded", // Ensure status is updated
                        });
                        setShowRefundSuccess(true);

                        // Force refresh transactions to show updated status
                        await fetchTransactions();

                        console.log(
                          "✅ [TransactionHistory] Refund completed, data refreshed"
                        );
                      } else {
                        throw new Error(
                          result.error || "Refund processing failed"
                        );
                      }
                      setShowEditModal(false);
                      setSelectedReason("");
                      setCustomReason("");
                      setFinalReason("");
                    } catch (error) {
                      console.error("Refund failed:", error);
                      alert("Refund failed: " + error.message);
                    }
                  }}
                  disabled={!finalReason.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Process Refund</span>
                </button>
              </div>
            </div>

            {/* Action Buttons - Sticky Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedReason("");
                    setCustomReason("");
                    setFinalReason("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Success Modal */}
      {showRefundSuccess && refundedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold">Refund Successful!</h3>
                  <p className="text-green-100 text-sm mt-1">
                    Transaction has been refunded
                  </p>
                </div>
              </div>
            </div>

            {/* Refund Details */}
            <div className="p-6 space-y-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <Receipt className="h-4 w-4 mr-2" />
                  Refund Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-green-700">
                      #{refundedTransaction.id?.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Amount:</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(refundedTransaction.total_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-700 capitalize">
                      {refundedTransaction.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Reason:</span>
                    <span className="font-medium text-gray-700">
                      {refundedTransaction.refund_reason}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed At:</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(refundedTransaction.refunded_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Restoration Notice */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Stock Restored</p>
                    <p className="text-blue-700 text-sm mt-1">
                      All items from this transaction have been returned to
                      inventory.
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Info if available */}
              {refundedTransaction.customer_name && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-2">
                    <User className="h-5 w-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">
                        Customer Notified
                      </p>
                      <p className="text-gray-700 text-sm mt-1">
                        {refundedTransaction.customer_name}
                        {refundedTransaction.customer_phone &&
                          ` • ${refundedTransaction.customer_phone}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowRefundSuccess(false);
                    setRefundedTransaction(null);
                    // Also open the receipt for the refunded transaction
                    setSelectedTransaction(refundedTransaction);
                    setShowReceipt(true);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Receipt</span>
                </button>
                <button
                  onClick={() => {
                    setShowRefundSuccess(false);
                    setRefundedTransaction(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
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
