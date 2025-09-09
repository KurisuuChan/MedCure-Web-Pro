import { SalesService } from "./dataService";

export const salesService = {
  // Process a sale transaction (atomic operation via RPC)
  processSale: async (saleData) => {
    return await SalesService.processSale(saleData);
  },

  // Get all sales with pagination
  getSales: async (page = 1, limit = 50) => {
    return await SalesService.getSales(page, limit);
  },

  // Get sales by date range
  getSalesByDateRange: async (startDate, endDate) => {
    return await SalesService.getSalesByDateRange(startDate, endDate);
  },

  // Void a sale transaction
  voidSale: async (saleId, reason) => {
    return await SalesService.voidSale(saleId, reason);
  },

  // Get daily sales summary
  getDailySalesSummary: async (date) => {
    return await SalesService.getDailySalesSummary(date);
  },

  // Get sales analytics
  getSalesAnalytics: async (startDate, endDate) => {
    return await SalesService.getSalesAnalytics(startDate, endDate);
  },

  // Get today's transactions
  getTodaysTransactions: async () => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    console.log("📅 Getting today's transactions:", { startOfDay, endOfDay });

    const rawTransactions = await SalesService.getSalesByDateRange(
      startOfDay,
      endOfDay
    );

    // Transform the data to match the expected format
    const transformedTransactions = rawTransactions.map((transaction) => ({
      ...transaction,
      // Transform sale_items to items with proper structure
      items:
        transaction.sale_items?.map((saleItem) => ({
          id: saleItem.product_id,
          product_id: saleItem.product_id,
          name: saleItem.products?.name || "Unknown Product",
          quantity: saleItem.quantity,
          unit_type: saleItem.unit_type,
          unit_price: saleItem.unit_price,
          subtotal: saleItem.total_price, // Map total_price to subtotal for UI
          total_price: saleItem.total_price,
        })) || [],
      // Calculate subtotal and tax for display
      subtotal: transaction.total_amount ? transaction.total_amount / 1.12 : 0,
      tax: transaction.total_amount
        ? (transaction.total_amount * 0.12) / 1.12
        : 0,
      total: transaction.total_amount || 0,
    }));

    console.log("🔄 Transformed transactions:", transformedTransactions);

    return transformedTransactions;
  },

  // Edit an existing transaction
  editTransaction: async (transactionId, editData) => {
    return await SalesService.editTransaction(transactionId, editData);
  },
};
