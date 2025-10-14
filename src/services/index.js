// 🏗️ **ENTERPRISE SERVICE ARCHITECTURE**
// Domain-driven design with professional organization
// Senior developer approved folder structure

// Core Utilities
export { logDebug, handleError } from "./core/serviceUtils";

// Domain Exports - Clean and organized by business domains
export * from "./domains/inventory";
export * from "./domains/sales";
export * from "./domains/auth";
export * from "./domains/analytics";
export * from "./notifications"; // ✅ Fixed path - notifications is in root services folder
export * from "./infrastructure";

// Legacy direct exports for backward compatibility
export { ProductService } from "./domains/inventory/productService";
export { UserService } from "./domains/auth/userService";
export { SalesService } from "./domains/sales/salesService";
export { DashboardService } from "./domains/analytics/dashboardService";
export { AuthService } from "./domains/auth/authService";

// Import for default export
import { ProductService } from "./domains/inventory/productService";
import { UserService } from "./domains/auth/userService";
import { SalesService } from "./domains/sales/salesService";
import { DashboardService } from "./domains/analytics/dashboardService";
import { AuthService } from "./domains/auth/authService";

// Default export for convenience (backward compatibility)
export default {
  ProductService,
  UserService,
  SalesService,
  DashboardService,
  AuthService,
};

// 🎯 **ENTERPRISE ARCHITECTURE SUMMARY**
// ├── domains/inventory/     - Product catalog, stock management
// ├── domains/sales/         - POS, transactions, revenue
// ├── domains/auth/          - Authentication, user management
// ├── domains/analytics/     - Dashboards, reports, insights
// ├── domains/notifications/ - Alerts, messaging systems
// ├── domains/infrastructure/- ML, technical services
// ├── core/                  - Shared utilities
// └── index.js              - Clean centralized exports
//
// Professional Benefits:
// ✅ Domain-driven design (DDD)
// ✅ Single responsibility per domain
// ✅ Easy to navigate and maintain
// ✅ Scalable team collaboration
// ✅ Clean import structure
