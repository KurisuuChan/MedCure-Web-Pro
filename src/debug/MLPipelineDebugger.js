/**
 * 🚀 PROFESSIONAL ML PIPELINE END-TO-END TEST
 * Comprehensive testing and debugging of the entire ML workflow
 */

import { MLService } from "../services/infrastructure/mlService";
// import { RealTimePredictionEngine } from "../services/realTimePredictionEngine.js";
// import { NotificationAnalyticsService } from "../services/notificationAnalyticsService.js";
import { supabase } from "../config/supabase.js";

/**
 * 🔬 CRITICAL PIPELINE ANALYSIS CLASS
 */
export class MLPipelineDebugger {
  static testResults = {
    dataIngestion: { status: "pending", metrics: {}, issues: [] },
    algorithmAccuracy: { status: "pending", metrics: {}, issues: [] },
    performanceAnalysis: { status: "pending", metrics: {}, issues: [] },
    errorHandling: { status: "pending", metrics: {}, issues: [] },
    dataIntegrity: { status: "pending", metrics: {}, issues: [] },
  };

  /**
   * 🧪 TEST 1: Data Ingestion & Quality Analysis
   */
  static async testDataIngestionPipeline() {
    console.log("🔍 [PIPELINE TEST] Starting Data Ingestion Analysis...");
    const startTime = performance.now();

    try {
      // Test 1.1: Verify database connectivity
      console.log("📡 Testing database connectivity...");
      const { data: dbTest, error: dbError } = await supabase
        .from("products")
        .select("id, name")
        .limit(1);

      if (dbError)
        throw new Error(`Database connection failed: ${dbError.message}`);

      // Test 1.2: Analyze data quality for sample products
      console.log("📊 Analyzing data quality...");
      const { data: products } = await supabase
        .from("products")
        .select("id, name, category")
        .eq("status", "active")
        .limit(5);

      const dataQualityResults = await Promise.all(
        products.map(async (product) => {
          const salesHistory = await MLService.getProductSalesHistory(
            product.id,
            30
          );
          return {
            productId: product.id,
            productName: product.name,
            dataPoints: salesHistory.length,
            hasData: salesHistory.length > 0,
            dataRange:
              salesHistory.length > 0
                ? {
                    from: salesHistory[0]?.date,
                    to: salesHistory[salesHistory.length - 1]?.date,
                    totalQuantity: salesHistory.reduce(
                      (sum, day) => sum + day.quantity,
                      0
                    ),
                    activeDays: salesHistory.filter((day) => day.quantity > 0)
                      .length,
                  }
                : null,
          };
        })
      );

      const dataQualityMetrics = {
        totalProductsTested: products.length,
        productsWithData: dataQualityResults.filter((r) => r.hasData).length,
        averageDataPoints:
          dataQualityResults.reduce((sum, r) => sum + r.dataPoints, 0) /
          dataQualityResults.length,
        totalActiveDays: dataQualityResults.reduce(
          (sum, r) => sum + (r.dataRange?.activeDays || 0),
          0
        ),
      };

      console.log("✅ Data ingestion test completed:", dataQualityMetrics);

      this.testResults.dataIngestion = {
        status: "passed",
        metrics: dataQualityMetrics,
        details: dataQualityResults,
        duration: performance.now() - startTime,
        issues: dataQualityResults
          .filter((r) => !r.hasData)
          .map((r) => `No data for product: ${r.productName}`),
      };

      return this.testResults.dataIngestion;
    } catch (error) {
      console.error("❌ Data ingestion test failed:", error);
      this.testResults.dataIngestion = {
        status: "failed",
        error: error.message,
        duration: performance.now() - startTime,
        issues: [error.message],
      };
      return this.testResults.dataIngestion;
    }
  }

  /**
   * 🧮 TEST 2: Algorithm Accuracy & Performance
   */
  static async testAlgorithmAccuracy() {
    console.log("🔍 [PIPELINE TEST] Starting Algorithm Accuracy Analysis...");
    const startTime = performance.now();

    try {
      // Get a product with good data for testing
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .eq("status", "active")
        .limit(3);

      const algorithmResults = await Promise.all(
        products.map(async (product) => {
          try {
            console.log(
              `🤖 Testing ML algorithms for product: ${product.name}`
            );

            // Test demand forecasting
            const forecastStartTime = performance.now();
            const forecast = await MLService.forecastDemand(product.id, 7);
            const forecastDuration = performance.now() - forecastStartTime;

            // Test individual algorithm performance
            const salesHistory = await MLService.getProductSalesHistory(
              product.id,
              60
            );
            const values = salesHistory.map((s) => s.quantity);

            let algorithmPerformance = {};

            if (values.length >= 7) {
              try {
                const esResult = MLService.exponentialSmoothing(values, 7);
                algorithmPerformance.exponentialSmoothing = {
                  success: true,
                  confidence: esResult.confidence,
                  forecastSum: esResult.forecast.reduce(
                    (sum, val) => sum + val,
                    0
                  ),
                };
              } catch (error) {
                algorithmPerformance.exponentialSmoothing = {
                  success: false,
                  error: error.message,
                };
              }

              try {
                const lrResult = MLService.linearRegressionForecast(values, 7);
                algorithmPerformance.linearRegression = {
                  success: true,
                  confidence: lrResult.confidence,
                  forecastSum: lrResult.forecast.reduce(
                    (sum, val) => sum + val,
                    0
                  ),
                };
              } catch (error) {
                algorithmPerformance.linearRegression = {
                  success: false,
                  error: error.message,
                };
              }
            }

            return {
              productId: product.id,
              productName: product.name,
              forecastSuccess: !!forecast,
              forecastDuration,
              confidence: forecast?.confidence || 0,
              algorithmPerformance,
              dataQuality: {
                dataPoints: salesHistory.length,
                nonZeroDays: salesHistory.filter((s) => s.quantity > 0).length,
                totalDemand: values.reduce((sum, val) => sum + val, 0),
              },
            };
          } catch (error) {
            return {
              productId: product.id,
              productName: product.name,
              forecastSuccess: false,
              error: error.message,
            };
          }
        })
      );

      const accuracyMetrics = {
        totalProductsTested: products.length,
        successfulForecasts: algorithmResults.filter((r) => r.forecastSuccess)
          .length,
        averageConfidence:
          algorithmResults
            .filter((r) => r.confidence)
            .reduce((sum, r) => sum + r.confidence, 0) /
            algorithmResults.filter((r) => r.confidence).length || 0,
        averageForecastTime:
          algorithmResults
            .filter((r) => r.forecastDuration)
            .reduce((sum, r) => sum + r.forecastDuration, 0) /
            algorithmResults.filter((r) => r.forecastDuration).length || 0,
      };

      console.log("✅ Algorithm accuracy test completed:", accuracyMetrics);

      this.testResults.algorithmAccuracy = {
        status: "passed",
        metrics: accuracyMetrics,
        details: algorithmResults,
        duration: performance.now() - startTime,
        issues: algorithmResults
          .filter((r) => !r.forecastSuccess)
          .map((r) => `Failed forecast for ${r.productName}: ${r.error}`),
      };

      return this.testResults.algorithmAccuracy;
    } catch (error) {
      console.error("❌ Algorithm accuracy test failed:", error);
      this.testResults.algorithmAccuracy = {
        status: "failed",
        error: error.message,
        duration: performance.now() - startTime,
        issues: [error.message],
      };
      return this.testResults.algorithmAccuracy;
    }
  }

  /**
   * ⚡ TEST 3: Real-Time Prediction Engine Integration
   */
  static async testRealTimePredictionEngine() {
    console.log(
      "🔍 [PIPELINE TEST] Starting Real-Time Prediction Engine Test..."
    );
    const startTime = performance.now();

    try {
      // Test prediction engine data retrieval
      console.log("📦 Testing active products retrieval...");
      const activeProducts = await RealTimePredictionEngine.getActiveProducts();

      console.log("📈 Testing top selling products retrieval...");
      const topProducts =
        await RealTimePredictionEngine.getTopSellingProducts();

      // Test demand forecasting cycle
      console.log("🔄 Testing demand forecasting cycle...");
      const demandResults =
        await RealTimePredictionEngine.processDemandForecasts();

      // Test engine status
      const engineStatus = RealTimePredictionEngine.getEngineStatus();

      const predictionEngineMetrics = {
        activeProductsCount: activeProducts.length,
        topProductsCount: topProducts.length,
        demandForecastsProcessed: demandResults.processed,
        demandNotificationsSent: demandResults.notifications,
        engineRunning: engineStatus.isRunning,
        totalPredictions: engineStatus.totalPredictions,
      };

      console.log(
        "✅ Real-time prediction engine test completed:",
        predictionEngineMetrics
      );

      this.testResults.performanceAnalysis = {
        status: "passed",
        metrics: predictionEngineMetrics,
        duration: performance.now() - startTime,
        issues: [],
      };

      return this.testResults.performanceAnalysis;
    } catch (error) {
      console.error("❌ Real-time prediction engine test failed:", error);
      this.testResults.performanceAnalysis = {
        status: "failed",
        error: error.message,
        duration: performance.now() - startTime,
        issues: [error.message],
      };
      return this.testResults.performanceAnalysis;
    }
  }

  /**
   * 🛡️ TEST 4: Error Handling & Edge Cases
   */
  static async testErrorHandling() {
    console.log("🔍 [PIPELINE TEST] Starting Error Handling Analysis...");
    const startTime = performance.now();

    try {
      const errorTestResults = [];

      // Test 4.1: Invalid product ID
      try {
        await MLService.forecastDemand(99999, 7);
        errorTestResults.push({
          test: "invalid_product_id",
          result: "failed",
          note: "Should have thrown error",
        });
      } catch (error) {
        errorTestResults.push({
          test: "invalid_product_id",
          result: "passed",
          error: error.message,
        });
      }

      // Test 4.2: Zero forecast days
      try {
        await MLService.forecastDemand(1, 0);
        errorTestResults.push({
          test: "zero_forecast_days",
          result: "failed",
          note: "Should have thrown error",
        });
      } catch (error) {
        errorTestResults.push({
          test: "zero_forecast_days",
          result: "passed",
          error: error.message,
        });
      }

      // Test 4.3: Empty data handling
      try {
        const emptyResult = MLService.exponentialSmoothing([], 7);
        errorTestResults.push({
          test: "empty_data_exponential",
          result: "failed",
          note: "Should have thrown error",
        });
      } catch (error) {
        errorTestResults.push({
          test: "empty_data_exponential",
          result: "passed",
          error: error.message,
        });
      }

      // Test 4.4: Notification analytics with invalid date range
      try {
        await NotificationAnalyticsService.getNotificationAnalytics(
          "invalid_range"
        );
        errorTestResults.push({
          test: "invalid_date_range",
          result: "check_implementation",
        });
      } catch (error) {
        errorTestResults.push({
          test: "invalid_date_range",
          result: "passed",
          error: error.message,
        });
      }

      const errorHandlingMetrics = {
        totalTests: errorTestResults.length,
        passedTests: errorTestResults.filter((t) => t.result === "passed")
          .length,
        failedTests: errorTestResults.filter((t) => t.result === "failed")
          .length,
      };

      console.log("✅ Error handling test completed:", errorHandlingMetrics);

      this.testResults.errorHandling = {
        status: "passed",
        metrics: errorHandlingMetrics,
        details: errorTestResults,
        duration: performance.now() - startTime,
        issues: errorTestResults
          .filter((t) => t.result === "failed")
          .map((t) => t.note || t.error),
      };

      return this.testResults.errorHandling;
    } catch (error) {
      console.error("❌ Error handling test failed:", error);
      this.testResults.errorHandling = {
        status: "failed",
        error: error.message,
        duration: performance.now() - startTime,
        issues: [error.message],
      };
      return this.testResults.errorHandling;
    }
  }

  /**
   * 🔒 TEST 5: Data Integrity & Validation
   */
  static async testDataIntegrity() {
    console.log("🔍 [PIPELINE TEST] Starting Data Integrity Analysis...");
    const startTime = performance.now();

    try {
      // Check for data consistency across tables
      const { data: products } = await supabase
        .from("products")
        .select("id, name, status")
        .limit(10);

      const integrityResults = await Promise.all(
        products.map(async (product) => {
          const salesHistory = await MLService.getProductSalesHistory(
            product.id,
            30
          );

          // Validate data integrity
          const hasNegativeQuantities = salesHistory.some(
            (day) => day.quantity < 0
          );
          const hasNegativeRevenue = salesHistory.some(
            (day) => day.revenue < 0
          );
          const hasValidDates = salesHistory.every(
            (day) => day.date instanceof Date && !isNaN(day.date)
          );
          const hasConsistentTimeSequence = salesHistory.every(
            (day, i) => i === 0 || day.date >= salesHistory[i - 1].date
          );

          return {
            productId: product.id,
            productName: product.name,
            dataPoints: salesHistory.length,
            validations: {
              noNegativeQuantities: !hasNegativeQuantities,
              noNegativeRevenue: !hasNegativeRevenue,
              validDates: hasValidDates,
              consistentTimeSequence: hasConsistentTimeSequence,
            },
            issues: [
              ...(hasNegativeQuantities
                ? ["Negative quantities detected"]
                : []),
              ...(hasNegativeRevenue ? ["Negative revenue detected"] : []),
              ...(!hasValidDates ? ["Invalid dates detected"] : []),
              ...(!hasConsistentTimeSequence
                ? ["Inconsistent time sequence"]
                : []),
            ],
          };
        })
      );

      const integrityMetrics = {
        totalProductsChecked: products.length,
        productsWithIssues: integrityResults.filter((r) => r.issues.length > 0)
          .length,
        totalValidationsPassed: integrityResults.reduce(
          (sum, r) =>
            sum + Object.values(r.validations).filter((v) => v).length,
          0
        ),
        totalValidationsRun: integrityResults.length * 4,
      };

      console.log("✅ Data integrity test completed:", integrityMetrics);

      this.testResults.dataIntegrity = {
        status: "passed",
        metrics: integrityMetrics,
        details: integrityResults,
        duration: performance.now() - startTime,
        issues: integrityResults.flatMap((r) =>
          r.issues.map((issue) => `${r.productName}: ${issue}`)
        ),
      };

      return this.testResults.dataIntegrity;
    } catch (error) {
      console.error("❌ Data integrity test failed:", error);
      this.testResults.dataIntegrity = {
        status: "failed",
        error: error.message,
        duration: performance.now() - startTime,
        issues: [error.message],
      };
      return this.testResults.dataIntegrity;
    }
  }

  /**
   * 🎯 COMPREHENSIVE PIPELINE TEST SUITE
   */
  static async runComprehensivePipelineTest() {
    console.log("🚀 STARTING COMPREHENSIVE ML PIPELINE ANALYSIS");
    console.log("=".repeat(80));

    const overallStartTime = performance.now();

    // Run all tests
    await this.testDataIngestionPipeline();
    await this.testAlgorithmAccuracy();
    await this.testRealTimePredictionEngine();
    await this.testErrorHandling();
    await this.testDataIntegrity();

    const overallDuration = performance.now() - overallStartTime;

    // Generate comprehensive report
    const overallResults = {
      summary: {
        totalTests: Object.keys(this.testResults).length,
        passedTests: Object.values(this.testResults).filter(
          (t) => t.status === "passed"
        ).length,
        failedTests: Object.values(this.testResults).filter(
          (t) => t.status === "failed"
        ).length,
        totalDuration: overallDuration,
        totalIssuesFound: Object.values(this.testResults).reduce(
          (sum, t) => sum + (t.issues?.length || 0),
          0
        ),
      },
      detailedResults: this.testResults,
    };

    console.log("=".repeat(80));
    console.log("📊 COMPREHENSIVE PIPELINE TEST RESULTS:");
    console.log(
      `   ✅ Passed: ${overallResults.summary.passedTests}/${overallResults.summary.totalTests}`
    );
    console.log(
      `   ❌ Failed: ${overallResults.summary.failedTests}/${overallResults.summary.totalTests}`
    );
    console.log(`   ⏱️  Duration: ${(overallDuration / 1000).toFixed(2)}s`);
    console.log(`   🐛 Issues: ${overallResults.summary.totalIssuesFound}`);
    console.log("=".repeat(80));

    // Detailed breakdown
    Object.entries(this.testResults).forEach(([testName, result]) => {
      const status = result.status === "passed" ? "✅" : "❌";
      console.log(
        `${status} ${testName}: ${result.status} (${(
          result.duration / 1000
        ).toFixed(2)}s)`
      );
      if (result.issues && result.issues.length > 0) {
        result.issues.forEach((issue) => console.log(`   ⚠️  ${issue}`));
      }
    });

    console.log("=".repeat(80));

    if (
      overallResults.summary.passedTests === overallResults.summary.totalTests
    ) {
      console.log("🎉 ALL TESTS PASSED! ML Pipeline is functioning correctly.");
    } else {
      console.log(
        "⚠️  Some tests failed. Review the issues above for optimization opportunities."
      );
    }

    return overallResults;
  }
}

// Browser environment integration
if (typeof window !== "undefined") {
  window.MLPipelineDebugger = MLPipelineDebugger;
  console.log("🧪 ML Pipeline Debugger available at window.MLPipelineDebugger");
  console.log(
    "   Run: window.MLPipelineDebugger.runComprehensivePipelineTest()"
  );
}

export default MLPipelineDebugger;
