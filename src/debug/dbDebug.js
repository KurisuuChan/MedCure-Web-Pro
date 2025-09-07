/**
 * 🛠️ **DATABASE DEBUG UTILITY**
 * Simple database testing and seeding functions
 */

import { supabase } from "../config/supabase.js";

export async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...");

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from("users")
      .select("count(*)")
      .limit(1);

    if (error) {
      console.error("❌ Database connection failed:", error);
      return { success: false, error: error.message };
    }

    console.log("✅ Database connection successful");

    // Count all data
    const [usersResult, productsResult, salesResult] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("sales").select("*", { count: "exact", head: true }),
    ]);

    const counts = {
      users: usersResult.count || 0,
      products: productsResult.count || 0,
      sales: salesResult.count || 0,
    };

    console.log("📊 Database counts:", counts);

    return { success: true, counts };
  } catch (error) {
    console.error("❌ Database test failed:", error);
    return { success: false, error: error.message };
  }
}

export async function seedSampleData() {
  console.log("🌱 Seeding sample data...");

  try {
    // Check if data exists
    const { data: existingUsers } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      console.log("ℹ️ Data already exists, skipping seed");
      return { success: true, message: "Data already exists" };
    }

    // Create users
    const { data: users, error: userError } = await supabase
      .from("users")
      .insert([
        {
          first_name: "John",
          last_name: "Admin",
          email: "admin@medcure.com",
          role: "admin",
          is_active: true,
        },
        {
          first_name: "Sarah",
          last_name: "Pharmacist",
          email: "sarah@medcure.com",
          role: "pharmacist",
          is_active: true,
        },
      ])
      .select();

    if (userError) throw userError;
    console.log(`✅ Created ${users.length} users`);

    // Create products
    const { data: products, error: productError } = await supabase
      .from("products")
      .insert([
        {
          name: "Paracetamol 500mg",
          brand: "Generic",
          category: "Pain Relief",
          stock_in_pieces: 500,
          price_per_piece: 2.5,
          reorder_level: 50,
          is_active: true,
        },
        {
          name: "Vitamin C 1000mg",
          brand: "VitaMax",
          category: "Vitamins",
          stock_in_pieces: 300,
          price_per_piece: 8.0,
          reorder_level: 40,
          is_active: true,
        },
        {
          name: "Cough Syrup",
          brand: "CoughAway",
          category: "Cold & Flu",
          stock_in_pieces: 15,
          price_per_piece: 45.0,
          reorder_level: 20,
          is_active: true,
        },
      ])
      .select();

    if (productError) throw productError;
    console.log(`✅ Created ${products.length} products`);

    // Create sales
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .insert([
        {
          user_id: users[0].id,
          total_amount: 125.5,
          payment_method: "cash",
          customer_name: "Walk-in Customer",
          status: "completed",
        },
        {
          user_id: users[1].id,
          total_amount: 67.0,
          payment_method: "card",
          customer_name: "John Doe",
          status: "completed",
        },
      ])
      .select();

    if (salesError) throw salesError;
    console.log(`✅ Created ${sales.length} sales`);

    const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    console.log(
      `🎉 Sample data created! Total sales value: ₱${totalSales.toFixed(2)}`
    );

    return {
      success: true,
      counts: {
        users: users.length,
        products: products.length,
        sales: sales.length,
      },
      totalSales,
    };
  } catch (error) {
    console.error("❌ Sample data creation failed:", error);
    return { success: false, error: error.message };
  }
}

// Make functions available globally for browser console
if (typeof window !== "undefined") {
  window.dbDebug = {
    test: testDatabaseConnection,
    seed: seedSampleData,
    both: async () => {
      const testResult = await testDatabaseConnection();
      if (testResult.success && testResult.counts.users === 0) {
        return await seedSampleData();
      }
      return testResult;
    },
  };

  console.log(`
🛠️ DATABASE DEBUG TOOLS LOADED

Available in browser console:
- dbDebug.test()  - Test database connection and count data
- dbDebug.seed()  - Create sample data if database is empty  
- dbDebug.both()  - Test and seed if needed

Run: await dbDebug.both()
  `);
}

export default { testDatabaseConnection, seedSampleData };
