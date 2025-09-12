// Detailed analysis of all products to find missing low stock items
import { mockProducts } from "./src/data/mockProducts.js";
import { isLowStock } from "./src/utils/productUtils.js";

console.log("🔍 DETAILED PRODUCT ANALYSIS - Finding Missing Low Stock Items\n");

console.log("📋 ALL PRODUCTS STOCK ANALYSIS:");
console.log("=====================================");

mockProducts.forEach((product, index) => {
  const stockLevel = product.stock_in_pieces;
  const reorderLevel = product.reorder_level;
  const isLow = isLowStock(product);
  const ratio = stockLevel / reorderLevel;

  let status = "";
  let emoji = "";

  if (stockLevel === 0) {
    status = "OUT OF STOCK";
    emoji = "🚨";
  } else if (stockLevel <= reorderLevel * 0.5) {
    status = "CRITICAL LOW";
    emoji = "🔴";
  } else if (stockLevel <= reorderLevel) {
    status = "LOW STOCK";
    emoji = "🟡";
  } else {
    status = "NORMAL";
    emoji = "✅";
  }

  console.log(`${emoji} Product ${index + 1}: ${product.name}`);
  console.log(
    `   Stock: ${stockLevel} | Reorder: ${reorderLevel} | Ratio: ${ratio.toFixed(
      2
    )}`
  );
  console.log(`   Status: ${status} | isLowStock(): ${isLow}`);
  console.log("");
});

// Check which products should be flagged but might be missed
console.log("🎯 PRODUCTS THAT SHOULD BE FLAGGED AS LOW STOCK:");
console.log("================================================");

const shouldBeLowStock = mockProducts.filter((product) => {
  const stockLevel = product.stock_in_pieces;
  const reorderLevel = product.reorder_level;
  return stockLevel <= reorderLevel;
});

shouldBeLowStock.forEach((product) => {
  console.log(
    `• ${product.name}: ${product.stock_in_pieces}/${product.reorder_level}`
  );
});

console.log(
  `\nTotal products that should be flagged: ${shouldBeLowStock.length}`
);

// Check what our function actually returns
const actualLowStock = mockProducts.filter((product) => isLowStock(product));
console.log(
  `Actual low stock detected by isLowStock(): ${actualLowStock.length}`
);

// Find any discrepancies
const missed = shouldBeLowStock.filter((product) => !isLowStock(product));
const falsePositives = actualLowStock.filter((product) => {
  const stockLevel = product.stock_in_pieces;
  const reorderLevel = product.reorder_level;
  return stockLevel > reorderLevel;
});

if (missed.length > 0) {
  console.log("\n❌ MISSED LOW STOCK PRODUCTS:");
  missed.forEach((product) => {
    console.log(
      `• ${product.name}: ${product.stock_in_pieces}/${product.reorder_level}`
    );
  });
}

if (falsePositives.length > 0) {
  console.log("\n⚠️ FALSE POSITIVES:");
  falsePositives.forEach((product) => {
    console.log(
      `• ${product.name}: ${product.stock_in_pieces}/${product.reorder_level}`
    );
  });
}

if (missed.length === 0 && falsePositives.length === 0) {
  console.log(
    "\n✅ DETECTION IS PERFECT - No missed items or false positives!"
  );
}
