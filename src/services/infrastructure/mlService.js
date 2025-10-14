/**
 * Lightweight MLService stub
 *
 * This file provides a safe, minimal implementation of the MLService API
 * expected by debug and validation utilities. It intentionally avoids
 * heavy dependencies and external calls. Replace with real implementation
 * when ML pipeline is available.
 */

export class MLService {
  /**
   * Forecast demand for a product over the next `days` days.
   * Returns a small placeholder object so debug code can run.
   */
  static async forecastDemand(productId, days = 7) {
    // Simple deterministic placeholder: flat forecast of zeros
    return {
      productId,
      days,
      forecast: Array.from({ length: Math.max(0, days) }, () => 0),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Alias for forecastDemand (some modules check getDemandForecast)
   */
  static async getDemandForecast(productId, days = 7) {
    return this.forecastDemand(productId, days);
  }

  /**
   * Return historical sales for a product. Debug tools expect an array.
   */
  static async getProductSalesHistory(productId, days = 30) {
    // Reference args to satisfy lint rules (placeholder implementation)
    void productId;
    void days;
    return [];
  }

  /**
   * Lightweight exponential smoothing implementation placeholder.
   */
  static exponentialSmoothing(values = [], period = 7) {
    // Reference period to satisfy lint rule
    void period;
    if (!Array.isArray(values) || values.length === 0) return { smoothed: [], error: null };
    // naive pass-through as placeholder
    return { smoothed: values.slice(), error: null };
  }

  /**
   * Lightweight linear regression forecast placeholder.
   */
  static linearRegressionForecast(values = [], days = 7) {
    // Reference values to satisfy lint rule
    void values;
    return { forecast: Array.from({ length: days }, () => 0) };
  }

  /**
   * Return placeholder customer transaction data used by some debug tests.
   */
  static async getCustomerTransactionData() {
    return [];
  }
}

export default MLService;
