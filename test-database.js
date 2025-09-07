// 🧪 **DATABASE CONNECTION TEST**
// Quick test to verify Supabase database integration
// Phase 3 - Database Integration Testing

import { supabase } from "../src/config/supabase.js";

console.log("🔍 Testing Supabase Database Connection...");

async function testDatabaseConnection() {
  try {
    console.log("📡 Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("🔄 Testing connection...");

    // Test 1: Basic connectivity
    const { data: healthCheck, error: healthError } = await supabase
      .from("users")
      .select("count(*)")
      .limit(1);

    if (healthError) {
      console.error("❌ Health check failed:", healthError);
      return false;
    }

    console.log("✅ Database connection successful!");

    // Test 2: Count users
    const { data: userCount, error: userError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (userError) {
      console.error("❌ User count failed:", userError);
    } else {
      console.log(`👥 Users in database: ${userCount?.count || 0}`);
    }

    // Test 3: Count products
    const { data: productCount, error: productError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (productError) {
      console.error("❌ Product count failed:", productError);
    } else {
      console.log(`💊 Products in database: ${productCount?.count || 0}`);
    }

    // Test 4: Count sales
    const { data: salesCount, error: salesError } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true });

    if (salesError) {
      console.error("❌ Sales count failed:", salesError);
    } else {
      console.log(`💰 Sales in database: ${salesCount?.count || 0}`);
    }

    // Test 5: Sample product data
    const { data: sampleProducts, error: sampleError } = await supabase
      .from("products")
      .select("name, price_per_piece, stock_in_pieces")
      .limit(3);

    if (sampleError) {
      console.error("❌ Sample products failed:", sampleError);
    } else {
      console.log("🎯 Sample products:");
      sampleProducts?.forEach((product) => {
        console.log(
          `  - ${product.name}: $${product.price_per_piece} (Stock: ${product.stock_in_pieces})`
        );
      });
    }

    return true;
  } catch (error) {
    console.error("💥 Database test failed:", error);
    return false;
  }
}

// Run the test
testDatabaseConnection().then((success) => {
  if (success) {
    console.log("🎉 Database integration test completed successfully!");
    console.log("🚀 Your application is ready to use the real database!");
  } else {
    console.log(
      "⚠️  Database integration test failed. Check your configuration."
    );
  }
});
