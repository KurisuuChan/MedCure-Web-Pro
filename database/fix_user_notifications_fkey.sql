-- Fix user_notifications Foreign Key Constraint
-- This script updates the foreign key to reference the correct 'users' table
-- instead of the non-existent 'user_profiles' table

-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Drop the old incorrect foreign key constraint
ALTER TABLE user_notifications 
DROP CONSTRAINT IF EXISTS user_notifications_user_id_fkey;

-- Step 2: Add the correct foreign key constraint
-- This references the 'users' table instead of 'user_profiles'
ALTER TABLE user_notifications 
ADD CONSTRAINT user_notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Step 3: Verify the constraint was created correctly
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conname = 'user_notifications_user_id_fkey';

-- Expected output:
-- constraint_name: user_notifications_user_id_fkey
-- table_name: user_notifications
-- references_table: users
-- constraint_definition: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

COMMIT;

-- Success message
SELECT '✅ Foreign key constraint fixed successfully!' AS status;
