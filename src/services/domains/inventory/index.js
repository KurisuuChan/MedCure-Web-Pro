// 📦 **INVENTORY DOMAIN SERVICES**
// All product and inventory management services

export { ProductService } from "./productService";
export { inventoryService as InventoryService } from "./inventoryService";
export { EnhancedInventoryService } from "./enhancedInventoryService";
export { default as CategoryService } from "./categoryService";
export { SmartCategoryService } from "./smartCategoryService";

// Import for default export
import { ProductService } from "./productService";
import { inventoryService as InventoryService } from "./inventoryService";
import { EnhancedInventoryService } from "./enhancedInventoryService";
import CategoryService from "./categoryService";
import { SmartCategoryService } from "./smartCategoryService";

// Domain exports for clean imports
export default {
  ProductService,
  InventoryService,
  EnhancedInventoryService,
  CategoryService,
  SmartCategoryService,
};
