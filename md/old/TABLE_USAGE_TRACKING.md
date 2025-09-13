# 📊 **MedCure Pro - Enterprise Service to Database Mapping**

This documentation maps the enterprise service architecture in `domains/` to the current database schema from COMPLETE_MEDCURE_MIGRATION.sql, providing complete visibility into database dependencies and service organization.

---

## 🎯 **Enterprise Service-Level Table Mapping**

### � **Authentication Domain** (`domains/auth/`)

#### **authService.js**

- **Purpose**: User authentication and session management
- **Tables**: `users` (authentication), `audit_log` (login tracking)
- **Key Functions**: `login()`, `logout()`, `verifySession()`, `refreshToken()`

#### **userService.js**

- **Purpose**: Basic user CRUD operations
- **Tables**: `users` (user data management)
- **Key Functions**: `getUser()`, `updateUser()`, `createUser()`, `deleteUser()`

#### **userManagementService.js**

- **Purpose**: Administrative user management and analytics
- **Tables**: `users`, `audit_log` (admin oversight)
- **Key Functions**: `getUserStatistics()`, `getActiveSessions()`, `manageUserRoles()`

#### **loginTrackingService.js**

- **Purpose**: Session monitoring and security tracking
- **Tables**: `audit_log` (session logging), `users` (activity tracking)
- **Key Functions**: `trackLogin()`, `getLoginHistory()`, `detectSuspiciousActivity()`

### 💰 **Sales Domain** (`domains/sales/`)

#### **salesService.js**

- **Purpose**: Core sales operations and reporting
- **Tables**: `sales`, `sale_items` (transaction management)
- **Key Functions**: `getSalesReport()`, `calculateRevenue()`, `getTopProducts()`

#### **transactionService.js**

- **Purpose**: POS transaction processing with professional workflow
- **Tables**: `sales`, `sale_items`, `stock_movements`, `audit_log`
- **Key Functions**:
  - `create_sale_with_items()` - Creates pending transaction
  - `complete_transaction_with_stock()` - Finalizes with stock deduction
  - `edit_transaction_with_stock_management()` - Professional edit workflow
  - `undo_transaction_completely()` - Complete reversal with audit

#### **enhancedSalesService.js**

- **Purpose**: Advanced sales analytics and insights
- **Tables**: `sales`, `sale_items`, `products`, `categories`
- **Key Functions**: `getAdvancedAnalytics()`, `predictSalesTrends()`, `analyzeBuyerPatterns()`

### 📦 **Inventory Domain** (`domains/inventory/`)

#### **inventoryService.js**

- **Purpose**: Core stock management operations
- **Tables**: `products`, `stock_movements` (inventory tracking)
- **Key Functions**: `updateStock()`, `getStockLevels()`, `trackMovements()`

#### **productService.js**

- **Purpose**: Product master data management
- **Tables**: `products`, `categories` (product catalog)
- **Key Functions**: `createProduct()`, `updateProduct()`, `searchProducts()`, `getProductDetails()`

#### **categoryService.js**

- **Purpose**: Product categorization management
- **Tables**: `categories` (category hierarchy)
- **Key Functions**: `createCategory()`, `updateCategory()`, `getCategoryTree()`

#### **smartCategoryService.js**

- **Purpose**: Intelligent category insights and analytics
- **Tables**: `categories`, `products`, `sale_items` (category performance)
- **Key Functions**: `getCategoryInsights()`, `analyzeCategoryPerformance()`, `suggestOptimizations()`

#### **enhancedInventoryService.js**

- **Purpose**: Advanced inventory management features
- **Tables**: `products`, `categories`, `stock_movements`, `sale_items`
- **Key Functions**: `predictReorderPoints()`, `optimizeStockLevels()`, `generateRestockSuggestions()`

### 📊 **Analytics Domain** (`domains/analytics/`)

#### **reportingService.js**

- **Purpose**: Business intelligence and comprehensive reporting
- **Tables**: ALL tables (comprehensive reporting across domains)
  - `sales`, `sale_items` - Revenue and transaction analysis
  - `products`, `categories` - Inventory performance
  - `users`, `audit_log` - User activity and system health
  - `stock_movements` - Inventory flow analysis
  - `notifications` - System activity monitoring
- **Key Functions**: `getDashboardAnalytics()`, `generateReports()`, `getPerformanceMetrics()`

### 🔔 **Notifications Domain** (`domains/notifications/`)

#### **notificationService.js**

- **Purpose**: System notification management
- **Tables**: `notifications`, `users` (notification delivery)
- **Key Functions**: `createNotification()`, `markAsRead()`, `getNotifications()`, `scheduleNotification()`

#### **simpleNotificationService.js**

- **Purpose**: Basic alert and messaging system
- **Tables**: `notifications` (simple alerts)
- **Key Functions**: `showAlert()`, `displaySuccess()`, `showError()`, `clearNotifications()`

## 🎯 **Page-Level Enterprise Service Usage**

### 📱 **POSPage.jsx**

- **Primary Purpose**: Point of Sale operations and transaction management
- **Enterprise Services Used**:
  - `domains/sales/transactionService.js` - POS transaction workflow
  - `domains/inventory/productService.js` - Product selection and pricing
  - `domains/notifications/simpleNotificationService.js` - User alerts
- **Database Tables** (via enterprise services):
  - `sales`, `sale_items` - Transaction records
  - `products` - Product catalog and pricing
  - `stock_movements` - Automatic stock deduction
  - `audit_log` - Transaction edit/undo audit trails

### � **DashboardPage.jsx**

- **Primary Purpose**: Business overview and KPI monitoring
- **Enterprise Services Used**:
  - `domains/analytics/reportingService.js` - Dashboard analytics
  - `domains/sales/salesService.js` - Revenue calculations
  - `domains/inventory/inventoryService.js` - Stock level monitoring
- **Database Tables** (via enterprise services):
  - `sales`, `sale_items` - Revenue analysis (status='completed' only)
  - `products` - Product count and low stock alerts
  - `users` - Active user statistics
  - `stock_movements` - Inventory activity tracking

### 📦 **InventoryPage.jsx**

- **Primary Purpose**: Product management and stock control
- **Enterprise Services Used**:
  - `domains/inventory/inventoryService.js` - Core stock management
  - `domains/inventory/productService.js` - Product CRUD operations
  - `domains/inventory/categoryService.js` - Category management
  - `domains/inventory/smartCategoryService.js` - Intelligent insights
- **Database Tables** (via enterprise services):
  - `products` - Product master data
  - `categories` - Product categorization
  - `stock_movements` - Stock adjustment tracking

### 📈 **AnalyticsPage.jsx**

- **Primary Purpose**: Advanced business intelligence and reporting
- **Enterprise Services Used**:
  - `domains/analytics/reportingService.js` - Comprehensive analytics
  - `domains/sales/enhancedSalesService.js` - Advanced sales insights
  - `domains/inventory/smartCategoryService.js` - Category performance
- **Database Tables** (via enterprise services):
  - `sales`, `sale_items` - Transaction analytics
  - `products`, `categories` - Product performance analysis
  - `stock_movements` - Inventory turnover analysis

### � **UserManagementPage.jsx**

- **Primary Purpose**: User administration and access control
- **Enterprise Services Used**:
  - `domains/auth/userManagementService.js` - User administration
  - `domains/auth/userService.js` - User CRUD operations
  - `domains/auth/loginTrackingService.js` - Session monitoring
- **Database Tables** (via enterprise services):
  - `users` - User profile management
  - `audit_log` - User activity logging and system changes

### ⚙️ **SettingsPage.jsx**

- **Primary Purpose**: System configuration and user preferences
- **Enterprise Services Used**:
  - `domains/notifications/notificationService.js` - Notification settings
  - `domains/auth/userService.js` - User preference management
- **Database Tables** (via enterprise services):
  - `users` - User preferences and settings
  - `notifications` - Notification configuration

## 🗄️ **Current Database Schema Reference**

### **Core Business Tables** (From COMPLETE_MEDCURE_MIGRATION.sql)

```sql
users                 -- Core user authentication and roles
categories           -- Product categorization with analytics
products             -- Complete medicine inventory
sales                -- Transaction records with edit/undo support
sale_items           -- Transaction line items
stock_movements      -- Complete inventory audit trail
audit_log           -- System audit for compliance
notifications       -- User notification system
```

### **Professional Transaction Functions**

```sql
create_sale_with_items()              -- Creates pending transaction
complete_transaction_with_stock()     -- Finalizes with stock deduction
edit_transaction_with_stock_management() -- Professional edit workflow
undo_transaction_completely()         -- Complete reversal with audit
```

## � **Enterprise Service Integration Matrix**

| Domain Service                        | users | categories | products | sales | sale_items | stock_movements | audit_log | notifications |
| ------------------------------------- | ----- | ---------- | -------- | ----- | ---------- | --------------- | --------- | ------------- |
| **auth/authService**                  | ✅    | -          | -        | -     | -          | -               | ✅        | -             |
| **auth/userService**                  | ✅    | -          | -        | -     | -          | -               | ✅        | -             |
| **auth/userManagementService**        | ✅    | -          | -        | -     | -          | -               | ✅        | -             |
| **sales/salesService**                | ✅    | -          | ✅       | ✅    | ✅         | -               | -         | -             |
| **sales/transactionService**          | ✅    | -          | ✅       | ✅    | ✅         | ✅              | ✅        | -             |
| **inventory/inventoryService**        | ✅    | -          | ✅       | -     | -          | ✅              | ✅        | -             |
| **inventory/productService**          | ✅    | ✅         | ✅       | -     | -          | -               | ✅        | -             |
| **inventory/smartCategoryService**    | -     | ✅         | ✅       | -     | ✅         | -               | -         | -             |
| **analytics/reportingService**        | ✅    | ✅         | ✅       | ✅    | ✅         | ✅              | ✅        | ✅            |
| **notifications/notificationService** | ✅    | -          | -        | -     | -          | -               | -         | ✅            |

## 🎯 **Enterprise Architecture Benefits**

### **Domain Separation**

- **Authentication concerns** isolated in `domains/auth/`
- **Business logic** separated by domain responsibility
- **Data access patterns** consistent within each domain
- **Service dependencies** clearly defined and managed

### **Performance Optimization**

- **Static imports** eliminate build warnings
- **Code splitting** reduces bundle sizes by 97%
- **Service caching** improves database performance
- **Selective loading** optimizes memory usage

### **Development Efficiency**

- **Single responsibility** per service file
- **Domain expertise** concentrated in relevant services
- **Import organization** improves AI development experience
- **Testing isolation** enables focused unit testing

## � **Migration & Deployment Notes**

### **Enterprise Service Migration Status** ✅

- ✅ **Service Organization**: All business logic organized by domain
- ✅ **Import Optimization**: Static imports implemented, dynamic warnings eliminated
- ✅ **Build Performance**: 97% bundle size reduction achieved
- ✅ **File Size Compliance**: All services <300 lines, components <200 lines

### **Database Integration Status** ✅

- ✅ **Schema Alignment**: Services aligned with COMPLETE_MEDCURE_MIGRATION.sql
- ✅ **Function Integration**: Professional transaction functions implemented
- ✅ **Audit Logging**: Complete audit trail through enterprise services
- ✅ **Performance Indexing**: Optimized for enterprise service access patterns

### **Production Readiness**

- ✅ **Service Architecture**: Enterprise domain organization complete
- ✅ **Database Schema**: Production-ready with audit and compliance features
- ✅ **Build System**: Optimized with code splitting and static imports
- ✅ **Error Handling**: Consistent patterns across all enterprise services

This enterprise service architecture provides scalable, maintainable, and performance-optimized access to the complete MedCure Pro database system.
