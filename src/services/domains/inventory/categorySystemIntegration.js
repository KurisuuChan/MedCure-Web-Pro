/**
 * 🔧 **CATEGORY SYSTEM INTEGRATION HELPER**
 *
 * This helper ensures proper integration and migration of the unified category system
 * across all components (Management, Inventory, POS, Reports, Analytics)
 *
 * @author Senior Developer
 * @version 1.0.0
 */

import { UnifiedCategoryService } from "./unifiedCategoryService.js";
import { supabase, isProductionSupabase } from "../../../config/supabase.js";

export class CategorySystemIntegration {
  /**
   * Test the unified category system integration
   */
  static async testSystemIntegration() {
    console.log(
      "🧪 [CategorySystemIntegration] Starting system integration test..."
    );

    const results = {
      passed: 0,
      failed: 0,
      tests: [],
    };

    // Test 1: Category fetching
    try {
      console.log("📋 Test 1: Category fetching");
      const categoriesResult = await UnifiedCategoryService.getAllCategories();

      if (categoriesResult.success && Array.isArray(categoriesResult.data)) {
        results.passed++;
        results.tests.push({
          name: "Category Fetching",
          status: "✅ PASSED",
          data: categoriesResult.data.length + " categories",
        });
      } else {
        results.failed++;
        results.tests.push({
          name: "Category Fetching",
          status: "❌ FAILED",
          error: categoriesResult.error,
        });
      }
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: "Category Fetching",
        status: "❌ FAILED",
        error: error.message,
      });
    }

    // Test 2: Category creation
    try {
      console.log("➕ Test 2: Category creation");
      const testCategory = {
        name: "Test Category " + Date.now(),
        description: "Test category for integration testing",
        color: "#3B82F6",
        icon: "Package",
      };

      const createResult = await UnifiedCategoryService.createCategory(
        testCategory,
        {
          userId: "test-user",
          source: "integration_test",
        }
      );

      if (createResult.success && createResult.data) {
        results.passed++;
        results.tests.push({
          name: "Category Creation",
          status: "✅ PASSED",
          data: createResult.data.name,
        });

        // Clean up test category
        await UnifiedCategoryService.deleteCategory(createResult.data.id, {
          userId: "test-user",
        });
      } else {
        results.failed++;
        results.tests.push({
          name: "Category Creation",
          status: "❌ FAILED",
          error: createResult.error,
        });
      }
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: "Category Creation",
        status: "❌ FAILED",
        error: error.message,
      });
    }

    // Test 3: Import category processing
    try {
      console.log("🤖 Test 3: Import category processing");
      const mockImportData = [
        { name: "Test Product 1", category: "Pain Relief", price: 10.99 },
        { name: "Test Product 2", category: "Vitamins", price: 15.5 },
        { name: "Test Product 3", category: "New Category Test", price: 8.75 },
      ];

      const processResult =
        await UnifiedCategoryService.processImportCategories(mockImportData, {
          userId: "test-user",
          source: "integration_test",
        });

      if (processResult.success && processResult.data) {
        results.passed++;
        results.tests.push({
          name: "Import Processing",
          status: "✅ PASSED",
          data: `${processResult.categoriesProcessed} categories processed`,
        });
      } else {
        results.failed++;
        results.tests.push({
          name: "Import Processing",
          status: "❌ FAILED",
          error: processResult.error,
        });
      }
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: "Import Processing",
        status: "❌ FAILED",
        error: error.message,
      });
    }

    // Test 4: Category insights
    try {
      console.log("📊 Test 4: Category insights");
      const insightsResult = await UnifiedCategoryService.getCategoryInsights();

      if (insightsResult.success && insightsResult.data) {
        results.passed++;
        results.tests.push({
          name: "Category Insights",
          status: "✅ PASSED",
          data: `${insightsResult.data.total_categories} categories analyzed`,
        });
      } else {
        results.failed++;
        results.tests.push({
          name: "Category Insights",
          status: "❌ FAILED",
          error: insightsResult.error,
        });
      }
    } catch (error) {
      results.failed++;
      results.tests.push({
        name: "Category Insights",
        status: "❌ FAILED",
        error: error.message,
      });
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      environment: isProductionSupabase ? "Production" : "Development",
      summary: {
        total_tests: results.passed + results.failed,
        passed: results.passed,
        failed: results.failed,
        success_rate:
          ((results.passed / (results.passed + results.failed)) * 100).toFixed(
            1
          ) + "%",
      },
      tests: results.tests,
    };

    console.log("📋 [CategorySystemIntegration] Test Results:");
    console.table(results.tests);
    console.log(`🎯 Success Rate: ${report.summary.success_rate}`);

    return report;
  }

  /**
   * Ensure default categories exist in the system
   */
  static async ensureDefaultCategories() {
    console.log(
      "🔧 [CategorySystemIntegration] Ensuring default categories exist..."
    );

    const defaultCategories = [
      {
        name: "Pain Relief",
        description: "Pain management and relief medications",
        color: "#EF4444",
        icon: "Zap",
        sort_order: 10,
      },
      {
        name: "Antibiotics",
        description: "Antibiotic medications for infections",
        color: "#8B5CF6",
        icon: "Cross",
        sort_order: 20,
      },
      {
        name: "Vitamins & Supplements",
        description: "Vitamins and dietary supplements",
        color: "#10B981",
        icon: "Shield",
        sort_order: 30,
      },
      {
        name: "Cardiovascular",
        description: "Heart and cardiovascular medications",
        color: "#EC4899",
        icon: "Heart",
        sort_order: 40,
      },
      {
        name: "Digestive Health",
        description: "Digestive system medications",
        color: "#F59E0B",
        icon: "Apple",
        sort_order: 50,
      },
      {
        name: "Respiratory",
        description: "Respiratory system medications",
        color: "#3B82F6",
        icon: "Wind",
        sort_order: 60,
      },
      {
        name: "Diabetes Care",
        description: "Diabetes management medications",
        color: "#6366F1",
        icon: "Activity",
        sort_order: 70,
      },
      {
        name: "Dermatology",
        description: "Skin care medications and treatments",
        color: "#F97316",
        icon: "Sun",
        sort_order: 80,
      },
      {
        name: "Eye Care",
        description: "Eye care medications and treatments",
        color: "#06B6D4",
        icon: "Eye",
        sort_order: 90,
      },
      {
        name: "General Medicine",
        description: "General medications and treatments",
        color: "#6B7280",
        icon: "Package",
        sort_order: 100,
      },
    ];

    const results = {
      created: 0,
      existing: 0,
      failed: 0,
    };

    for (const categoryData of defaultCategories) {
      try {
        const result = await UnifiedCategoryService.createOrGetCategory(
          categoryData.name,
          {
            userId: "system",
            source: "default_setup",
          }
        );

        if (result.success) {
          if (result.action === "created") {
            // Update with additional properties if it was created
            await UnifiedCategoryService.updateCategory(result.data.id, {
              description: categoryData.description,
              color: categoryData.color,
              icon: categoryData.icon,
              sort_order: categoryData.sort_order,
            });
            results.created++;
            console.log(`✅ Created default category: ${categoryData.name}`);
          } else {
            results.existing++;
            console.log(`ℹ️ Category already exists: ${categoryData.name}`);
          }
        } else {
          results.failed++;
          console.error(
            `❌ Failed to create category: ${categoryData.name}`,
            result.error
          );
        }
      } catch (error) {
        results.failed++;
        console.error(
          `❌ Error creating category: ${categoryData.name}`,
          error
        );
      }
    }

    console.log(
      `🎯 Default categories setup complete: ${results.created} created, ${results.existing} existing, ${results.failed} failed`
    );
    return results;
  }

  /**
   * Migrate existing product categories to the new system
   */
  static async migrateProductCategories() {
    console.log(
      "🔄 [CategorySystemIntegration] Starting product category migration..."
    );

    try {
      // Get all products with categories
      const { data: products, error } = await supabase
        .from("products")
        .select("id, category")
        .not("category", "is", null)
        .neq("category", "");

      if (error) {
        console.warn(
          "⚠️ Could not fetch products for migration:",
          error.message
        );
        return { success: false, error: error.message };
      }

      if (!products || products.length === 0) {
        console.log("ℹ️ No products found to migrate");
        return { success: true, migrated: 0 };
      }

      const categoryMappings = new Map();
      const uniqueCategories = [...new Set(products.map((p) => p.category))];

      console.log(
        `📋 Found ${uniqueCategories.length} unique categories to process`
      );

      // Create or get category IDs for all unique categories
      for (const categoryName of uniqueCategories) {
        try {
          const result = await UnifiedCategoryService.createOrGetCategory(
            categoryName,
            {
              userId: "system",
              source: "migration",
            }
          );

          if (result.success) {
            categoryMappings.set(categoryName, result.data.id);
            console.log(
              `🔗 Mapped category "${categoryName}" to ID: ${result.data.id}`
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to process category: ${categoryName}`,
            error
          );
        }
      }

      // Update products with category IDs
      let migrated = 0;
      for (const product of products) {
        const categoryId = categoryMappings.get(product.category);
        if (categoryId) {
          try {
            const { error: updateError } = await supabase
              .from("products")
              .update({ category_id: categoryId })
              .eq("id", product.id);

            if (!updateError) {
              migrated++;
            } else {
              console.error(
                `❌ Failed to update product ${product.id}:`,
                updateError
              );
            }
          } catch (error) {
            console.error(`❌ Error updating product ${product.id}:`, error);
          }
        }
      }

      console.log(`✅ Migration complete: ${migrated} products updated`);
      return { success: true, migrated, totalProducts: products.length };
    } catch (error) {
      console.error("❌ Migration failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate that all system components can access categories
   */
  static async validateSystemIntegration() {
    console.log(
      "🔍 [CategorySystemIntegration] Validating system integration..."
    );

    const validationResults = [];

    // Test ProductService integration
    try {
      const { ProductService } = await import("./productService.js");
      const categories = await ProductService.getProductCategories();

      if (Array.isArray(categories) && categories.length > 0) {
        validationResults.push({
          component: "ProductService",
          status: "✅ PASSED",
          details: `${categories.length} categories loaded`,
        });
      } else {
        validationResults.push({
          component: "ProductService",
          status: "⚠️ WARNING",
          details: "No categories returned",
        });
      }
    } catch (error) {
      validationResults.push({
        component: "ProductService",
        status: "❌ FAILED",
        details: error.message,
      });
    }

    // Test UnifiedCategoryService directly
    try {
      const result = await UnifiedCategoryService.getAllCategories();

      if (result.success && result.data.length > 0) {
        validationResults.push({
          component: "UnifiedCategoryService",
          status: "✅ PASSED",
          details: `${result.data.length} categories, source: ${result.source}`,
        });
      } else {
        validationResults.push({
          component: "UnifiedCategoryService",
          status: "⚠️ WARNING",
          details: result.error || "No categories found",
        });
      }
    } catch (error) {
      validationResults.push({
        component: "UnifiedCategoryService",
        status: "❌ FAILED",
        details: error.message,
      });
    }

    console.log("📊 [CategorySystemIntegration] Validation Results:");
    console.table(validationResults);

    return validationResults;
  }

  /**
   * Run complete system setup and integration
   */
  static async runCompleteSetup() {
    console.log(
      "🚀 [CategorySystemIntegration] Running complete category system setup..."
    );

    const setupResults = {
      timestamp: new Date().toISOString(),
      steps: [],
    };

    // Step 1: Ensure default categories
    try {
      const defaultsResult = await this.ensureDefaultCategories();
      setupResults.steps.push({
        step: "Default Categories Setup",
        status: "✅ COMPLETED",
        details: `${defaultsResult.created} created, ${defaultsResult.existing} existing`,
      });
    } catch (error) {
      setupResults.steps.push({
        step: "Default Categories Setup",
        status: "❌ FAILED",
        details: error.message,
      });
    }

    // Step 2: Migrate existing products
    try {
      const migrationResult = await this.migrateProductCategories();
      if (migrationResult.success) {
        setupResults.steps.push({
          step: "Product Migration",
          status: "✅ COMPLETED",
          details: `${migrationResult.migrated} products migrated`,
        });
      } else {
        setupResults.steps.push({
          step: "Product Migration",
          status: "❌ FAILED",
          details: migrationResult.error,
        });
      }
    } catch (error) {
      setupResults.steps.push({
        step: "Product Migration",
        status: "❌ FAILED",
        details: error.message,
      });
    }

    // Step 3: Validate integration
    try {
      const validationResults = await this.validateSystemIntegration();
      const passed = validationResults.filter((r) =>
        r.status.includes("PASSED")
      ).length;
      const total = validationResults.length;

      setupResults.steps.push({
        step: "System Validation",
        status: passed === total ? "✅ COMPLETED" : "⚠️ PARTIAL",
        details: `${passed}/${total} components validated`,
      });
    } catch (error) {
      setupResults.steps.push({
        step: "System Validation",
        status: "❌ FAILED",
        details: error.message,
      });
    }

    // Step 4: Run integration test
    try {
      const testResults = await this.testSystemIntegration();
      setupResults.steps.push({
        step: "Integration Testing",
        status:
          testResults.summary.failed === 0 ? "✅ COMPLETED" : "⚠️ PARTIAL",
        details: `${testResults.summary.success_rate} success rate`,
      });
    } catch (error) {
      setupResults.steps.push({
        step: "Integration Testing",
        status: "❌ FAILED",
        details: error.message,
      });
    }

    console.log("🎯 [CategorySystemIntegration] Setup Results:");
    console.table(setupResults.steps);

    const successCount = setupResults.steps.filter((s) =>
      s.status.includes("COMPLETED")
    ).length;
    const totalSteps = setupResults.steps.length;

    console.log(
      `🏆 Overall Success: ${successCount}/${totalSteps} steps completed`
    );

    return setupResults;
  }
}

// Export for use in browser console or development tools
if (typeof window !== "undefined") {
  window.CategorySystemIntegration = CategorySystemIntegration;
  console.log("🔧 CategorySystemIntegration available in browser console!");
  console.log("📋 Available methods:");
  console.log("  • window.CategorySystemIntegration.testSystemIntegration()");
  console.log("  • window.CategorySystemIntegration.ensureDefaultCategories()");
  console.log("  • window.CategorySystemIntegration.runCompleteSetup()");
}

export default CategorySystemIntegration;
