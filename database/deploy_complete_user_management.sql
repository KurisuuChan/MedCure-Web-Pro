-- Complete User Management Schema Deployment
-- This script deploys the entire user management system in the correct order

-- Step 1: Create all tables in dependency order
-- Note: user_profiles should already exist or be created first

-- User profiles table (extends the auth.users table)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'super_admin', 'admin', 'manager', 'pharmacist', 'cashier', 'staff'
    )),
    assigned_by UUID REFERENCES user_profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role)
);

-- User sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    ended_at TIMESTAMP WITH TIME ZONE,
    session_data JSONB
);

-- User activity logs table - CRITICAL: Ensure this has activity_type column
DROP TABLE IF EXISTS user_activity_logs CASCADE;
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

-- User permissions table (for custom permissions beyond role-based)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    permission VARCHAR(100) NOT NULL,
    granted_by UUID REFERENCES user_profiles(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, permission)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, preference_key)
);

-- User notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT false
);

-- User login attempts table (for security monitoring)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(255),
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Verify critical table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('user_activity_logs', 'user_profiles', 'user_roles')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Step 3: Create all indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_created ON user_activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type_created ON user_activity_logs(activity_type, created_at);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_key ON user_preferences(preference_key);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_address ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_attempted ON login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_attempted ON login_attempts(ip_address, attempted_at);

-- Step 4: Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Step 5: Create helper functions
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = user_uuid AND is_active = true
    ORDER BY 
        CASE role
            WHEN 'super_admin' THEN 1
            WHEN 'admin' THEN 2
            WHEN 'manager' THEN 3
            WHEN 'pharmacist' THEN 4
            WHEN 'cashier' THEN 5
            WHEN 'staff' THEN 6
            ELSE 7
        END
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    user_uuid UUID,
    activity_type_param VARCHAR(100),
    description_param TEXT,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    metadata_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_logs (
        user_id, activity_type, description, ip_address, user_agent, metadata
    ) VALUES (
        user_uuid, activity_type_param, description_param, ip_address_param, user_agent_param, metadata_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_sessions
    SET last_activity = NOW()
    WHERE user_id = user_uuid AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create basic RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own activity" ON user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Step 7: Test the schema
SELECT 'Schema deployment completed successfully. Testing log function...' AS status;

-- This should work now - testing the log function
-- Note: This will only work if there's at least one user in user_profiles
DO $$
DECLARE
    test_user_id UUID;
    log_result UUID;
BEGIN
    -- Try to get a user ID for testing (create a dummy one if needed)
    SELECT id INTO test_user_id FROM user_profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        SELECT log_user_activity(
            test_user_id,
            'SCHEMA_DEPLOYMENT',
            'User management schema deployed successfully',
            '127.0.0.1'::inet,
            'Schema Deployment Script',
            '{"deployment_version": "1.0", "timestamp": "' || NOW() || '"}'::jsonb
        ) INTO log_result;
        
        RAISE NOTICE 'Test activity logged with ID: %', log_result;
    ELSE
        RAISE NOTICE 'No users found in user_profiles - skipping activity log test';
    END IF;
END $$;

SELECT 'Deployment verification completed.' AS final_status;
