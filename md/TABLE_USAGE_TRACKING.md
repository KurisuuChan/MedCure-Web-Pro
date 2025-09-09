# 📊 **MedCure Pro - Supabase Table Usage Tracking**

This documentation maps every page, service, and component to the specific Supabase tables they interact with, providing complete visibility into database dependencies.

---

## 🎯 **Page-Level Table Usage**

### 📱 **POSPage.jsx**

- **Primary Purpose**: Point of Sale operations and transaction management
- **Tables Used**:
  - `products` - Product selection and pricing
  - `sales` - Transaction creation and management
  - `sale_items` - Individual transaction line items
  - `stock_movements` - Automatic stock deduction tracking
  - `audit_log` - Transaction edit/undo audit trails
  - `users` - Cashier identification
- **Services**:
  - `unifiedTransactionService.js`
  - `usePOS` hook
  - `simpleNotificationService.js`
- **Key Functions**:
  - Create pending transactions
  - Complete sales with stock deduction
  - Edit/undo transactions with audit

### 📊 **DashboardPage.jsx**

- **Primary Purpose**: Business overview and KPI monitoring
- **Tables Used**:
  - `sales` - Revenue calculations (status='completed' only)
  - `products` - Total product count and low stock alerts
  - `users` - Active user statistics
  - `stock_movements` - Inventory activity tracking
  - `sale_items` - Top selling products analysis
- **Services**:
  - `DashboardService` from `dataService.js`
  - `analyticsService.js`
- **Key Functions**:
  - Daily/monthly revenue totals
  - Stock level monitoring
  - User activity tracking

### 📦 **InventoryPage.jsx**

- **Primary Purpose**: Product management and stock control
- **Tables Used**:
  - `products` - Product CRUD operations
  - `categories` - Product categorization
  - `stock_movements` - Stock adjustment tracking
  - `batches` - Batch number management
  - `audit_log` - Product modification history
- **Services**:
  - `ProductService` from `dataService.js`
  - `enhancedInventoryService.js`
  - `intelligentCategoryService.js`
- **Key Functions**:
  - Product creation/editing
  - Stock level adjustments
  - Category management
  - Import/export operations

### 📈 **AnalyticsPage.jsx**

- **Primary Purpose**: Advanced business intelligence and reporting
- **Tables Used**:
  - `sales` - Transaction analytics (completed only)
  - `sale_items` - Product performance analysis
  - `products` - Product-level insights
  - `categories` - Category performance tracking
  - `stock_movements` - Inventory turnover analysis
- **Services**:
  - `analyticsService.js`
  - `reportingService.js`
- **Key Functions**:
  - Revenue trend analysis
  - Product performance metrics
  - Category insights

### 📋 **ReportsPage.jsx**

- **Primary Purpose**: Financial and operational reporting
- **Tables Used**:
  - `sales` - Financial report generation
  - `sale_items` - Detailed transaction breakdowns
  - `products` - Product-wise sales reports
  - `users` - Cashier performance reports
  - `audit_log` - System activity reports
  - `stock_movements` - Inventory movement reports
- **Services**:
  - `reportingService.js`
  - `auditReportsService.js`
- **Key Functions**:
  - Daily/monthly sales reports
  - Audit trail reporting
  - Stock movement reports

### 👥 **UserManagementPage.jsx**

- **Primary Purpose**: User administration and access control
- **Tables Used**:
  - `users` - User profile management
  - `user_profiles` - Extended user information
  - `user_roles` - Role assignment tracking
  - `user_sessions` - Session management
  - `audit_log` - User activity logging
- **Services**:
  - `userManagementService.js`
  - `authService.js`
  - `loginTrackingService.js`
- **Key Functions**:
  - User creation/modification
  - Role management
  - Session tracking
  - Activity monitoring

### 🏢 **ManagementPage.jsx**

- **Primary Purpose**: Administrative oversight and system configuration
- **Tables Used**:
  - `users` - User management overview
  - `sales` - Business performance monitoring
  - `products` - Inventory oversight
  - `categories` - Category management
  - `notifications` - System notification management
  - `audit_log` - System audit review
- **Services**:
  - Multiple services for comprehensive management
- **Key Functions**:
  - System administration
  - Business oversight
  - Configuration management

### 🔐 **LoginPage.jsx**

- **Primary Purpose**: User authentication and session establishment
- **Tables Used**:
  - `users` - Authentication validation
  - `user_sessions` - Session creation
  - `audit_log` - Login activity tracking
- **Services**:
  - `authService.js`
  - `loginTrackingService.js`
- **Key Functions**:
  - User authentication
  - Session management
  - Login tracking

### ⚙️ **SettingsPage.jsx**

- **Primary Purpose**: System configuration and preferences
- **Tables Used**:
  - `users` - User preference storage
  - `notifications` - Notification settings
- **Services**:
  - `notificationService.js`
- **Key Functions**:
  - User preferences
  - System configuration
  - Notification settings

---

## 🔧 **Service-Level Table Mapping**

### 📊 **dataService.js**

- **Purpose**: Core database operations
- **Tables**: `products`, `users`, `sales`, `sale_items`
- **Functions**: Basic CRUD operations for all main entities

### 🎯 **unifiedTransactionService.js**

- **Purpose**: Professional transaction workflow
- **Tables**: `sales`, `sale_items`, `stock_movements`, `audit_log`
- **Functions**: `create_sale_with_items()`, `complete_transaction_with_stock()`, `edit_transaction_with_stock_management()`, `undo_transaction_completely()`

### 📈 **analyticsService.js**

- **Purpose**: Business intelligence calculations
- **Tables**: `sales`, `sale_items`, `products`, `categories`
- **Functions**: Revenue analytics, performance metrics, trend analysis

### 📋 **reportingService.js**

- **Purpose**: Report generation
- **Tables**: `sales`, `sale_items`, `products`, `users`, `audit_log`
- **Functions**: Financial reports, audit reports, performance reports

### 🔍 **auditReportsService.js**

- **Purpose**: Audit trail management
- **Tables**: `audit_log`, `stock_movements`, `users`, `products`
- **Functions**: Activity tracking, compliance reporting

### 👤 **userManagementService.js**

- **Purpose**: User administration
- **Tables**: `users`, `user_profiles`, `user_roles`, `user_sessions`
- **Functions**: User lifecycle management, role assignment

### 📦 **enhancedInventoryService.js**

- **Purpose**: Advanced inventory management
- **Tables**: `products`, `categories`, `stock_movements`, `batches`, `sale_items`
- **Functions**: Stock forecasting, reorder suggestions, category analytics

### 🧠 **intelligentCategoryService.js**

- **Purpose**: Smart category management
- **Tables**: `categories`, `products`
- **Functions**: Auto-categorization, category analytics

### 🔔 **notificationService.js**

- **Purpose**: System notifications
- **Tables**: `notifications`, `users`
- **Functions**: Notification creation, delivery, management

### 🔐 **authService.js**

- **Purpose**: Authentication management
- **Tables**: `users`, `user_sessions`
- **Functions**: Login/logout, session management

### 📊 **loginTrackingService.js**

- **Purpose**: Session and activity tracking
- **Tables**: `user_sessions`, `audit_log`
- **Functions**: Login tracking, activity monitoring

---

## 🗄️ **Complete Database Schema Reference**

### 👥 **User Management Tables**

```sql
users                 -- Core user authentication
user_profiles         -- Extended user information
user_roles           -- Role assignments
user_sessions        -- Session tracking
```

### 💰 **Transaction Tables**

```sql
sales                -- Main transaction records
sale_items           -- Transaction line items
```

### 📦 **Inventory Tables**

```sql
products             -- Product master data
categories           -- Product categories
batches              -- Batch tracking
stock_movements      -- Inventory movements
```

### 🔍 **Audit & Tracking Tables**

```sql
audit_log           -- System audit trail
notifications       -- System notifications
```

---

## 🎯 **Critical Business Functions**

### 💳 **Transaction Workflow**

1. **Create Sale**: `create_sale_with_items()` → `sales`, `sale_items`
2. **Complete Transaction**: `complete_transaction_with_stock()` → `stock_movements`
3. **Edit Transaction**: `edit_transaction_with_stock_management()` → `audit_log`
4. **Undo Transaction**: `undo_transaction_completely()` → All related tables

### 📊 **Revenue Calculations**

- **Filter**: `status = 'completed'` (excludes cancelled)
- **Tables**: `sales`, `sale_items`
- **Functions**: `get_daily_revenue()`, `get_monthly_revenue()`

### 📦 **Stock Management**

- **Single Deduction Point**: Only at transaction completion
- **Tables**: `products`, `stock_movements`
- **Tracking**: Complete audit trail for all movements

### 🔐 **Security & Audit**

- **Row Level Security**: Enabled on all sensitive tables
- **Audit Trail**: `audit_log` captures all changes
- **User Tracking**: All operations linked to authenticated users

---

## 📋 **Table Dependency Matrix**

| Page/Service   | products | sales | sale_items | users | categories | stock_movements | audit_log | notifications |
| -------------- | -------- | ----- | ---------- | ----- | ---------- | --------------- | --------- | ------------- |
| POSPage        | ✅       | ✅    | ✅         | ✅    | -          | ✅              | ✅        | -             |
| DashboardPage  | ✅       | ✅    | ✅         | ✅    | -          | ✅              | -         | -             |
| InventoryPage  | ✅       | -     | -          | ✅    | ✅         | ✅              | ✅        | -             |
| AnalyticsPage  | ✅       | ✅    | ✅         | -     | ✅         | ✅              | -         | -             |
| ReportsPage    | ✅       | ✅    | ✅         | ✅    | -          | ✅              | ✅        | -             |
| UserMgmtPage   | -        | -     | -          | ✅    | -          | -               | ✅        | ✅            |
| ManagementPage | ✅       | ✅    | -          | ✅    | ✅         | -               | ✅        | ✅            |

---

## 🔄 **Migration & Deployment Notes**

- **Critical Tables**: `users`, `products`, `sales`, `sale_items` are core to all operations
- **Function Dependencies**: Revenue calculations require proper status filtering
- **Security**: All tables have RLS policies and audit requirements
- **Performance**: Indexes on frequently queried columns (status, created_at, product_id)

This tracking system ensures complete visibility into database dependencies for maintenance, optimization, and migration planning.
