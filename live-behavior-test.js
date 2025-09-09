// 🧪 LIVE SYSTEM BEHAVIOR TEST
// Copy and paste this into browser console (F12) at http://localhost:5174

console.log("🔍 Starting Live System Behavior Test...");

const testSystemBehavior = async () => {
  try {
    console.log("\n📊 === CHECKING CURRENT SYSTEM STATE ===\n");

    // 1. Check if unified service is available
    if (typeof unifiedTransactionService === "undefined") {
      console.log("❌ unifiedTransactionService not available");
      return;
    }

    // 2. Get a test product with good stock
    console.log("🔍 Finding suitable test product...");
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .gt("stock_in_pieces", 10)
      .eq("is_active", true)
      .limit(1);

    if (productError || !products || products.length === 0) {
      console.log("❌ No suitable products found for testing");
      return;
    }

    const testProduct = products[0];
    console.log("📦 Test Product:", {
      id: testProduct.id,
      name: testProduct.name,
      initial_stock: testProduct.stock_in_pieces,
      price: testProduct.price_per_piece,
    });

    const initialStock = testProduct.stock_in_pieces;
    const testQuantity = 3; // Test with 3 pieces

    // 3. Create test sale data
    const testSaleData = {
      items: [
        {
          product_id: testProduct.id,
          quantity: testQuantity,
          unit_type: "piece",
          unit_price: testProduct.price_per_piece,
          total_price: testProduct.price_per_piece * testQuantity,
        },
      ],
      total: testProduct.price_per_piece * testQuantity,
      paymentMethod: "cash",
      cashierId: "diagnostic-test",
    };

    console.log("\n🧪 === TESTING TRANSACTION WORKFLOW ===\n");

    // 4. Test Step 1: Create Transaction (should NOT deduct stock)
    console.log("1️⃣ Creating transaction (should NOT deduct stock yet)...");
    const createResult = await unifiedTransactionService.createTransaction(
      testSaleData
    );
    console.log("✅ Transaction created:", createResult.transaction_id);

    // Check stock after create
    const { data: afterCreateProduct } = await supabase
      .from("products")
      .select("stock_in_pieces")
      .eq("id", testProduct.id)
      .single();

    const stockAfterCreate = afterCreateProduct.stock_in_pieces;
    console.log("📊 Stock after CREATE:", {
      initial: initialStock,
      current: stockAfterCreate,
      difference: initialStock - stockAfterCreate,
      expected_difference: 0,
    });

    if (stockAfterCreate === initialStock) {
      console.log(
        "✅ CORRECT: No stock deduction during create (transaction pending)"
      );
    } else {
      console.log("⚠️ ISSUE: Stock was deducted during create phase");
    }

    // 5. Test Step 2: Complete Transaction (should deduct stock)
    console.log("\n2️⃣ Completing transaction (should deduct stock now)...");
    const completeResult = await unifiedTransactionService.completeTransaction(
      createResult.transaction_id
    );
    console.log("✅ Transaction completed:", completeResult.status);

    // Check stock after complete
    const { data: afterCompleteProduct } = await supabase
      .from("products")
      .select("stock_in_pieces")
      .eq("id", testProduct.id)
      .single();

    const stockAfterComplete = afterCompleteProduct.stock_in_pieces;
    const actualDeduction = initialStock - stockAfterComplete;

    console.log("📊 Stock after COMPLETE:", {
      initial: initialStock,
      current: stockAfterComplete,
      actual_deduction: actualDeduction,
      expected_deduction: testQuantity,
    });

    if (actualDeduction === testQuantity) {
      console.log(
        "✅ CORRECT: Stock deducted by exact amount (" + testQuantity + ")"
      );
    } else if (actualDeduction === testQuantity * 2) {
      console.log(
        "❌ DOUBLE DEDUCTION: Stock deducted twice! (" +
          actualDeduction +
          " instead of " +
          testQuantity +
          ")"
      );
    } else {
      console.log("⚠️ UNEXPECTED: Stock deduction amount is wrong");
    }

    // 6. Test Step 3: Undo Transaction (should restore stock)
    console.log("\n3️⃣ Undoing transaction (should restore stock)...");
    const undoResult = await unifiedTransactionService.undoTransaction(
      createResult.transaction_id
    );
    console.log("✅ Transaction undone:", undoResult.status);

    // Check stock after undo
    const { data: afterUndoProduct } = await supabase
      .from("products")
      .select("stock_in_pieces")
      .eq("id", testProduct.id)
      .single();

    const stockAfterUndo = afterUndoProduct.stock_in_pieces;
    console.log("📊 Stock after UNDO:", {
      initial: initialStock,
      current: stockAfterUndo,
      difference: initialStock - stockAfterUndo,
      expected_difference: 0,
    });

    if (stockAfterUndo === initialStock) {
      console.log("✅ CORRECT: Stock fully restored to original amount");
    } else {
      console.log("❌ ISSUE: Stock not properly restored");
    }

    // 7. Check transaction status
    const { data: finalTransaction } = await supabase
      .from("sales")
      .select("status")
      .eq("id", createResult.transaction_id)
      .single();

    console.log("📋 Final transaction status:", finalTransaction.status);

    console.log("\n🎯 === TEST SUMMARY ===\n");

    const issues = [];
    if (stockAfterCreate !== initialStock)
      issues.push("Stock deducted during create phase");
    if (actualDeduction !== testQuantity)
      issues.push("Incorrect stock deduction amount");
    if (stockAfterUndo !== initialStock)
      issues.push("Stock not properly restored");

    if (issues.length === 0) {
      console.log("🎉 ALL TESTS PASSED! System working correctly!");
    } else {
      console.log("⚠️ ISSUES FOUND:");
      issues.forEach((issue) => console.log("   - " + issue));
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("Error details:", error.message);
  }
};

// Run the test
testSystemBehavior();

// Also provide manual testing functions
window.checkProductStock = async (productId) => {
  const { data } = await supabase
    .from("products")
    .select("name, stock_in_pieces")
    .eq("id", productId)
    .single();
  console.log(`📦 ${data.name}: ${data.stock_in_pieces} pieces`);
  return data;
};

window.checkRecentTransactions = async () => {
  const { data } = await supabase
    .from("sales")
    .select("id, status, total_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log("📋 Recent transactions:", data);
  return data;
};

console.log("\n📋 Available manual test functions:");
console.log("• checkProductStock(productId) - Check specific product stock");
console.log("• checkRecentTransactions() - View recent transactions");
