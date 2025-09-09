const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Supabase configuration
const supabaseUrl = "https://kbvdfgmlqakvjuhmfvjw.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmRmZ21scWFrdmp1aG1mdmp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTY5NzU0MSwiZXhwIjoyMDQxMjczNTQxfQ.zUKtQBBHLNmBqc2YaSTInNMsDCtEq1Rmd24f1rNyAV8";

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployStockFix() {
  try {
    console.log("🚀 Deploying Professional Stock Deduction Fix...");

    // Read the SQL file
    const sqlContent = fs.readFileSync(
      "database/PROFESSIONAL_STOCK_DEDUCTION_FIX.sql",
      "utf8"
    );

    // Split SQL into individual statements (rough approach)
    const statements = sqlContent
      .split(/(?:^|\n)(?:CREATE|BEGIN|COMMIT|DO)/gi)
      .filter((stmt) => stmt.trim().length > 0)
      .map((stmt) => {
        let cleanStmt = stmt.trim();
        if (
          !cleanStmt.startsWith("CREATE") &&
          !cleanStmt.startsWith("BEGIN") &&
          !cleanStmt.startsWith("COMMIT") &&
          !cleanStmt.startsWith("DO")
        ) {
          cleanStmt = "CREATE" + cleanStmt;
        }
        return cleanStmt;
      });

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length > 0) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

        const { data, error } = await supabase.rpc("exec_sql", {
          sql_query: statement,
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          throw error;
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log("🎉 Professional Stock Deduction Fix deployed successfully!");

    // Test the functions
    console.log("🧪 Testing new functions...");
    const { data: testResult, error: testError } = await supabase.rpc(
      "complete_transaction_with_stock",
      {
        p_transaction_id: "00000000-0000-0000-0000-000000000000", // This will fail but shows function exists
      }
    );

    if (testError && testError.message.includes("Transaction not found")) {
      console.log(
        "✅ Functions are working - test failed as expected with non-existent transaction"
      );
    } else {
      console.log("📋 Test result:", testResult);
    }
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

deployStockFix();
