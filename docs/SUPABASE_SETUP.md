# 🚀 **SUPABASE PROJECT SETUP GUIDE**

## 📋 **QUICK SETUP INSTRUCTIONS**

Your Supabase credentials are already configured! Follow these steps to complete the database setup:

---

## **STEP 1: Access Your Supabase Project**

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Access Your Project**: https://supabase.com/dashboard/project/ccffpklqscpzqculffnd
3. **Navigate to**: SQL Editor (in the left sidebar)

---

## **STEP 2: Create Database Schema**

### **Execute Schema File**

1. In the SQL Editor, click **"New Query"**
2. **Copy the entire contents** of: `database/schema.sql`
3. **Paste into the SQL Editor**
4. **Click "Run"** to execute the schema

**Expected Result**: ✅ All tables, functions, triggers, and indexes created

---

## **STEP 3: Populate with Test Data**

### **Execute Seed Data**

1. Create **another new query** in SQL Editor
2. **Copy the entire contents** of: `database/seed.sql`
3. **Paste and Run** the seed data script

**Expected Result**: ✅ 6 users, 20 products, 10 sales with items populated

---

## **STEP 4: Apply Security Policies**

### **Execute RLS Policies**

1. Create **another new query** in SQL Editor
2. **Copy the entire contents** of: `database/policies.sql`
3. **Paste and Run** the security policies

**Expected Result**: ✅ Row Level Security enabled with role-based access

---

## **STEP 5: Verify Database Setup**

### **Quick Verification Queries**

Run these queries in SQL Editor to verify setup:

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Check user count
SELECT COUNT(*) as user_count FROM users;

-- Check product count
SELECT COUNT(*) as product_count FROM products;

-- Check sales count
SELECT COUNT(*) as sales_count FROM sales;

-- Test stock status view
SELECT * FROM product_stock_status LIMIT 5;
```

**Expected Results**:

- ✅ 5 main tables + audit_log table
- ✅ 6 users (1 admin, 2 managers, 3 cashiers)
- ✅ 20 pharmaceutical products
- ✅ 10 test sales transactions
- ✅ Stock status view working

---

## **STEP 6: Configure Authentication (Optional)**

### **Enable Email Authentication**

1. Go to **Authentication > Settings**
2. **Enable Email authentication** (if not already enabled)
3. **Configure email templates** (optional)

### **Test User Accounts**

Pre-configured test accounts (use with email auth):

- **Admin**: `admin@medcure.com`
- **Manager**: `manager@medcure.com`
- **Cashier**: `cashier@medcure.com`

_Note: You'll need to create these users in Supabase Auth or use your own authentication method_

---

## **STEP 7: Test the Application**

### **Switch to Database Mode**

The environment is already configured for database mode:

- ✅ `VITE_USE_MOCK_DATA=false` (using real database)
- ✅ Supabase credentials configured
- ✅ Real-time features enabled

### **Run the Application**

```bash
npm run dev
```

### **Expected Functionality**:

- ✅ **Login/Authentication** working with Supabase
- ✅ **Product Inventory** loaded from database
- ✅ **POS System** creating real sales transactions
- ✅ **Dashboard** showing real sales data
- ✅ **Stock Management** with automatic updates
- ✅ **Role-based Access Control** enforced

---

## **TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **RLS Policy Errors**

```sql
-- If you get RLS errors, temporarily disable for testing:
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable after testing!
```

#### **Permission Errors**

```sql
-- Grant permissions to authenticated role:
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

#### **Connection Issues**

- ✅ Verify Supabase URL in `.env` file
- ✅ Check if project is active in Supabase dashboard
- ✅ Ensure anonymous key is correct

---

## **WHAT'S ALREADY CONFIGURED**

### **✅ Environment Variables**

- Supabase URL and keys configured
- Database mode enabled (`VITE_USE_MOCK_DATA=false`)
- Real-time subscriptions enabled
- Production-ready configuration

### **✅ Database Files Created**

- `database/schema.sql` - Complete database schema
- `database/seed.sql` - Test data population
- `database/policies.sql` - Security policies

### **✅ Application Architecture**

- Service layer supports both mock and database modes
- Authentication system ready for Supabase Auth
- Real-time subscriptions configured
- Error handling for database operations

---

## **NEXT STEPS AFTER SETUP**

1. **Test all features** with real database
2. **Create production user accounts**
3. **Import real pharmaceutical data**
4. **Configure backup strategies**
5. **Set up monitoring and alerts**

---

## **NEED HELP?**

If you encounter any issues:

1. Check the **Supabase Dashboard Logs**
2. Use **Browser Developer Tools** to check network requests
3. **Verify SQL execution** in Supabase SQL Editor
4. **Test queries manually** before running the application

---

**🎯 Ready to proceed? Execute the SQL files in order and your database will be fully operational!**
