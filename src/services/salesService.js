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
};
