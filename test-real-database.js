// Test real database connection and verify products data
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("🔍 TESTING REAL DATABASE CONNECTION\n");

// Create Supabase client with real credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("📡 Database URL:", supabaseUrl);
console.log("🔑 Has API Key:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  try {
    console.log("📡 Connecting to Supabase database...");
    console.log("Database URL:", import.meta.env.VITE_SUPABASE_URL);

    // Test basic connection
    const { data: authData, error: authError } =
      await supabase.auth.getSession();
    if (authError) {
      console.log("⚠️ Auth error (this might be normal):", authError.message);
    } else {
      console.log("✅ Database connection established");
    }

    // Test products table
    console.log("\n📊 Fetching products from database...");
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .limit(5); // Just get first 5 to test

    if (productsError) {
      console.error("❌ Error fetching products:", productsError);
      return;
    }

    console.log(`✅ Found ${products?.length || 0} products in database`);

    if (products && products.length > 0) {
      console.log("\n📦 Sample products:");
      products.forEach((product, index) => {
        console.log(
          `${index + 1}. ${product.name} - Stock: ${
            product.stock_in_pieces
          }, Reorder: ${product.reorder_level}`
        );
      });

      // Check for low stock items
      console.log("\n🔍 Checking for low stock items...");
      const { data: allProducts, error: allError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (allError) {
        console.error("❌ Error fetching all products:", allError);
        return;
      }

      const lowStockItems = allProducts.filter((product) => {
        const stockLevel = product.stock_in_pieces || 0;
        const reorderLevel = product.reorder_level || 10;
        return stockLevel <= reorderLevel;
      });

      console.log(
        `🎯 Found ${lowStockItems.length} low stock items in database:`
      );
      lowStockItems.forEach((product) => {
        const status =
          product.stock_in_pieces === 0 ? "OUT OF STOCK" : "LOW STOCK";
        console.log(
          `• ${product.name}: ${product.stock_in_pieces}/${product.reorder_level} - ${status}`
        );
      });
    } else {
      console.log("⚠️ No products found in database");
      console.log("💡 You may need to populate your database with products");
    }
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
  }
}

testDatabaseConnection();
