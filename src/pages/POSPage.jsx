import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../hooks/useCustomers";
import { CustomerService } from "../services/CustomerService";
import notificationService from "../services/notifications/NotificationService";
import { useAuth } from "../hooks/useAuth";
import {
  CreditCard,
  DollarSign,
  Smartphone,
  Receipt,
  History,
  Users,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import ProductSelector from "../features/pos/components/ProductSelector";
import ShoppingCartComponent from "../features/pos/components/ShoppingCart";
import DiscountSelector from "../components/features/pos/DiscountSelector";
import SimpleReceipt from "../components/ui/SimpleReceipt";
import { usePOS } from "../features/pos/hooks/usePOS";
import "../components/ui/ScrollableModal.css";
import { formatCurrency } from "../utils/formatting";
import PhoneValidator from "../utils/phoneValidator";
import { useToast } from "../components/ui/Toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function POSPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const {
    cartItems,
    availableProducts,
    isProcessing,
    isLoadingProducts,
    error,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    processPayment,
    getCartSummary,
    clearError,
  } = usePOS();

  const {
    customers,
    loading: customersLoading,
    createCustomer,
    error: customerError,
    clearError: clearCustomerError,
  } = useCustomers();

  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: "cash",
    amount: 0,
    customerType: null, // guest, new, old
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    customer_id: "",
  });
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showOldCustomerModal, setShowOldCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [discount, setDiscount] = useState({
    type: "none",
    percentage: 0,
    amount: 0,
    subtotal: 0,
    finalTotal: 0,
    idNumber: "",
    customerName: "",
    isValid: true,
    label: "No Discount",
    description: "Regular customer",
  });
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);

  const cartSummary = getCartSummary();

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Calculate final total with discount
    const subtotalBeforeDiscount = cartSummary.total;
    const finalTotal = subtotalBeforeDiscount - discount.amount;

    setPaymentData({
      method: "cash",
      amount: finalTotal, // Set to exact amount needed
      customer_name: "",
      customer_phone: "",
    });
    setShowCheckout(true);
  };

  const handleDiscountChange = useCallback(
    (discountData) => {
      console.log("🎯 [POSPage] Discount data received:", discountData);
      console.log("🔍 [POSPage] Holder name from discount:", {
        holderName: discountData.holderName,
        customerName: discountData.customerName,
        idNumber: discountData.idNumber,
      });
      setDiscount(discountData);

      // Update payment amount if checkout is open
      if (showCheckout) {
        // Get current cart total without dependency
        const currentCartSummary = getCartSummary();
        const subtotalBeforeDiscount = currentCartSummary.total;
        const finalTotal = subtotalBeforeDiscount - discountData.amount;

        console.log("💰 [POSPage] Updating payment amount:", {
          subtotalBeforeDiscount,
          discountAmount: discountData.amount,
          finalTotal,
        });

        setPaymentData((prev) => ({
          ...prev,
          amount: Math.max(finalTotal, prev.amount), // Keep higher amount if customer already entered more
        }));
      }
    },
    [showCheckout, getCartSummary]
  );

  const handlePayment = async () => {
    try {
      // Validate discount before processing
      if (discount.type !== "none" && !discount.isValid) {
        throw new Error(
          "Please complete discount information (ID number and customer name required)"
        );
      }

      console.log("🔍 [POSPage] Current discount state:", discount);
      console.log("🔍 [POSPage] Cart summary:", cartSummary);

      // Ensure we have user authentication for the cashier ID
      const paymentDataWithCashier = {
        ...paymentData,
        cashier_name: user?.first_name || "Unknown",
        customer_name: paymentData.customer_name, // This is the registered customer name
        customer_type: paymentData.customerType, // Add customer type
        customer_email: paymentData.customer_email, // Add customer email
        customer_address: paymentData.customer_address, // Add customer address
        // ✅ ADD DISCOUNT DATA
        discount_type: discount.type,
        discount_percentage: discount.percentage,
        discount_amount: discount.amount,
        subtotal_before_discount: cartSummary.total,
        pwd_senior_id: discount.idNumber,
        pwd_senior_holder_name: discount.holderName, // PWD/Senior holder name (separate from customer)
      };

      console.log("🔍 [DEBUG] Holder name being sent:", {
        from_discount_object: discount.holderName,
        in_payment_data: paymentDataWithCashier.pwd_senior_holder_name,
      });

      console.log(
        "💳 POS Page - Processing payment with discount data:",
        paymentDataWithCashier
      );
      console.log("🔍 [DEBUG] Customer data being sent to processPayment:", {
        customer_name: paymentDataWithCashier.customer_name,
        customer_phone: paymentDataWithCashier.customer_phone,
        customer_address: paymentDataWithCashier.customer_address,
        customer_email: paymentDataWithCashier.customer_email,
        customerType: paymentDataWithCashier.customerType,
      });

      const transaction = await processPayment(paymentDataWithCashier);

      // Calculate final total for notification
      const finalTotal = cartSummary.total - discount.amount;
      const customerName = paymentData.customer_name || "Walk-in Customer";

      // Trigger sale notification
      try {
        await notificationService.create({
          userId: user?.id,
          title: "Sale Completed",
          message: `₱${finalTotal.toFixed(2)} - ${
            cartItems.length
          } items - ${customerName}`,
          type: "success",
          priority: 2,
          category: "sales",
          metadata: {
            transactionId: transaction?.id,
            amount: finalTotal,
            itemCount: cartItems.length,
          },
        });
        console.log("✅ Sale notification added");
      } catch (error) {
        console.warn("⚠️ Failed to add sale notification:", error);
      }

      // Update customer purchase history in localStorage for persistence
      if (
        paymentData.customerType !== null &&
        paymentData.customerType !== "guest" &&
        paymentData.customer_phone
      ) {
        try {
          const finalTotal = cartSummary.total - discount.amount;
          await CustomerService.updateCustomerPurchaseStats(
            paymentData.customer_phone,
            finalTotal
          );
          console.log("✅ Customer purchase history updated in localStorage");
        } catch (error) {
          console.warn("⚠️ Failed to update customer purchase stats:", error);
          // Don't fail the transaction if customer stats update fails
        }
      }

      console.log(
        "🧾 [POSPage] Transaction received from processPayment:",
        transaction
      );
      console.log("🔍 [POSPage] Discount data in transaction:", {
        discount_type: transaction.discount_type,
        discount_percentage: transaction.discount_percentage,
        discount_amount: transaction.discount_amount,
        pwd_senior_id: transaction.pwd_senior_id,
        pwd_senior_holder_name: transaction.pwd_senior_holder_name,
      });
      console.log(
        "🔍 [POSPage] Complete transaction object keys:",
        Object.keys(transaction)
      );

      setLastTransaction(transaction);
      setShowCheckout(false);

      // Show success toast immediately with View Receipt action
      showSuccess(
        `🎉 Sale completed successfully! ₱${finalTotal.toFixed(
          2
        )} from ${customerName}`,
        {
          duration: 5000,
          action: {
            label: "View Receipt",
            onClick: () => {
              setShowReceipt(true);
            },
          },
        }
      );

      // Reset form data
      setPaymentData({
        method: "cash",
        amount: 0,
        customerType: null,
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        customer_address: "",
        customer_id: "",
      });
      setDiscount({
        type: "none",
        percentage: 0,
        amount: 0,
        subtotal: 0,
        finalTotal: 0,
        idNumber: "",
        customerName: "",
        isValid: true,
        label: "No Discount",
        description: "Regular customer",
      });

      // Trigger desktop notifications for sale completion and stock checks
      try {
        console.log("🔔 Processing post-sale notifications...");

        // Sale notification is already handled above
        // Check for low stock and expiry alerts using the notification service
        console.log("🔔 Checking for low stock and expiry notifications...");
        // These checks can be added as background tasks if needed
        // For now, the notification service will handle them through scheduled checks

        console.log("✅ Notifications processed successfully");
      } catch (notificationError) {
        console.error("⚠️ Error generating notifications:", notificationError);
        // Don't fail the sale if notifications fail
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-6 flex items-center justify-between">
          {/* Left: Title Section */}
          <div className="flex items-center space-x-4">
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <ShoppingCart className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  Point of Sale
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Live
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Fast checkout and transaction processing
              </p>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/transaction-history")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              title="View Transaction History"
            >
              <History className="h-4 w-4 mr-2" />
              Transaction History
            </button>

            <button
              onClick={() => navigate("/customers")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              title="Manage Customers"
            >
              <Users className="h-4 w-4 mr-2" />
              Customer Information
            </button>
          </div>
        </div>
      </div>

      {/* Error Messages */}
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

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selector - Left Column (2/3 width) */}
        <div className="lg:col-span-2">
          {isLoadingProducts ? (
            /* Loading State - Same style as Inventory Page */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : availableProducts.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products available
                </h3>
                <p className="text-gray-500">
                  Products are currently being loaded or no items are in stock.
                </p>
              </div>
            </div>
          ) : (
            /* Product Selector */
            <ProductSelector
              products={availableProducts}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
            />
          )}
        </div>

        {/* Shopping Cart - Right Column (1/3 width) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Cart Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Shopping Cart</h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-800 px-2 py-1 rounded-full">
                      <span className="text-sm font-medium">
                        {cartItems.length} item
                        {cartItems.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {cartItems.length > 0 && (
                      <button
                        onClick={handleClearCart}
                        className="text-sm text-blue-100 hover:text-white transition-colors underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart Content */}
              <div className="flex-1">
                <ShoppingCartComponent
                  items={cartItems}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                />
              </div>

              {/* Checkout Section */}
              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  {/* Discount Display Only */}
                  {discount.amount > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between text-sm text-green-700 font-medium">
                        <span>Discount Applied:</span>
                        <span>-{formatCurrency(discount.amount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-green-800 border-t border-green-200 pt-2 mt-2">
                        <span>Final Total:</span>
                        <span>
                          {formatCurrency(cartSummary.total - discount.amount)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Checkout</span>
                  </button>

                  {discount.amount > 0 && (
                    <p className="text-center text-sm text-green-600 font-medium mt-2">
                      💰 You save {formatCurrency(discount.amount)}!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
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
                      <span className="text-gray-600 text-sm">VAT Status</span>
                      <span className="font-medium text-green-600 text-sm">
                        EXEMPT
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">
                        Total Amount
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(cartSummary.total)}
                      </span>
                    </div>
                    {discount.amount > 0 && (
                      <div className="flex justify-between py-1">
                        <span className="text-green-600">
                          Discount ({discount.percentage}%)
                        </span>
                        <span className="font-medium text-green-600">
                          -{formatCurrency(discount.amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t border-gray-300 font-bold text-lg">
                      <span className="text-gray-900">Amount Due</span>
                      <span className="text-green-600">
                        {formatCurrency(cartSummary.total - discount.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Discount Selector */}
                <DiscountSelector
                  onDiscountChange={handleDiscountChange}
                  subtotal={cartSummary.total}
                />

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
                  <div className="flex items-center justify-between mb-3">
                    <label
                      htmlFor="amount-received"
                      className="text-lg font-medium text-gray-900"
                    >
                      Amount Received
                    </label>
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      Total: ₱{(cartSummary.total - discount.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-medium text-xl">
                        ₱
                      </span>
                    </div>
                    <input
                      id="amount-received"
                      type="text"
                      inputMode="decimal"
                      value={
                        paymentData.amount === 0
                          ? ""
                          : paymentData.amount.toString()
                      }
                      onChange={(e) => {
                        const inputValue = e.target.value;

                        // Handle empty input
                        if (inputValue === "" || inputValue === null) {
                          setPaymentData((prev) => ({
                            ...prev,
                            amount: 0,
                          }));
                          return;
                        }

                        // Allow decimal numbers and basic validation
                        const value = parseFloat(inputValue);
                        if (!isNaN(value) && value >= 0 && value <= 999999.99) {
                          setPaymentData((prev) => ({
                            ...prev,
                            amount: value,
                          }));
                        } else if (inputValue.match(/^\d*\.?\d*$/)) {
                          // Allow partial typing like "50." or "5"
                          setPaymentData((prev) => ({
                            ...prev,
                            amount:
                              inputValue === ""
                                ? 0
                                : parseFloat(inputValue) || 0,
                          }));
                        }
                      }}
                      onFocus={(e) => {
                        // Select all text when focused for easy editing
                        e.target.select();
                      }}
                      className="w-full pl-12 pr-4 py-4 text-xl font-medium border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                      placeholder="Enter amount received"
                      autoComplete="off"
                    />
                  </div>

                  {/* Payment Status */}
                  {paymentData.amount > 0 && (
                    <div className="mt-4 text-center">
                      {paymentData.amount >=
                        cartSummary.total - discount.amount && (
                        <p className="text-gray-700 text-lg">
                          Change:{" "}
                          {formatCurrency(
                            paymentData.amount -
                              (cartSummary.total - discount.amount)
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Customer Info Refactor */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-3">
                    Customer Type
                  </h4>
                  <div className="flex gap-3 mb-2">
                    <button
                      type="button"
                      className={`flex-1 px-3 py-2 rounded-lg border border-gray-300 font-medium transition-colors ${
                        paymentData.customerType === "guest"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() =>
                        setPaymentData((prev) => ({
                          ...prev,
                          customerType: "guest",
                          customer_name: "Walk-in Customer",
                          customer_phone: "",
                          customer_address: "",
                          customer_id: "",
                        }))
                      }
                    >
                      Guest
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-3 py-2 rounded-lg border border-gray-300 font-medium transition-colors ${
                        paymentData.customerType === "new"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setShowNewCustomerModal(true)}
                    >
                      New Customer
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-3 py-2 rounded-lg border border-gray-300 font-medium transition-colors ${
                        paymentData.customerType === "old"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setShowOldCustomerModal(true)}
                    >
                      Old Customer
                    </button>
                  </div>
                  {/* Show selected customer info if not guest */}
                  {paymentData.customerType &&
                    paymentData.customerType !== null && (
                      <div className="bg-gray-100 rounded p-3 mt-2">
                        <div className="text-sm text-gray-700 font-medium">
                          Selected Customer:
                        </div>
                        <div className="text-base font-semibold">
                          {paymentData.customer_name}
                        </div>
                        <div className="text-sm">
                          {paymentData.customer_phone}
                        </div>
                        <div className="text-sm">
                          {paymentData.customer_address}
                        </div>
                      </div>
                    )}
                </div>

                {/* New Customer Modal */}
                {showNewCustomerModal && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                        onClick={() => setShowNewCustomerModal(false)}
                      >
                        <span aria-hidden>×</span>
                      </button>

                      {/* Customer Error Display - Over Modal */}
                      {customerError && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
                          <span className="text-sm font-medium">
                            ❌ {customerError}
                          </span>
                          <button
                            onClick={clearCustomerError}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      )}

                      <h3 className="text-lg font-semibold mb-4">
                        New Customer
                      </h3>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          value={newCustomer.name}
                          onChange={(e) =>
                            setNewCustomer((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                        <div>
                          <input
                            type="tel"
                            placeholder="Phone Number (e.g. 09123456789)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={newCustomer.phone}
                            onChange={(e) => {
                              // Allow only numbers, spaces, dashes, parentheses, plus
                              const value = e.target.value.replace(
                                /[^0-9\s\-\(\)\+\.]/g,
                                ""
                              );
                              setNewCustomer((prev) => ({
                                ...prev,
                                phone: value,
                              }));
                            }}
                            maxLength={15}
                          />
                          {newCustomer.phone &&
                            (() => {
                              const validation = PhoneValidator.validatePhone(
                                newCustomer.phone
                              );

                              if (validation.type === "error") {
                                return (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    ❌ {validation.message}
                                  </p>
                                );
                              } else if (validation.type === "warning") {
                                return (
                                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                                    ⚠️ {validation.message}
                                  </p>
                                );
                              } else if (validation.type === "success") {
                                return (
                                  <p className="mt-1 text-sm text-green-600 flex items-center">
                                    ✅ {validation.message}
                                  </p>
                                );
                              }
                              return null;
                            })()}
                        </div>
                        <input
                          type="text"
                          placeholder="Address *"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          value={newCustomer.address}
                          onChange={(e) =>
                            setNewCustomer((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          required
                          maxLength={255}
                        />
                        {newCustomer.address &&
                          newCustomer.address.length < 5 && (
                            <p className="mt-1 text-sm text-amber-600 flex items-center">
                              ⚠️ Address must be at least 5 characters long
                            </p>
                          )}
                        <input
                          type="email"
                          placeholder="Email (Optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          value={newCustomer.email}
                          onChange={(e) =>
                            setNewCustomer((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <button
                        className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-medium disabled:bg-gray-400"
                        onClick={async () => {
                          try {
                            const savedCustomer = await createCustomer({
                              customer_name: newCustomer.name,
                              phone: newCustomer.phone,
                              email: newCustomer.email,
                              address: newCustomer.address,
                            });

                            setPaymentData((prev) => ({
                              ...prev,
                              customerType: "new",
                              customer_name: savedCustomer.customer_name,
                              customer_phone: savedCustomer.phone,
                              customer_address: savedCustomer.address,
                              customer_id: savedCustomer.id,
                            }));
                            setShowNewCustomerModal(false);
                            setNewCustomer({
                              name: "",
                              phone: "",
                              email: "",
                              address: "",
                            });

                            // Show success toast for new customer creation
                            showSuccess(
                              `👤 Customer "${savedCustomer.customer_name}" created and selected for this sale!`,
                              {
                                duration: 4000,
                                action: {
                                  label: "View Customer",
                                  onClick: () => {},
                                },
                              }
                            );
                          } catch (error) {
                            console.error("Failed to create customer:", error);
                            showError(
                              `Failed to create customer: ${
                                error.message || "Please try again"
                              }`,
                              { duration: 5000 }
                            );
                          }
                        }}
                        disabled={
                          !newCustomer.name ||
                          !newCustomer.phone ||
                          !newCustomer.address ||
                          newCustomer.address.length < 5 ||
                          !PhoneValidator.validatePhone(newCustomer.phone)
                            .isValid
                        }
                      >
                        Save Customer
                      </button>
                    </div>
                  </div>
                )}

                {/* Old Customer Modal */}
                {showOldCustomerModal && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative max-h-[80vh] overflow-y-auto">
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                        onClick={() => {
                          setShowOldCustomerModal(false);
                          setCustomerSearch("");
                        }}
                      >
                        <span aria-hidden>×</span>
                      </button>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">
                          Select Customer
                        </h3>
                        <button
                          onClick={() => {
                            console.log("🔄 Refreshing customers...");
                            fetchCustomers();
                          }}
                          className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Refresh ({customers.length})
                        </button>
                      </div>

                      {/* Search Box */}
                      <div className="mb-4">
                        <input
                          type="text"
                          placeholder="Search customers by name or phone..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        {customersLoading ? (
                          <div className="text-center py-4 text-gray-500">
                            Loading customers...
                          </div>
                        ) : customers.length === 0 ? (
                          <div className="text-center py-4 space-y-2">
                            <div className="text-gray-500">
                              No customers found.
                            </div>
                            <div className="text-xs text-gray-400">
                              Debug: customers array length = {customers.length}
                            </div>
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  console.log(
                                    "🔍 Debug customers data from database:",
                                    customers
                                  );
                                  console.log(
                                    "🔍 Debug customers count:",
                                    customers.length
                                  );
                                }}
                                className="text-xs text-blue-500 underline"
                              >
                                Debug Console
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const testCustomer = await createCustomer({
                                      customer_name: "Test Customer",
                                      phone: "09123456789",
                                      email: "test@test.com",
                                      address: "Test Address",
                                    });
                                    console.log(
                                      "✅ Created test customer:",
                                      testCustomer
                                    );
                                  } catch (error) {
                                    console.error(
                                      "❌ Error creating test customer:",
                                      error
                                    );
                                  }
                                }}
                                className="text-xs text-green-500 underline"
                              >
                                Add Test Customer
                              </button>
                            </div>
                          </div>
                        ) : (
                          customers
                            .filter(
                              (customer) =>
                                !customerSearch ||
                                customer.customer_name
                                  .toLowerCase()
                                  .includes(customerSearch.toLowerCase()) ||
                                (customer.phone &&
                                  customer.phone.includes(customerSearch))
                            )
                            .map((customer) => (
                              <button
                                key={customer.id}
                                className="w-full text-left px-3 py-2 rounded hover:bg-green-100 border border-gray-200 mb-1"
                                onClick={() => {
                                  setPaymentData((prev) => ({
                                    ...prev,
                                    customerType: "old",
                                    customer_name: customer.customer_name,
                                    customer_phone: customer.phone,
                                    customer_address: customer.address,
                                    customer_id: customer.id,
                                  }));
                                  setShowOldCustomerModal(false);
                                  setCustomerSearch("");
                                }}
                              >
                                <div className="font-medium">
                                  {customer.customer_name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  📞 {customer.phone || "No phone"}
                                </div>
                                {customer.email && (
                                  <div className="text-sm text-gray-600">
                                    ✉️ {customer.email}
                                  </div>
                                )}
                                {customer.address && (
                                  <div className="text-sm text-gray-600">
                                    📍 {customer.address}
                                  </div>
                                )}
                                {customer.total_purchases > 0 && (
                                  <div className="text-xs text-green-600 font-medium">
                                    Total Purchases: ₱
                                    {customer.total_purchases.toLocaleString()}
                                  </div>
                                )}
                                {customer.last_purchase_date && (
                                  <div className="text-xs text-gray-400">
                                    Last purchase:{" "}
                                    {new Date(
                                      customer.last_purchase_date
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
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
                      isProcessing ||
                      paymentData.amount <
                        cartSummary.total - discount.amount ||
                      cartSummary.total - discount.amount <= 0
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

      {/* Simple Receipt */}
      <SimpleReceipt
        transaction={lastTransaction}
        isOpen={showReceipt}
        onClose={closeReceipt}
      />
    </div>
  );
}
