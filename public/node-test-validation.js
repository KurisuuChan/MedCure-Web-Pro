// Node.js validation script for transaction system
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 SYSTEM VALIDATION - Transaction Fix Testing");
console.log("=".repeat(50));

// Check that unified service is properly configured
const unifiedServicePath = path.join(
  __dirname,
  "..",
  "src",
  "services",
  "unifiedTransactionService.js"
);

if (fs.existsSync(unifiedServicePath)) {
  const content = fs.readFileSync(unifiedServicePath, "utf8");

  console.log("✅ Unified Transaction Service found");

  // Check for global availability
  if (content.includes("window.unifiedTransactionService")) {
    console.log("✅ Global service availability configured");
  } else {
    console.log("❌ Global service availability NOT configured");
  }

  // Check for data transformation
  if (content.includes("items: transaction.sale_items || []")) {
    console.log("✅ Data transformation for sale_items mapping configured");
  } else {
    console.log("❌ Data transformation NOT configured");
  }

  // Check getTransactions method
  if (content.includes("getTransactions")) {
    console.log("✅ getTransactions method exists");
  } else {
    console.log("❌ getTransactions method missing");
  }
} else {
  console.log("❌ Unified Transaction Service NOT found");
}

console.log("\n📋 MANUAL TESTING INSTRUCTIONS:");
console.log("1. Open the application in browser");
console.log("2. Go to POS page");
console.log("3. Open browser console (F12)");
console.log("4. Check if window.unifiedTransactionService is available");
console.log("5. Test transaction creation and completion");
console.log("6. Verify stock deduction happens only once");
console.log("7. Check transaction history displays items correctly");

console.log("\n🔧 BROWSER CONSOLE TESTS:");
console.log("// Test service availability:");
console.log(
  'console.log("Service available:", !!window.unifiedTransactionService);'
);
console.log("");
console.log("// Test transaction listing:");
console.log(
  "window.unifiedTransactionService.getTransactions().then(console.log);"
);
console.log("");
console.log("// Test specific transaction:");
console.log(
  'window.unifiedTransactionService.getTransaction("some-id").then(console.log);'
);

console.log("\n✅ VALIDATION COMPLETE");
