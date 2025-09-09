import { useState, useCallback, useEffect } from "react";
import { usePOSStore } from "../../../stores/posStore";
import { inventoryService } from "../../../services/inventoryService";
import unifiedTransactionService from "../../../services/unifiedTransactionService";

export function usePOS() {
  const {
    cartItems,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
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
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Load available products on mount
  useEffect(() => {
    loadAvailableProducts();
  }, [loadAvailableProducts]);

  // Handle adding products to cart with variants - matches POS store signature
  const handleAddToCart = useCallback(
    (product, quantity = 1, unit = "piece") => {
      try {
        console.log("🎪 usePOS Hook - Received:", {
          productName: product.name,
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
          cashierId: paymentData.cashierId || null,
          // Add discount fields
          discount_type: paymentData.discount_type || "none",
          discount_percentage: paymentData.discount_percentage || 0,
          discount_amount: paymentData.discount_amount || 0,
          subtotal_before_discount:
            paymentData.subtotal_before_discount || total,
          pwd_senior_id: paymentData.pwd_senior_id || null,
        };

        console.log("🚀 POS Hook - Sale data being sent:", saleData);
        console.log("🛒 POS Hook - Cart items:", cartItems);

        // Use the new unified service complete payment workflow
        const completedTransaction =
          await unifiedTransactionService.processCompletePayment(saleData);
        console.log(
          "✅ POS Hook - Complete payment successful:",
          completedTransaction
        );

        // Extract the transaction data
        const transaction = {
          id: completedTransaction.transaction_id,
          ...completedTransaction.create_result,
          status: "completed",
        };

        // Enhance transaction with additional data
        const enhancedTransaction = {
          ...transaction,
          payment: {
            method: paymentData.method,
            amount: paymentData.amount,
            change: paymentData.amount - finalTotalAfterDiscount, // ✅ FIXED: Use correct total for change calculation
          },
          items: cartItems.map((item) => ({
            id: item.productId,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            quantityInPieces: item.quantityInPieces,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice,
          })),
          subtotal: getCartSubtotal(),
          tax: getCartTax(),
        };

        // Save transaction
        setLastTransaction(enhancedTransaction);

        // Clear cart
        clearCart();

        // Reload available products to update stock
        await loadAvailableProducts();

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
