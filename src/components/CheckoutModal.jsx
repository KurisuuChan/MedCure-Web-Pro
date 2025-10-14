import React from "react";
import {
  X,
  CreditCard,
  Receipt,
  DollarSign,
  Smartphone,
  Package,
  User,
} from "lucide-react";
import { formatCurrency } from "../utils/formatting";
import DiscountSelector from "./features/pos/DiscountSelector";
import PhoneValidator from "../utils/phoneValidator";
import UnifiedSpinner from "./ui/loading/UnifiedSpinner";

export default function CheckoutModal({
  showCheckout,
  setShowCheckout,
  cartItems,
  cartSummary,
  discount,
  handleDiscountChange,
  paymentData,
  setPaymentData,
  handlePayment,
  isProcessing,
  showNewCustomerModal,
  setShowNewCustomerModal,
  showOldCustomerModal,
  setShowOldCustomerModal,
  newCustomer,
  setNewCustomer,
  customerError,
  clearCustomerError,
  createCustomer,
  showSuccess,
  showError,
  customers,
  customersLoading,
  fetchCustomers,
  customerSearch,
  setCustomerSearch,
}) {
  if (!showCheckout) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded">
              <CreditCard className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Checkout</h2>
              <p className="text-sm text-gray-500">Complete your transaction</p>
            </div>
          </div>
          <button
            onClick={() => setShowCheckout(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
            {/* Left Panel - Payment Details */}
            <div className="lg:col-span-3 space-y-5">
              {/* Discount Selector */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <DiscountSelector
                  onDiscountChange={handleDiscountChange}
                  subtotal={cartSummary.total}
                />
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setPaymentData((prev) => ({ ...prev, method: "cash" }))
                    }
                    className={`p-4 border rounded-lg transition-colors ${
                      paymentData.method === "cash"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
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
                    className={`p-4 border rounded-lg transition-colors ${
                      paymentData.method === "gcash"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
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
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Amount Received
                  </label>
                  <span className="text-sm text-gray-600">
                    Total:{" "}
                    <span className="font-semibold">
                      {formatCurrency(cartSummary.total - discount.amount)}
                    </span>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium text-xl">₱</span>
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

                      if (inputValue === "" || inputValue === null) {
                        setPaymentData((prev) => ({ ...prev, amount: 0 }));
                        return;
                      }

                      const value = parseFloat(inputValue);
                      if (!isNaN(value) && value >= 0 && value <= 999999.99) {
                        setPaymentData((prev) => ({ ...prev, amount: value }));
                      } else if (inputValue.match(/^\d*\.?\d*$/)) {
                        setPaymentData((prev) => ({
                          ...prev,
                          amount:
                            inputValue === "" ? 0 : parseFloat(inputValue) || 0,
                        }));
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-12 pr-4 py-4 text-xl font-semibold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    placeholder="Enter amount"
                    autoComplete="off"
                  />
                </div>

                {/* Payment Status */}
                {paymentData.amount > 0 &&
                  paymentData.amount >= cartSummary.total - discount.amount && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Change:</span>
                        <span className="text-lg font-bold text-green-700">
                          {formatCurrency(
                            paymentData.amount -
                              (cartSummary.total - discount.amount)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
              </div>

              {/* Customer Information */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Customer Information
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                      paymentData.customerType === "guest"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
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
                    Walk-in
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                      paymentData.customerType === "new"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    onClick={() => setShowNewCustomerModal(true)}
                  >
                    New Customer
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg border font-medium text-sm transition-colors ${
                      paymentData.customerType === "old"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                    onClick={() => setShowOldCustomerModal(true)}
                  >
                    Existing
                  </button>
                </div>

                {/* Show selected customer info */}
                {paymentData.customerType &&
                  paymentData.customerType !== null && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Selected Customer
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        {paymentData.customer_name}
                      </div>
                      {paymentData.customer_phone && (
                        <div className="text-xs text-gray-600">
                          📞 {paymentData.customer_phone}
                        </div>
                      )}
                      {paymentData.customer_address && (
                        <div className="text-xs text-gray-600">
                          📍 {paymentData.customer_address}
                        </div>
                      )}
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
                      <X className="h-5 w-5" />
                    </button>

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

                    <h3 className="text-lg font-semibold mb-4">New Customer</h3>
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
                            const value = e.target.value.replace(
                              /[^0-9\s\-()+.]/g,
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
                      className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
                        !PhoneValidator.validatePhone(newCustomer.phone).isValid
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
                      <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Select Customer</h3>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 border border-gray-200 mb-1"
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

            {/* Right Panel - Order Summary */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order Summary Card */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900">
                    Order Summary
                  </h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Items</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {cartItems.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subtotal</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(cartSummary.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">VAT Status</span>
                      <span className="text-xs font-medium text-green-600">
                        EXEMPT
                      </span>
                    </div>

                    {discount.amount > 0 && (
                      <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded -mx-3">
                        <span className="text-sm text-green-700">
                          Discount ({discount.percentage}%)
                        </span>
                        <span className="text-sm font-semibold text-green-700">
                          -{formatCurrency(discount.amount)}
                        </span>
                      </div>
                    )}

                    <div className="pt-3 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-bold text-gray-900">
                          Amount Due
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(cartSummary.total - discount.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary Card */}
              {paymentData.amount > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-900">
                      Payment Summary
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Payment Method
                      </span>
                      <span className="text-sm font-medium text-gray-900 uppercase">
                        {paymentData.method}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Amount Received
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          paymentData.amount >=
                          cartSummary.total - discount.amount
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(paymentData.amount)}
                      </span>
                    </div>
                    {paymentData.amount >=
                      cartSummary.total - discount.amount && (
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-sm font-medium text-gray-700">
                          Change
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(
                            paymentData.amount -
                              (cartSummary.total - discount.amount)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="text-sm text-gray-600">
            {paymentData.amount < cartSummary.total - discount.amount &&
              paymentData.amount > 0 && (
                <span className="text-red-600 font-medium">
                  Insufficient payment amount
                </span>
              )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCheckout(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handlePayment}
              disabled={
                isProcessing ||
                paymentData.amount < cartSummary.total - discount.amount ||
                cartSummary.total - discount.amount <= 0
              }
              className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center space-x-2 ${
                isProcessing ||
                paymentData.amount < cartSummary.total - discount.amount ||
                cartSummary.total - discount.amount <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "text-white bg-green-600 hover:bg-green-700 shadow-sm hover:shadow"
              }`}
            >
              {isProcessing ? (
                <>
                  <UnifiedSpinner variant="dots" size="sm" color="white" />
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
  );
}
