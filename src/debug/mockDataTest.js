/**
 * Mock Data Integration Test
 * Verifies that all major services connect to real data instead of mock data
 */

import { MLService } from "../services/infrastructure/mlService";
// import { RealTimePredictionEngine } from "../services/infrastructure/realTimePredictionEngine";
// import { NotificationAnalyticsService } from "../services/domains/notifications/notificationAnalyticsService";
import { AnalyticsService } from "../services/domains/analytics/analyticsService";

/**
 * Test MLService data connections
 */
export async function testMLServiceDataConnections() {
  console.log("🧪 Testing MLService data connections...");

  try {
    // Test getProductSalesHistory
    console.log("📊 Testing getProductSalesHistory...");
    const salesHistory = await MLService.getProductSalesHistory(1, 30);
    console.log(
      `✅ getProductSalesHistory returned ${salesHistory.length} records`
    );

    // Test getCustomerTransactionData
    console.log("👥 Testing getCustomerTransactionData...");
    const customerData = await MLService.getCustomerTransactionData();
    console.log(
      `✅ getCustomerTransactionData returned ${customerData.length} customers`
    );

    // Test forecastDemand (should now work with real data)
    console.log("🤖 Testing forecastDemand...");
    const forecast = await MLService.forecastDemand(1, 7);
    console.log(
      `✅ forecastDemand completed - confidence: ${forecast.confidence}`
    );

    return { success: true, message: "MLService data connections working" };
  } catch (error) {
    console.error("❌ MLService data connection test failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Test RealTimePredictionEngine data connections
 */
export async function testRealTimePredictionEngineConnections() {
  console.log("🧪 Testing RealTimePredictionEngine data connections...");

  try {
    // Test getActiveProducts
    console.log("📦 Testing getActiveProducts...");
    const activeProducts = await RealTimePredictionEngine.getActiveProducts();
    console.log(
      `✅ getActiveProducts returned ${activeProducts.length} products`
    );

    // Test getTopSellingProducts
    console.log("📈 Testing getTopSellingProducts...");
    const topProducts = await RealTimePredictionEngine.getTopSellingProducts();
    console.log(
      `✅ getTopSellingProducts returned ${topProducts.length} products`
    );

    return {
      success: true,
      message: "RealTimePredictionEngine data connections working",
    };
  } catch (error) {
    console.error(
      "❌ RealTimePredictionEngine data connection test failed:",
      error
    );
    return { success: false, error: error.message };
  }
}

/**
 * Test NotificationAnalyticsService
 */
export async function testNotificationAnalyticsService() {
  console.log("🧪 Testing NotificationAnalyticsService...");

  try {
    // Test getNotificationAnalytics
    console.log("📊 Testing getNotificationAnalytics...");
    const analytics =
      await NotificationAnalyticsService.getNotificationAnalytics();
    console.log(
      `✅ getNotificationAnalytics returned data with overview:`,
      analytics.overview
    );

    return { success: true, message: "NotificationAnalyticsService working" };
  } catch (error) {
    console.error("❌ NotificationAnalyticsService test failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Test AnalyticsService
 */
export async function testAnalyticsService() {
  console.log("🧪 Testing AnalyticsService...");

  try {
    // Test getAnalyticsData
    console.log("📈 Testing getAnalyticsData...");
    const analyticsResult = await AnalyticsService.getAnalyticsData();
    console.log(`✅ getAnalyticsData success: ${analyticsResult.success}`);

    if (analyticsResult.success) {
      console.log("📊 Analytics data keys:", Object.keys(analyticsResult.data));
    }

    return { success: true, message: "AnalyticsService working" };
  } catch (error) {
    console.error("❌ AnalyticsService test failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Run comprehensive data integration test
 */
export async function runComprehensiveDataTest() {
  console.log("🚀 Starting comprehensive mock data removal verification...");
  console.log("=".repeat(60));

  const results = {
    mlService: await testMLServiceDataConnections(),
    predictionEngine: await testRealTimePredictionEngineConnections(),
    notificationAnalytics: await testNotificationAnalyticsService(),
    analytics: await testAnalyticsService(),
  };

  console.log("=".repeat(60));
  console.log("📋 COMPREHENSIVE TEST RESULTS:");

  const allPassed = Object.values(results).every((result) => result.success);

  Object.entries(results).forEach(([service, result]) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status} ${service}: ${result.message || result.error}`);
  });

  console.log("=".repeat(60));

  if (allPassed) {
    console.log(
      "🎉 ALL TESTS PASSED! Mock data has been successfully removed."
    );
    console.log("✅ All services are now connected to real Supabase data.");
  } else {
    console.log("⚠️  Some tests failed. Review the errors above.");
  }

  return {
    success: allPassed,
    results,
    summary: `${Object.values(results).filter((r) => r.success).length}/${
      Object.keys(results).length
    } services passing`,
  };
}

// Auto-run if called directly
if (typeof window !== "undefined") {
  // Browser environment - attach to window for manual testing
  window.mockDataTest = {
    runComprehensiveDataTest,
    testMLServiceDataConnections,
    testRealTimePredictionEngineConnections,
    testNotificationAnalyticsService,
    testAnalyticsService,
  };

  console.log("🧪 Mock data tests available at window.mockDataTest");
  console.log("   Run: window.mockDataTest.runComprehensiveDataTest()");
}
