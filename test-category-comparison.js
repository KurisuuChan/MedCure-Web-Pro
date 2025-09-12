// Compare categories between inventory and management pages
import { ProductService } from "./src/services/domains/inventory/productService.js";
import { UnifiedCategoryService } from "./src/services/domains/inventory/unifiedCategoryService.js";

console.log("🔍 DIAGNOSING CATEGORY DIFFERENCES BETWEEN PAGES\n");

async function compareCategoryServices() {
  try {
    console.log("📊 Testing Inventory Page Categories (via ProductService):");
    const inventoryCategories = await ProductService.getProductCategories();
    console.log(`Found ${inventoryCategories?.length || 0} categories`);
    inventoryCategories?.forEach((cat, index) => {
      console.log(
        `${index + 1}. ${cat.name} (ID: ${cat.id}) - ${
          cat.description || "No description"
        }`
      );
    });

    console.log(
      "\n📊 Testing Management Page Categories (via UnifiedCategoryService):"
    );
    const managementResult = await UnifiedCategoryService.getAllCategories({
      activeOnly: true,
    });

    if (managementResult.success) {
      const managementCategories = managementResult.data || [];
      console.log(`Found ${managementCategories.length} categories`);
      managementCategories.forEach((cat, index) => {
        console.log(
          `${index + 1}. ${cat.name} (ID: ${cat.id}) - ${
            cat.description || "No description"
          }`
        );
      });

      // Compare the results
      console.log("\n🔍 COMPARISON ANALYSIS:");
      console.log(
        `Inventory categories count: ${inventoryCategories?.length || 0}`
      );
      console.log(
        `Management categories count: ${managementCategories.length}`
      );

      if (inventoryCategories?.length !== managementCategories.length) {
        console.log("❌ DIFFERENT CATEGORY COUNTS DETECTED!");
      } else {
        console.log("✅ Same category count");
      }

      // Find differences
      const inventoryNames = inventoryCategories?.map((c) => c.name) || [];
      const managementNames = managementCategories.map((c) => c.name);

      const onlyInInventory = inventoryNames.filter(
        (name) => !managementNames.includes(name)
      );
      const onlyInManagement = managementNames.filter(
        (name) => !inventoryNames.includes(name)
      );

      if (onlyInInventory.length > 0) {
        console.log("\n📦 Categories ONLY in Inventory Page:");
        onlyInInventory.forEach((name) => console.log(`• ${name}`));
      }

      if (onlyInManagement.length > 0) {
        console.log("\n⚙️ Categories ONLY in Management Page:");
        onlyInManagement.forEach((name) => console.log(`• ${name}`));
      }

      if (onlyInInventory.length === 0 && onlyInManagement.length === 0) {
        console.log("✅ Both pages have identical categories!");
        console.log(
          "💡 The issue might be in the UI rendering or filtering logic"
        );
      }
    } else {
      console.error("❌ Management categories failed:", managementResult.error);
    }
  } catch (error) {
    console.error("❌ Category comparison failed:", error);
  }
}

compareCategoryServices();
