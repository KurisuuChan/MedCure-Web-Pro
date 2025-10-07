import { useState, useCallback } from 'react'; 
import { SalesService } from '../../../services/domains/sales/salesService';
import { ProductService } from '../../../services/domains/inventory/productService';

export function usePOS() {
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await ProductService.getProducts();
      if (result.success) {
        setProducts(result.data);
      } else {
        setError(result.error || 'Failed to load products');
      }
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to cart
  const addToCart = useCallback((product, quantity = 1, unit = 'piece') => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.product.id === product.id && item.unit === unit
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id && item.unit === unit
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, {
          product,
          quantity,
          unit,
          price: product.price_per_piece || 0,
          subtotal: (product.price_per_piece || 0) * quantity
        }];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId, unit) => {
    setCart(prevCart => 
      prevCart.filter(item => 
        !(item.product.id === productId && item.unit === unit)
      )
    );
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId, unit, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, unit);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId && item.unit === unit
            ? { 
                ...item, 
                quantity: newQuantity,
                subtotal: item.price * newQuantity
              }
            : item
        )
      );
    }
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setAmountPaid(0);
  }, []);

  // Calculate totals
  const cartTotal = cart.reduce((total, item) => total + item.subtotal, 0);
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const change = amountPaid - cartTotal;

  // Process sale
  const processSale = useCallback(async () => {
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    if (paymentMethod === 'cash' && amountPaid < cartTotal) {
      throw new Error('Insufficient payment amount');
    }

    setIsProcessing(true);
    try {
      const saleData = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        payment_method: paymentMethod,
        amount_paid: amountPaid,
        change_amount: change,
        total_amount: cartTotal,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.generic_name || item.product.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.price,
          subtotal: item.subtotal
        }))
      };

      const result = await SalesService.createSale(saleData);
      
      if (result.success) {
        clearCart();
        return result;
      } else {
        throw new Error(result.error || 'Failed to process sale');
      }
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [cart, selectedCustomer, paymentMethod, amountPaid, cartTotal, change, clearCart]);

  // Get cart summary
  const getCartSummary = useCallback(() => {
    return {
      items: cart,
      totalItems: itemCount,
      subtotal: cartTotal,
      total: cartTotal,
      itemCount
    };
  }, [cart, itemCount, cartTotal]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Process payment (alias for processSale)
  const processPayment = useCallback(async (paymentData) => {
    return await processSale(paymentData);
  }, [processSale]);

  return {
    // State - matching POSPage expectations
    cartItems: cart,
    availableProducts: products,
    isProcessing,
    error,
    selectedCustomer,
    paymentMethod,
    amountPaid,
    loading,
    
    // Computed values
    cartTotal,
    itemCount,
    change,
    
    // Actions - matching POSPage function names
    handleAddToCart: addToCart,
    handleUpdateQuantity: updateQuantity,
    handleRemoveItem: removeFromCart,
    handleClearCart: clearCart,
    processPayment,
    getCartSummary,
    clearError,
    loadProducts,
    
    // Setters
    setSelectedCustomer,
    setPaymentMethod,  
    setAmountPaid,
    setError
  };
}