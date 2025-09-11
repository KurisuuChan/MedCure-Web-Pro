// 🧪 TRANSACTION HISTORY DEBUG TEST
// Run this in browser console to test transaction data fetching

import unifiedTransactionService from "../services/domains/sales/transactionService";

export class TransactionHistoryTester {
  static async runComprehensiveTest() {
    console.log("🧪 Starting Transaction History Test...");

    try {
      // Test 1: Get today's transactions
      console.log("\n📊 Test 1: Getting today's transactions...");
      const todaysTransactions =
        await unifiedTransactionService.getTodaysTransactions();

      console.log("✅ Today's transactions result:", {
        success: true,
        count: todaysTransactions?.length || 0,
        data: todaysTransactions,
      });

      if (todaysTransactions && todaysTransactions.length > 0) {
        // Test 2: Analyze first transaction structure
        console.log("\n🔍 Test 2: Analyzing transaction structure...");
        const firstTransaction = todaysTransactions[0];

        const analysis = {
          id: firstTransaction.id,
          status: firstTransaction.status,
          total_amount: firstTransaction.total_amount,
          payment_method: firstTransaction.payment_method,
          created_at: firstTransaction.created_at,
          items_source: {
            has_items: !!firstTransaction.items,
            has_sale_items: !!firstTransaction.sale_items,
            items_count: firstTransaction.items?.length || 0,
            sale_items_count: firstTransaction.sale_items?.length || 0,
          },
          item_details: (
            firstTransaction.items ||
            firstTransaction.sale_items ||
            []
          ).map((item) => ({
            product_id: item.product_id,
            product_name: item.products?.name || item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })),
        };

        console.log("📊 Transaction analysis:", analysis);

        // Test 3: Check for data consistency issues
        console.log("\n🔍 Test 3: Checking data consistency...");
        const issues = [];

        todaysTransactions.forEach((transaction, index) => {
          if (!transaction.id)
            issues.push(`Transaction ${index + 1}: Missing ID`);
          if (!transaction.total_amount)
            issues.push(`Transaction ${index + 1}: Missing total_amount`);
          if (!transaction.created_at)
            issues.push(`Transaction ${index + 1}: Missing created_at`);

          const items = transaction.items || transaction.sale_items || [];
          if (items.length === 0)
            issues.push(`Transaction ${index + 1}: No items`);

          items.forEach((item, itemIndex) => {
            if (!item.product_id)
              issues.push(
                `Transaction ${index + 1}, Item ${
                  itemIndex + 1
                }: Missing product_id`
              );
            if (!item.products?.name && !item.name)
              issues.push(
                `Transaction ${index + 1}, Item ${
                  itemIndex + 1
                }: Missing product name`
              );
            if (!item.quantity)
              issues.push(
                `Transaction ${index + 1}, Item ${
                  itemIndex + 1
                }: Missing quantity`
              );
          });
        });

        if (issues.length > 0) {
          console.warn("⚠️ Data consistency issues:", issues);
        } else {
          console.log("✅ All data looks consistent!");
        }
      } else {
        console.log("📝 No transactions found for today");

        // Test 4: Check if we can get all transactions (not just today's)
        console.log(
          "\n📊 Test 4: Checking for any transactions in database..."
        );
        const allTransactions = await unifiedTransactionService.getTransactions(
          { limit: 5 }
        );
        console.log("📊 Recent transactions (any date):", {
          count: allTransactions?.length || 0,
          data: allTransactions,
        });
      }

      console.log("\n✅ Transaction History Test Completed Successfully!");
      return { success: true, message: "Test completed" };
    } catch (error) {
      console.error("❌ Transaction History Test Failed:", error);
      return { success: false, error: error.message };
    }
  }

  static async testDatabaseConnection() {
    console.log("🔌 Testing database connection...");

    try {
      const result = await unifiedTransactionService.getTransactions({
        limit: 1,
      });
      console.log("✅ Database connection successful:", result);
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }
  }
}

// Auto-run in development mode
if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.TransactionHistoryTester = TransactionHistoryTester;
  console.log("🧪 TransactionHistoryTester available in console");
  console.log("Run: TransactionHistoryTester.runComprehensiveTest()");
}
