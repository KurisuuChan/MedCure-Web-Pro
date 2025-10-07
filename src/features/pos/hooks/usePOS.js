import { useState, useCallback, useEffect } from "react";
import { usePOSStore } from "../../../stores/posStore";
import { inventoryService } from "../../../services/domains/inventory/inventoryService";
import transactionService from "../../../services/domains/sales/transactionService";
import { useAuth } from "../../../hooks/useAuth";
import notificationService from "../../../services/notifications/NotificationService";

export function usePOS() {
  const { user } = useAuth();
  const {
    cartItems,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
    setAvailableProducts: setStoreProducts,
  } = usePOSStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [error, setError] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Define loadAvailableProducts first before using it
  const loadAvailableProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      // Use the dedicated method for POS-available products
      const availableProducts = await inventoryService.getAvailableProducts();
      console.log("🏪 [usePOS] Loaded available products for POS:", {
        availableProducts: availableProducts.length,
      });
      setAvailableProducts(availableProducts);
      // 🎯 Update the store with available products
      setStoreProducts(availableProducts);
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  }, [setStoreProducts]);

  // Load available products on mount
  useEffect(() => {
    loadAvailableProducts();
  }, [loadAvailableProducts]);

  // Handle adding products to cart with variants - matches POS store signature
  const handleAddToCart = useCallback(
    (product, quantity = 1, unit = "piece") => {
      try {
        console.log("🎪 usePOS Hook - Received:", {
          productName:
            product.generic_name || product.brand_name || "Unknown Medicine",
          brandName: product.brand_name,
          genericName: product.generic_name,
          quantity,
          unit,
          typeof_quantity: typeof quantity,
          typeof_unit: typeof unit,
        });

        setError(null);

        // Use the POS store's addToCart method directly
        addToCart(product, quantity, unit);
      } catch (err) {
        console.error("❌ Error in handleAddToCart:", err);
        setError(err.message);
        setTimeout(() => setError(null), 3000);
      }
    },
    [addToCart]
  );

  // Handle updating cart item quantity
  const handleUpdateQuantity = useCallback(
    (itemId, newQuantity) => {
      try {
        setError(null);

        if (newQuantity <= 0) {
          removeFromCart(itemId);
          return;
        }

        // Use the POS store's updateCartItemQuantity method
        updateCartItemQuantity(itemId, null, newQuantity);
      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(null), 3000);
      }
    },
    [updateCartItemQuantity, removeFromCart]
  );

  // Handle removing item from cart
  const handleRemoveItem = useCallback(
    (itemId) => {
      try {
        setError(null);
        removeFromCart(itemId);
      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(null), 3000);
      }
    },
    [removeFromCart]
  );

  // Calculate cart subtotal (before tax) - use store's total directly
  const getCartSubtotal = useCallback(() => {
    return getCartTotal();
  }, [getCartTotal]);

  // Calculate cart tax (12% VAT)
  const getCartTax = useCallback(() => {
    return getCartSubtotal() * 0.12;
  }, [getCartSubtotal]);

  // Calculate cart total (subtotal + tax)
  const getCartTotalWithTax = useCallback(() => {
    return getCartSubtotal() + getCartTax();
  }, [getCartSubtotal, getCartTax]);

  // Handle clearing cart
  const handleClearCart = useCallback(() => {
    try {
      setError(null);
      clearCart();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  }, [clearCart]);

  // Process payment
  const processPayment = useCallback(
    async (paymentData) => {
      setIsProcessing(true);
      setError(null);

      try {
        // Validate cart
        if (cartItems.length === 0) {
          throw new Error("Cart is empty");
        }

        // Validate payment amount
        const total = getCartTotalWithTax();
        const finalTotalAfterDiscount =
          total - (paymentData.discount_amount || 0);

        if (paymentData.amount < finalTotalAfterDiscount) {
          throw new Error(
            `Insufficient payment amount. Need ₱${finalTotalAfterDiscount.toFixed(
              2
            )}, received ₱${paymentData.amount.toFixed(2)}`
          );
        }

        // Prepare sale data with discount support
        const saleData = {
          items: cartItems.map((item) => ({
            product_id: item.productId,
            quantity_in_pieces: item.quantityInPieces,
            unit_type: item.unit,
            unit_quantity: item.quantity,
            price_per_unit: item.pricePerUnit,
            total_price: item.totalPrice,
          })),
          total: finalTotalAfterDiscount, // ✅ FIXED: Use actual sale total after discount
          paymentMethod: paymentData.method,
          customer: paymentData.customer || null,
          cashierId: user?.id || null,
          // Customer information
          customer_name: paymentData.customer_name || "Walk-in Customer",
          customer_phone: paymentData.customer_phone || "",
          customer_email: paymentData.customer_email || "",
          customer_address: paymentData.customer_address || "",
          customer_type: paymentData.customer_type || "guest",
          // Add discount fields
          discount_type: paymentData.discount_type || "none",
          discount_percentage: paymentData.discount_percentage || 0,
          discount_amount: paymentData.discount_amount || 0,
          subtotal_before_discount:
            paymentData.subtotal_before_discount || total,
          pwd_senior_id: paymentData.pwd_senior_id || null,
          pwd_senior_holder_name: paymentData.pwd_senior_holder_name || null,
        };

        console.log("🚀 POS Hook - Sale data being sent:", saleData);
        console.log("🔍 [DEBUG] PWD/Senior holder name in sale data:", {
          pwd_senior_id: saleData.pwd_senior_id,
          pwd_senior_holder_name: saleData.pwd_senior_holder_name,
          from_payment_data: paymentData.pwd_senior_holder_name,
        });
        console.log("🛒 POS Hook - Cart items:", cartItems);

        // Use the new unified service complete payment workflow
        const completedTransaction =
          await transactionService.processCompletePayment(saleData);
        console.log(
          "✅ POS Hook - Complete payment successful:",
          completedTransaction
        );
        console.log("🔍 [DEBUG] Customer data in completed transaction:", {
          customer_id: completedTransaction.create_result?.customer_id,
          customer_name: completedTransaction.create_result?.customer_name,
        });

        // Extract the transaction data
        const transaction = {
          id: completedTransaction.transaction_id,
          ...completedTransaction.create_result,
          status: "completed",
        };

        console.log("🔍 [usePOS] Backend transaction result:", transaction);
        console.log("🔍 [usePOS] PWD fields in backend response:", {
          pwd_senior_id: transaction.pwd_senior_id,
          pwd_senior_holder_name: transaction.pwd_senior_holder_name,
          discount_type: transaction.discount_type,
          discount_percentage: transaction.discount_percentage,
          discount_amount: transaction.discount_amount,
        });

        // Enhance transaction with additional data (preserve customer information)
        const enhancedTransaction = {
          ...transaction, // Keep all original transaction data including customer_id and customer info
          payment: {
            method: paymentData.method,
            amount: paymentData.amount,
            change: paymentData.amount - finalTotalAfterDiscount, // ✅ FIXED: Use correct total for change calculation
          },
          // Override items with cart data for receipt display
          sale_items: cartItems.map((item) => ({
            id: item.productId,
            generic_name: item.generic_name || "Unknown Medicine",
            brand_name: item.brand_name || "Generic",
            unit: item.unit,
            quantity: item.quantity,
            quantityInPieces: item.quantityInPieces,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice,
          })),
          subtotal: getCartSubtotal(),
          tax: getCartTax(),
          // Explicitly preserve customer data to ensure it's not lost
          customer_id: transaction.customer_id,
          customer_name: transaction.customer_name,
          customer_phone: transaction.customer_phone,
          customer_email: transaction.customer_email,
          customer_address: transaction.customer_address,
          customer_type: transaction.customer_type,
          // ✅ PRESERVE DISCOUNT DATA FOR RECEIPT
          discount_type: transaction.discount_type || saleData.discount_type,
          discount_percentage:
            transaction.discount_percentage || saleData.discount_percentage,
          discount_amount:
            transaction.discount_amount || saleData.discount_amount,
          subtotal_before_discount:
            transaction.subtotal_before_discount ||
            saleData.subtotal_before_discount,
          pwd_senior_id: transaction.pwd_senior_id || saleData.pwd_senior_id,
          pwd_senior_holder_name:
            transaction.pwd_senior_holder_name ||
            saleData.pwd_senior_holder_name,
        };

        console.log("🔍 [usePOS] Enhanced transaction created:", {
          original_pwd_senior_holder_name: transaction.pwd_senior_holder_name,
          fallback_pwd_senior_holder_name: saleData.pwd_senior_holder_name,
          final_pwd_senior_holder_name: enhancedTransaction.pwd_senior_holder_name,
          using_fallback: !transaction.pwd_senior_holder_name && saleData.pwd_senior_holder_name,
        });

        // Save transaction
        setLastTransaction(enhancedTransaction);

        // Clear cart
        clearCart();

        // Reload available products to update stock
        await loadAvailableProducts();

        // ✅ NEW: Check for low stock notifications after sale
        // Wait a moment for stock to update, then check
        setTimeout(async () => {
          try {
            // Re-fetch products to get updated stock levels
            const updatedProducts =
              await inventoryService.getAvailableProducts();

            // Check each sold product for low stock
            for (const item of cartItems) {
              const product = updatedProducts.find(
                (p) => p.id === item.productId
              );
              if (product) {
                const currentStock = product.stock || 0;
                const reorderLevel = product.reorder_level || 50;

                // Notify if stock is below reorder level
                if (currentStock <= reorderLevel) {
                  console.log(
                    `📢 Sending low stock notification for ${
                      product.brand_name || product.generic_name
                    }`,
                    {
                      currentStock,
                      reorderLevel,
                    }
                  );
                  await notificationService.notifyLowStock(
                    product.id,
                    product.brand_name || product.generic_name,
                    currentStock,
                    reorderLevel,
                    user?.id
                  );
                }
              }
            }
          } catch (notifError) {
            console.error(
              "⚠️ Failed to send low stock notifications:",
              notifError
            );
            // Don't fail the transaction if notifications fail
          }
        }, 500); // Wait 500ms for stock to update

        return enhancedTransaction;
      } catch (err) {
        console.error("Payment processing error:", err);
        setError(err.message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [
      cartItems,
      getCartTotalWithTax,
      getCartSubtotal,
      getCartTax,
      clearCart,
      loadAvailableProducts,
      user?.id,
    ]
  );

  // Calculate change
  const calculateChange = useCallback(
    (amountPaid, discountAmount = 0) => {
      const total = getCartTotalWithTax();
      const finalTotal = total - discountAmount;
      return Math.max(0, amountPaid - finalTotal);
    },
    [getCartTotalWithTax]
  );

  // Validate payment
  const validatePayment = useCallback(
    (paymentData) => {
      const errors = {};

      if (!paymentData.method) {
        errors.method = "Payment method is required";
      }

      if (!paymentData.amount || paymentData.amount <= 0) {
        errors.amount = "Payment amount is required";
      }

      const total = getCartTotalWithTax();
      const finalTotalAfterDiscount =
        total - (paymentData.discount_amount || 0);
      if (paymentData.amount < finalTotalAfterDiscount) {
        errors.amount = `Insufficient payment amount. Need ₱${finalTotalAfterDiscount.toFixed(
          2
        )}`;
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [getCartTotalWithTax]
  );

  // Get cart summary
  const getCartSummary = useCallback(() => {
    return {
      itemCount: getCartItemCount(),
      subtotal: getCartSubtotal(),
      tax: getCartTax(),
      total: getCartTotalWithTax(),
    };
  }, [getCartItemCount, getCartSubtotal, getCartTax, getCartTotalWithTax]);

  return {
    // Data
    cartItems,
    availableProducts,
    lastTransaction,

    // State
    isProcessing,
    isLoadingProducts,
    error,

    // Actions
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    processPayment,
    loadAvailableProducts,

    // Helpers
    calculateChange,
    validatePayment,
    getCartSummary,

    // Clear error
    clearError: () => setError(null),
  };
}
