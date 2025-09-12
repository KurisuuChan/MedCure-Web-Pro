// Product utility functions and constants

// Stock status helpers
export function getStockStatus(product) {
  const { stock_in_pieces, reorder_level } = product;

  if (stock_in_pieces === 0) return "out_of_stock";
  if (stock_in_pieces <= reorder_level * 0.5) return "critical_stock";
  if (stock_in_pieces <= reorder_level) return "low_stock";
  return "in_stock";
}

/**
 * Check if a product is considered low stock
 * This is the standardized method used across the application
 * @param {Object} product - Product object
 * @param {number} fallbackThreshold - Default threshold if product has no reorder level
 * @returns {boolean} Whether the product is low stock
 */
export function isLowStock(product, fallbackThreshold = 10) {
  const stockLevel = product.stock_in_pieces || 0;
  const reorderLevel = product.reorder_level || fallbackThreshold;
  return stockLevel <= reorderLevel;
}

/**
 * Get low stock products from a list
 * @param {Array} products - Array of products
 * @param {number} fallbackThreshold - Default threshold if product has no reorder level
 * @returns {Array} Filtered low stock products
 */
export function filterLowStockProducts(products, fallbackThreshold = 10) {
  return products.filter((product) => isLowStock(product, fallbackThreshold));
}

/**
 * Count low stock products
 * @param {Array} products - Array of products
 * @param {number} fallbackThreshold - Default threshold if product has no reorder level
 * @returns {number} Count of low stock products
 */
export function countLowStockProducts(products, fallbackThreshold = 10) {
  return filterLowStockProducts(products, fallbackThreshold).length;
}

export function getExpiryStatus(product) {
  if (!product.expiry_date) return "good";

  const today = new Date();
  const expiryDate = new Date(product.expiry_date);
  const daysUntilExpiry = Math.ceil(
    (expiryDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring_soon";
  if (daysUntilExpiry <= 90) return "expiring_warning";
  return "good";
}

// Categories for filtering
export const productCategories = [
  "All Categories",
  "Pain Relief",
  "Antibiotics",
  "Antihistamine",
  "Gastro",
  "Diabetes",
  "Cardiovascular",
  "Respiratory",
  "Dermatology",
  "Vitamins",
];

// Brands for filtering
export const productBrands = [
  "All Brands",
  "Unilab",
  "Pfizer",
  "Teva",
  "Advil",
  "AstraZeneca",
  "Merck",
  "Norvasc",
  "Imodium",
  "GSK",
  "Johnson & Johnson",
];

// Stock status colors and labels
export const stockStatusConfig = {
  in_stock: {
    label: "In Stock",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
  },
  low_stock: {
    label: "Low Stock",
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
  },
  critical_stock: {
    label: "Critical Stock",
    color: "orange",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    borderColor: "border-orange-200",
  },
  out_of_stock: {
    label: "Out of Stock",
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
  },
};

// Expiry status colors and labels
export const expiryStatusConfig = {
  good: {
    label: "Good",
    color: "green",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
  },
  expiring_warning: {
    label: "Expiring in 3 months",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
  },
  expiring_soon: {
    label: "Expiring Soon",
    color: "yellow",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
  },
  expired: {
    label: "Expired",
    color: "red",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
  },
};

// Get stock status badge props
export function getStockStatusBadge(product) {
  const status = getStockStatus(product);
  return stockStatusConfig[status];
}

// Get expiry status badge props
export function getExpiryStatusBadge(product) {
  const status = getExpiryStatus(product);
  return expiryStatusConfig[status];
}
