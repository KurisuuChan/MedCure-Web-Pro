// 🚀 QUICK CONSOLE VALIDATION SCRIPT
// Paste this directly into your browser console for immediate testing

console.log("🔧 Loading MedCure-Pro Validation Tools...");

// Define validation functions directly in browser console
window.quickValidation = {
  // Phase 1: Database Foundation Check
  async phase1_DatabaseCheck() {
    console.log("🔍 PHASE 1: DATABASE FOUNDATION CHECK");
    console.log("=".repeat(60));

    try {
      // Import supabase from global if available
      const { supabase } = await import("/src/config/supabase.js");

      // Test basic connectivity
      console.log("📡 Testing database connectivity...");
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("id, name, category, status")
        .limit(5);

      if (prodError) {
        console.error("❌ Products table error:", prodError);
        return { success: false, error: prodError.message };
      }

      console.log(`✅ Products table: ${products.length} records found`);
      if (products.length > 0) {
        console.log("   Sample:", products[0]);
      }

      // Test transactions
      const { data: transactions, error: transError } = await supabase
        .from("pos_transactions")
        .select("id, total_amount, status, created_at")
        .limit(5);

      if (transError) {
        console.error("❌ Transactions table error:", transError);
      } else {
        console.log(
          `✅ POS Transactions: ${transactions.length} records found`
        );
      }

      // Test transaction items
      const { data: items, error: itemsError } = await supabase
        .from("pos_transaction_items")
        .select("id, product_id, quantity, unit_price")
        .limit(5);

      if (itemsError) {
        console.error("❌ Transaction items error:", itemsError);
      } else {
        console.log(`✅ Transaction Items: ${items.length} records found`);
      }

      const success = !prodError && !transError && !itemsError;
      console.log(
        success
          ? "✅ Database foundation is solid!"
          : "❌ Database issues detected"
      );

      return {
        success,
        results: {
          products: products.length,
          transactions: transactions.length,
          items: items.length,
        },
      };
    } catch (error) {
      console.error("❌ Phase 1 failed:", error);
      return { success: false, error: error.message };
    }
  },

  // Phase 2: Test ML Service
  async phase2_MLTest() {
    console.log("\n🔍 PHASE 2: ML SERVICE TEST");
    console.log("=".repeat(60));

    try {
      // Import ML service
      const { MLService } = await import("/src/services/mlService.js");
      const { supabase } = await import("/src/config/supabase.js");

      // Get a sample product
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .eq("status", "active")
        .limit(1);

      if (!products || products.length === 0) {
        console.log("❌ No active products found for testing");
        return { success: false, error: "No active products" };
      }

      const testProduct = products[0];
      console.log(
        `🔍 Testing with product: ${testProduct.name} (ID: ${testProduct.id})`
      );

      // Test sales history retrieval
      console.log("📊 Testing sales history retrieval...");
      const salesHistory = await MLService.getProductSalesHistory(
        testProduct.id,
        30
      );

      console.log(`✅ Sales history: ${salesHistory.length} days retrieved`);
      const daysWithSales = salesHistory.filter(
        (day) => day.quantity > 0
      ).length;
      console.log(`📈 Days with sales: ${daysWithSales}`);

      // Test forecasting if sufficient data
      if (daysWithSales >= 3) {
        console.log("🤖 Testing demand forecasting...");
        const forecast = await MLService.forecastDemand(testProduct.id, 7);

        console.log("✅ Forecast generated:");
        console.log(
          `   - Total demand: ${forecast.totalDemand?.toFixed(2) || "N/A"}`
        );
        console.log(
          `   - Confidence: ${((forecast.confidence || 0) * 100).toFixed(1)}%`
        );
        console.log(
          `   - Forecast array length: ${forecast.forecast?.length || 0}`
        );

        return {
          success: true,
          testProduct: testProduct.name,
          salesHistory: salesHistory.length,
          daysWithSales,
          forecastGenerated: !!forecast.forecast,
        };
      } else {
        console.log(
          "⚠️ Insufficient sales data for forecasting (need 3+ days)"
        );
        return {
          success: true,
          testProduct: testProduct.name,
          salesHistory: salesHistory.length,
          daysWithSales,
          forecastGenerated: false,
          note: "Need more sales data for forecasting",
        };
      }
    } catch (error) {
      console.error("❌ Phase 2 failed:", error);
      return { success: false, error: error.message };
    }
  },

  // Quick Real-Time Engine Test
  async phase3_EngineTest() {
    console.log("\n🔍 PHASE 3: REAL-TIME ENGINE TEST");
    console.log("=".repeat(60));

    try {
      const { RealTimePredictionEngine } = await import(
        "/src/services/realTimePredictionEngine.js"
      );

      console.log("📦 Testing product retrieval...");
      const activeProducts = await RealTimePredictionEngine.getActiveProducts();
      console.log(`✅ Active products: ${activeProducts.length} found`);

      const topProducts =
        await RealTimePredictionEngine.getTopSellingProducts();
      console.log(`✅ Top selling products: ${topProducts.length} found`);

      // Test engine status
      const engineStatus = RealTimePredictionEngine.getEngineStatus();
      console.log("📊 Engine status:");
      console.log(`   - Running: ${engineStatus.isRunning}`);
      console.log(`   - Total predictions: ${engineStatus.totalPredictions}`);

      return {
        success: true,
        activeProducts: activeProducts.length,
        topProducts: topProducts.length,
        engineRunning: engineStatus.isRunning,
      };
    } catch (error) {
      console.error("❌ Phase 3 failed:", error);
      return { success: false, error: error.message };
    }
  },

  // Run all phases
  async runAll() {
    console.log("🚀 RUNNING COMPLETE VALIDATION");
    console.log("=".repeat(80));

    const results = {
      phase1: await this.phase1_DatabaseCheck(),
      phase2: null,
      phase3: null,
    };

    if (results.phase1.success) {
      results.phase2 = await this.phase2_MLTest();

      if (results.phase2.success) {
        results.phase3 = await this.phase3_EngineTest();
      }
    }

    console.log("\n🎯 VALIDATION SUMMARY");
    console.log("=".repeat(80));

    const phases = [
      { name: "Database Foundation", result: results.phase1 },
      { name: "ML Service", result: results.phase2 },
      { name: "Real-Time Engine", result: results.phase3 },
    ];

    phases.forEach((phase, index) => {
      const status = !phase.result
        ? "⏭️ SKIPPED"
        : phase.result.success
        ? "✅ PASSED"
        : "❌ FAILED";
      console.log(`Phase ${index + 1}: ${phase.name} - ${status}`);

      if (phase.result && !phase.result.success) {
        console.log(`   Error: ${phase.result.error}`);
      }
    });

    const passedPhases = phases.filter(
      (p) => p.result && p.result.success
    ).length;
    console.log("=".repeat(80));
    console.log(`📊 RESULT: ${passedPhases}/3 phases passed`);

    if (passedPhases === 3) {
      console.log("🎉 ALL SYSTEMS OPERATIONAL!");
    } else {
      console.log("⚠️ Some systems need attention");
    }

    return results;
  },
};

console.log("✅ Quick Validation Tools Loaded!");
console.log("");
console.log("📋 Available Commands:");
console.log("  await window.quickValidation.phase1_DatabaseCheck()");
console.log("  await window.quickValidation.phase2_MLTest()");
console.log("  await window.quickValidation.phase3_EngineTest()");
console.log("  await window.quickValidation.runAll()");
console.log("");
console.log("🚀 Quick Start: await window.quickValidation.runAll()");
