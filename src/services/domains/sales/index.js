// 💰 **SALES DOMAIN SERVICES**
// All sales and transaction management services

export { SalesService } from "./salesService";
export { default as EnhancedSalesService } from "./enhancedSalesService";
export { default as TransactionService } from "./transactionService";
export { default as ReceiptService } from "./receiptService";

// Import for default export
import { SalesService } from "./salesService";
import EnhancedSalesService from "./enhancedSalesService";
import TransactionService from "./transactionService";
import ReceiptService from "./receiptService";

export default {
  SalesService,
  EnhancedSalesService,
  TransactionService,
  ReceiptService,
};
