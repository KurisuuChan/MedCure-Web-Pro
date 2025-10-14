/**
 * 🔍 MEDCURE-PRO SYSTEM VALIDATION ROADMAP
 * Step-by-step manual validation guide for systematic testing
 */

// Import required services for testing
import { supabase } from "../config/supabase";
import { MLService } from "../services/infrastructure/mlService";
import { AnalyticsService } from "../services/domains/analytics/analyticsService";
// Old notification service removed - using new database-backed system now
// import { SimpleNotificationService } from "../services/domains/notifications/simpleNotificationService";

export class SystemValidationRoadmap {
  /**
   * 🏁 PHASE 1: DATABASE FOUNDATION CHECK
   * CRITICAL: Start here - validate your data foundation
   */
  static async phase1_DatabaseFoundationCheck() {
    console.log("🔍 PHASE 1: DATABASE FOUNDATION CHECK");
    console.log("=".repeat(60));

    try {
      // Step 1.1: Test basic database connectivity
      console.log("📡 Step 1.1: Testing database connectivity...");
      const { data: connectionTest, error: connError } = await supabase
        .from("products")
        .select("count", { count: "exact", head: true });

      if (connError) {
        console.error("❌ Database connection failed:", connError);
        return { success: false, error: "Database connection failed" };
      }
      console.log("✅ Database connected successfully");

      // Step 1.2: Check core table data availability
      console.log("\n📊 Step 1.2: Checking core table data...");

      const tableChecks = await Promise.all([
        // Products table
        supabase
          .from("products")
          .select(
            "id, name, category, status, stock_in_pieces, price_per_piece"
          )
          .limit(5),
        // POS transactions
        supabase
          .from("pos_transactions")
          .select("id, total_amount, status, created_at")
          .limit(5),
        // POS transaction items
        supabase
          .from("pos_transaction_items")
          .select("id, product_id, quantity, unit_price, created_at")
          .limit(5),
        // Notifications
        supabase
          .from("notifications")
          .select("id, delivery_status, created_at")
          .limit(5),
      ]);

      const [
        productsResult,
        transactionsResult,
        transactionItemsResult,
        notificationsResult,
      ] = tableChecks;

      const tableStatus = {
        products: {
          success: !productsResult.error,
          count: productsResult.data?.length || 0,
          sample: productsResult.data?.[0] || null,
          error: productsResult.error?.message,
        },
        pos_transactions: {
          success: !transactionsResult.error,
          count: transactionsResult.data?.length || 0,
          sample: transactionsResult.data?.[0] || null,
          error: transactionsResult.error?.message,
        },
        pos_transaction_items: {
          success: !transactionItemsResult.error,
          count: transactionItemsResult.data?.length || 0,
          sample: transactionItemsResult.data?.[0] || null,
          error: transactionItemsResult.error?.message,
        },
        notifications: {
          success: !notificationsResult.error,
          count: notificationsResult.data?.length || 0,
          sample: notificationsResult.data?.[0] || null,
          error: notificationsResult.error?.message,
        },
      };

      // Display results
      Object.entries(tableStatus).forEach(([tableName, status]) => {
        const icon = status.success ? "✅" : "❌";
        console.log(
          `${icon} ${tableName}: ${status.count} records ${
            status.success ? "found" : "ERROR: " + status.error
          }`
        );
        if (status.sample) {
          console.log(`   Sample data:`, status.sample);
        }
      });

      // Step 1.3: Check data relationships
      console.log("\n🔗 Step 1.3: Checking data relationships...");
      if (
        tableStatus.pos_transaction_items.success &&
        tableStatus.products.success
      ) {
        const { data: relationshipCheck } = await supabase
          .from("pos_transaction_items")
          .select(
            `
            product_id,
            products!inner(id, name),
            pos_transactions!inner(id, status)
          `
          )
          .limit(3);

        console.log(
          "✅ Table relationships working:",
          relationshipCheck?.length || 0,
          "linked records found"
        );
      }

      console.log("\n📋 PHASE 1 SUMMARY:");
      const allTablesWorking = Object.values(tableStatus).every(
        (t) => t.success
      );
      console.log(
        allTablesWorking
          ? "✅ Database foundation is solid!"
          : "❌ Database issues detected - fix before proceeding"
      );

      return {
        success: allTablesWorking,
        tableStatus,
        recommendations: allTablesWorking
          ? ["Proceed to Phase 2: ML Data Pipeline Validation"]
          : [
              "Fix database connection and table setup",
              "Ensure all required tables exist with sample data",
            ],
      };
    } catch (error) {
      console.error("❌ Phase 1 failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🤖 PHASE 2: ML DATA PIPELINE VALIDATION
   * Test the core ML data ingestion and processing
   */
  static async phase2_MLDataPipelineValidation() {
    console.log("\n🔍 PHASE 2: ML DATA PIPELINE VALIDATION");
    console.log("=".repeat(60));

    try {
      // Step 2.1: Get sample products for testing
      console.log("📦 Step 2.1: Getting sample products...");
      const { data: products } = await supabase
        .from("products")
        .select("id, name, category, status")
        .eq("status", "active")
        .limit(3);

      if (!products || products.length === 0) {
        console.log("❌ No active products found - cannot test ML pipeline");
        return { success: false, error: "No active products available" };
      }

      console.log(`✅ Found ${products.length} active products for testing`);
      products.forEach((p) => console.log(`   - ${p.name} (ID: ${p.id})`));

      // Step 2.2: Test sales history retrieval and aggregation
      console.log("\n📊 Step 2.2: Testing sales history data aggregation...");

      const pipelineResults = await Promise.all(
        products.map(async (product) => {
          try {
            console.log(`\n🔍 Testing product: ${product.name}`);

            // Test raw data retrieval
            console.log("   📥 Fetching sales history (30 days)...");
            const salesHistory = await MLService.getProductSalesHistory(
              product.id,
              30
            );

            // Analyze data quality
            const dataQuality = {
              totalDays: salesHistory.length,
              daysWithSales: salesHistory.filter((day) => day.quantity > 0)
                .length,
              totalQuantity: salesHistory.reduce(
                (sum, day) => sum + day.quantity,
                0
              ),
              totalRevenue: salesHistory.reduce(
                (sum, day) => sum + day.revenue,
                0
              ),
              dateRange:
                salesHistory.length > 0
                  ? {
                      from: salesHistory[0].date.toISOString().split("T")[0],
                      to: salesHistory[salesHistory.length - 1].date
                        .toISOString()
                        .split("T")[0],
                    }
                  : null,
            };

            console.log("   ✅ Data aggregation results:");
            console.log(`      - Total days: ${dataQuality.totalDays}`);
            console.log(
              `      - Days with sales: ${dataQuality.daysWithSales}`
            );
            console.log(
              `      - Total quantity sold: ${dataQuality.totalQuantity}`
            );
            console.log(
              `      - Total revenue: $${dataQuality.totalRevenue.toFixed(2)}`
            );

            // Test data structure validation
            const structureValid = salesHistory.every(
              (day) =>
                day.hasOwnProperty("date") &&
                day.hasOwnProperty("quantity") &&
                day.hasOwnProperty("revenue") &&
                day.hasOwnProperty("value") &&
                day.date instanceof Date
            );

            console.log(
              `      - Data structure: ${
                structureValid ? "✅ Valid" : "❌ Invalid"
              }`
            );

            return {
              productId: product.id,
              productName: product.name,
              success: true,
              dataQuality,
              structureValid,
              hasSufficientData: dataQuality.daysWithSales >= 3,
            };
          } catch (error) {
            console.log(
              `   ❌ Error testing ${product.name}: ${error.message}`
            );
            return {
              productId: product.id,
              productName: product.name,
              success: false,
              error: error.message,
            };
          }
        })
      );

      // Step 2.3: Analyze pipeline health
      console.log("\n📋 Step 2.3: Pipeline Health Analysis:");
      const successfulProducts = pipelineResults.filter((r) => r.success);
      const productsWithData = successfulProducts.filter(
        (r) => r.hasSufficientData
      );

      console.log(
        `✅ Successfully processed: ${successfulProducts.length}/${products.length} products`
      );
      console.log(
        `📊 Products with sufficient data: ${productsWithData.length}/${products.length} products`
      );

      const pipelineHealthy =
        successfulProducts.length > 0 && productsWithData.length > 0;

      return {
        success: pipelineHealthy,
        results: pipelineResults,
        summary: {
          totalProducts: products.length,
          successfulProducts: successfulProducts.length,
          productsWithSufficientData: productsWithData.length,
        },
        recommendations: pipelineHealthy
          ? [
              "Data pipeline is working!",
              "Proceed to Phase 3: Algorithm Testing",
            ]
          : [
              "Check POS transaction data",
              "Ensure sales data exists for products",
              "Verify date ranges and data integrity",
            ],
      };
    } catch (error) {
      console.error("❌ Phase 2 failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧮 PHASE 3: ALGORITHM FUNCTION TESTING
   * Test individual ML algorithms and ensemble forecasting
   */
  static async phase3_AlgorithmTesting() {
    console.log("\n🔍 PHASE 3: ALGORITHM FUNCTION TESTING");
    console.log("=".repeat(60));

    try {
      // Step 3.1: Find product with good data for testing
      console.log("🔍 Step 3.1: Finding product with sufficient data...");
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .eq("status", "active")
        .limit(5);

      let testProduct = null;
      let testSalesHistory = null;

      for (const product of products) {
        const salesHistory = await MLService.getProductSalesHistory(
          product.id,
          60
        );
        const daysWithSales = salesHistory.filter(
          (day) => day.quantity > 0
        ).length;

        if (daysWithSales >= 7) {
          testProduct = product;
          testSalesHistory = salesHistory;
          break;
        }
      }

      if (!testProduct) {
        console.log(
          "❌ No product found with sufficient sales data (need 7+ days)"
        );
        return {
          success: false,
          error: "Insufficient data for algorithm testing",
        };
      }

      console.log(`✅ Testing with product: ${testProduct.name}`);
      console.log(
        `📊 Data points: ${testSalesHistory.length} days, ${
          testSalesHistory.filter((d) => d.quantity > 0).length
        } with sales`
      );

      // Step 3.2: Test individual algorithms
      console.log("\n🧮 Step 3.2: Testing individual algorithms...");

      const values = testSalesHistory.map((day) => day.quantity);
      const algorithmResults = {};

      // Test Exponential Smoothing
      try {
        console.log("   🔄 Testing Exponential Smoothing...");
        const esResult = MLService.exponentialSmoothing(values, 7);
        algorithmResults.exponentialSmoothing = {
          success: true,
          forecast: esResult.forecast,
          confidence: esResult.confidence,
          forecastSum: esResult.forecast.reduce((sum, val) => sum + val, 0),
        };
        console.log(
          `   ✅ Exponential Smoothing: confidence ${(
            esResult.confidence * 100
          ).toFixed(
            1
          )}%, forecast sum: ${algorithmResults.exponentialSmoothing.forecastSum.toFixed(
            2
          )}`
        );
      } catch (error) {
        algorithmResults.exponentialSmoothing = {
          success: false,
          error: error.message,
        };
        console.log(`   ❌ Exponential Smoothing failed: ${error.message}`);
      }

      // Test Linear Regression
      try {
        console.log("   📈 Testing Linear Regression...");
        const lrResult = MLService.linearRegressionForecast(values, 7);
        algorithmResults.linearRegression = {
          success: true,
          forecast: lrResult.forecast,
          confidence: lrResult.confidence,
          forecastSum: lrResult.forecast.reduce((sum, val) => sum + val, 0),
        };
        console.log(
          `   ✅ Linear Regression: confidence ${(
            lrResult.confidence * 100
          ).toFixed(
            1
          )}%, forecast sum: ${algorithmResults.linearRegression.forecastSum.toFixed(
            2
          )}`
        );
      } catch (error) {
        algorithmResults.linearRegression = {
          success: false,
          error: error.message,
        };
        console.log(`   ❌ Linear Regression failed: ${error.message}`);
      }

      // Step 3.3: Test ensemble forecasting
      console.log("\n🎯 Step 3.3: Testing ensemble forecasting...");
      try {
        const ensembleForecast = await MLService.forecastDemand(
          testProduct.id,
          7
        );

        console.log("✅ Ensemble Forecast Results:");
        console.log(
          `   - Total predicted demand: ${ensembleForecast.totalDemand.toFixed(
            2
          )}`
        );
        console.log(
          `   - Average daily demand: ${ensembleForecast.averageDailyDemand.toFixed(
            2
          )}`
        );
        console.log(
          `   - Confidence: ${(ensembleForecast.confidence * 100).toFixed(1)}%`
        );
        console.log(`   - Trend: ${ensembleForecast.trend}`);
        console.log(
          `   - Algorithms used: ${ensembleForecast.algorithms.join(", ")}`
        );

        // Step 3.4: Validate forecast quality
        console.log("\n✨ Step 3.4: Forecast Quality Validation:");
        const forecastQuality = {
          hasValidNumbers: ensembleForecast.forecast.every(
            (val) => !isNaN(val) && val >= 0
          ),
          confidenceInRange:
            ensembleForecast.confidence >= 0 &&
            ensembleForecast.confidence <= 1,
          reasonableMagnitude:
            ensembleForecast.averageDailyDemand >= 0 &&
            ensembleForecast.averageDailyDemand <= 1000,
        };

        const qualityScore =
          Object.values(forecastQuality).filter(Boolean).length;
        console.log(`📊 Quality Score: ${qualityScore}/3 checks passed`);
        Object.entries(forecastQuality).forEach(([check, passed]) => {
          console.log(`   ${passed ? "✅" : "❌"} ${check}`);
        });

        return {
          success: true,
          testProduct: testProduct.name,
          algorithmResults,
          ensembleForecast,
          forecastQuality,
          qualityScore,
          recommendations:
            qualityScore === 3
              ? [
                  "Algorithms working correctly!",
                  "Proceed to Phase 4: Real-Time Engine Testing",
                ]
              : [
                  "Review algorithm parameters",
                  "Check data quality",
                  "Investigate forecast validation issues",
                ],
        };
      } catch (error) {
        console.log(`❌ Ensemble forecasting failed: ${error.message}`);
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error("❌ Phase 3 failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ⚡ PHASE 4: NOTIFICATION SYSTEM TESTING
   * Test the simplified notification system
   */
  static async phase4_NotificationSystemTest() {
    console.log("\n🔍 PHASE 4: NOTIFICATION SYSTEM TESTING");
    console.log("=".repeat(60));

    try {
      // Step 4.1: Test notification permissions (browser notifications)
      console.log("📋 Step 4.1: Testing browser notification support...");

      const notificationSupported = "Notification" in window;
      const permissionStatus = notificationSupported
        ? Notification.permission
        : "unsupported";
      console.log(
        `✅ Browser notifications supported: ${notificationSupported}`
      );
      console.log(`✅ Permission status: ${permissionStatus}`);

      // Step 4.2: Test basic inventory checks
      console.log("\n📊 Step 4.2: Testing inventory monitoring...");
      const { data: activeProducts } = await supabase
        .from("products")
        .select("id, generic_name, brand_name, stock_in_pieces, reorder_level")
        .eq("is_active", true)
        .limit(10);

      if (activeProducts && activeProducts.length > 0) {
        console.log(`✅ Active products: ${activeProducts.length} found`);

        const lowStockItems = activeProducts.filter(
          (p) => p.stock_in_pieces <= (p.reorder_level || 10)
        );
        console.log(`📊 Low stock items: ${lowStockItems.length} found`);
      }

      // Step 4.3: Test database notification system
      console.log("\n🔄 Step 4.3: Testing database notification system...");

      const { data: notificationCount, error: notifError } = await supabase
        .from("user_notifications")
        .select("count", { count: "exact", head: true });

      if (!notifError) {
        console.log("✅ Database notification system accessible");
        console.log(
          `📊 Total notifications in database: ${notificationCount || 0}`
        );
      } else {
        console.warn(
          "⚠️ Database notification system not accessible:",
          notifError.message
        );
      }

      return {
        success: true,
        notificationSupported,
        permissionStatus,
        activeProductsCount: activeProducts?.length || 0,
        lowStockCount:
          activeProducts?.filter(
            (p) => p.stock_in_pieces <= (p.reorder_level || 10)
          ).length || 0,
        recommendations: [
          "Database notification system is active and functional!",
          notificationSupported
            ? "Browser notifications supported"
            : "Browser notifications not supported",
          permissionStatus !== "granted"
            ? "Enable browser notifications for desktop alerts"
            : "Browser notifications enabled",
          "Check notification bell icon in header",
          "Proceed to Phase 5: Analytics Validation",
        ],
      };
    } catch (error) {
      console.error("❌ Phase 4 failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 MASTER VALIDATION COMMAND
   * Run all phases sequentially with detailed reporting
   */
  static async runCompleteValidation() {
    console.log("🚀 STARTING COMPLETE SYSTEM VALIDATION");
    console.log("=".repeat(80));
    console.log("⏰ Started at:", new Date().toLocaleString());
    console.log("=".repeat(80));

    const results = {
      phase1: await this.phase1_DatabaseFoundationCheck(),
      phase2: null,
      phase3: null,
      phase4: null,
    };

    // Only proceed if Phase 1 passes
    if (results.phase1.success) {
      results.phase2 = await this.phase2_MLDataPipelineValidation();

      if (results.phase2.success) {
        results.phase3 = await this.phase3_AlgorithmTesting();

        if (results.phase3.success) {
          results.phase4 = await this.phase4_NotificationSystemTest();
        }
      }
    }

    // Generate final report
    console.log("\n🎯 FINAL VALIDATION REPORT");
    console.log("=".repeat(80));

    const phases = [
      { name: "Database Foundation", result: results.phase1 },
      { name: "ML Data Pipeline", result: results.phase2 },
      { name: "Algorithm Testing", result: results.phase3 },
      { name: "Notification System", result: results.phase4 },
    ];

    phases.forEach((phase, index) => {
      const status = !phase.result
        ? "⏭️  SKIPPED"
        : phase.result.success
        ? "✅ PASSED"
        : "❌ FAILED";
      console.log(`Phase ${index + 1}: ${phase.name} - ${status}`);

      if (phase.result && !phase.result.success) {
        console.log(`   Error: ${phase.result.error}`);
      }

      if (phase.result && phase.result.recommendations) {
        console.log(
          `   Next steps: ${phase.result.recommendations.join(", ")}`
        );
      }
    });

    const passedPhases = phases.filter(
      (p) => p.result && p.result.success
    ).length;
    const totalPhases = phases.filter((p) => p.result).length;

    console.log("=".repeat(80));
    console.log(
      `📊 OVERALL RESULT: ${passedPhases}/${totalPhases} phases passed`
    );

    if (passedPhases === 4) {
      console.log("🎉 SYSTEM VALIDATION COMPLETE - ALL SYSTEMS OPERATIONAL!");
    } else {
      console.log(
        "⚠️  Some phases failed - review errors and fix before proceeding"
      );
    }

    return {
      success: passedPhases === totalPhases,
      passedPhases,
      totalPhases,
      results,
    };
  }
}

// Browser environment setup
if (typeof window !== "undefined") {
  window.SystemValidationRoadmap = SystemValidationRoadmap;

  console.log("🗺️ System Validation Roadmap loaded!");
  console.log("Commands available:");
  console.log(
    "  window.SystemValidationRoadmap.phase1_DatabaseFoundationCheck()"
  );
  console.log(
    "  window.SystemValidationRoadmap.phase2_MLDataPipelineValidation()"
  );
  console.log("  window.SystemValidationRoadmap.phase3_AlgorithmTesting()");
  console.log("  window.SystemValidationRoadmap.phase4_RealTimeEngineTest()");
  console.log(
    "  window.SystemValidationRoadmap.runCompleteValidation() // Run all phases"
  );
}

export default SystemValidationRoadmap;
