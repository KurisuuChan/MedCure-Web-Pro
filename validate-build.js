// Quick validation script to test enterprise service imports
import { DashboardService } from "./src/services/domains/analytics/dashboardService.js";
import { UserService } from "./src/services/domains/auth/userService.js";
import { ProductService } from "./src/services/domains/inventory/productService.js";
import { UnifiedCategoryService } from "./src/services/domains/inventory/unifiedCategoryService.js";

console.log("🔍 Validating Enterprise Service Architecture...");

// Test service imports
const services = [
  { name: "DashboardService", service: DashboardService },
  { name: "UserService", service: UserService },
  { name: "ProductService", service: ProductService },
  { name: "UnifiedCategoryService", service: UnifiedCategoryService },
];

let allValid = true;

services.forEach(({ name, service }) => {
  if (service && typeof service === "object") {
    console.log(`✅ ${name} - Import successful`);
  } else {
    console.log(`❌ ${name} - Import failed`);
    allValid = false;
  }
});

// Test specific methods
const methodTests = [
  { service: "UnifiedCategoryService", method: "getCategoryInsights" },
  { service: "UserService", method: "getUserStatistics" },
];

methodTests.forEach(({ service: serviceName, method }) => {
  const service = services.find((s) => s.name === serviceName)?.service;
  if (service && typeof service[method] === "function") {
    console.log(`✅ ${serviceName}.${method}() - Method available`);
  } else {
    console.log(`❌ ${serviceName}.${method}() - Method missing`);
    allValid = false;
  }
});

if (allValid) {
  console.log("🎉 Enterprise Service Architecture Validation PASSED");
  process.exit(0);
} else {
  console.log("🚨 Enterprise Service Architecture Validation FAILED");
  process.exit(1);
}
