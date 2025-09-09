// =================================================
// 🚀 DATABASE DEPLOYMENT SCRIPT FOR STOCK MANAGEMENT FIXES
// Run this script to deploy the critical stock management fixes
// =================================================

import { supabase } from "../config/supabase";
import fs from "fs";
import path from "path";

// Deploy the stock management fixes
export const deployStockManagementFixes = async () => {
  try {
    console.log("🚀 Starting stock management fixes deployment...");

    // Read the SQL deployment script
    const sqlPath = path.join(
      process.cwd(),
      "database",
      "FIX_TRANSACTION_EDIT_STOCK_MANAGEMENT.sql"
    );

    if (!fs.existsSync(sqlPath)) {
      console.error("❌ SQL deployment file not found:", sqlPath);
      return { success: false, error: "SQL file not found" };
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        const { data, error } = await supabase.rpc("exec_sql", {
          sql_statement: statement,
        });

        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} completed`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err);
        errorCount++;
      }
    }

    const result = {
      success: errorCount === 0,
      successCount,
      errorCount,
      totalStatements: statements.length,
    };

    if (result.success) {
      console.log("🎉 Stock management fixes deployed successfully!");
      console.log(`✅ ${successCount} statements executed successfully`);
    } else {
      console.log("⚠️ Deployment completed with errors");
      console.log(`✅ ${successCount} successful, ❌ ${errorCount} failed`);
    }

    return result;
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    return { success: false, error: error.message };
  }
};

// Test the deployment
export const testStockManagementFixes = async () => {
  try {
    console.log("🧪 Testing stock management fixes...");

    // Test 1: Check if the stored procedure exists
    const { data: procedures, error: procError } = await supabase
      .from("information_schema.routines")
      .select("routine_name")
      .eq("routine_name", "edit_transaction_with_stock_management");

    if (procError) {
      console.error("❌ Error checking procedures:", procError);
      return false;
    }

    if (!procedures || procedures.length === 0) {
      console.log("❌ Stock management procedure not found");
      return false;
    }

    console.log("✅ Stock management procedure found");

    // Test 2: Check if the audit view exists
    const { data: views, error: viewError } = await supabase
      .from("information_schema.views")
      .select("table_name")
      .eq("table_name", "transaction_edit_stock_audit");

    if (viewError) {
      console.error("❌ Error checking views:", viewError);
      return false;
    }

    if (!views || views.length === 0) {
      console.log("❌ Stock audit view not found");
      return false;
    }

    console.log("✅ Stock audit view found");

    // Test 3: Check stock_movements table structure
    const { data: columns, error: colError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "stock_movements")
      .in("column_name", ["reference_type", "stock_before", "stock_after"]);

    if (colError) {
      console.error("❌ Error checking columns:", colError);
      return false;
    }

    if (!columns || columns.length < 3) {
      console.log("❌ Stock movements table missing required columns");
      return false;
    }

    console.log("✅ Stock movements table structure verified");

    console.log("🎉 All stock management fixes are properly deployed!");
    return true;
  } catch (error) {
    console.error("❌ Testing failed:", error);
    return false;
  }
};

// Manual deployment for browser console
if (typeof window !== "undefined") {
  window.deployStockFixes = deployStockManagementFixes;
  window.testStockFixes = testStockManagementFixes;
  console.log("🔧 Stock management deployment functions loaded!");
  console.log("Run: await deployStockFixes() or await testStockFixes()");
}
