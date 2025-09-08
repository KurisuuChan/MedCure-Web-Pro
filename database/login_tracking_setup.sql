-- Add user activity logs table for login tracking
-- Run this after the main schema.sql

CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'password_change', etc.
    metadata JSONB DEFAULT '{}', -- Store IP, user agent, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action_type ON user_activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- Add RLS policies
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs" ON user_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy: Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
    FOR SELECT USING (user_id = auth.uid());

-- Policy: System can insert activity logs
CREATE POLICY "System can insert activity logs" ON user_activity_logs
    FOR INSERT WITH CHECK (true);

-- Function to automatically log user activities
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when user last_login is updated
    IF TG_OP = 'UPDATE' AND OLD.last_login IS DISTINCT FROM NEW.last_login THEN
        INSERT INTO user_activity_logs (user_id, action_type, metadata)
        VALUES (NEW.id, 'login', jsonb_build_object(
            'timestamp', NEW.last_login,
            'previous_login', OLD.last_login
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-log activities
DROP TRIGGER IF EXISTS trigger_log_user_activity ON users;
CREATE TRIGGER trigger_log_user_activity
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activity();

-- Create a view for easy access to login statistics
CREATE OR REPLACE VIEW login_statistics AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    u.last_login,
    u.is_active,
    CASE 
        WHEN u.last_login > NOW() - INTERVAL '15 minutes' THEN true
        ELSE false
    END as is_online,
    (
        SELECT COUNT(*) 
        FROM user_activity_logs ual 
        WHERE ual.user_id = u.id 
        AND ual.action_type = 'login'
        AND ual.created_at > NOW() - INTERVAL '7 days'
    ) as logins_this_week,
    (
        SELECT COUNT(*) 
        FROM user_activity_logs ual 
        WHERE ual.user_id = u.id 
        AND ual.action_type = 'login'
        AND ual.created_at > NOW() - INTERVAL '30 days'
    ) as logins_this_month
FROM users u
WHERE u.is_active = true
ORDER BY u.last_login DESC NULLS LAST;

-- Grant access to the view
GRANT SELECT ON login_statistics TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_activity_logs IS 'Tracks user login/logout activity and other security events';
COMMENT ON COLUMN user_activity_logs.metadata IS 'JSON data containing IP address, user agent, and other context';
COMMENT ON VIEW login_statistics IS 'Provides quick access to user login statistics and online status';
