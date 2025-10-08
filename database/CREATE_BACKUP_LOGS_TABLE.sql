-- =====================================================
-- CREATE BACKUP_LOGS TABLE (OPTIONAL)
-- =====================================================
-- This table is optional for the backup system.
-- The system works fine without it using localStorage.
-- Create this table if you want backup history in the database.
-- =====================================================

-- Drop table if exists (optional - comment out if you don't want to drop)
-- DROP TABLE IF EXISTS backup_logs CASCADE;

-- Create backup_logs table
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('manual', 'automatic')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed')),
    tables_backed_up TEXT[] DEFAULT '{}',
    total_records INTEGER DEFAULT 0,
    backup_size_mb NUMERIC(10, 2),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_logs_status ON backup_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_logs_type ON backup_logs(backup_type);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_by ON backup_logs(created_by);

-- Add comments
COMMENT ON TABLE backup_logs IS 'Logs all backup operations (manual and automatic)';
COMMENT ON COLUMN backup_logs.id IS 'Unique identifier for each backup log entry';
COMMENT ON COLUMN backup_logs.backup_type IS 'Type of backup: manual or automatic';
COMMENT ON COLUMN backup_logs.status IS 'Current status of the backup operation';
COMMENT ON COLUMN backup_logs.tables_backed_up IS 'Array of table names that were backed up';
COMMENT ON COLUMN backup_logs.total_records IS 'Total number of records backed up across all tables';
COMMENT ON COLUMN backup_logs.backup_size_mb IS 'Approximate size of the backup in megabytes';
COMMENT ON COLUMN backup_logs.error_message IS 'Error message if backup failed';
COMMENT ON COLUMN backup_logs.created_at IS 'When the backup was initiated';
COMMENT ON COLUMN backup_logs.completed_at IS 'When the backup completed or failed';
COMMENT ON COLUMN backup_logs.created_by IS 'User who initiated the backup';

-- Enable Row Level Security
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view backup logs"
    ON backup_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can manage backup logs"
    ON backup_logs FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT ON backup_logs TO authenticated;
GRANT ALL ON backup_logs TO service_role;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the table was created successfully:
-- SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 10;
-- =====================================================

-- =====================================================
-- EXAMPLE USAGE
-- =====================================================
-- Insert a manual backup log:
-- INSERT INTO backup_logs (backup_type, status, tables_backed_up, total_records)
-- VALUES ('manual', 'completed', ARRAY['products', 'categories', 'sales'], 450);
-- =====================================================

-- =====================================================
-- CLEANUP OLD BACKUPS (Run periodically)
-- =====================================================
-- Delete backups older than 90 days:
-- DELETE FROM backup_logs WHERE created_at < NOW() - INTERVAL '90 days';
-- =====================================================

SELECT '✅ backup_logs table created successfully!' AS status;
