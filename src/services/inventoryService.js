import { ProductService } from "./dataService";

export const inventoryService = {
  // Get all products with variant information
  getProducts: async () => {
    return await ProductService.getProducts();
  },

  // Get single product by ID
  getProductById: async (id) => {
    return await ProductService.getProductById(id);
  },

  // Search products by name or barcode
  searchProducts: async (query) => {
    return await ProductService.searchProducts(query);
  },

  // Add new product
  addProduct: async (productData) => {
    return await ProductService.addProduct(productData);
  },

  // Update product
  updateProduct: async (id, updates) => {
    return await ProductService.updateProduct(id, updates);
  },

  // Delete product
  deleteProduct: async (id) => {
    return await ProductService.deleteProduct(id);
  },

  // Get low stock products
  getLowStockProducts: async () => {
    return await ProductService.getLowStockProducts();
  },

  // Get expiring products
  getExpiringProducts: async (days = 30) => {
    return await ProductService.getExpiringProducts(days);
  },
};
