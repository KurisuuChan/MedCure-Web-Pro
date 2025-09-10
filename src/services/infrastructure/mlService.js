import { AnalyticsService } from "../domains/analytics/analyticsService";
import { supabase } from "../../config/supabase";

/**
 * Machine Learning Service
 * Provides AI-powered analytics, predictions, and recommendations
 */
export class MLService {
  // ==================== CONFIGURATION ====================

  static ML_MODELS = {
    DEMAND_FORECASTING: "demand_forecast",
    PRICE_OPTIMIZATION: "price_optimizer",
    INVENTORY_OPTIMIZATION: "inventory_optimizer",
    CUSTOMER_SEGMENTATION: "customer_segmentation",
    CHURN_PREDICTION: "churn_prediction",
  };

  static FORECAST_PERIODS = {
    DAILY: 1,
    WEEKLY: 7,
    MONTHLY: 30,
    QUARTERLY: 90,
  };

  // ==================== DEMAND FORECASTING ====================

  /**
   * Predict future demand for products using historical sales data
   */
  static async forecastDemand(productId, forecastDays = 30) {
    try {
      console.log(
        `🤖 [ML] Forecasting demand for product ${productId} for ${forecastDays} days`
      );

      // Get historical sales data for the product
      const salesHistory = await this.getProductSalesHistory(productId, 90);

      if (salesHistory.length < 7) {
        console.warn(
          `⚠️ [ML] Insufficient data for product ${productId}. Need at least 7 data points.`
        );
        return this.getBasicForecast(salesHistory, forecastDays);
      }

      // Apply time series analysis
      const forecast = await this.applyTimeSeriesForecasting(
        salesHistory,
        forecastDays
      );

      // Add seasonality and trend analysis
      const enhancedForecast = await this.addSeasonalityAnalysis(
        forecast,
        salesHistory
      );

      // Calculate confidence intervals
      const finalForecast = this.calculateConfidenceIntervals(enhancedForecast);

      console.log(`✅ [ML] Demand forecast generated for product ${productId}`);
      return finalForecast;
    } catch (error) {
      console.error("❌ [ML] Error in demand forecasting:", error);
      throw error;
    }
  }

  /**
   * Batch forecast demand for multiple products
   */
  static async batchForecastDemand(productIds, forecastDays = 30) {
    try {
      console.log(
        `🤖 [ML] Starting batch demand forecasting for ${productIds.length} products`
      );

      const forecasts = await Promise.all(
        productIds.map((productId) =>
          this.forecastDemand(productId, forecastDays).catch((error) => ({
            productId,
            error: error.message,
            forecast: null,
          }))
        )
      );

      const successful = forecasts.filter((f) => f.forecast);
      const failed = forecasts.filter((f) => f.error);

      console.log(
        `✅ [ML] Batch forecasting complete: ${successful.length} successful, ${failed.length} failed`
      );

      return {
        successful,
        failed,
        summary: {
          totalProducts: productIds.length,
          successRate: (successful.length / productIds.length) * 100,
        },
      };
    } catch (error) {
      console.error("❌ [ML] Error in batch demand forecasting:", error);
      throw error;
    }
  }

  // ==================== PRICE OPTIMIZATION ====================

  /**
   * Optimize pricing based on demand elasticity and competition
   */
  static async optimizePrice(productId, currentPrice, targetMargin = 0.3) {
    try {
      console.log(`🤖 [ML] Optimizing price for product ${productId}`);

      // Get demand elasticity data
      const elasticity = await this.calculateDemandElasticity(productId);

      // Get competitor pricing data (if available)
      const marketData = await this.getMarketPricingData(productId);

      // Calculate optimal price point
      const optimization = this.calculateOptimalPrice({
        currentPrice,
        targetMargin,
        elasticity,
        marketData,
        productId,
      });

      console.log(
        `✅ [ML] Price optimization complete for product ${productId}`
      );
      return optimization;
    } catch (error) {
      console.error("❌ [ML] Error in price optimization:", error);
      throw error;
    }
  }

  /**
   * Generate dynamic pricing recommendations
   */
  static async generateDynamicPricing(productIds, marketConditions = {}) {
    try {
      console.log(
        `🤖 [ML] Generating dynamic pricing for ${productIds.length} products`
      );

      const recommendations = [];

      for (const productId of productIds) {
        try {
          // Get current product data
          const productData = await this.getProductAnalytics(productId);

          // Calculate dynamic price factors
          const pricingFactors = {
            demandTrend: productData.demandTrend,
            stockLevel: productData.stockLevel,
            seasonality: productData.seasonality,
            competition: marketConditions.competition || "medium",
            marketTrend: marketConditions.trend || "stable",
          };

          // Generate price recommendation
          const recommendation = this.calculateDynamicPrice(
            productData,
            pricingFactors
          );

          recommendations.push({
            productId,
            currentPrice: productData.currentPrice,
            recommendedPrice: recommendation.price,
            priceChange: recommendation.change,
            reasoning: recommendation.reasoning,
            confidence: recommendation.confidence,
            expectedImpact: recommendation.impact,
          });
        } catch (error) {
          console.warn(
            `⚠️ [ML] Failed to generate pricing for product ${productId}:`,
            error.message
          );
        }
      }

      console.log(
        `✅ [ML] Dynamic pricing generated for ${recommendations.length} products`
      );
      return recommendations;
    } catch (error) {
      console.error("❌ [ML] Error in dynamic pricing:", error);
      throw error;
    }
  }

  // ==================== INVENTORY OPTIMIZATION ====================

  /**
   * Calculate optimal reorder points and quantities
   */
  static async optimizeInventory(productId) {
    try {
      console.log(`🤖 [ML] Optimizing inventory for product ${productId}`);

      // Get demand forecast
      const demandForecast = await this.forecastDemand(productId, 30);

      // Get historical stock-out data
      const _stockoutHistory = await this.getStockoutHistory(productId);

      // Calculate lead times
      const leadTimeAnalysis = await this.analyzeLeadTimes(productId);

      // Calculate safety stock
      const safetyStock = this.calculateSafetyStock(
        demandForecast,
        leadTimeAnalysis
      );

      // Calculate reorder point
      const reorderPoint = this.calculateReorderPoint(
        demandForecast,
        leadTimeAnalysis,
        safetyStock
      );

      // Calculate economic order quantity (EOQ)
      const eoq = this.calculateEOQ(productId, demandForecast);

      const optimization = {
        productId,
        currentStock: await this.getCurrentStock(productId),
        reorderPoint: Math.ceil(reorderPoint),
        optimalOrderQuantity: Math.ceil(eoq),
        safetyStock: Math.ceil(safetyStock),
        forecastedDemand: demandForecast.totalDemand,
        recommendedAction: this.getInventoryAction(
          productId,
          reorderPoint,
          eoq
        ),
        confidence: this.calculateInventoryConfidence(
          demandForecast,
          leadTimeAnalysis
        ),
        costImpact: this.calculateCostImpact(eoq, safetyStock),
      };

      console.log(
        `✅ [ML] Inventory optimization complete for product ${productId}`
      );
      return optimization;
    } catch (error) {
      console.error("❌ [ML] Error in inventory optimization:", error);
      throw error;
    }
  }

  /**
   * Generate inventory recommendations for all products
   */
  static async generateInventoryRecommendations() {
    try {
      console.log("🤖 [ML] Generating comprehensive inventory recommendations");

      // Get all active products
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, stock_in_pieces, price_per_piece")
        .eq("is_active", true);

      if (error) throw error;

      const recommendations = [];
      const criticalItems = [];
      const optimizationOpportunities = [];

      for (const product of products) {
        try {
          const optimization = await this.optimizeInventory(product.id);

          recommendations.push(optimization);

          // Identify critical items
          if (optimization.currentStock <= optimization.reorderPoint) {
            criticalItems.push({
              ...optimization,
              urgency:
                optimization.currentStock <= optimization.safetyStock
                  ? "critical"
                  : "high",
            });
          }

          // Identify optimization opportunities
          if (optimization.costImpact.savings > 100) {
            optimizationOpportunities.push(optimization);
          }
        } catch (error) {
          console.warn(
            `⚠️ [ML] Failed to optimize inventory for product ${product.id}:`,
            error.message
          );
        }
      }

      const summary = {
        totalProducts: products.length,
        processedProducts: recommendations.length,
        criticalItems: criticalItems.length,
        optimizationOpportunities: optimizationOpportunities.length,
        totalPotentialSavings: optimizationOpportunities.reduce(
          (sum, opt) => sum + opt.costImpact.savings,
          0
        ),
      };

      console.log(
        `✅ [ML] Inventory recommendations generated: ${summary.processedProducts} products analyzed`
      );

      return {
        recommendations,
        criticalItems,
        optimizationOpportunities,
        summary,
      };
    } catch (error) {
      console.error(
        "❌ [ML] Error generating inventory recommendations:",
        error
      );
      throw error;
    }
  }

  /**
   * Alias for generateInventoryRecommendations (for backwards compatibility)
   */
  static async getInventoryRecommendations() {
    return await this.generateInventoryRecommendations();
  }

  // ==================== CUSTOMER ANALYTICS ====================

  /**
   * Segment customers based on purchasing behavior
   */
  static async segmentCustomers() {
    try {
      console.log("🤖 [ML] Performing customer segmentation analysis");

      // Get customer transaction data
      const customerData = await this.getCustomerTransactionData();

      // Calculate RFM scores (Recency, Frequency, Monetary)
      const rfmScores = this.calculateRFMScores(customerData);

      // Apply clustering algorithm
      const segments = this.clusterCustomers(rfmScores);

      // Generate segment profiles
      const segmentProfiles = this.generateSegmentProfiles(segments);

      console.log(
        `✅ [ML] Customer segmentation complete: ${segments.length} segments identified`
      );

      return {
        segments: segmentProfiles,
        customerSegments: segments,
        summary: {
          totalCustomers: customerData.length,
          segmentCount: segmentProfiles.length,
        },
      };
    } catch (error) {
      console.error("❌ [ML] Error in customer segmentation:", error);
      throw error;
    }
  }

  // ==================== PREDICTIVE ANALYTICS ====================

  /**
   * Predict product lifecycle and recommend actions
   */
  static async predictProductLifecycle(productId) {
    try {
      console.log(`🤖 [ML] Analyzing product lifecycle for ${productId}`);

      const salesHistory = await this.getProductSalesHistory(productId, 180);
      const lifecycle = this.analyzeProductLifecycle(salesHistory);

      const predictions = {
        currentStage: lifecycle.stage,
        confidence: lifecycle.confidence,
        timeToNextStage: lifecycle.timeToNext,
        recommendedActions: this.getLifecycleRecommendations(lifecycle),
        riskFactors: lifecycle.risks,
      };

      console.log(
        `✅ [ML] Product lifecycle analysis complete for ${productId}`
      );
      return predictions;
    } catch (error) {
      console.error("❌ [ML] Error in product lifecycle prediction:", error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  static async getProductSalesHistory(productId, days) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // OPTIMIZED QUERY: Use focused select and proper indexing
      const { data, error } = await supabase
        .from("pos_transaction_items")
        .select(
          `
          quantity,
          unit_price,
          created_at,
          pos_transactions!inner(status)
        `
        )
        .eq("product_id", productId)
        .eq("pos_transactions.status", "completed")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(1000); // Prevent excessive data loading

      if (error) {
        console.error("❌ [ML] Error fetching sales history:", error);
        console.error("❌ [ML] Query details:", {
          productId,
          startDate: startDate.toISOString(),
          days,
        });
        return [];
      }

      if (!data || data.length === 0) {
        console.warn(
          `⚠️ [ML] No sales data found for product ${productId} in last ${days} days`
        );
        return [];
      }

      // Transform data into time series format for ML algorithms
      const timeSeriesData = this.aggregateSalesDataByDay(
        data,
        startDate,
        days
      );

      console.log(
        `📊 [ML] Retrieved and processed ${timeSeriesData.length} daily data points for product ${productId}`
      );
      return timeSeriesData;
    } catch (error) {
      console.error("❌ [ML] Error in getProductSalesHistory:", error);
      return [];
    }
  }

  /**
   * Aggregate raw sales data into daily time series for ML algorithms
   * CRITICAL: This ensures consistent daily intervals and proper data formatting
   */
  static aggregateSalesDataByDay(rawData, startDate, days) {
    try {
      console.log(
        `🔧 [ML] Aggregating ${
          rawData?.length || 0
        } raw sales records into daily time series`
      );

      // Create a map to aggregate sales by date
      const dailyAggregation = new Map();
      const endDate = new Date(
        startDate.getTime() + days * 24 * 60 * 60 * 1000
      );

      // Initialize all days with zero values to ensure consistent time series
      for (
        let d = new Date(startDate);
        d < endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD format
        dailyAggregation.set(dateKey, {
          date: new Date(d),
          quantity: 0,
          revenue: 0,
          transactionCount: 0,
          value: 0, // Main value for forecasting
        });
      }

      // Aggregate raw data by day
      rawData?.forEach((item) => {
        const itemDate = new Date(item.created_at);
        const dateKey = itemDate.toISOString().split("T")[0];

        if (dailyAggregation.has(dateKey)) {
          const dayData = dailyAggregation.get(dateKey);
          dayData.quantity += item.quantity;
          dayData.revenue += item.quantity * item.unit_price;
          dayData.transactionCount += 1;
          dayData.value = dayData.quantity; // Update main forecasting value
        }
      });

      // Convert to sorted array
      const timeSeriesArray = Array.from(dailyAggregation.values()).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      console.log(
        `✅ [ML] Successfully aggregated into ${timeSeriesArray.length} daily data points`
      );
      console.log(
        `📈 [ML] Data range: ${
          timeSeriesArray[0]?.date.toISOString().split("T")[0]
        } to ${
          timeSeriesArray[timeSeriesArray.length - 1]?.date
            .toISOString()
            .split("T")[0]
        }`
      );

      // Log data quality metrics
      const nonZeroDays = timeSeriesArray.filter(
        (day) => day.quantity > 0
      ).length;
      const totalQuantity = timeSeriesArray.reduce(
        (sum, day) => sum + day.quantity,
        0
      );
      console.log(
        `📊 [ML] Data quality: ${nonZeroDays}/${timeSeriesArray.length} days with sales, total quantity: ${totalQuantity}`
      );

      return timeSeriesArray;
    } catch (error) {
      console.error("❌ [ML] Error in aggregateSalesDataByDay:", error);
      return [];
    }
  }

  static getBasicForecast(salesHistory, forecastDays) {
    if (salesHistory.length === 0) {
      return {
        forecast: Array(forecastDays).fill(0),
        confidence: 0.1,
        totalDemand: 0,
        averageDailyDemand: 0,
      };
    }

    const totalQuantity = salesHistory.reduce(
      (sum, sale) => sum + sale.quantity,
      0
    );
    const averageDaily = totalQuantity / salesHistory.length;

    return {
      forecast: Array(forecastDays).fill(averageDaily),
      confidence: 0.3,
      totalDemand: averageDaily * forecastDays,
      averageDailyDemand: averageDaily,
    };
  }

  static async applyTimeSeriesForecasting(salesHistory, forecastDays) {
    const values = salesHistory.map((sale) => sale.quantity);
    const dates = salesHistory.map((sale) => new Date(sale.date));

    console.log(
      `🔬 [ML] Applying advanced forecasting algorithms to ${values.length} data points`
    );

    // Enhanced algorithm ensemble with new advanced algorithms
    const algorithms = [
      { name: "exponentialSmoothing", weight: 0.2 },
      { name: "holtWinters", weight: 0.2 },
      { name: "linearRegression", weight: 0.15 },
      { name: "seasonalDecomposition", weight: 0.1 },
      { name: "randomForest", weight: 0.15 }, // New advanced algorithm
      { name: "arima", weight: 0.1 }, // New advanced algorithm
      { name: "prophet", weight: 0.1 }, // New advanced algorithm
    ];

    const forecasts = {};
    const confidences = {};

    // Apply existing algorithms...
    try {
      const esResult = this.exponentialSmoothing(values, forecastDays);
      forecasts.exponentialSmoothing = esResult.forecast;
      confidences.exponentialSmoothing = esResult.confidence;
    } catch (error) {
      console.warn("⚠️ [ML] Exponential smoothing failed:", error.message);
      forecasts.exponentialSmoothing = this.fallbackForecast(
        values,
        forecastDays
      );
      confidences.exponentialSmoothing = 0.3;
    }

    try {
      const hwResult = this.holtWinters(values, dates, forecastDays);
      forecasts.holtWinters = hwResult.forecast;
      confidences.holtWinters = hwResult.confidence;
    } catch (error) {
      console.warn("⚠️ [ML] Holt-Winters failed:", error.message);
      forecasts.holtWinters = this.fallbackForecast(values, forecastDays);
      confidences.holtWinters = 0.3;
    }

    try {
      const lrResult = this.linearRegressionForecast(values, forecastDays);
      forecasts.linearRegression = lrResult.forecast;
      confidences.linearRegression = lrResult.confidence;
    } catch (error) {
      console.warn("⚠️ [ML] Linear regression failed:", error.message);
      forecasts.linearRegression = this.fallbackForecast(values, forecastDays);
      confidences.linearRegression = 0.3;
    }

    try {
      const sdResult = this.seasonalDecomposition(values, dates, forecastDays);
      forecasts.seasonalDecomposition = sdResult.forecast;
      confidences.seasonalDecomposition = sdResult.confidence;
    } catch (error) {
      console.warn("⚠️ [ML] Seasonal decomposition failed:", error.message);
      forecasts.seasonalDecomposition = this.fallbackForecast(
        values,
        forecastDays
      );
      confidences.seasonalDecomposition = 0.3;
    }

    // Apply NEW ADVANCED ALGORITHMS
    try {
      console.log("🌲 [ML] Applying Random Forest ensemble...");
      const rfResult = this.randomForestForecast(values, dates, forecastDays);
      forecasts.randomForest = rfResult.forecast;
      confidences.randomForest = rfResult.confidence;
    } catch (error) {
      console.warn("⚠️ [ML] Random Forest failed:", error.message);
      forecasts.randomForest = this.fallbackForecast(values, forecastDays);
      confidences.randomForest = 0.3;
    }

    try {
      console.log("📈 [ML] Applying ARIMA model...");
      const arimaResult = this.arimaForecast(values, forecastDays);
      forecasts.arima = arimaResult.forecast;
      confidences.arima = arimaResult.confidence;
    } catch (error) {
      console.warn("⚠️ [ML] ARIMA failed:", error.message);
      forecasts.arima = this.fallbackForecast(values, forecastDays);
      confidences.arima = 0.3;
    }

    try {
      console.log("🔮 [ML] Applying Prophet algorithm...");
      const prophetResult = this.prophetForecast(values, dates, forecastDays);
      forecasts.prophet = prophetResult.forecast;
      confidences.prophet = prophetResult.confidence;
    } catch (error) {
      console.warn("⚠️ [ML] Prophet failed:", error.message);
      forecasts.prophet = this.fallbackForecast(values, forecastDays);
      confidences.prophet = 0.3;
    }

    // Ensemble the forecasts using weighted average
    const ensembleForecast = this.ensembleForecasts(forecasts, algorithms);
    const ensembleConfidence = this.calculateEnsembleConfidence(
      confidences,
      algorithms
    );

    // Calculate additional metrics
    const trend = this.calculateAdvancedTrend(values);
    const volatility = this.calculateVolatility(values);
    const seasonality = this.detectSeasonality(values, dates);

    // Enhanced model validation
    const modelValidation = this.validateEnsembleModel(forecasts, values);

    console.log(
      `✅ [ML] Enhanced forecasting complete - Confidence: ${(
        ensembleConfidence * 100
      ).toFixed(1)}% (${Object.keys(forecasts).length} algorithms)`
    );

    return {
      forecast: ensembleForecast,
      trend,
      volatility,
      seasonality,
      confidence: ensembleConfidence,
      totalDemand: ensembleForecast.reduce((sum, val) => sum + val, 0),
      averageDailyDemand:
        ensembleForecast.reduce((sum, val) => sum + val, 0) / forecastDays,
      algorithms: Object.keys(forecasts),
      individualForecasts: forecasts,
      algorithmConfidences: confidences,
      modelMetrics: {
        mape: this.calculateMAPE(
          values.slice(-7),
          forecasts.exponentialSmoothing?.slice(0, 7) || []
        ),
        rmse: this.calculateRMSE(
          values.slice(-7),
          forecasts.exponentialSmoothing?.slice(0, 7) || []
        ),
        ensembleAccuracy: modelValidation.accuracy,
        algorithmPerformance: modelValidation.algorithmPerformance,
      },
      ensembleMetadata: {
        totalAlgorithms: algorithms.length,
        successfulAlgorithms: Object.keys(forecasts).length,
        ensembleWeights: algorithms,
        confidenceDistribution: confidences,
      },
    };
  }

  // ==================== ADVANCED FORECASTING ALGORITHMS ====================

  /**
   * Exponential Smoothing (Single, Double, Triple)
   */
  static exponentialSmoothing(values, forecastDays, alpha = 0.3) {
    if (values.length === 0)
      throw new Error("No data for exponential smoothing");

    // Simple Exponential Smoothing
    let smoothed = [values[0]];

    for (let i = 1; i < values.length; i++) {
      const smoothValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothValue);
    }

    // Generate forecast
    const forecast = [];
    let lastSmoothed = smoothed[smoothed.length - 1];

    for (let i = 0; i < forecastDays; i++) {
      forecast.push(Math.max(0, lastSmoothed));
    }

    // Calculate confidence based on forecast error
    const errors = values.slice(1).map((val, i) => Math.abs(val - smoothed[i]));
    const mae = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const confidence = Math.max(
      0.1,
      1 - mae / (values.reduce((sum, val) => sum + val, 0) / values.length)
    );

    return { forecast, confidence };
  }

  /**
   * Holt-Winters Triple Exponential Smoothing
   */
  static holtWinters(
    values,
    dates,
    forecastDays,
    alpha = 0.3,
    beta = 0.3,
    gamma = 0.3
  ) {
    if (values.length < 14) {
      // Fall back to double exponential smoothing for insufficient data
      return this.doubleExponentialSmoothing(values, forecastDays, alpha, beta);
    }

    const seasonLength = this.detectSeasonalLength(values, dates);
    if (seasonLength < 2) {
      return this.doubleExponentialSmoothing(values, forecastDays, alpha, beta);
    }

    // Initialize components
    const level = [];
    const trend = [];
    const seasonal = new Array(seasonLength).fill(0);

    // Initialize seasonal indices
    for (let i = 0; i < seasonLength; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i; j < values.length; j += seasonLength) {
        sum += values[j];
        count++;
      }
      seasonal[i] = count > 0 ? sum / count : 1;
    }

    // Deseasonalize initial values for level and trend
    const avgSeasonal =
      seasonal.reduce((sum, val) => sum + val, 0) / seasonLength;
    for (let i = 0; i < seasonLength; i++) {
      seasonal[i] /= avgSeasonal;
    }

    level[0] = values[0] / seasonal[0];
    trend[0] = 0;

    // Apply Holt-Winters
    for (let i = 1; i < values.length; i++) {
      const seasonalIndex = i % seasonLength;

      level[i] =
        alpha * (values[i] / seasonal[seasonalIndex]) +
        (1 - alpha) * (level[i - 1] + trend[i - 1]);
      trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
      seasonal[seasonalIndex] =
        gamma * (values[i] / level[i]) + (1 - gamma) * seasonal[seasonalIndex];
    }

    // Generate forecast
    const forecast = [];
    const lastLevel = level[level.length - 1];
    const lastTrend = trend[trend.length - 1];

    for (let i = 0; i < forecastDays; i++) {
      const seasonalIndex = (values.length + i) % seasonLength;
      const forecastValue =
        (lastLevel + lastTrend * (i + 1)) * seasonal[seasonalIndex];
      forecast.push(Math.max(0, forecastValue));
    }

    return {
      forecast,
      confidence: this.calculateHoltWintersConfidence(
        values,
        level,
        trend,
        seasonal
      ),
    };
  }

  /**
   * Double Exponential Smoothing (Holt's method)
   */
  static doubleExponentialSmoothing(
    values,
    forecastDays,
    alpha = 0.3,
    beta = 0.3
  ) {
    const level = [values[0]];
    const trend = [values[1] - values[0]];

    for (let i = 1; i < values.length; i++) {
      level[i] =
        alpha * values[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
      trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
    }

    const forecast = [];
    const lastLevel = level[level.length - 1];
    const lastTrend = trend[trend.length - 1];

    for (let i = 0; i < forecastDays; i++) {
      forecast.push(Math.max(0, lastLevel + lastTrend * (i + 1)));
    }

    return {
      forecast,
      confidence: 0.7, // Base confidence for double exponential smoothing
    };
  }

  /**
   * Linear Regression Forecast with trend analysis
   */
  static linearRegressionForecast(values, forecastDays) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    // Calculate linear regression coefficients
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    for (let i = 0; i < forecastDays; i++) {
      const forecastValue = intercept + slope * (n + i);
      forecast.push(Math.max(0, forecastValue));
    }

    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const totalSumSquares = y.reduce(
      (sum, val) => sum + Math.pow(val - yMean, 2),
      0
    );
    const residualSumSquares = y.reduce((sum, val, i) => {
      const predicted = intercept + slope * i;
      return sum + Math.pow(val - predicted, 2);
    }, 0);

    const rSquared = 1 - residualSumSquares / totalSumSquares;
    const confidence = Math.max(0.1, Math.min(0.95, rSquared));

    return { forecast, confidence, slope, intercept, rSquared };
  }

  /**
   * Seasonal Decomposition
   */
  static seasonalDecomposition(values, dates, forecastDays) {
    if (values.length < 28) {
      throw new Error("Insufficient data for seasonal decomposition");
    }

    const seasonLength = this.detectSeasonalLength(values, dates);
    if (seasonLength < 2) {
      throw new Error("No clear seasonality detected");
    }

    // Decompose into trend, seasonal, and residual components
    const decomposition = this.decomposeTimeSeries(values, seasonLength);

    // Forecast each component separately
    const trendForecast = this.forecastTrend(decomposition.trend, forecastDays);
    const seasonalForecast = this.forecastSeasonal(
      decomposition.seasonal,
      forecastDays,
      seasonLength
    );

    // Combine forecasts
    const forecast = trendForecast.map((trend, i) => {
      const seasonal = seasonalForecast[i];
      return Math.max(0, trend + seasonal);
    });

    return {
      forecast,
      confidence: 0.75, // Generally good confidence for seasonal decomposition
      components: decomposition,
    };
  }

  // ==================== ADVANCED ML ALGORITHMS ====================

  /**
   * Random Forest Time Series Forecasting
   * Uses ensemble of decision trees with feature engineering
   */
  static randomForestForecast(values, dates, forecastDays) {
    console.log("🌲 [ML] Implementing Random Forest ensemble forecasting...");

    if (values.length < 14) {
      throw new Error(
        "Insufficient data for Random Forest (need at least 14 points)"
      );
    }

    // Feature engineering for time series
    const features = this.engineerTimeSeriesFeatures(values, dates);

    // Build multiple decision trees (simplified random forest)
    const numTrees = Math.min(10, Math.floor(values.length / 3));
    const trees = [];

    for (let i = 0; i < numTrees; i++) {
      try {
        const tree = this.buildDecisionTree(features, values, i);
        trees.push(tree);
      } catch (error) {
        console.warn(`⚠️ [ML] Tree ${i} failed, skipping:`, error.message);
      }
    }

    if (trees.length === 0) {
      throw new Error("No decision trees could be built");
    }

    // Generate forecast using ensemble of trees
    const forecast = [];
    const baseDate = new Date(dates[dates.length - 1]);

    for (let day = 1; day <= forecastDays; day++) {
      const forecastDate = new Date(baseDate);
      forecastDate.setDate(forecastDate.getDate() + day);

      // Create features for forecast day
      const forecastFeatures = this.createForecastFeatures(
        values,
        dates,
        forecastDate,
        day
      );

      // Get predictions from all trees
      const treePredictions = trees
        .map((tree) => this.predictWithTree(tree, forecastFeatures))
        .filter((pred) => !isNaN(pred) && isFinite(pred));

      // Ensemble average
      const avgPrediction =
        treePredictions.length > 0
          ? treePredictions.reduce((sum, pred) => sum + pred, 0) /
            treePredictions.length
          : 0;

      forecast.push(Math.max(0, avgPrediction));
    }

    // Calculate confidence based on tree agreement
    const confidence = this.calculateRandomForestConfidence(
      trees,
      features,
      values
    );

    console.log(
      `✅ [ML] Random Forest complete: ${trees.length} trees, confidence: ${(
        confidence * 100
      ).toFixed(1)}%`
    );

    return {
      forecast,
      confidence,
      metadata: {
        numTrees: trees.length,
        featuresUsed: Object.keys(features[0] || {}),
        treeDepths: trees.map((tree) => tree.depth || 1),
      },
    };
  }

  /**
   * ARIMA (AutoRegressive Integrated Moving Average) Forecasting
   * Simplified implementation focusing on core ARIMA concepts
   */
  static arimaForecast(values, forecastDays) {
    console.log("📈 [ML] Implementing ARIMA forecasting...");

    if (values.length < 20) {
      throw new Error("Insufficient data for ARIMA (need at least 20 points)");
    }

    // Determine ARIMA parameters (p, d, q) using simplified heuristics
    const arimaParams = this.determineARIMAParameters(values);
    const { p, d, q } = arimaParams;

    console.log(`📊 [ML] ARIMA parameters: p=${p}, d=${d}, q=${q}`);

    // Apply differencing to make series stationary
    const stationarySeries = this.makeStationary(values, d);

    if (stationarySeries.length < 10) {
      throw new Error("Series too short after differencing");
    }

    // Fit AR (AutoRegressive) component
    const arCoefficients = this.fitAutoRegressive(stationarySeries, p);

    // Fit MA (Moving Average) component
    const maCoefficients = this.fitMovingAverage(
      stationarySeries,
      arCoefficients,
      q
    );

    // Generate forecast
    const forecast = this.generateARIMAForecast(
      stationarySeries,
      arCoefficients,
      maCoefficients,
      forecastDays,
      d
    );

    // Calculate confidence based on model fit
    const confidence = this.calculateARIMAConfidence(
      stationarySeries,
      arCoefficients,
      maCoefficients
    );

    console.log(
      `✅ [ML] ARIMA complete: (${p},${d},${q}), confidence: ${(
        confidence * 100
      ).toFixed(1)}%`
    );

    return {
      forecast,
      confidence,
      parameters: { p, d, q },
      coefficients: {
        ar: arCoefficients,
        ma: maCoefficients,
      },
      metadata: {
        stationarySeriesLength: stationarySeries.length,
        originalSeriesLength: values.length,
        differencingOrder: d,
      },
    };
  }

  /**
   * Prophet-like Algorithm for Time Series Forecasting
   * Simplified implementation inspired by Facebook's Prophet
   */
  static prophetForecast(values, dates, forecastDays) {
    console.log("🔮 [ML] Implementing Prophet-like forecasting...");

    if (values.length < 21) {
      throw new Error(
        "Insufficient data for Prophet (need at least 21 points)"
      );
    }

    // Decompose time series into components (like Prophet)
    const components = this.prophetDecomposition(values, dates);

    // Fit growth model (linear or logistic)
    const growthModel = this.fitGrowthModel(values, dates);

    // Model seasonality (daily, weekly patterns)
    const seasonalModel = this.modelSeasonality(values, dates);

    // Model holidays/special events (simplified)
    const holidayModel = this.modelHolidays(values, dates);

    // Generate future dates
    const futureDates = this.generateFutureDates(dates, forecastDays);

    // Generate forecast by combining components
    const forecast = futureDates.map((date, i) => {
      const trend = this.predictTrend(growthModel, date);
      const seasonal = this.predictSeasonal(seasonalModel, date);
      const holiday = this.predictHoliday(holidayModel, date);

      const prediction = trend + seasonal + holiday;
      return Math.max(0, prediction);
    });

    // Calculate uncertainty intervals (simplified)
    const uncertainty = this.calculateProphetUncertainty(components, forecast);

    // Calculate confidence based on component fit quality
    const confidence = this.calculateProphetConfidence(
      components,
      growthModel,
      seasonalModel
    );

    console.log(
      `✅ [ML] Prophet complete: confidence: ${(confidence * 100).toFixed(1)}%`
    );

    return {
      forecast,
      confidence,
      components: {
        trend: growthModel,
        seasonal: seasonalModel,
        holiday: holidayModel,
      },
      uncertainty,
      metadata: {
        trendType: growthModel.type,
        seasonalPeriods: seasonalModel.periods,
        holidayEffects: holidayModel.effects.length,
      },
    };
  }

  // ==================== ADVANCED ALGORITHM UTILITIES ====================

  /**
   * Engineer features for Random Forest time series
   */
  static engineerTimeSeriesFeatures(values, dates) {
    const features = [];

    for (let i = 7; i < values.length; i++) {
      // Need at least 7 previous values
      const feature = {
        // Lag features
        lag1: values[i - 1] || 0,
        lag2: values[i - 2] || 0,
        lag3: values[i - 3] || 0,
        lag7: values[i - 7] || 0,

        // Rolling statistics
        ma3: this.calculateMovingAverage(values.slice(i - 3, i), 3)[0] || 0,
        ma7: this.calculateMovingAverage(values.slice(i - 7, i), 7)[0] || 0,

        // Temporal features
        dayOfWeek: new Date(dates[i]).getDay(),
        dayOfMonth: new Date(dates[i]).getDate(),
        month: new Date(dates[i]).getMonth(),

        // Trend features
        trend3: this.calculateTrend(values.slice(i - 3, i)),
        trend7: this.calculateTrend(values.slice(i - 7, i)),

        // Volatility features
        volatility3: this.calculateVolatility(values.slice(i - 3, i)),
        volatility7: this.calculateVolatility(values.slice(i - 7, i)),

        // Target
        target: values[i],
      };

      features.push(feature);
    }

    return features;
  }

  /**
   * Build a simplified decision tree for time series
   */
  static buildDecisionTree(features, values, seed = 0) {
    // Simple decision tree implementation
    const sampleFeatures = this.bootstrapSample(features, seed);
    const tree = this.growTree(sampleFeatures, 0, 5); // max depth 5

    return {
      ...tree,
      depth: this.calculateTreeDepth(tree),
    };
  }

  /**
   * Bootstrap sampling for Random Forest
   */
  static bootstrapSample(features, seed) {
    const n = features.length;
    const sample = [];

    // Simple seeded random (for reproducibility)
    let random = seed * 12345;

    for (let i = 0; i < n; i++) {
      random = (random * 1103515245 + 12345) % 2 ** 31;
      const index = Math.floor((random / 2 ** 31) * n);
      sample.push(features[index]);
    }

    return sample;
  }

  /**
   * Grow decision tree recursively
   */
  static growTree(samples, depth, maxDepth) {
    if (depth >= maxDepth || samples.length < 3) {
      // Leaf node
      const targets = samples.map((s) => s.target);
      return {
        type: "leaf",
        value: targets.reduce((sum, val) => sum + val, 0) / targets.length,
        samples: samples.length,
      };
    }

    // Find best split
    const bestSplit = this.findBestSplit(samples);

    if (!bestSplit || bestSplit.gain < 0.01) {
      // No good split found
      const targets = samples.map((s) => s.target);
      return {
        type: "leaf",
        value: targets.reduce((sum, val) => sum + val, 0) / targets.length,
        samples: samples.length,
      };
    }

    // Split samples
    const leftSamples = samples.filter(
      (s) => s[bestSplit.feature] <= bestSplit.threshold
    );
    const rightSamples = samples.filter(
      (s) => s[bestSplit.feature] > bestSplit.threshold
    );

    return {
      type: "node",
      feature: bestSplit.feature,
      threshold: bestSplit.threshold,
      left: this.growTree(leftSamples, depth + 1, maxDepth),
      right: this.growTree(rightSamples, depth + 1, maxDepth),
      samples: samples.length,
    };
  }

  /**
   * Find best split for decision tree
   */
  static findBestSplit(samples) {
    const features = [
      "lag1",
      "lag2",
      "lag3",
      "lag7",
      "ma3",
      "ma7",
      "trend3",
      "trend7",
    ];
    let bestSplit = null;
    let bestGain = -Infinity;

    for (const feature of features) {
      const values = samples.map((s) => s[feature]).filter((v) => !isNaN(v));
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const gain = this.calculateSplitGain(samples, feature, threshold);

        if (gain > bestGain) {
          bestGain = gain;
          bestSplit = { feature, threshold, gain };
        }
      }
    }

    return bestSplit;
  }

  /**
   * Calculate information gain for a split
   */
  static calculateSplitGain(samples, feature, threshold) {
    const leftSamples = samples.filter((s) => s[feature] <= threshold);
    const rightSamples = samples.filter((s) => s[feature] > threshold);

    if (leftSamples.length === 0 || rightSamples.length === 0) {
      return -Infinity;
    }

    const totalVariance = this.calculateVariance(samples.map((s) => s.target));
    const leftVariance = this.calculateVariance(
      leftSamples.map((s) => s.target)
    );
    const rightVariance = this.calculateVariance(
      rightSamples.map((s) => s.target)
    );

    const weightedVariance =
      (leftSamples.length / samples.length) * leftVariance +
      (rightSamples.length / samples.length) * rightVariance;

    return totalVariance - weightedVariance;
  }

  /**
   * ARIMA parameter determination using simplified heuristics
   */
  static determineARIMAParameters(values) {
    // Simplified parameter selection
    const diff1 = this.differenceOnce(values);
    const isStationary = this.testStationarity(diff1);

    return {
      p: Math.min(3, Math.floor(values.length / 10)), // AR order
      d: isStationary ? 1 : 2, // Differencing order
      q: Math.min(2, Math.floor(values.length / 15)), // MA order
    };
  }

  /**
   * Make time series stationary through differencing
   */
  static makeStationary(values, order) {
    let series = values.slice();

    for (let d = 0; d < order; d++) {
      series = this.differenceOnce(series);
    }

    return series;
  }

  /**
   * Apply first-order differencing
   */
  static differenceOnce(values) {
    const diff = [];
    for (let i = 1; i < values.length; i++) {
      diff.push(values[i] - values[i - 1]);
    }
    return diff;
  }

  /**
   * Simple stationarity test
   */
  static testStationarity(values) {
    if (values.length < 10) return false;

    // Simple test: compare variance of first and second half
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);

    const var1 = this.calculateVariance(firstHalf);
    const var2 = this.calculateVariance(secondHalf);

    // If variances are similar, consider stationary
    return Math.abs(var1 - var2) < Math.max(var1, var2) * 0.5;
  }

  /**
   * Fit autoregressive component
   */
  static fitAutoRegressive(series, order) {
    if (order === 0 || series.length <= order) return [];

    // Simple AR fitting using least squares
    const X = [];
    const y = [];

    for (let i = order; i < series.length; i++) {
      const row = [];
      for (let j = 1; j <= order; j++) {
        row.push(series[i - j]);
      }
      X.push(row);
      y.push(series[i]);
    }

    return this.leastSquares(X, y);
  }

  /**
   * Fit moving average component
   */
  static fitMovingAverage(series, arCoeffs, order) {
    if (order === 0) return [];

    // Calculate residuals from AR model
    const residuals = this.calculateARResiduals(series, arCoeffs);

    // Fit MA model to residuals (simplified)
    const coeffs = [];
    for (let i = 0; i < order; i++) {
      coeffs.push(0.1); // Simplified MA coefficients
    }

    return coeffs;
  }

  /**
   * Simple least squares estimation
   */
  static leastSquares(X, y) {
    const n = X.length;
    const k = X[0].length;

    if (n === 0 || k === 0) return [];

    // Normal equations: X'X * beta = X'y
    const XtX = this.matrixMultiply(this.transpose(X), X);
    const Xty = this.matrixVectorMultiply(this.transpose(X), y);

    // Solve using simple methods (for small matrices)
    return this.solveLinearSystem(XtX, Xty);
  }

  /**
   * Prophet-like decomposition
   */
  static prophetDecomposition(values, dates) {
    // Decompose into trend, seasonality, and noise
    const trend = this.extractTrend(values, dates);
    const detrended = values.map((val, i) => val - trend[i]);
    const seasonal = this.extractSeasonality(detrended, dates);
    const residual = detrended.map((val, i) => val - seasonal[i]);

    return { trend, seasonal, residual };
  }

  /**
   * Fit growth model (linear or logistic)
   */
  static fitGrowthModel(values, dates) {
    // Simple linear growth model
    const x = dates.map((date, i) => i);
    const y = values;

    const lrResult = this.linearRegressionForecast(y, 1);

    return {
      type: "linear",
      slope: lrResult.slope || 0,
      intercept: lrResult.intercept || 0,
    };
  }

  /**
   * Model seasonality patterns
   */
  static modelSeasonality(values, dates) {
    const weeklyPattern = this.extractWeeklyPattern(values, dates);
    const monthlyPattern = this.extractMonthlyPattern(values, dates);

    return {
      periods: ["weekly", "monthly"],
      weekly: weeklyPattern,
      monthly: monthlyPattern,
    };
  }

  /**
   * Extract weekly seasonal pattern
   */
  static extractWeeklyPattern(values, dates) {
    const pattern = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    values.forEach((value, i) => {
      const dayOfWeek = new Date(dates[i]).getDay();
      pattern[dayOfWeek] += value;
      counts[dayOfWeek]++;
    });

    return pattern.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
  }

  /**
   * Model validation for ensemble
   */
  static validateEnsembleModel(forecasts, historicalValues) {
    const algorithms = Object.keys(forecasts);
    const performance = {};

    // Calculate performance for each algorithm
    algorithms.forEach((algo) => {
      const forecast = forecasts[algo];
      if (forecast && forecast.length > 0) {
        // Use last 7 days for validation if available
        const testSize = Math.min(7, Math.floor(historicalValues.length * 0.2));
        const actualTest = historicalValues.slice(-testSize);
        const forecastTest = forecast.slice(0, testSize);

        const mape = this.calculateMAPE(actualTest, forecastTest);
        const rmse = this.calculateRMSE(actualTest, forecastTest);

        performance[algo] = {
          mape,
          rmse,
          accuracy: Math.max(0, 1 - mape / 100),
        };
      }
    });

    // Calculate ensemble accuracy
    const accuracies = Object.values(performance).map((p) => p.accuracy);
    const ensembleAccuracy =
      accuracies.length > 0
        ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
        : 0.5;

    return {
      accuracy: ensembleAccuracy,
      algorithmPerformance: performance,
    };
  }

  /**
   * Calculate Random Forest confidence
   */
  static calculateRandomForestConfidence(trees, features, values) {
    if (trees.length === 0 || features.length === 0) return 0.3;

    // Calculate out-of-bag error approximation
    const predictions = features.map((feature) => {
      const treePredictions = trees
        .map((tree) => this.predictWithTree(tree, feature))
        .filter((pred) => !isNaN(pred) && isFinite(pred));

      return treePredictions.length > 0
        ? treePredictions.reduce((sum, pred) => sum + pred, 0) /
            treePredictions.length
        : 0;
    });

    const mape = this.calculateMAPE(
      features.map((f) => f.target),
      predictions
    );

    return Math.max(0.1, Math.min(0.95, 1 - mape / 100));
  }

  /**
   * Additional utility methods for advanced algorithms
   */
  static createForecastFeatures(values, dates, forecastDate, dayAhead) {
    const lastIndex = values.length - 1;

    return {
      lag1: values[lastIndex] || 0,
      lag2: values[lastIndex - 1] || 0,
      lag3: values[lastIndex - 2] || 0,
      lag7: values[lastIndex - 6] || 0,
      ma3: this.calculateMovingAverage(values.slice(-3), 3)[0] || 0,
      ma7: this.calculateMovingAverage(values.slice(-7), 7)[0] || 0,
      dayOfWeek: forecastDate.getDay(),
      dayOfMonth: forecastDate.getDate(),
      month: forecastDate.getMonth(),
      trend3: this.calculateTrend(values.slice(-3)),
      trend7: this.calculateTrend(values.slice(-7)),
      volatility3: this.calculateVolatility(values.slice(-3)),
      volatility7: this.calculateVolatility(values.slice(-7)),
    };
  }

  static predictWithTree(tree, features) {
    if (tree.type === "leaf") {
      return tree.value;
    }

    const featureValue = features[tree.feature];
    if (featureValue <= tree.threshold) {
      return this.predictWithTree(tree.left, features);
    } else {
      return this.predictWithTree(tree.right, features);
    }
  }

  static calculateTreeDepth(tree) {
    if (tree.type === "leaf") return 1;

    const leftDepth = tree.left ? this.calculateTreeDepth(tree.left) : 0;
    const rightDepth = tree.right ? this.calculateTreeDepth(tree.right) : 0;

    return 1 + Math.max(leftDepth, rightDepth);
  }

  static calculateARResiduals(series, coeffs) {
    const residuals = [];
    const order = coeffs.length;

    for (let i = order; i < series.length; i++) {
      let predicted = 0;
      for (let j = 0; j < order; j++) {
        predicted += coeffs[j] * series[i - j - 1];
      }
      residuals.push(series[i] - predicted);
    }

    return residuals;
  }

  static generateARIMAForecast(series, arCoeffs, maCoeffs, forecastDays, d) {
    // Generate forecast from ARIMA model
    const forecast = [];
    const lastValues = series.slice(
      -Math.max(arCoeffs.length, maCoeffs.length, 1)
    );

    for (let i = 0; i < forecastDays; i++) {
      let prediction = 0;

      // AR component
      for (let j = 0; j < arCoeffs.length; j++) {
        const index = lastValues.length - 1 - j - i;
        if (index >= 0) {
          prediction += arCoeffs[j] * lastValues[index];
        }
      }

      // MA component (simplified)
      // In practice, this would use forecast errors

      forecast.push(Math.max(0, prediction));
    }

    // Integrate back if differencing was applied
    return this.integrateForecasts(forecast, series, d);
  }

  static integrateForecasts(forecasts, originalSeries, order) {
    // Simple integration - would be more sophisticated in practice
    let integrated = forecasts.slice();
    const lastValue = originalSeries[originalSeries.length - 1];

    for (let i = 0; i < integrated.length; i++) {
      integrated[i] = Math.max(0, integrated[i] + lastValue);
    }

    return integrated;
  }

  static calculateARIMAConfidence(series, arCoeffs, maCoeffs) {
    // Calculate confidence based on model fit
    const residuals = this.calculateARResiduals(series, arCoeffs);
    const mse = this.calculateVariance(residuals);
    const signalVariance = this.calculateVariance(series);

    const snr = signalVariance / (mse + 1e-8); // Signal-to-noise ratio
    return Math.min(0.95, Math.max(0.1, snr / (snr + 1)));
  }

  // Simplified matrix operations for ARIMA
  static transpose(matrix) {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, i) => matrix.map((row) => row[i]));
  }

  static matrixMultiply(A, B) {
    // Simplified matrix multiplication
    const result = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        result[i][j] = 0;
        for (let k = 0; k < B.length; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }

  static matrixVectorMultiply(A, v) {
    return A.map((row) => row.reduce((sum, val, i) => sum + val * v[i], 0));
  }

  static solveLinearSystem(A, b) {
    // Simplified Gaussian elimination for small systems
    const n = A.length;
    if (n === 0 || n !== b.length) return [];

    // Simple case for 1x1
    if (n === 1) {
      return A[0][0] !== 0 ? [b[0] / A[0][0]] : [0];
    }

    // For larger systems, use simplified approach
    const solution = new Array(n).fill(0);

    // Back substitution for upper triangular approximation
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = b[i];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= A[i][j] * solution[j];
      }
      solution[i] /= A[i][i] || 1;
    }

    return solution;
  }

  // Additional Prophet utilities
  static modelHolidays(values, dates) {
    // Simplified holiday modeling
    return { effects: [] };
  }

  static generateFutureDates(dates, forecastDays) {
    const lastDate = new Date(dates[dates.length - 1]);
    const futureDates = [];

    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);
      futureDates.push(futureDate);
    }

    return futureDates;
  }

  static predictTrend(growthModel, date) {
    // Simple linear trend prediction
    const daysSinceStart = Math.floor(
      (date - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24)
    );
    return growthModel.intercept + growthModel.slope * daysSinceStart;
  }

  static predictSeasonal(seasonalModel, date) {
    const dayOfWeek = date.getDay();
    return seasonalModel.weekly[dayOfWeek] || 0;
  }

  static predictHoliday(holidayModel, date) {
    return 0; // Simplified - no holiday effects
  }

  static extractTrend(values, dates) {
    // Simple linear trend extraction
    const x = dates.map((_, i) => i);
    const n = values.length;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n || 0;

    return x.map((xi) => intercept + slope * xi);
  }

  static extractSeasonality(detrended, dates) {
    // Extract weekly seasonality
    const pattern = new Array(7).fill(0);
    const counts = new Array(7).fill(0);

    detrended.forEach((value, i) => {
      const dayOfWeek = new Date(dates[i]).getDay();
      pattern[dayOfWeek] += value;
      counts[dayOfWeek]++;
    });

    const avgPattern = pattern.map((sum, i) =>
      counts[i] > 0 ? sum / counts[i] : 0
    );

    return detrended.map((_, i) => {
      const dayOfWeek = new Date(dates[i]).getDay();
      return avgPattern[dayOfWeek];
    });
  }

  static extractMonthlyPattern(values, dates) {
    const pattern = new Array(12).fill(0);
    const counts = new Array(12).fill(0);

    values.forEach((value, i) => {
      const month = new Date(dates[i]).getMonth();
      pattern[month] += value;
      counts[month]++;
    });

    return pattern.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
  }

  static calculateProphetUncertainty(components, forecast) {
    // Simplified uncertainty calculation
    const baseUncertainty = this.calculateVariance(components.residual);

    return forecast.map((value, i) => ({
      lower: Math.max(0, value - 1.96 * Math.sqrt(baseUncertainty)),
      upper: value + 1.96 * Math.sqrt(baseUncertainty),
    }));
  }

  static calculateProphetConfidence(components, growthModel, seasonalModel) {
    // Calculate confidence based on component quality
    const trendVariance = this.calculateVariance(components.trend);
    const residualVariance = this.calculateVariance(components.residual);

    const snr = trendVariance / (residualVariance + 1e-8);
    return Math.min(0.95, Math.max(0.1, snr / (snr + 1)));
  }

  // ==================== UTILITY METHODS FOR ADVANCED FORECASTING ====================

  static detectSeasonalLength(values, _dates) {
    // Try common seasonal patterns
    const patterns = [7, 14, 30]; // Daily, bi-weekly, monthly
    let bestPattern = 7;
    let bestCorrelation = 0;

    for (const pattern of patterns) {
      if (values.length >= pattern * 2) {
        const correlation = this.calculateSeasonalCorrelation(values, pattern);
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestPattern = pattern;
        }
      }
    }

    return bestCorrelation > 0.3 ? bestPattern : 7; // Default to weekly
  }

  static calculateSeasonalCorrelation(values, period) {
    const n = Math.floor(values.length / period);
    if (n < 2) return 0;

    const correlations = [];
    for (let lag = 1; lag < n; lag++) {
      const x = values.slice(0, values.length - lag * period);
      const y = values.slice(lag * period);
      correlations.push(this.pearsonCorrelation(x, y));
    }

    return (
      correlations.reduce((sum, val) => sum + Math.abs(val), 0) /
      correlations.length
    );
  }

  static pearsonCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;

    const sumX = x.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumY = y.slice(0, n).reduce((sum, val) => sum + val, 0);
    const sumXY = x.slice(0, n).reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.slice(0, n).reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.slice(0, n).reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  static ensembleForecasts(forecasts, algorithms) {
    const forecastLength = Math.max(
      ...Object.values(forecasts).map((f) => f.length)
    );
    const ensemble = [];

    for (let i = 0; i < forecastLength; i++) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const { name, weight } of algorithms) {
        if (forecasts[name] && forecasts[name][i] !== undefined) {
          weightedSum += forecasts[name][i] * weight;
          totalWeight += weight;
        }
      }

      ensemble.push(totalWeight > 0 ? weightedSum / totalWeight : 0);
    }

    return ensemble;
  }

  static calculateEnsembleConfidence(confidences, algorithms) {
    let weightedConfidence = 0;
    let totalWeight = 0;

    for (const { name, weight } of algorithms) {
      if (confidences[name] !== undefined) {
        weightedConfidence += confidences[name] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedConfidence / totalWeight : 0.5;
  }

  static fallbackForecast(values, forecastDays) {
    if (values.length === 0) return Array(forecastDays).fill(0);

    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    return Array(forecastDays).fill(Math.max(0, average));
  }

  static calculateAdvancedTrend(values) {
    if (values.length < 3) return 0;

    // Use robust trend calculation with outlier resistance
    const differences = [];
    for (let i = 1; i < values.length; i++) {
      differences.push(values[i] - values[i - 1]);
    }

    // Use median instead of mean for robustness
    differences.sort((a, b) => a - b);
    const median =
      differences.length % 2 === 0
        ? (differences[differences.length / 2 - 1] +
            differences[differences.length / 2]) /
          2
        : differences[Math.floor(differences.length / 2)];

    return median;
  }

  static calculateVolatility(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }

  static detectSeasonality(values, _dates) {
    if (values.length < 14) return { detected: false };

    const weeklyPattern = this.calculateSeasonalCorrelation(values, 7);
    const monthlyPattern = this.calculateSeasonalCorrelation(values, 30);

    return {
      detected: weeklyPattern > 0.3 || monthlyPattern > 0.3,
      weekly: weeklyPattern,
      monthly: monthlyPattern,
      dominant: weeklyPattern > monthlyPattern ? "weekly" : "monthly",
    };
  }

  static calculateMAPE(actual, predicted) {
    if (actual.length === 0 || predicted.length === 0) return 0;

    const n = Math.min(actual.length, predicted.length);
    let sum = 0;

    for (let i = 0; i < n; i++) {
      if (actual[i] !== 0) {
        sum += Math.abs((actual[i] - predicted[i]) / actual[i]);
      }
    }

    return (sum / n) * 100;
  }

  static calculateRMSE(actual, predicted) {
    if (actual.length === 0 || predicted.length === 0) return 0;

    const n = Math.min(actual.length, predicted.length);
    let sum = 0;

    for (let i = 0; i < n; i++) {
      sum += Math.pow(actual[i] - predicted[i], 2);
    }

    return Math.sqrt(sum / n);
  }

  static calculateHoltWintersConfidence(values, level, trend, seasonal) {
    // Calculate forecast accuracy on historical data
    const errors = [];
    const seasonLength = seasonal.length;

    for (let i = seasonLength; i < values.length; i++) {
      const seasonalIndex = i % seasonLength;
      const predicted = level[i - 1] + trend[i - 1] * seasonal[seasonalIndex];
      errors.push(Math.abs(values[i] - predicted));
    }

    if (errors.length === 0) return 0.6;

    const mae = errors.reduce((sum, err) => sum + err, 0) / errors.length;
    const meanValue = values.reduce((sum, val) => sum + val, 0) / values.length;

    return Math.max(0.1, 1 - mae / meanValue);
  }

  static decomposeTimeSeries(values, seasonLength) {
    // Simple additive decomposition
    const trend = this.calculateMovingAverage(values, seasonLength);
    const detrended = values.map(
      (val, i) => val - (trend[i] || trend[trend.length - 1])
    );

    const seasonal = [];
    for (let i = 0; i < seasonLength; i++) {
      const seasonalValues = [];
      for (let j = i; j < detrended.length; j += seasonLength) {
        seasonalValues.push(detrended[j]);
      }
      seasonal[i] =
        seasonalValues.reduce((sum, val) => sum + val, 0) /
        seasonalValues.length;
    }

    const residual = values.map((val, i) => {
      const trendVal = trend[i] || trend[trend.length - 1];
      const seasonalVal = seasonal[i % seasonLength];
      return val - trendVal - seasonalVal;
    });

    return { trend, seasonal, residual };
  }

  static calculateMovingAverage(values, window) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(values.length, i + Math.ceil(window / 2));
      const slice = values.slice(start, end);
      result[i] = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    }
    return result;
  }

  static forecastTrend(trend, forecastDays) {
    if (trend.length < 2) return Array(forecastDays).fill(trend[0] || 0);

    const lastTrend = trend[trend.length - 1];
    const trendSlope = this.calculateAdvancedTrend(trend);

    const forecast = [];
    for (let i = 0; i < forecastDays; i++) {
      forecast.push(lastTrend + trendSlope * (i + 1));
    }

    return forecast;
  }

  static forecastSeasonal(seasonal, forecastDays, seasonLength) {
    const forecast = [];
    for (let i = 0; i < forecastDays; i++) {
      forecast.push(seasonal[i % seasonLength]);
    }
    return forecast;
  }

  static calculateTrend(values) {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = values.reduce((sum, val, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  static calculateForecastConfidence(salesHistory) {
    if (salesHistory.length < 7) return 0.3;
    if (salesHistory.length < 30) return 0.6;
    return 0.8;
  }

  static addSeasonalityAnalysis(forecast, salesHistory) {
    // Simple seasonality detection based on day of week patterns
    const dayPatterns = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);

    salesHistory.forEach((sale) => {
      const dayOfWeek = new Date(sale.created_at).getDay();
      dayPatterns[dayOfWeek] += sale.quantity;
      dayCounts[dayOfWeek]++;
    });

    // Calculate average for each day
    const dayAverages = dayPatterns.map((sum, index) =>
      dayCounts[index] > 0 ? sum / dayCounts[index] : 1
    );

    // Apply seasonality to forecast
    const enhancedForecast = forecast.forecast.map((value, index) => {
      const dayOfWeek = (new Date().getDay() + index) % 7;
      const seasonalityFactor =
        dayAverages[dayOfWeek] /
        (dayAverages.reduce((sum, avg) => sum + avg, 0) / 7);
      return value * seasonalityFactor;
    });

    return {
      ...forecast,
      forecast: enhancedForecast,
      seasonality: dayAverages,
    };
  }

  static calculateConfidenceIntervals(forecast) {
    const variance = this.calculateVariance(forecast.forecast);
    const standardDeviation = Math.sqrt(variance);

    return {
      ...forecast,
      confidenceIntervals: {
        lower: forecast.forecast.map((val) =>
          Math.max(0, val - 1.96 * standardDeviation)
        ),
        upper: forecast.forecast.map((val) => val + 1.96 * standardDeviation),
      },
      standardDeviation,
    };
  }

  static calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Placeholder methods for more advanced ML features
  /* eslint-disable no-unused-vars */
  static async calculateDemandElasticity(_productId) {
    // Simplified elasticity calculation - would use more sophisticated analysis in production
    return { elasticity: -1.2, confidence: 0.7 };
  }

  static async getMarketPricingData(_productId) {
    // Placeholder for competitor pricing data
    return { competitorPrices: [], marketAverage: null };
  }

  static calculateOptimalPrice(params) {
    const { currentPrice, targetMargin, elasticity } = params;

    // Simplified price optimization
    const optimalPrice =
      currentPrice * (1 + targetMargin) * (1 + elasticity.elasticity * 0.1);

    return {
      currentPrice,
      optimalPrice: Math.round(optimalPrice * 100) / 100,
      expectedDemandChange: elasticity.elasticity * 0.1,
      confidence: elasticity.confidence,
    };
  }

  static async getProductAnalytics(productId) {
    // Get basic product analytics
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error) throw error;

    return {
      currentPrice: product.price_per_piece,
      stockLevel: product.stock_in_pieces,
      demandTrend: "stable",
      seasonality: 1.0,
    };
  }

  static calculateDynamicPrice(productData, factors) {
    let priceMultiplier = 1.0;
    const reasoning = [];

    // Adjust based on stock level
    if (factors.stockLevel < 10) {
      priceMultiplier *= 1.1;
      reasoning.push("Low stock - increase price");
    } else if (factors.stockLevel > 100) {
      priceMultiplier *= 0.95;
      reasoning.push("High stock - reduce price");
    }

    // Adjust based on demand trend
    if (factors.demandTrend === "increasing") {
      priceMultiplier *= 1.05;
      reasoning.push("Increasing demand");
    } else if (factors.demandTrend === "decreasing") {
      priceMultiplier *= 0.95;
      reasoning.push("Decreasing demand");
    }

    const newPrice = productData.currentPrice * priceMultiplier;
    const change =
      ((newPrice - productData.currentPrice) / productData.currentPrice) * 100;

    return {
      price: Math.round(newPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      reasoning: reasoning.join(", "),
      confidence: 0.75,
      impact: `Expected ${change > 0 ? "increase" : "decrease"} in revenue`,
    };
  }

  // Additional placeholder methods for full ML functionality
  static async getStockoutHistory(_productId) {
    return [];
  }
  static async analyzeLeadTimes(_productId) {
    return { average: 7, variance: 2 };
  }
  static calculateSafetyStock(demandForecast, leadTimeAnalysis) {
    return demandForecast.averageDailyDemand * leadTimeAnalysis.average * 1.5;
  }
  static calculateReorderPoint(demandForecast, leadTimeAnalysis, safetyStock) {
    return (
      demandForecast.averageDailyDemand * leadTimeAnalysis.average + safetyStock
    );
  }
  static calculateEOQ(_productId, demandForecast) {
    return Math.sqrt((2 * demandForecast.totalDemand * 50) / 2);
  } // Simplified EOQ
  static async getCurrentStock(productId) {
    const { data } = await supabase
      .from("products")
      .select("stock_in_pieces")
      .eq("id", productId)
      .single();
    return data?.stock_in_pieces || 0;
  }
  static getInventoryAction(_productId, _reorderPoint, _eoq) {
    return "monitor";
  }
  static calculateInventoryConfidence(_demandForecast, _leadTimeAnalysis) {
    return 0.8;
  }
  static calculateCostImpact(_eoq, _safetyStock) {
    return { savings: 150, holdingCost: 75 };
  }
  static async getCustomerTransactionData() {
    try {
      // Get customer transaction data from pos_transactions
      const { data, error } = await supabase
        .from("pos_transactions")
        .select(
          `
          id,
          customer_id,
          total_amount,
          payment_method,
          created_at,
          status,
          pos_transaction_items(
            quantity,
            unit_price,
            product_id
          )
        `
        )
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1000); // Limit for performance

      if (error) {
        console.error(
          "❌ [ML] Error fetching customer transaction data:",
          error
        );
        return [];
      }

      // Transform data for RFM analysis
      const customerMap = new Map();

      data?.forEach((transaction) => {
        const customerId = transaction.customer_id || "guest";

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            transactions: [],
            totalSpent: 0,
            transactionCount: 0,
            lastTransactionDate: null,
            averageOrderValue: 0,
          });
        }

        const customer = customerMap.get(customerId);
        customer.transactions.push(transaction);
        customer.totalSpent += transaction.total_amount;
        customer.transactionCount++;

        const transactionDate = new Date(transaction.created_at);
        if (
          !customer.lastTransactionDate ||
          transactionDate > customer.lastTransactionDate
        ) {
          customer.lastTransactionDate = transactionDate;
        }
      });

      // Calculate averages
      customerMap.forEach((customer) => {
        customer.averageOrderValue =
          customer.totalSpent / customer.transactionCount;
      });

      console.log(
        `📊 [ML] Retrieved transaction data for ${customerMap.size} customers`
      );
      return Array.from(customerMap.values());
    } catch (error) {
      console.error("❌ [ML] Error in getCustomerTransactionData:", error);
      return [];
    }
  }
  static calculateRFMScores(_customerData) {
    return [];
  }
  static clusterCustomers(_rfmScores) {
    return [];
  }
  static generateSegmentProfiles(_segments) {
    return [];
  }
  static analyzeProductLifecycle(_salesHistory) {
    return { stage: "growth", confidence: 0.7, timeToNext: 90, risks: [] };
  }
  static getLifecycleRecommendations(_lifecycle) {
    return ["Monitor performance", "Consider promotion"];
  }
}
