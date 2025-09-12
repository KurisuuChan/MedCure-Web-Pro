// Test script to verify low stock detection functionality
import { mockProducts } from "./src/data/mockProducts.js";
import {
  isLowStock,
  filterLowStockProducts,
  countLowStockProducts,
} from "./src/utils/productUtils.js";

console.log("🧪 Testing Low Stock Detection...\n");

// Test individual products
console.log("📊 Individual Product Tests:");
mockProducts.forEach((product) => {
  const lowStock = isLowStock(product);
  const stockLevel = product.stock_in_pieces;
  const reorderLevel = product.reorder_level;

  if (lowStock || stockLevel === 0) {
    console.log(
      `${lowStock ? "🔴" : "⚫"} ${
        product.name
      }: ${stockLevel}/${reorderLevel} - ${
        stockLevel === 0 ? "OUT OF STOCK" : "LOW STOCK"
      }`
    );
  }
});

// Test aggregated functions
console.log("\n📈 Aggregated Tests:");
const lowStockProducts = filterLowStockProducts(mockProducts);
const lowStockCount = countLowStockProducts(mockProducts);
const outOfStockProducts = mockProducts.filter((p) => p.stock_in_pieces === 0);

console.log(`Total Products: ${mockProducts.length}`);
console.log(`Low Stock Products: ${lowStockCount}`);
console.log(`Out of Stock Products: ${outOfStockProducts.length}`);

console.log("\n✅ Low Stock Products Found:");
lowStockProducts.forEach((product) => {
  console.log(
    `- ${product.name}: ${product.stock_in_pieces}/${product.reorder_level}`
  );
});

console.log("\n❌ Out of Stock Products Found:");
outOfStockProducts.forEach((product) => {
  console.log(
    `- ${product.name}: ${product.stock_in_pieces}/${product.reorder_level}`
  );
});

// Test expected results
console.log("\n🎯 Expected Results:");
console.log("Expected Low Stock: Cetirizine (45/100), Amlodipine (15/60)");
console.log("Expected Out of Stock: Metformin (0/200), Aspirin (0/150)");
console.log("Total Expected Low Stock Count: 4 (2 low + 2 out of stock)");
