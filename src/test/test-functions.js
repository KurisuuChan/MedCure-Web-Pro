import { supabase } from "../config/supabase.js";

async function testStockFunctions() {
  console.log("🧪 Testing stock management functions...");

  try {
    // Test if functions exist by calling with a non-existent ID
    console.log("1. Testing complete_transaction_with_stock...");
    const { data: test1, error: error1 } = await supabase.rpc(
      "complete_transaction_with_stock",
      {
        p_transaction_id: "00000000-0000-0000-0000-000000000000",
      }
    );

    if (error1) {
      console.log("✅ complete_transaction_with_stock exists:", error1.message);
    } else {
      console.log("✅ complete_transaction_with_stock responded:", test1);
    }

    console.log("2. Testing undo_transaction_completely...");
    const { data: test2, error: error2 } = await supabase.rpc(
      "undo_transaction_completely",
      {
        p_transaction_id: "00000000-0000-0000-0000-000000000000",
      }
    );

    if (error2) {
      console.log("❌ undo_transaction_completely error:", error2.message);
    } else {
      console.log("✅ undo_transaction_completely responded:", test2);
    }

    console.log("3. Testing edit_transaction_with_stock_management...");
    const { data: test3, error: error3 } = await supabase.rpc(
      "edit_transaction_with_stock_management",
      {
        p_edit_data: {
          transaction_id: "00000000-0000-0000-0000-000000000000",
          items: [],
        },
      }
    );

    if (error3) {
      console.log(
        "❌ edit_transaction_with_stock_management error:",
        error3.message
      );
    } else {
      console.log(
        "✅ edit_transaction_with_stock_management responded:",
        test3
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testStockFunctions();
