import React, { useState } from "react";
import { CreditCard, DollarSign, Smartphone, Receipt } from "lucide-react";
import ProductSelector from "../features/pos/components/ProductSelector";
import ShoppingCartComponent from "../features/pos/components/ShoppingCart";
import { usePOS } from "../features/pos/hooks/usePOS";
import { formatCurrency } from "../utils/formatting";

export default function POSPage() {
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
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const cartSummary = getCartSummary();

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setPaymentData({
      method: "cash",
      amount: cartSummary.total,
    });
    setShowCheckout(true);
  };

  const handlePayment = async () => {
    try {
      const transaction = await processPayment(paymentData);
      setLastTransaction(transaction);
      setShowCheckout(false);
      setShowReceipt(true);
      setPaymentData({ method: "cash", amount: 0 });
    } catch {
      // Error is handled in the hook
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setLastTransaction(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-600">Process customer transactions</p>
        </div>

        {cartItems.length > 0 && (
          <button
            onClick={handleCheckout}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Checkout ({formatCurrency(cartSummary.total)})</span>
          </button>
        )}
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
        <div>
          <ShoppingCartComponent
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Checkout</h2>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cartSummary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (12%):</span>
                    <span>{formatCurrency(cartSummary.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(cartSummary.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      setPaymentData((prev) => ({ ...prev, method: "cash" }))
                    }
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      paymentData.method === "cash"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Cash</span>
                  </button>
                  <button
                    onClick={() =>
                      setPaymentData((prev) => ({ ...prev, method: "gcash" }))
                    }
                    className={`p-3 border rounded-lg flex items-center justify-center space-x-2 transition-colors ${
                      paymentData.method === "gcash"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>GCash</span>
                  </button>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="mb-4">
                <label
                  htmlFor="payment-amount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Amount Received
                </label>
                <input
                  id="payment-amount"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {paymentData.amount >= cartSummary.total && (
                  <p className="text-sm text-green-600 mt-1">
                    Change:{" "}
                    {formatCurrency(calculateChange(paymentData.amount))}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={
                    isProcessing || paymentData.amount < cartSummary.total
                  }
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing..." : "Complete Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="text-center mb-4">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Transaction Complete
                </h2>
                <p className="text-gray-600">Receipt #{lastTransaction.id}</p>
              </div>

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
                  <p>{new Date(lastTransaction.date).toLocaleString()}</p>
                  <p>Thank you for your business!</p>
                </div>
              </div>

              <button
                onClick={closeReceipt}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                New Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
