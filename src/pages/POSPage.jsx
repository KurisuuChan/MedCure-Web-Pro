import React, { useState, useEffect } from "react";
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Receipt,
  History,
  User,
  Clock,
  X,
  ShoppingCart,
} from "lucide-react";
import ProductSelector from "../features/pos/components/ProductSelector";
import ShoppingCartComponent from "../features/pos/components/ShoppingCart";
import { usePOS } from "../features/pos/hooks/usePOS";
import { useAuth } from "../hooks/useAuth";
import "../components/ui/ScrollableModal.css";
import { formatCurrency } from "../utils/formatting";
import { formatDate } from "../utils/dateTime";
import { salesService } from "../services/salesService";

export default function POSPage() {
  const { user } = useAuth();
  const {
    cartItems,
    availableProducts,
    isProcessing,
    error,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    processPayment,
    calculateChange,
    getCartSummary,
    clearError,
  } = usePOS();

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: "cash",
    amount: 0,
    customer_name: "",
    customer_phone: "",
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const cartSummary = getCartSummary();

  // Load transaction history
  useEffect(() => {
    const loadHistory = async () => {
      if (showTransactionHistory) {
        setLoadingHistory(true);
        try {
          console.log("📊 Loading transaction history...");
          const history = await salesService.getTodaysTransactions();
          console.log("📊 Received transaction history:", history);
          setTransactionHistory(history);
        } catch (error) {
          console.error("Failed to load transaction history:", error);
        } finally {
          setLoadingHistory(false);
        }
      }
    };
    loadHistory();
  }, [showTransactionHistory]); // Remove the length dependency to always reload

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setPaymentData({
      method: "cash",
      amount: cartSummary.total,
      customer_name: "",
      customer_phone: "",
    });
    setShowCheckout(true);
  };

  const handlePayment = async () => {
    try {
      // Ensure we have user authentication for the cashier ID
      const paymentDataWithCashier = {
        ...paymentData,
        cashierId: user?.id || null,
      };

      console.log(
        "💳 POS Page - Processing payment with data:",
        paymentDataWithCashier
      );

      const transaction = await processPayment(paymentDataWithCashier);
      setLastTransaction(transaction);
      setShowCheckout(false);
      setShowReceipt(true);
      setPaymentData({
        method: "cash",
        amount: 0,
        customer_name: "",
        customer_phone: "",
      });
      // Refresh transaction history if modal is open
      if (showTransactionHistory) {
        console.log("🔄 Refreshing transaction history after payment...");
        const history = await salesService.getTodaysTransactions();
        console.log("🔄 Updated transaction history:", history);
        setTransactionHistory(history);
      }
    } catch (error) {
      console.error("❌ Payment processing error:", error);
      // Error is handled in the hook
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setLastTransaction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <ShoppingCart className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>Point of Sale</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </h1>
              <p className="text-gray-600">
                Process customer transactions securely and efficiently
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Transaction History Button */}
            <button
              onClick={() => setShowTransactionHistory(true)}
              className="group flex items-center space-x-2 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
            >
              <History className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Today's Transactions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selector */}
        <div className="lg:col-span-2">
          <ProductSelector
            products={availableProducts}
            onAddToCart={handleAddToCart}
            cartItems={cartItems}
          />
        </div>

        {/* Shopping Cart */}
        <div className="space-y-4">
          <ShoppingCartComponent
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />

          {/* Checkout Button */}
          {cartItems.length > 0 && (
            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 font-medium text-lg shadow-lg hover:shadow-xl"
            >
              <CreditCard className="h-5 w-5" />
              <span>
                Proceed to Checkout - {formatCurrency(cartSummary.total)}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Payment Header - Sticky */}
            <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Process Payment
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Complete your transaction
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scrollable-modal-content">
              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <Receipt className="h-5 w-5 mr-2 text-gray-600" />
                      Order Summary
                    </h3>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                      {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(cartSummary.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">VAT (12%)</span>
                      <span className="font-medium">
                        {formatCurrency(cartSummary.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-t border-gray-300 font-semibold text-base">
                      <span>Total</span>
                      <span className="text-green-600">
                        {formatCurrency(cartSummary.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setPaymentData((prev) => ({ ...prev, method: "cash" }))
                      }
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        paymentData.method === "cash"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <DollarSign className="h-5 w-5" />
                        <span className="font-medium">Cash</span>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setPaymentData((prev) => ({ ...prev, method: "gcash" }))
                      }
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        paymentData.method === "gcash"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Smartphone className="h-5 w-5" />
                        <span className="font-medium">GCash</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-lg font-medium text-gray-900 mb-3">
                    Amount Received
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg">₱</span>
                    </div>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      step="0.01"
                      min={cartSummary.total}
                      className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="0.00"
                    />
                  </div>

                  {paymentData.amount >= cartSummary.total && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 font-medium text-center">
                        Change:{" "}
                        {formatCurrency(calculateChange(paymentData.amount))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-3">
                    Customer Information (Optional)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Customer name"
                      value={paymentData.customer_name}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          customer_name: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={paymentData.customer_phone}
                      onChange={(e) =>
                        setPaymentData((prev) => ({
                          ...prev,
                          customer_phone: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons - Sticky Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={
                      isProcessing || paymentData.amount < cartSummary.total
                    }
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        <span>Complete Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Receipt Header - Sticky */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="text-center">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Transaction Complete
                </h2>
                <p className="text-gray-600">Receipt #{lastTransaction.id}</p>
              </div>
            </div>

            {/* Receipt Content - Scrollable */}
            <div className="flex-1 overflow-y-auto scrollable-modal-content p-6">
              {/* Receipt Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-sm">
                <div className="text-center border-b pb-2 mb-2">
                  <h3 className="font-bold">MEDCURE PRO</h3>
                  <p className="text-xs">Pharmacy Management System</p>
                </div>

                <div className="space-y-1 border-b pb-2 mb-2">
                  {lastTransaction.items.map((item) => (
                    <div
                      key={`${item.id}-${item.quantity}`}
                      className="flex justify-between"
                    >
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(lastTransaction.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(lastTransaction.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(lastTransaction.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment ({lastTransaction.payment.method}):</span>
                    <span>
                      {formatCurrency(lastTransaction.payment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>
                      {formatCurrency(lastTransaction.payment.change)}
                    </span>
                  </div>
                </div>

                <div className="text-center border-t pt-2 mt-2 text-xs">
                  <p>
                    {lastTransaction.date
                      ? new Date(lastTransaction.date).toLocaleString()
                      : new Date().toLocaleString()}
                  </p>
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>

            {/* Receipt Footer - Sticky */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={closeReceipt}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <History className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Transaction History
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Sales for {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTransactionHistory(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-white max-h-[calc(90vh-120px)] overflow-y-auto scrollable-modal-content">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-b-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <History className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Loading Transactions
                    </h3>
                    <p className="text-gray-600">
                      Fetching today's sales data...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {transactionHistory.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <Clock className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        No Transactions Today
                      </h3>
                      <p className="text-gray-600 text-lg max-w-md mx-auto">
                        Start processing sales to see transaction history here.
                        Your completed transactions will appear in this view.
                      </p>
                      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-sm mx-auto">
                        <p className="text-sm text-blue-800 font-medium">
                          💡 Tip: Completed sales will automatically appear here
                          with full details.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Summary Stats */}
                      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                              <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Transactions
                              </p>
                              <p className="text-xl font-semibold text-gray-900">
                                {transactionHistory.length}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Total Revenue
                              </p>
                              <p className="text-xl font-semibold text-gray-900">
                                {formatCurrency(
                                  transactionHistory.reduce(
                                    (sum, t) => sum + (t.total || 0),
                                    0
                                  )
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 text-gray-600 p-2 rounded-lg">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                Latest Sale
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {transactionHistory[0]
                                  ? formatDate(transactionHistory[0].created_at)
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transaction List */}
                      <div className="space-y-3">
                        {transactionHistory.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                                  <Receipt className="h-4 w-4" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    Transaction #
                                    {transaction.id?.slice(-8) || "N/A"}
                                  </h4>
                                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {formatDate(transaction.created_at)}
                                      </span>
                                    </span>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                                      {transaction.payment_method?.toUpperCase() ||
                                        "CASH"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(transaction.total || 0)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transaction.items?.length || 0} item
                                  {(transaction.items?.length || 0) !== 1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            </div>

                            {/* Transaction Items */}
                            {transaction.items &&
                              transaction.items.length > 0 && (
                                <div className="border-t border-gray-100 pt-3">
                                  <div className="space-y-1">
                                    {transaction.items
                                      .slice(0, 3)
                                      .map((item, itemIndex) => (
                                        <div
                                          key={itemIndex}
                                          className="flex justify-between text-sm"
                                        >
                                          <span className="text-gray-600">
                                            {item.name} x{item.quantity}
                                          </span>
                                          <span className="text-gray-900">
                                            {formatCurrency(item.subtotal || 0)}
                                          </span>
                                        </div>
                                      ))}
                                    {transaction.items.length > 3 && (
                                      <p className="text-xs text-gray-500 italic">
                                        +{transaction.items.length - 3} more
                                        item
                                        {transaction.items.length - 3 !== 1
                                          ? "s"
                                          : ""}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
