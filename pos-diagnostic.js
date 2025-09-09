// 🧪 **POS SYSTEM DIAGNOSTIC SCRIPT**
// Professional testing and validation tool
// Copy and paste this into browser console (F12) on http://localhost:5174

console.log("🚀 Starting POS System Diagnostic...");

// =================================================================
// 🔧 SYSTEM HEALTH CHECK
// =================================================================

async function runSystemDiagnostic() {
  console.log("\n📊 === POS SYSTEM DIAGNOSTIC REPORT ===\n");

  try {
    // 1. CHECK UNIFIED SERVICE AVAILABILITY
    console.log("1️⃣ Checking Unified Transaction Service...");

    if (typeof unifiedTransactionService !== "undefined") {
      console.log("✅ unifiedTransactionService is available");

      // Run health check if available
      try {
        const healthCheck = await unifiedTransactionService.runHealthCheck();
        console.log("✅ Health Check Results:", healthCheck);
      } catch (error) {
        console.log("⚠️ Health check failed:", error.message);
      }
    } else {
      console.log("❌ unifiedTransactionService is NOT available");
    }

    // 2. CHECK DATABASE FUNCTIONS
    console.log("\n2️⃣ Testing Database Function Availability...");

    const testFunctions = [
      "create_sale_with_items",
      "complete_transaction_with_stock",
      "undo_transaction_completely",
      "edit_transaction_with_stock_management",
    ];

    for (const funcName of testFunctions) {
      try {
        // Try to call with empty params to test existence
        await supabase.rpc(funcName, {});
        console.log(`✅ ${funcName} - Function exists`);
      } catch (error) {
        if (
          error.message.includes("function") &&
          error.message.includes("does not exist")
        ) {
          console.log(`❌ ${funcName} - Function MISSING`);
        } else {
          console.log(
            `⚠️ ${funcName} - Function exists but failed validation:`,
            error.message
          );
        }
      }
    }

    // 3. TEST BASIC TRANSACTION WORKFLOW
    console.log("\n3️⃣ Testing Basic Transaction Workflow...");

    if (typeof unifiedTransactionService !== "undefined") {
      try {
        // Get a test product
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .limit(1);

        if (products && products.length > 0) {
          const testProduct = products[0];
          console.log("📦 Using test product:", testProduct.name);

          const testSale = {
            items: [
              {
                product_id: testProduct.id,
                quantity: 1,
                unit_type: "piece",
                unit_price: testProduct.price_per_piece || 10.0,
                total_price: testProduct.price_per_piece || 10.0,
              },
            ],
            total: testProduct.price_per_piece || 10.0,
            paymentMethod: "cash",
            cashierId: "test-diagnostic",
          };

          // Test create transaction
          console.log("🆕 Testing transaction creation...");
          const createResult =
            await unifiedTransactionService.createTransaction(testSale);
          console.log("✅ Transaction created:", createResult.transaction_id);

          // Test complete transaction
          console.log("💰 Testing transaction completion...");
          const completeResult =
            await unifiedTransactionService.completeTransaction(
              createResult.transaction_id
            );
          console.log("✅ Transaction completed:", completeResult.status);

          // Test undo transaction
          console.log("↩️ Testing transaction undo...");
          const undoResult = await unifiedTransactionService.undoTransaction(
            createResult.transaction_id
          );
          console.log("✅ Transaction undone:", undoResult.status);

          console.log("🎉 Basic workflow test PASSED!");
        } else {
          console.log("⚠️ No products available for testing");
        }
      } catch (error) {
        console.log("❌ Basic workflow test FAILED:", error.message);
      }
    }

    // 4. CHECK REVENUE CALCULATION
    console.log("\n4️⃣ Testing Revenue Calculation...");

    try {
      const { data: allSales } = await supabase
        .from("sales")
        .select("id, total_amount, status")
        .order("created_at", { ascending: false })
        .limit(10);

      if (allSales && allSales.length > 0) {
        const allRevenue = allSales.reduce(
          (sum, sale) => sum + (sale.total_amount || 0),
          0
        );
        const completedRevenue = allSales
          .filter((sale) => sale.status === "completed")
          .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        const cancelledCount = allSales.filter(
          (sale) => sale.status === "cancelled"
        ).length;

        console.log("💰 Revenue Analysis:");
        console.log(`   All transactions: ₱${allRevenue.toFixed(2)}`);
        console.log(`   Completed only: ₱${completedRevenue.toFixed(2)}`);
        console.log(`   Cancelled transactions: ${cancelledCount}`);

        if (cancelledCount > 0 && allRevenue !== completedRevenue) {
          console.log(
            "⚠️ Revenue calculation should exclude cancelled transactions"
          );
        } else {
          console.log("✅ Revenue calculation appears correct");
        }
      } else {
        console.log("ℹ️ No sales data available for revenue test");
      }
    } catch (error) {
      console.log("❌ Revenue calculation test failed:", error.message);
    }

    // 5. CHECK FOR COMPETING TRIGGERS
    console.log("\n5️⃣ Checking for Competing Database Triggers...");

    try {
      const { data: triggers } = await supabase
        .from("information_schema.triggers")
        .select("trigger_name, event_object_table")
        .in("event_object_table", ["sales", "sale_items"]);

      if (triggers && triggers.length > 0) {
        console.log("⚠️ Found database triggers that might cause conflicts:");
        triggers.forEach((trigger) => {
          console.log(
            `   - ${trigger.trigger_name} on ${trigger.event_object_table}`
          );
        });
      } else {
        console.log("✅ No competing triggers found");
      }
    } catch (error) {
      console.log("ℹ️ Could not check triggers (normal for some setups)");
    }

    console.log("\n🎯 === DIAGNOSTIC SUMMARY ===");
    console.log("Copy this report and share with your developer for analysis.");
  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
  }
}

// =================================================================
// 🧪 MANUAL TESTING FUNCTIONS
// =================================================================

// Test individual POS operations
window.testPOSOperation = async (operation, ...args) => {
  console.log(`🧪 Testing POS operation: ${operation}`);

  try {
    let result;
    switch (operation) {
      case "create":
        result = await unifiedTransactionService.createTransaction(args[0]);
        break;
      case "complete":
        result = await unifiedTransactionService.completeTransaction(args[0]);
        break;
      case "undo":
        result = await unifiedTransactionService.undoTransaction(args[0]);
        break;
      case "getTransactions":
        result = await unifiedTransactionService.getTransactions(args[0] || {});
        break;
      default:
        throw new Error("Unknown operation");
    }

    console.log("✅ Operation successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Operation failed:", error);
    throw error;
  }
};

// Quick stock check for a product
window.checkProductStock = async (productId) => {
  try {
    const { data } = await supabase
      .from("products")
      .select("name, stock_in_pieces")
      .eq("id", productId)
      .single();

    console.log(`📦 Stock for ${data.name}: ${data.stock_in_pieces} pieces`);
    return data;
  } catch (error) {
    console.error("❌ Stock check failed:", error);
  }
};

// Quick revenue calculation
window.calculateRevenue = async () => {
  try {
    const { data: sales } = await supabase
      .from("sales")
      .select("total_amount, status")
      .order("created_at", { ascending: false });

    const total = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const completed = sales
      .filter((s) => s.status === "completed")
      .reduce((sum, sale) => sum + sale.total_amount, 0);

    console.log("💰 Revenue Summary:");
    console.log(`   Total: ₱${total.toFixed(2)}`);
    console.log(`   Completed: ₱${completed.toFixed(2)}`);

    return { total, completed };
  } catch (error) {
    console.error("❌ Revenue calculation failed:", error);
  }
};

// =================================================================
// 🚀 AUTO-START DIAGNOSTIC
// =================================================================

// Run diagnostic automatically
setTimeout(() => {
  runSystemDiagnostic();
}, 1000);

// Export functions for manual testing
console.log("\n📋 Available Test Functions:");
console.log("• runSystemDiagnostic() - Full system check");
console.log(
  "• testPOSOperation(operation, ...args) - Test specific operations"
);
console.log("• checkProductStock(productId) - Check product stock");
console.log("• calculateRevenue() - Calculate total revenue");

console.log("\n🎯 Example Usage:");
console.log('testPOSOperation("getTransactions", {limit: 5})');
console.log("checkProductStock(1)");
console.log("calculateRevenue()");
