import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// POS Cart Store with offline-first sync queue
export const usePOSStore = create(
  persist(
    (set, get) => ({
      // Cart items
      cartItems: [],

      // Customer information
      customer: null,

      // Payment information
      paymentMethod: "cash",
      amountPaid: 0,

      // Sync queue for offline transactions
      syncQueue: [],

      // Cart actions
      addToCart: (product, quantity, unit) => {
        console.log("🛒 POS Store - addToCart called with:", {
          productName: product.name,
          quantity,
          unit,
          productData: {
            pieces_per_sheet: product.pieces_per_sheet,
            sheets_per_box: product.sheets_per_box,
            price_per_piece: product.price_per_piece,
          },
        });

        const state = get();
        const existingItemIndex = state.cartItems.findIndex(
          (item) => item.product.id === product.id && item.unit === unit
        );

        // Convert quantity to pieces (base unit) - ensure quantity is a number
        const numQuantity = Number(quantity);
        const quantityInPieces = convertToBaseUnit(numQuantity, unit, product);
        const pricePerPiece = Number(product.price_per_piece);
        const pricePerUnit = calculatePricePerUnit(
          pricePerPiece,
          unit,
          product
        );
        const totalPrice = pricePerUnit * numQuantity;

        console.log("💰 POS Store - Calculated values:", {
          quantityInPieces,
          pricePerPiece,
          pricePerUnit,
          totalPrice,
          originalQuantity: quantity,
          numQuantity,
          unit,
        });

        if (existingItemIndex >= 0) {
          // Update existing item
          const updatedItems = [...state.cartItems];
          const existingItem = updatedItems[existingItemIndex];
          const newQuantity = existingItem.quantity + numQuantity;
          const newQuantityInPieces =
            existingItem.quantityInPieces + quantityInPieces;
          const newTotalPrice = pricePerUnit * newQuantity;

          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            quantityInPieces: newQuantityInPieces,
            totalPrice: newTotalPrice,
          };
          console.log(
            "📝 Updated existing item:",
            updatedItems[existingItemIndex]
          );
          set({ cartItems: updatedItems });
        } else {
          // Add new item with proper structure
          const newItem = {
            id: `${product.id}-${unit}`, // Unique ID for cart item
            productId: product.id, // Keep original product ID
            name: product.name,
            quantity: numQuantity,
            quantityInPieces,
            unit,
            pricePerUnit,
            pricePerPiece,
            totalPrice,
            product: { ...product }, // Full product data for display
          };
          console.log("✨ Created new cart item:", newItem);
          set({ cartItems: [...state.cartItems, newItem] });
        }
      },

      removeFromCart: (itemId) => {
        const state = get();
        const updatedItems = state.cartItems.filter(
          (item) => item.id !== itemId
        );
        set({ cartItems: updatedItems });
      },

      updateCartItemQuantity: (itemId, _, newQuantity) => {
        const state = get();
        const updatedItems = state.cartItems.map((item) => {
          if (item.id === itemId) {
            const quantityInPieces = convertToBaseUnit(
              newQuantity,
              item.unit,
              item.product
            );
            const totalPrice = item.pricePerUnit * newQuantity;
            return {
              ...item,
              quantity: newQuantity,
              quantityInPieces,
              totalPrice,
            };
          }
          return item;
        });
        set({ cartItems: updatedItems });
      },

      clearCart: () => {
        set({
          cartItems: [],
          customer: null,
          paymentMethod: "cash",
          amountPaid: 0,
        });
      },

      // Customer actions
      setCustomer: (customer) => set({ customer }),

      // Payment actions
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setAmountPaid: (amount) => set({ amountPaid: amount }),

      // Sync queue actions (for offline functionality)
      addToSyncQueue: (transaction) => {
        const state = get();
        set({
          syncQueue: [
            ...state.syncQueue,
            {
              ...transaction,
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              synced: false,
            },
          ],
        });
      },

      markAsSynced: (transactionId) => {
        const state = get();
        const updatedQueue = state.syncQueue.map((item) =>
          item.id === transactionId ? { ...item, synced: true } : item
        );
        set({ syncQueue: updatedQueue });
      },

      clearSyncedItems: () => {
        const state = get();
        const unsynced = state.syncQueue.filter((item) => !item.synced);
        set({ syncQueue: unsynced });
      },

      // Computed values
      getCartTotal: () => {
        const state = get();
        return state.cartItems.reduce(
          (total, item) => total + item.totalPrice,
          0
        );
      },

      getCartItemCount: () => {
        const state = get();
        return state.cartItems.reduce(
          (count, item) => count + item.quantity,
          0
        );
      },
    }),
    {
      name: "medcure-pos-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        syncQueue: state.syncQueue,
        cartItems: state.cartItems,
        customer: state.customer,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);

// Helper functions for unit conversion
function convertToBaseUnit(quantity, unit, product) {
  switch (unit) {
    case "piece":
      return quantity;
    case "sheet":
      return quantity * (product.pieces_per_sheet || 1);
    case "box":
      return (
        quantity *
        (product.sheets_per_box || 1) *
        (product.pieces_per_sheet || 1)
      );
    default:
      return quantity;
  }
}

function calculatePricePerUnit(pricePerPiece, unit, product) {
  switch (unit) {
    case "piece":
      return pricePerPiece;
    case "sheet":
      return pricePerPiece * (product.pieces_per_sheet || 1);
    case "box":
      return (
        pricePerPiece *
        (product.sheets_per_box || 1) *
        (product.pieces_per_sheet || 1)
      );
    default:
      return pricePerPiece;
  }
}
