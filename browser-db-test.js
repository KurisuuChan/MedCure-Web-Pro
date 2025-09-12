// Test database connection in browser console
// Copy and paste this into browser developer console

console.log("🔍 TESTING REAL DATABASE CONNECTION IN BROWSER\n");

// Test if environment variables are loaded
console.log("Environment check:");
console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_USE_MOCK_DATA:", import.meta.env.VITE_USE_MOCK_DATA);

// Test database connection
import { supabase } from "/src/config/supabase.js";

async function testRealDatabase() {
  try {
    console.log("📡 Testing Supabase connection...");

    // Test products table
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, stock_in_pieces, reorder_level, is_active")
      .limit(10);

    if (error) {
      console.error("❌ Database error:", error);
      return;
    }

    console.log(
      `✅ Successfully connected! Found ${products?.length || 0} products`
    );

    if (products && products.length > 0) {
      console.log("📦 Sample products from YOUR DATABASE:");
      products.forEach((product, index) => {
        const stockStatus =
          product.stock_in_pieces <= (product.reorder_level || 10)
            ? product.stock_in_pieces === 0
              ? "OUT OF STOCK"
              : "LOW STOCK"
            : "NORMAL";
        console.log(
          `${index + 1}. ${product.name} - ${product.stock_in_pieces}/${
            product.reorder_level
          } - ${stockStatus}`
        );
      });

      // Count low stock items
      const lowStockCount = products.filter(
        (p) => p.stock_in_pieces <= (p.reorder_level || 10)
      ).length;
      console.log(`\n🎯 Low stock items found: ${lowStockCount}`);
    } else {
      console.log("⚠️ No products found in database");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testRealDatabase();
