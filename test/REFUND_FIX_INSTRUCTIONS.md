# Refund System Fix Instructions

## Issues Found and Fixed:

### 1. Database Status Constraint Issue
**Error**: `new row for relation "sales" violates check constraint "sales_status_check"`
**Cause**: The `sales` table has a check constraint that only allows 'pending', 'completed', 'cancelled' but not 'refunded'
**Fix**: Updated database constraint to include 'refunded'

### 2. Stock Movements Column Mismatch  
**Error**: `Could not find the 'performed_by' column of 'stock_movements' in the schema cache`
**Cause**: Transaction service was using `performed_by` column but database table uses `user_id`
**Fix**: Updated transaction service to use correct `user_id` column name

## Files Fixed:

### ✅ database/fix_refund_medicine_structure.sql
- Added constraint update to allow 'refunded' status
- Fixed database functions to use new medicine structure (brand_name, generic_name)
- Set refund status to 'refunded' instead of 'cancelled'

### ✅ src/services/domains/sales/transactionService.js  
- Fixed stock_movements insert to use `user_id` instead of `performed_by`
- Updated audit log fields to match database schema (movement_type: "in", proper stock tracking)

## Deployment Steps:

### Step 1: Deploy Database Changes
1. Open Supabase SQL Editor
2. Copy and paste the content of `database/fix_refund_medicine_structure.sql`
3. Execute the script

### Step 2: Test Refund Functionality
1. Go to Transaction History
2. Try to refund a completed transaction
3. Verify:
   - Transaction status changes to "REFUNDED" with orange badge
   - Stock is properly restored
   - No database errors in console

### Step 3: Test View Receipt Button
1. Click "View" button on any transaction
2. Verify the receipt modal opens correctly

## Expected Results After Fix:
- ✅ Refunds process without database errors
- ✅ Transaction status shows "REFUNDED" in orange
- ✅ Stock is properly restored to inventory
- ✅ Audit logs are created in stock_movements table
- ✅ View receipt button works properly

## SQL Script to Execute:
The file `database/fix_refund_medicine_structure.sql` contains all necessary database fixes.