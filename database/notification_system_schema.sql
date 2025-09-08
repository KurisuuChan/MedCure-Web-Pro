-- ==========================================
-- NOTIFICATION SYSTEM SCHEMA
-- Phase 4: Smart Notification System
-- ==========================================

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
-- Core notifications storage
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'low_stock',
        'expiry_warning', 
        'sales_target',
        'system_alert',
        'reorder_suggestion',
        'daily_report',
        'weekly_report',
        'critical_error'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    data JSONB DEFAULT '{}', -- Additional structured data
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ==========================================
-- NOTIFICATION PREFERENCES TABLE  
-- ==========================================
-- User notification preferences and settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Delivery methods
    email_notifications BOOLEAN DEFAULT TRUE,
    browser_notifications BOOLEAN DEFAULT TRUE,
    
    -- Notification types
    low_stock_alerts BOOLEAN DEFAULT TRUE,
    expiry_warnings BOOLEAN DEFAULT TRUE,
    sales_reports BOOLEAN DEFAULT TRUE,
    system_alerts BOOLEAN DEFAULT TRUE,
    
    -- Frequency settings
    notification_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ==========================================
-- NOTIFICATION TEMPLATES TABLE
-- ==========================================
-- Reusable notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Array of variable names used in template
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for template lookups
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(active);

-- ==========================================
-- EMAIL QUEUE TABLE
-- ==========================================
-- Queue for email notifications to be sent
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON email_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue(status, created_at) WHERE status = 'pending';

-- ==========================================
-- NOTIFICATION RULES TABLE
-- ==========================================
-- Automated notification rules and triggers
CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
        'low_stock_threshold',
        'expiry_days_warning',
        'sales_target_achievement',
        'system_health_check',
        'daily_report_schedule'
    )),
    conditions JSONB NOT NULL, -- Rule conditions (thresholds, schedules, etc.)
    notification_template_id UUID REFERENCES notification_templates(id),
    target_roles TEXT[] DEFAULT ARRAY['admin'], -- Array of roles to notify
    active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for rule processing
CREATE INDEX IF NOT EXISTS idx_notification_rules_type ON notification_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON notification_rules(active);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at 
    BEFORE UPDATE ON email_queue 
    FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at_column();

CREATE TRIGGER update_notification_rules_updated_at 
    BEFORE UPDATE ON notification_rules 
    FOR EACH ROW EXECUTE FUNCTION update_notification_updated_at_column();

-- ==========================================
-- RLS (Row Level Security) POLICIES
-- ==========================================

-- Enable RLS on all notification tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- Notification templates policies (admin only)
CREATE POLICY "Admins can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Email queue policies
CREATE POLICY "Users can view their own email queue" ON email_queue
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage email queue" ON email_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Notification rules policies (admin only)
CREATE POLICY "Admins can manage notification rules" ON notification_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Insert default notification templates
INSERT INTO notification_templates (name, type, subject_template, body_template, variables) VALUES
('Low Stock Alert', 'low_stock', 'Low Stock Alert: {{product_name}}', 'Product {{product_name}} is running low with only {{current_stock}} pieces remaining.', '["product_name", "current_stock"]'),
('Expiry Warning', 'expiry_warning', 'Product Expiry Warning: {{product_name}}', 'Product {{product_name}} expires in {{days_to_expiry}} days on {{expiry_date}}.', '["product_name", "days_to_expiry", "expiry_date"]'),
('Daily Sales Report', 'daily_report', 'Daily Sales Report - {{date}}', 'Daily performance: {{total_transactions}} transactions, ₹{{total_revenue}} revenue.', '["date", "total_transactions", "total_revenue"]'),
('System Alert', 'system_alert', 'System Alert: {{alert_type}}', '{{message}}', '["alert_type", "message"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default notification rules
INSERT INTO notification_rules (name, description, rule_type, conditions, target_roles) VALUES
('Low Stock Threshold', 'Alert when product stock falls below 10 pieces', 'low_stock_threshold', '{"threshold": 10}', ARRAY['admin', 'manager']),
('Expiry Warning - 30 Days', 'Warn about products expiring within 30 days', 'expiry_days_warning', '{"days": 30}', ARRAY['admin', 'manager']),
('Expiry Critical - 7 Days', 'Critical alert for products expiring within 7 days', 'expiry_days_warning', '{"days": 7, "priority": "critical"}', ARRAY['admin', 'manager']),
('Daily Report Schedule', 'Generate daily sales report', 'daily_report_schedule', '{"schedule": "daily", "time": "18:00"}', ARRAY['admin', 'manager'])
ON CONFLICT (name) DO NOTHING;

-- Create default notification preferences for existing admin users
INSERT INTO notification_preferences (user_id, email_notifications, browser_notifications, low_stock_alerts, expiry_warnings, sales_reports, system_alerts)
SELECT id, true, true, true, true, true, true 
FROM users 
WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE notifications IS 'Core notifications storage for the smart notification system';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery and types';
COMMENT ON TABLE notification_templates IS 'Reusable templates for generating notifications';
COMMENT ON TABLE email_queue IS 'Queue for email notifications to be processed';
COMMENT ON TABLE notification_rules IS 'Automated rules for generating notifications';
