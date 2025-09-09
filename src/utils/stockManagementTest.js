// =================================================
// 🚀 SIMPLE STOCK MANAGEMENT TEST & DEPLOYMENT
// Browser-compatible version for testing stock fixes
// =================================================

import { supabase } from "../config/supabase";

// Test if stock management functions are available
export const testStockManagementAvailability = async () => {
  try {
    console.log("🧪 Testing stock management availability...");

    // Test if we can call the stock management function
    const testResult = await supabase.rpc(
      "edit_transaction_with_stock_management",
      {
        p_transaction_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
        p_new_items: "[]",
        p_edit_data: "{}",
      }
    );

    if (testResult.error && testResult.error.code === "42883") {
      console.log("❌ Stock management functions not deployed yet");
      return {
        available: false,
        error: "Functions not found - need to deploy SQL script",
      };
    }

    if (testResult.error && testResult.error.message.includes("not found")) {
      console.log("❌ Transaction not found (expected for test)");
      console.log("✅ But function exists - deployment successful!");
      return { available: true };
    }

    console.log("✅ Stock management functions are available");
    return { available: true };
  } catch (error) {
    console.error("❌ Error testing stock management:", error);
    return {
      available: false,
      error: error.message,
    };
  }
};

// Check stock movements table structure
export const checkStockMovementsTable = async () => {
  try {
    console.log("📋 Checking stock movements table...");

    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ Stock movements table error:", error);
      return { exists: false, error: error.message };
    }

    console.log("✅ Stock movements table accessible");
    return { exists: true, sample: data };
  } catch (error) {
    console.error("❌ Error checking stock movements:", error);
    return { exists: false, error: error.message };
  }
};

// Test transaction editing with current system
export const testCurrentTransactionEditing = async () => {
  try {
    console.log("🔧 Testing current transaction editing...");

    // Get a recent transaction to test with
    const { data: transactions, error } = await supabase
      .from("sales")
      .select(
        `
        id,
        total_amount,
        created_at,
        sale_items (
          id,
          product_id,
          quantity,
          unit_type,
          unit_price,
          total_price
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("❌ Error fetching transactions:", error);
      return { success: false, error: error.message };
    }

    if (!transactions || transactions.length === 0) {
      console.log("❌ No transactions found for testing");
      return { success: false, error: "No test data available" };
    }

    const testTransaction = transactions[0];
    console.log("📋 Found test transaction:", testTransaction.id);

    // Check if stock management is available
    const stockTest = await testStockManagementAvailability();

    return {
      success: true,
      testTransaction,
      stockManagementAvailable: stockTest.available,
      recommendation: stockTest.available
        ? "✅ Ready to use enhanced editing"
        : "⚠️ Deploy SQL script first, then use enhanced editing",
    };
  } catch (error) {
    console.error("❌ Error testing transaction editing:", error);
    return { success: false, error: error.message };
  }
};

// Complete system readiness check
export const checkSystemReadiness = async () => {
  try {
    console.log("🔍 Running complete system readiness check...");

    const results = {
      stockManagement: await testStockManagementAvailability(),
      stockMovements: await checkStockMovementsTable(),
      transactionEditing: await testCurrentTransactionEditing(),
    };

    console.log("📊 System Readiness Results:", results);

    const allReady =
      results.stockManagement.available &&
      results.stockMovements.exists &&
      results.transactionEditing.success;

    if (allReady) {
      console.log("🎉 System is ready for stock-aware transaction editing!");
    } else {
      console.log("⚠️ System needs additional setup:");
      if (!results.stockManagement.available) {
        console.log("  - Deploy database SQL script");
      }
      if (!results.stockMovements.exists) {
        console.log("  - Create stock_movements table");
      }
      if (!results.transactionEditing.success) {
        console.log("  - Fix transaction editing setup");
      }
    }

    return {
      ready: allReady,
      results,
    };
  } catch (error) {
    console.error("❌ System readiness check failed:", error);
    return { ready: false, error: error.message };
  }
};

// Export for browser console use
if (typeof window !== "undefined") {
  window.testStockManagement = testStockManagementAvailability;
  window.checkStockMovements = checkStockMovementsTable;
  window.testTransactionEditing = testCurrentTransactionEditing;
  window.checkSystemReadiness = checkSystemReadiness;

  console.log("🛠️ Stock management testing functions loaded!");
  console.log("Available functions:");
  console.log("  - testStockManagement()");
  console.log("  - checkStockMovements()");
  console.log("  - testTransactionEditing()");
  console.log("  - checkSystemReadiness()");
}
