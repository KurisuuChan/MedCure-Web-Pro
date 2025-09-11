// 📦 **INVENTORY DOMAIN SERVICES**
// All product and inventory management services

export { ProductService } from "./productService";
export { inventoryService as InventoryService } from "./inventoryService";
export { AdvancedInventoryService } from "./advancedInventoryService";
export { UnifiedCategoryService } from "./unifiedCategoryService";

// Import for default export
import { ProductService } from "./productService";
import { inventoryService as InventoryService } from "./inventoryService";
import { AdvancedInventoryService } from "./advancedInventoryService";
import { UnifiedCategoryService } from "./unifiedCategoryService";

// Domain exports for clean imports
export default {
  ProductService,
  InventoryService,
  AdvancedInventoryService,
  UnifiedCategoryService,
};
