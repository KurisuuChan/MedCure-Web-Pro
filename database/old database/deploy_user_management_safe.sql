-- Safe Deployment Script for User Management Schema
-- This script handles existing tables and ensures proper column creation

-- Step 1: Drop and recreate user_activity_logs table to ensure proper schema
DROP TABLE IF EXISTS user_activity_logs CASCADE;

-- Step 2: Create user_activity_logs table with correct schema
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Verify the column exists (this should not error now)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_activity_logs' 
AND column_name = 'activity_type';

-- Step 4: Create indexes for user_activity_logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_created ON user_activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type_created ON user_activity_logs(activity_type, created_at);

-- Step 5: Enable RLS on user_activity_logs
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for user_activity_logs
CREATE POLICY "Users can view own activity" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin') 
            AND is_active = true
        )
    );

-- Step 7: Test the log_user_activity function
-- This should work now that the table has the correct schema
SELECT log_user_activity(
    (SELECT id FROM user_profiles LIMIT 1),
    'TEST_ACTIVITY',
    'Testing activity logging after schema fix',
    '127.0.0.1'::inet,
    'Test User Agent',
    '{"test": true}'::jsonb
);

-- Step 8: Verify the activity was logged
SELECT 
    id,
    activity_type,
    description,
    created_at
FROM user_activity_logs 
WHERE activity_type = 'TEST_ACTIVITY'
LIMIT 1;
