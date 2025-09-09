// Quick diagnostic script to check product pricing
// Run this in browser console on the POS page

async function diagnosePricing() {
  console.log("🔍 Starting POS pricing diagnostic...");

  // 1. Check if unified service is available
  if (!window.unifiedTransactionService) {
    console.error("❌ unifiedTransactionService not available");
    return;
  }

  // 2. Check recent transactions
  console.log("📊 Checking recent transactions...");
  try {
    const transactions = await window.unifiedTransactionService.getTransactions(
      { limit: 3 }
    );
    console.log("Recent transactions:", transactions);

    transactions.forEach((trans, index) => {
      console.log(`Transaction ${index + 1}:`, {
        id: trans.id,
        total: trans.total_amount,
        status: trans.status,
        itemCount: trans.items?.length || 0,
        items: trans.items?.map((item) => ({
          name: item.products?.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          product_price: item.products?.price_per_piece,
        })),
      });
    });
  } catch (error) {
    console.error("❌ Error fetching transactions:", error);
  }

  // 3. Check cart state
  console.log("🛒 Checking current cart state...");
  const posStore = window.usePOSStore?.getState?.() || {};
  console.log("Cart items:", posStore.cartItems);
  console.log("Cart total:", posStore.getCartTotal?.());

  // 4. Check products
  console.log("💊 Checking product pricing...");
  // This would require accessing the product data

  console.log("✅ Diagnostic complete");
}

// Auto-run if window is available
if (typeof window !== "undefined") {
  diagnosePricing();
}
