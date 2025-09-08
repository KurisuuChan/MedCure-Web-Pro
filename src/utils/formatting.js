// Currency and number formatting utilities

/**
 * Format currency in Philippine Peso
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(number, decimals = 0) {
  return new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number || 0);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString) {
  if (typeof currencyString === "number") return currencyString;
  if (!currencyString) return 0;

  // Remove currency symbols and parse
  return parseFloat(currencyString.replace(/[₱,\s]/g, "")) || 0;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(sellingPrice, costPrice) {
  if (!sellingPrice || !costPrice) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

/**
 * Calculate markup
 */
export function calculateMarkup(sellingPrice, costPrice) {
  if (!costPrice || costPrice === 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Round to nearest peso
 */
export function roundToPeso(amount) {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate change
 */
export function calculateChange(amountPaid, totalAmount) {
  const change = amountPaid - totalAmount;
  return change >= 0 ? change : 0;
}

/**
 * Validate positive number
 */
export function isValidPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format date for display
 */
export function formatDate(date, options = {}) {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  const formatOptions = { ...defaultOptions, ...options };

  return new Intl.DateTimeFormat("en-US", formatOptions).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(dateObj, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
