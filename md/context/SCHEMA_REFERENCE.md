# MedCure Pro Schema Reference

_Professional Development Edition - September 2025_

## 🚨 **CRITICAL CONFLICTS TO RESOLVE FIRST**

### **Database Schema Issues (MUST FIX - Phase 1)**

1. **DUPLICATE USER TABLES**: `users` vs `user_profiles`

   - ✅ **Use**: `user_profiles` linked to `auth.users(id)`
   - ❌ **Deprecated**: `users` table (migrate data in Phase 1)
   - **Time**: 2-3 hours

2. **DUPLICATE BATCH TABLES**: `batch_inventory` vs `batches`

   - ✅ **Use**: `batches` table (modern batch tracking)
   - ❌ **Deprecated**: `batch_inventory` (consolidate in Phase 1)
   - **Time**: 2-3 hours

3. **FOREIGN KEY INCONSISTENCY**: Mixed references

   - ❌ **Problem**: Some FK point to `public.users(id)`, others to `auth.users(id)`
   - ✅ **Solution**: Standardize all references to `user_profiles(id)` or `auth.users(id)`
   - **Time**: 1-2 hours

4. **SECURITY VULNERABILITY**: Credentials exposed in `.env` files
   - ❌ **Problem**: Production credentials in repository
   - ✅ **Solution**: Remove credentials, create `.env.template`
   - **Time**: 30 minutes

---

## 🏗️ **PROFESSIONAL DEVELOPMENT TABLE GUIDE**

### **AI Development Standards**

- **File Size**: Components <200 lines, services <300 lines
- **Naming**: Clear, descriptive, intention-revealing
- **References**: Always use recommended tables (marked ✅)
- **Dependencies**: Follow FK relationship standards

### 👥 **USER MANAGEMENT SCHEMA**

#### **`users` Table**

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
email                 VARCHAR UNIQUE NOT NULL
first_name           VARCHAR NOT NULL
last_name            VARCHAR NOT NULL
role                 VARCHAR DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier'))
is_active            BOOLEAN DEFAULT true
created_at           TIMESTAMPTZ DEFAULT NOW()
updated_at           TIMESTAMPTZ DEFAULT NOW()
```

- **Purpose**: Core user authentication and role management
- **Used By**: All pages for user identification and authorization
- **Key Relationships**: Referenced by sales, audit_log, user_sessions

#### **`user_profiles` Table** (Extended User Info)

```sql
id                    UUID PRIMARY KEY REFERENCES users(id)
phone                VARCHAR
address              TEXT
emergency_contact    VARCHAR
department           VARCHAR
employee_id          VARCHAR
hire_date            DATE
status               VARCHAR DEFAULT 'active'
preferences          JSONB
```

- **Purpose**: Extended user profile information
- **Used By**: UserManagementPage, HR functions
- **Key Relationships**: One-to-one with users table

#### **`user_roles` Table** (Role Assignment Tracking)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id              UUID REFERENCES users(id)
role                 VARCHAR NOT NULL
assigned_at          TIMESTAMPTZ DEFAULT NOW()
assigned_by          UUID REFERENCES users(id)
is_active            BOOLEAN DEFAULT true
```

- **Purpose**: Track role assignments and changes
- **Used By**: UserManagementPage, audit functions
- **Key Relationships**: Links users to their assigned roles

#### **`user_sessions` Table** (Session Management)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id              UUID REFERENCES users(id)
session_token        VARCHAR UNIQUE
last_login           TIMESTAMPTZ DEFAULT NOW()
last_activity        TIMESTAMPTZ DEFAULT NOW()
ip_address           INET
user_agent           TEXT
is_active            BOOLEAN DEFAULT true
expires_at           TIMESTAMPTZ
```

- **Purpose**: Track user sessions and login activity
- **Used By**: LoginPage, security monitoring
- **Key Relationships**: Links to users for session management

---

### 💰 **TRANSACTION SCHEMA**

#### **`sales` Table** (Main Transaction Records)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id              UUID REFERENCES users(id) NOT NULL
total_amount         DECIMAL(10,2) NOT NULL
payment_method       VARCHAR DEFAULT 'cash'
customer_name        VARCHAR
customer_phone       VARCHAR
notes                TEXT
status               VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled'))
created_at           TIMESTAMPTZ DEFAULT NOW()
completed_at         TIMESTAMPTZ
-- Discount fields
discount_type        VARCHAR DEFAULT 'none'
discount_percentage  DECIMAL(5,2) DEFAULT 0
discount_amount      DECIMAL(10,2) DEFAULT 0
subtotal_before_discount DECIMAL(10,2)
pwd_senior_id        VARCHAR
-- Edit tracking
is_edited            BOOLEAN DEFAULT false
edited_at            TIMESTAMPTZ
edited_by            UUID REFERENCES users(id)
edit_reason          TEXT
original_total       DECIMAL(10,2)
```

- **Purpose**: Core transaction records with edit/undo support
- **Used By**: POSPage, ReportsPage, AnalyticsPage, DashboardPage
- **Key Relationships**: Links to users (cashier), sale_items (line items)
- **Critical**: Only `status='completed'` transactions count toward revenue

#### **`sale_items` Table** (Transaction Line Items)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
sale_id              UUID REFERENCES sales(id) ON DELETE CASCADE
product_id           UUID REFERENCES products(id)
quantity             INTEGER NOT NULL
unit_type            VARCHAR DEFAULT 'piece'
unit_price           DECIMAL(10,2) NOT NULL
total_price          DECIMAL(10,2) NOT NULL
created_at           TIMESTAMPTZ DEFAULT NOW()
```

- **Purpose**: Individual items within each transaction
- **Used By**: POSPage, ReportsPage, AnalyticsPage
- **Key Relationships**: Links sales to products with quantity/pricing

---

### 📦 **INVENTORY SCHEMA**

#### **`products` Table** (Product Master Data)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name                 VARCHAR NOT NULL
generic_name         VARCHAR
brand                VARCHAR
category             VARCHAR
description          TEXT
barcode              VARCHAR UNIQUE
-- Pricing (per piece)
price_per_piece      DECIMAL(10,2) NOT NULL
cost_per_piece       DECIMAL(10,2)
-- Stock levels (in pieces)
stock_quantity       INTEGER DEFAULT 0
minimum_stock        INTEGER DEFAULT 10
maximum_stock        INTEGER DEFAULT 1000
-- Unit information
pieces_per_sheet     INTEGER DEFAULT 1
sheets_per_box       INTEGER DEFAULT 1
-- Product details
manufacturer         VARCHAR
supplier             VARCHAR
-- Status and tracking
is_active            BOOLEAN DEFAULT true
requires_prescription BOOLEAN DEFAULT false
is_controlled        BOOLEAN DEFAULT false
expiry_date          DATE
batch_number         VARCHAR
created_at           TIMESTAMPTZ DEFAULT NOW()
updated_at           TIMESTAMPTZ DEFAULT NOW()
```

- **Purpose**: Complete product catalog with pricing and stock
- **Used By**: InventoryPage, POSPage, AnalyticsPage, ReportsPage
- **Key Relationships**: Referenced by sale_items, stock_movements
- **Critical**: All quantities stored in pieces for consistency

#### **`categories` Table** (Product Categories)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name                 VARCHAR UNIQUE NOT NULL
description          TEXT
parent_category_id   UUID REFERENCES categories(id)
is_active            BOOLEAN DEFAULT true
created_at           TIMESTAMPTZ DEFAULT NOW()
-- Analytics fields
stats                JSONB
color_code           VARCHAR
icon                 VARCHAR
```

- **Purpose**: Hierarchical product categorization
- **Used By**: InventoryPage, AnalyticsPage, intelligent categorization
- **Key Relationships**: Self-referencing for category hierarchy

#### **`batches` Table** (Batch Tracking)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
product_id           UUID REFERENCES products(id)
batch_number         VARCHAR NOT NULL
expiry_date          DATE
quantity_received    INTEGER NOT NULL
quantity_remaining   INTEGER NOT NULL
cost_per_unit        DECIMAL(10,2)
supplier             VARCHAR
received_date        DATE DEFAULT CURRENT_DATE
created_at           TIMESTAMPTZ DEFAULT NOW()
```

- **Purpose**: Track product batches for expiry and cost management
- **Used By**: InventoryPage, advanced inventory tracking
- **Key Relationships**: Links to products for batch-level tracking

#### **`stock_movements` Table** (Inventory Movement Audit)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
product_id           UUID REFERENCES products(id)
movement_type        VARCHAR NOT NULL CHECK (movement_type IN ('sale', 'adjustment', 'return', 'transfer', 'restock'))
quantity             INTEGER NOT NULL
stock_before         INTEGER NOT NULL
stock_after          INTEGER NOT NULL
reason               TEXT
reference_type       VARCHAR
reference_id         UUID
user_id              UUID REFERENCES users(id)
created_at           TIMESTAMPTZ DEFAULT NOW()
```

- **Purpose**: Complete audit trail for all stock movements
- **Used By**: InventoryPage, AuditReports, DashboardPage
- **Key Relationships**: Links to products and users for tracking
- **Critical**: Automatically updated by transaction functions

---

### 🔍 **AUDIT & TRACKING SCHEMA**

#### **`audit_log` Table** (System Audit Trail)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
table_name           VARCHAR NOT NULL
record_id            UUID NOT NULL
action               VARCHAR NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
old_values           JSONB
new_values           JSONB
user_id              UUID REFERENCES users(id)
ip_address           INET
user_agent           TEXT
created_at           TIMESTAMPTZ DEFAULT NOW()
```

- **Purpose**: Complete system audit trail for compliance
- **Used By**: ReportsPage, security monitoring, compliance
- **Key Relationships**: Generic tracking for all table changes
- **Critical**: Required for regulatory compliance

#### **`notifications` Table** (System Notifications)

```sql
id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id              UUID REFERENCES users(id)
title                VARCHAR NOT NULL
message              TEXT NOT NULL
type                 VARCHAR DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success'))
priority             VARCHAR DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
is_read              BOOLEAN DEFAULT false
action_required      BOOLEAN DEFAULT false
action_url           VARCHAR
metadata             JSONB
created_at           TIMESTAMPTZ DEFAULT NOW()
read_at              TIMESTAMPTZ
expires_at           TIMESTAMPTZ
```

- **Purpose**: System-wide notification management
- **Used By**: All pages for alerts and notifications
- **Key Relationships**: Links to users for targeted notifications

---

## 🔗 **Critical Database Functions**

### 💳 **Transaction Management Functions**

#### **`create_sale_with_items(sale_data, sale_items[])`**

```sql
-- Creates pending transaction WITHOUT stock deduction
-- Returns: transaction_id for completion
```

- **Tables Modified**: `sales`, `sale_items`
- **Purpose**: Initial transaction creation
- **Status**: Sets status='pending'

#### **`complete_transaction_with_stock(transaction_id)`**

```sql
-- Completes transaction and deducts stock ONCE
-- Returns: updated transaction record
```

- **Tables Modified**: `sales`, `products`, `stock_movements`
- **Purpose**: Finalize sale with stock deduction
- **Status**: Changes status='pending' to 'completed'

#### **`edit_transaction_with_stock_management(edit_data)`**

```sql
-- Professional edit: undos old, creates new pending
-- Returns: new transaction record
```

- **Tables Modified**: `sales`, `sale_items`, `products`, `stock_movements`, `audit_log`
- **Purpose**: Edit existing transaction with proper audit
- **Status**: Cancels original, creates new pending

#### **`undo_transaction_completely(transaction_id)`**

```sql
-- Completely undos transaction and restores stock
-- Returns: success confirmation
```

- **Tables Modified**: `sales`, `products`, `stock_movements`, `audit_log`
- **Purpose**: Full transaction reversal
- **Status**: Changes status to 'cancelled'

### 📊 **Revenue Calculation Functions**

#### **`get_daily_revenue(date)`**

```sql
-- Returns revenue for specific date (completed only)
SELECT SUM(total_amount) FROM sales
WHERE DATE(created_at) = date AND status = 'completed'
```

#### **`get_monthly_revenue(month, year)`**

```sql
-- Returns monthly revenue totals (completed only)
SELECT SUM(total_amount) FROM sales
WHERE EXTRACT(MONTH FROM created_at) = month
AND EXTRACT(YEAR FROM created_at) = year
AND status = 'completed'
```

#### **`get_dashboard_analytics()`**

```sql
-- Comprehensive dashboard data (completed transactions only)
-- Returns: revenue, transaction counts, top products, etc.
```

---

## 🔐 **Security & Performance**

### **Row Level Security (RLS) Policies**

- **Enabled on all tables** for production security
- **Role-based access**: Admin > Manager > Cashier permissions
- **User isolation**: Users can only access their authorized data

### **Performance Indexes**

```sql
-- Critical performance indexes
CREATE INDEX idx_sales_status_date ON sales(status, created_at);
CREATE INDEX idx_sales_user_date ON sales(user_id, created_at);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX idx_products_active_stock ON products(is_active, stock_quantity);
CREATE INDEX idx_stock_movements_product_date ON stock_movements(product_id, created_at);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
```

### **Data Integrity Constraints**

- **Foreign key constraints** maintain referential integrity
- **Check constraints** enforce valid data states
- **Unique constraints** prevent duplicate records
- **NOT NULL constraints** ensure required data

---

## 📊 **Usage Patterns & Best Practices**

### **Revenue Calculations**

- **Always filter by** `status = 'completed'`
- **Exclude cancelled transactions** from financial reports
- **Use database functions** for consistent calculations

### **Stock Management**

- **Single deduction point** at transaction completion
- **Complete audit trail** for all movements
- **Automatic restoration** on transaction undo/edit

### **User Management**

- **Role-based permissions** throughout system
- **Session tracking** for security monitoring
- **Audit logging** for compliance requirements

### **Performance Optimization**

- **Use indexes** for frequently queried columns
- **Batch operations** for bulk data changes
- **Connection pooling** for high-traffic scenarios

This schema reference provides complete visibility into the MedCure Pro database structure and ensures consistent implementation across all system components.
