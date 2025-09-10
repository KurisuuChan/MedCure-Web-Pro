import { ProductService } from "./productService";

export const inventoryService = {
  // Get all products with variant information
  getProducts: async () => {
    return await ProductService.getProducts();
  },

  // Get only active, non-archived products (for POS and general inventory display)
  getActiveProducts: async () => {
    const allProducts = await ProductService.getProducts();
    return allProducts.filter(
      (product) => !product.is_archived && product.is_active !== false
    );
  },

  // Get available products for POS (active, non-archived, in-stock)
  getAvailableProducts: async () => {
    const allProducts = await ProductService.getProducts();
    return allProducts.filter(
      (product) =>
        !product.is_archived &&
        product.is_active !== false &&
        product.stock_in_pieces > 0
    );
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

  // Archive product
  archiveProduct: async (id, userId = null) => {
    return await ProductService.updateProduct(id, {
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: userId,
      is_active: false,
    });
  },

  // Restore archived product
  restoreProduct: async (id) => {
    return await ProductService.updateProduct(id, {
      is_archived: false,
      archived_at: null,
      archived_by: null,
      is_active: true,
    });
  },

  // Get archived products
  getArchivedProducts: async () => {
    const products = await ProductService.getProducts();
    return products.filter((product) => product.is_archived);
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
