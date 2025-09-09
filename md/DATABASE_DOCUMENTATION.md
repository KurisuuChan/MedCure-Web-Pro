# MedCure Pro - Production Database Documentation

## 🎯 **System Overview**

MedCure Pro is a professional pharmacy management system with enterprise-grade features including:

- **Professional POS System** with real-time inventory tracking
- **Revenue-Accurate Financial Management** with edit/undo capabilities
- **Comprehensive Audit Trails** for regulatory compliance
- **Advanced Stock Management** with automatic deduction controls
- **Multi-User Role Management** with secure authentication

## 🗄️ **Database Architecture**

### **Core Tables**

#### **Users Management**

- `users` - Core user authentication and role management
- `audit_log` - Complete system audit trail for compliance

#### **Product & Inventory**

- `categories` - Product categorization system
- `products` - Complete medicine inventory with multi-unit support
- `stock_movements` - Comprehensive stock tracking and audit

#### **Sales & Transactions**

- `sales` - Main transaction records with edit/undo support
- `sale_items` - Line items for each transaction
- `notifications` - System notification management

### **Critical Business Functions**

#### **Professional Stock Management**

```sql
-- 1. Create Sale (NO stock deduction)
create_sale_with_items(sale_data, sale_items[])

-- 2. Complete Transaction (Deducts stock ONCE)
complete_transaction_with_stock(transaction_id)

-- 3. Edit Transaction (Undos old, creates new pending)
edit_transaction_with_stock_management(edit_data)

-- 4. Undo Transaction (Restores stock, marks cancelled)
undo_transaction_completely(transaction_id)
```

#### **Revenue Analytics (Excludes Cancelled)**

```sql
-- Daily/Monthly/Yearly revenue (completed transactions only)
get_daily_revenue(date)
get_monthly_revenue(month, year)
get_dashboard_analytics()
```

## 🔧 **Migration Instructions**

### **1. Supabase Setup**

1. Create new Supabase project
2. Enable required extensions (uuid-ossp, pgcrypto)
3. Run `COMPLETE_MEDCURE_MIGRATION.sql`
4. Verify tables and functions are created

### **2. Authentication Setup**

1. Configure Supabase Auth in project settings
2. Set up email/password authentication
3. Create initial admin user through SQL or Supabase dashboard

### **3. Security Configuration**

```sql
-- Enable Row Level Security (RLS) for production
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies based on user roles
CREATE POLICY "Users can view own data" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage all data" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## 💼 **Business Logic**

### **Transaction Workflow**

1. **Add to Cart**: Items selected, stock checked but NOT deducted
2. **Create Sale**: `create_sale_with_items()` creates pending transaction
3. **Complete Payment**: `complete_transaction_with_stock()` deducts stock and marks completed
4. **Edit/Undo**: Properly restores/adjusts stock with full audit trail

### **Revenue Calculation**

- **Only `status = 'completed'` transactions are included in revenue**
- **Cancelled transactions are excluded from all financial reports**
- **Edit operations preserve audit trail with original amounts**

### **Stock Management**

- **Single-point stock deduction** prevents double-deduction bugs
- **Automatic stock restoration** on transaction undo/edit
- **Multi-unit support** (pieces, sheets, boxes) with conversion
- **Comprehensive movement tracking** for inventory audits

## 🛡️ **Security Features**

### **Audit Trail**

- All sales changes logged in `audit_log` table
- User tracking for all sensitive operations
- Timestamp and IP address logging
- JSON storage of old/new values for complete history

### **Data Integrity**

- Foreign key constraints ensure referential integrity
- Check constraints prevent invalid data states
- Triggers maintain data consistency
- Indexed tables for optimal performance

### **Role-Based Access Control**

- **Admin**: Full system access and user management
- **Manager**: Sales oversight and reporting access
- **Cashier**: POS operations and limited inventory view

## 📊 **Performance Optimizations**

### **Essential Indexes**

- Sales by status and date for revenue queries
- Products by active status and stock levels
- Full-text search on product names
- Audit log by table and timestamp

### **Query Optimization**

- Revenue functions use status filtering
- Stock movement queries indexed by product and date
- Category-based product filtering optimized
- User session tracking for performance monitoring

## 🔄 **Maintenance & Monitoring**

### **Daily Operations**

- Monitor stock levels and low-stock alerts
- Review transaction edit/undo activity
- Check system notification queue
- Validate revenue calculation accuracy

### **Weekly Reports**

- Sales performance by period
- Stock movement analysis
- User activity and audit review
- System health and performance metrics

### **Monthly Tasks**

- Archive old audit logs if needed
- Review and update user permissions
- Stock reorder analysis and planning
- Financial reconciliation and reporting

## 📞 **Support & Documentation**

This database schema is designed for:

- **High-volume pharmacy operations**
- **Regulatory compliance requirements**
- **Financial accuracy and audit trails**
- **Scalable multi-user environments**
- **Easy migration between Supabase instances**

For technical support or customization needs, refer to the comprehensive audit logs and detailed function documentation within the SQL migration file.
