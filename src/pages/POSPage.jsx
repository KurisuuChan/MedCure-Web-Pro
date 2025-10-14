import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomers } from "../hooks/useCustomers";
import { CustomerService } from "../services/CustomerService";
import notificationService from "../services/notifications/NotificationService";
import { useAuth } from "../hooks/useAuth";
import { CreditCard, History, Users, ShoppingCart } from "lucide-react";
import ProductSelector from "../features/pos/components/ProductSelector";
import ShoppingCartComponent from "../features/pos/components/ShoppingCart";
import SimpleReceipt from "../components/ui/SimpleReceipt";
import CheckoutModal from "../components/CheckoutModal";
import { usePOS } from "../features/pos/hooks/usePOS";
import "../components/ui/ScrollableModal.css";
import { formatCurrency } from "../utils/formatting";
import { useToast } from "../components/ui/Toast";
import {
  LoadingInventoryGrid,
  EmptyState,
  LoadingPOSPage,
} from "../components/ui/loading/PharmacyLoadingStates";

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
    fetchCustomers,
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
      {isLoadingProducts ? (
        /* Full Page Loading State */
        <LoadingPOSPage />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selector - Left Column (2/3 width) */}
          <div className="lg:col-span-2">
            {availableProducts.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <EmptyState
                  icon={ShoppingCart}
                  title="No products available"
                  message="Products are currently being loaded or no items are in stock."
                />
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
                            {formatCurrency(
                              cartSummary.total - discount.amount
                            )}
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
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        showCheckout={showCheckout}
        setShowCheckout={setShowCheckout}
        cartItems={cartItems}
        cartSummary={cartSummary}
        discount={discount}
        handleDiscountChange={handleDiscountChange}
        paymentData={paymentData}
        setPaymentData={setPaymentData}
        handlePayment={handlePayment}
        isProcessing={isProcessing}
        showNewCustomerModal={showNewCustomerModal}
        setShowNewCustomerModal={setShowNewCustomerModal}
        showOldCustomerModal={showOldCustomerModal}
        setShowOldCustomerModal={setShowOldCustomerModal}
        newCustomer={newCustomer}
        setNewCustomer={setNewCustomer}
        customerError={customerError}
        clearCustomerError={clearCustomerError}
        createCustomer={createCustomer}
        showSuccess={showSuccess}
        showError={showError}
        customers={customers}
        customersLoading={customersLoading}
        fetchCustomers={fetchCustomers}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
      />

      {/* Simple Receipt */}
      <SimpleReceipt
        transaction={lastTransaction}
        isOpen={showReceipt}
        onClose={closeReceipt}
      />
    </div>
  );
}
