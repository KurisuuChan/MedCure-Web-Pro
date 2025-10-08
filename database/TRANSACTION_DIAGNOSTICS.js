// ================================================================
// COMPREHENSIVE TRANSACTION UPDATE DIAGNOSTICS
// ================================================================
// Run this script in the browser console to diagnose transaction update issues

window.TransactionDiagnostics = {
  async runComprehensiveDiagnostics() {
    console.log("🔍 Starting comprehensive transaction update diagnostics...");

    const results = {
      timestamp: new Date().toISOString(),
      database_capabilities: null,
      rpc_functions: null,
      sample_transaction_test: null,
      manual_update_test: null,
      constraint_analysis: null,
    };

    try {
      // Test 1: Database Capabilities
      console.log("📊 Testing database capabilities...");
      results.database_capabilities = await this.testDatabaseCapabilities();

      // Test 2: RPC Functions
      console.log("🛠️ Testing RPC functions...");
      results.rpc_functions = await this.testRPCFunctions();

      // Test 3: Find a sample transaction for testing
      console.log("🔍 Finding sample transaction...");
      const sampleTransaction = await this.findSampleTransaction();

      if (sampleTransaction) {
        // Test 4: Manual update test
        console.log("✏️ Testing manual update...");
        results.manual_update_test = await this.testManualUpdate(
          sampleTransaction.id
        );

        // Test 5: RPC update test
        console.log("🔧 Testing RPC update...");
        results.sample_transaction_test = await this.testRPCUpdate(
          sampleTransaction.id
        );
      }

      // Test 6: Constraint Analysis
      console.log("🔒 Analyzing constraints...");
      results.constraint_analysis = await this.analyzeConstraints();

      console.log("✅ Comprehensive diagnostics completed:", results);
      return results;
    } catch (error) {
      console.error("❌ Diagnostics failed:", error);
      results.error = error.message;
      return results;
    }
  },

  async testDatabaseCapabilities() {
    try {
      // Test basic Supabase connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("sales")
        .select("id")
        .limit(1);

      if (connectionError) {
        return { success: false, error: connectionError.message };
      }

      return {
        success: true,
        connection: "working",
        sample_transactions: connectionTest.length,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async testRPCFunctions() {
    const tests = {
      update_transaction_total: false,
      diagnose_transaction_update: false,
      errors: {},
    };

    // Test update function
    try {
      const { data, error } = await supabase.rpc("update_transaction_total", {
        transaction_id: "00000000-0000-0000-0000-000000000000",
        new_total: 0,
      });

      if (error) {
        tests.errors.update_transaction_total = error.message;
        tests.update_transaction_total =
          !error.message.includes("does not exist");
      } else {
        tests.update_transaction_total = true;
      }
    } catch (error) {
      tests.errors.update_transaction_total = error.message;
    }

    // Test diagnostic function
    try {
      const { data, error } = await supabase.rpc(
        "diagnose_transaction_update",
        {
          transaction_id: "00000000-0000-0000-0000-000000000000",
        }
      );

      if (error) {
        tests.errors.diagnose_transaction_update = error.message;
        tests.diagnose_transaction_update =
          !error.message.includes("does not exist");
      } else {
        tests.diagnose_transaction_update = true;
      }
    } catch (error) {
      tests.errors.diagnose_transaction_update = error.message;
    }

    return tests;
  },

  async findSampleTransaction() {
    try {
      const { data: transactions, error } = await supabase
        .from("sales")
        .select("id, total_amount, status")
        .eq("status", "completed")
        .limit(1);

      if (error || !transactions.length) {
        console.warn("⚠️ No sample transactions found");
        return null;
      }

      return transactions[0];
    } catch (error) {
      console.error("❌ Error finding sample transaction:", error);
      return null;
    }
  },

  async testManualUpdate(transactionId) {
    try {
      console.log(`🧪 Testing manual update on transaction: ${transactionId}`);

      // Get current total
      const { data: before, error: beforeError } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("id", transactionId)
        .single();

      if (beforeError) {
        return { success: false, error: beforeError.message };
      }

      const originalTotal = before.total_amount;
      const testTotal = originalTotal + 0.01; // Small change for testing

      // Attempt update
      const { data: updateResult, error: updateError } = await supabase
        .from("sales")
        .update({ total_amount: testTotal })
        .eq("id", transactionId)
        .select("total_amount")
        .single();

      if (updateError) {
        return {
          success: false,
          error: updateError.message,
          original_total: originalTotal,
        };
      }

      // Verify update
      const { data: after, error: afterError } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("id", transactionId)
        .single();

      const updateSuccessful = Math.abs(after.total_amount - testTotal) < 0.001;

      // Restore original value
      await supabase
        .from("sales")
        .update({ total_amount: originalTotal })
        .eq("id", transactionId);

      return {
        success: updateSuccessful,
        original_total: originalTotal,
        test_total: testTotal,
        actual_result: after.total_amount,
        update_worked: updateSuccessful,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async testRPCUpdate(transactionId) {
    try {
      console.log(`🔧 Testing RPC update on transaction: ${transactionId}`);

      // Get current total
      const { data: before, error: beforeError } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("id", transactionId)
        .single();

      if (beforeError) {
        return { success: false, error: beforeError.message };
      }

      const originalTotal = before.total_amount;
      const testTotal = originalTotal + 0.01; // Small change for testing

      // Test RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "update_transaction_total",
        {
          transaction_id: transactionId,
          new_total: testTotal,
        }
      );

      if (rpcError) {
        return {
          success: false,
          error: rpcError.message,
          original_total: originalTotal,
        };
      }

      // Verify the result
      const { data: after, error: afterError } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("id", transactionId)
        .single();

      const updateSuccessful = Math.abs(after.total_amount - testTotal) < 0.001;

      // Restore original value
      await supabase.rpc("update_transaction_total", {
        transaction_id: transactionId,
        new_total: originalTotal,
      });

      return {
        success: updateSuccessful,
        rpc_response: rpcResult,
        original_total: originalTotal,
        test_total: testTotal,
        actual_result: after.total_amount,
        update_worked: updateSuccessful,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async analyzeConstraints() {
    try {
      // Test if diagnose function exists
      const { data: constraintData, error: constraintError } =
        await supabase.rpc("diagnose_transaction_update", {
          transaction_id: "00000000-0000-0000-0000-000000000000",
        });

      if (constraintError) {
        return {
          success: false,
          error: constraintError.message,
          note: "RPC function may not be installed",
        };
      }

      return {
        success: true,
        constraint_info: constraintData,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Quick test for immediate issues
  async quickTest() {
    console.log("⚡ Running quick transaction update test...");

    try {
      // Test 1: Basic connection
      const { data: transactions, error } = await supabase
        .from("sales")
        .select("id, total_amount")
        .limit(1);

      if (error) {
        console.error("❌ Basic connection failed:", error);
        return { success: false, error: error.message };
      }

      if (!transactions.length) {
        console.warn("⚠️ No transactions found for testing");
        return { success: false, error: "No transactions available" };
      }

      const testTransaction = transactions[0];
      const originalTotal = testTransaction.total_amount;
      const testTotal = originalTotal + 0.01;

      console.log(
        `🧪 Testing update on transaction ${testTransaction.id}: ${originalTotal} → ${testTotal}`
      );

      // Test 2: Standard update
      const { data: updateResult, error: updateError } = await supabase
        .from("sales")
        .update({ total_amount: testTotal })
        .eq("id", testTransaction.id)
        .select("total_amount")
        .single();

      if (updateError) {
        console.error("❌ Standard update failed:", updateError);
        return { success: false, error: updateError.message };
      }

      // Test 3: Verify update
      const { data: verification, error: verifyError } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("id", testTransaction.id)
        .single();

      const updateWorked =
        Math.abs(verification.total_amount - testTotal) < 0.001;

      // Restore original value
      await supabase
        .from("sales")
        .update({ total_amount: originalTotal })
        .eq("id", testTransaction.id);

      if (updateWorked) {
        console.log("✅ Transaction updates are working normally!");
        return { success: true, message: "Updates working normally" };
      } else {
        console.error(
          `❌ Update failed: Expected ${testTotal}, got ${verification.total_amount}`
        );
        return {
          success: false,
          error: "Update verification failed",
          expected: testTotal,
          actual: verification.total_amount,
        };
      }
    } catch (error) {
      console.error("❌ Quick test failed:", error);
      return { success: false, error: error.message };
    }
  },
};

// Auto-run quick test
console.log("🚀 Transaction diagnostics loaded! Available commands:");
console.log("  • window.TransactionDiagnostics.quickTest() - Quick test");
console.log(
  "  • window.TransactionDiagnostics.runComprehensiveDiagnostics() - Full analysis"
);

// Run quick test automatically
window.TransactionDiagnostics.quickTest();
