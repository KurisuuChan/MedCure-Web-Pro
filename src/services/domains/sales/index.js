// 💰 **SALES DOMAIN SERVICES**
// All sales and transaction management services

export { SalesService } from "./salesService";
export { default as EnhancedSalesService } from "./enhancedSalesService";
export { default as UnifiedSalesService } from "./unifiedSalesService";
export { default as TransactionService } from "./transactionService";

// Import for default export
import { SalesService } from "./salesService";
import EnhancedSalesService from "./enhancedSalesService";
import UnifiedSalesService from "./unifiedSalesService";
import TransactionService from "./transactionService";

export default {
  SalesService,
  EnhancedSalesService,
  UnifiedSalesService,
  TransactionService,
};
