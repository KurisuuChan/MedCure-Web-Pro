import { useState, useCallback, useEffect } from "react";
import { usePOSStore } from "../../../stores/posStore";
import { inventoryService } from "../../../services/domains/inventory/inventoryService";
import transactionService from "../../../services/domains/sales/transactionService";
import { useAuth } from "../../../hooks/useAuth";
import notificationService from "../../../services/notifications/NotificationService";
import { supabase } from "../../../config/supabase";

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

  // Calculate cart tax - VAT EXEMPT for pharmacy products
  const getCartTax = useCallback(
    (afterDiscount = false, discountAmount = 0) => {
      // Pharmacy products are VAT exempt
      return 0;
    },
    [getCartSubtotal]
  );

  // Calculate cart total (subtotal - discount) - VAT EXEMPT for pharmacy products
  const getCartTotalWithTax = useCallback(
    (discountAmount = 0) => {
      const subtotal = getCartSubtotal();
      // Pharmacy products are VAT exempt - just subtract discount from subtotal
      return subtotal - discountAmount;
    },
    [getCartSubtotal]
  );

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

  // Validate cart items against current product database
  const validateCartItems = useCallback(async () => {
    if (cartItems.length === 0) {
      return { isValid: true, issues: [] };
    }

    const productIds = cartItems.map((item) => item.productId);
    const issues = [];

    try {
      // Check if products still exist and are available
      const { data: currentProducts, error } = await supabase
        .from("products")
        .select(
          "id, brand_name, generic_name, is_active, is_archived, stock_in_pieces"
        )
        .in("id", productIds);

      if (error) {
        console.error("Error validating cart items:", error);
        return { isValid: false, issues: ["Failed to validate cart items"] };
      }

      const foundProductIds = new Set(currentProducts.map((p) => p.id));

      // Check each cart item
      for (const cartItem of cartItems) {
        const product = currentProducts.find(
          (p) => p.id === cartItem.productId
        );

        if (!product) {
          issues.push(`${cartItem.name || "Unknown Product"} no longer exists`);
          continue;
        }

        if (!product.is_active) {
          issues.push(
            `${product.brand_name || product.generic_name} is no longer active`
          );
          continue;
        }

        if (product.is_archived) {
          issues.push(
            `${product.brand_name || product.generic_name} has been archived`
          );
          continue;
        }

        if ((product.stock_in_pieces || 0) < cartItem.quantityInPieces) {
          issues.push(
            `${product.brand_name || product.generic_name}: requested ${
              cartItem.quantityInPieces
            }, available ${product.stock_in_pieces || 0}`
          );
        }
      }

      return { isValid: issues.length === 0, issues };
    } catch (err) {
      console.error("Error validating cart items:", err);
      return { isValid: false, issues: ["Failed to validate cart items"] };
    }
  }, [cartItems]);

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

        // Pre-validate cart items to catch stale products early
        console.log("🔍 Pre-validating cart items...");
        const validation = await validateCartItems();
        if (!validation.isValid) {
          console.warn("⚠️ Cart validation failed:", validation.issues);

          // Refresh product list and try validation again
          await loadAvailableProducts();
          const retryValidation = await validateCartItems();

          if (!retryValidation.isValid) {
            throw new Error(
              `Cart validation failed: ${retryValidation.issues.join("; ")}. ` +
                "Please remove invalid items and try again."
            );
          }

          console.log("✅ Cart validation passed after product refresh");
        } else {
          console.log("✅ Cart validation passed");
        }

        // Validate payment amount - use correct discount calculation
        const subtotal = getCartSubtotal();
        const discountAmount = paymentData.discount_amount || 0;
        const finalTotalAfterDiscount = getCartTotalWithTax(discountAmount);

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
            quantity: item.quantityInPieces, // Use pieces as base quantity
            unit_type: item.unit,
            unit_price: item.pricePerPiece, // Use price per piece (base unit)
            total_price: item.totalPrice,
            // Additional fields for debugging/display
            display_quantity: item.quantity,
            display_unit: item.unit,
            price_per_unit: item.pricePerUnit,
          })),
          total: finalTotalAfterDiscount, // ✅ FIXED: Use correctly calculated total
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
          subtotal_before_discount: subtotal,
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
          // Add payment fields that receipt service expects
          amount_paid: paymentData.amount,
          change_amount: paymentData.amount - finalTotalAfterDiscount,
          payment_method: paymentData.method,
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
          tax: 0, // VAT EXEMPT for pharmacy products
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
          final_pwd_senior_holder_name:
            enhancedTransaction.pwd_senior_holder_name,
          using_fallback:
            !transaction.pwd_senior_holder_name &&
            saleData.pwd_senior_holder_name,
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
                // Use stock_in_pieces (base unit) for accuracy and coerce to Number
                const currentStock = Number(product.stock_in_pieces || 0);
                const reorderLevel = Number(product.reorder_level || 50);

                // Defensive logging for debugging incorrect zero values
                console.log("🔎 [LowStockCheck]", {
                  productId: product.id,
                  sku: product.sku || null,
                  brand: product.brand_name || product.generic_name,
                  currentStock,
                  reorderLevel,
                });

                // Notify if stock is below or equal to reorder level
                if (currentStock <= reorderLevel) {
                  console.log(
                    `📢 Sending low stock notification for ${
                      product.brand_name || product.generic_name
                    } - currentStock=${currentStock} reorderLevel=${reorderLevel}`
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

        // Check if the error is related to stale products
        if (
          err.message &&
          (err.message.includes("no longer exist in the database") ||
            err.message.includes("not available for sale") ||
            err.message.includes("Please refresh the product list"))
        ) {
          console.log(
            "🔄 Product validation error detected, refreshing product list..."
          );

          // Automatically refresh the product list
          try {
            await loadAvailableProducts();
            setError(
              `${err.message}\n\n✅ Product list has been refreshed. Please review your cart and try again.`
            );
          } catch (refreshError) {
            console.error("Failed to refresh product list:", refreshError);
            setError(
              `${err.message}\n\n⚠️ Failed to refresh product list. Please refresh the page and try again.`
            );
          }
        } else {
          setError(err.message);
        }

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
      validateCartItems,
      user?.id,
    ]
  );

  // Calculate change
  const calculateChange = useCallback(
    (amountPaid, discountAmount = 0) => {
      const finalTotal = getCartTotalWithTax(discountAmount);
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

      const finalTotalAfterDiscount = getCartTotalWithTax(
        paymentData.discount_amount || 0
      );
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
  const getCartSummary = useCallback(
    (discountAmount = 0) => {
      return {
        itemCount: getCartItemCount(),
        subtotal: getCartSubtotal(),
        tax: getCartTax(discountAmount > 0, discountAmount),
        total: getCartTotalWithTax(discountAmount),
      };
    },
    [getCartItemCount, getCartSubtotal, getCartTax, getCartTotalWithTax]
  );

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
    validateCartItems,
    getCartSummary,

    // Clear error
    clearError: () => setError(null),
  };
}
