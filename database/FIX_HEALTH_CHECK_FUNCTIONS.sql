-- ================================================================
-- FIX HEALTH CHECK FUNCTIONS (Missing from Database)
-- ================================================================
-- Error: Could not find the function public.should_run_health_check
-- Solution: Create the missing health check functions
-- ================================================================

-- ================================================================
-- 1. CREATE health_check_log TABLE (if not exists)
-- ================================================================

CREATE TABLE IF NOT EXISTS health_check_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    check_type VARCHAR NOT NULL,
    notifications_created INTEGER DEFAULT 0,
    error_message TEXT,
    status VARCHAR DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_check_log_type ON health_check_log(check_type);
CREATE INDEX IF NOT EXISTS idx_health_check_log_created ON health_check_log(created_at);

SELECT '✅ health_check_log table created' as status;

-- ================================================================
-- 2. CREATE should_run_health_check FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION should_run_health_check(
    p_check_type VARCHAR,
    p_interval_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_last_run TIMESTAMP WITH TIME ZONE;
    v_interval INTERVAL;
BEGIN
    -- Check if health_check_log table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'health_check_log'
    ) THEN
        -- Table doesn't exist, allow check to run
        RETURN TRUE;
    END IF;

    -- Convert minutes to interval
    v_interval := (p_interval_minutes || ' minutes')::INTERVAL;
    
    -- Get last successful run time for this check type
    SELECT MAX(created_at) INTO v_last_run
    FROM health_check_log
    WHERE check_type = p_check_type
    AND status = 'success';
    
    -- If never run before, or interval has passed, allow check
    IF v_last_run IS NULL OR (NOW() - v_last_run) >= v_interval THEN
        RETURN TRUE;
    END IF;
    
    -- Check was run recently, skip it
    RETURN FALSE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- On any error, fail open (allow check to run)
        RAISE NOTICE 'Error in should_run_health_check: %', SQLERRM;
        RETURN TRUE;
END;
$$;

SELECT '✅ should_run_health_check function created' as status;

-- ================================================================
-- 3. CREATE record_health_check_run FUNCTION
-- ================================================================

CREATE OR REPLACE FUNCTION record_health_check_run(
    p_check_type VARCHAR,
    p_notifications_created INTEGER DEFAULT 0,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if health_check_log table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'health_check_log'
    ) THEN
        -- Table doesn't exist, silently exit
        RETURN;
    END IF;

    -- Insert health check log record
    INSERT INTO health_check_log (
        check_type,
        notifications_created,
        error_message,
        status,
        created_at
    ) VALUES (
        p_check_type,
        p_notifications_created,
        p_error_message,
        CASE WHEN p_error_message IS NULL THEN 'success' ELSE 'error' END,
        NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Silently ignore errors (non-critical function)
        NULL;
END;
$$;

SELECT '✅ record_health_check_run function created' as status;

-- ================================================================
-- 4. GRANT PERMISSIONS
-- ================================================================

-- Grant execute permissions to authenticated, anon, and service_role
GRANT EXECUTE ON FUNCTION should_run_health_check(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION should_run_health_check(VARCHAR, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION should_run_health_check(VARCHAR, INTEGER) TO service_role;

GRANT EXECUTE ON FUNCTION record_health_check_run(VARCHAR, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_health_check_run(VARCHAR, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION record_health_check_run(VARCHAR, INTEGER, TEXT) TO service_role;

-- Grant table permissions
GRANT SELECT, INSERT ON health_check_log TO authenticated;
GRANT SELECT, INSERT ON health_check_log TO anon;
GRANT ALL ON health_check_log TO service_role;

SELECT '✅ Permissions granted' as status;

-- ================================================================
-- 5. VERIFICATION
-- ================================================================

-- Test the function works
SELECT 
    '🧪 TEST should_run_health_check' as test_name,
    should_run_health_check('low_stock', 15) as result,
    'Should return TRUE (first run)' as expected;

-- Test recording a health check
SELECT record_health_check_run('test_check', 5, NULL);

SELECT '✅ Test health check recorded' as status;

-- Show recent health checks
SELECT 
    '📋 RECENT HEALTH CHECKS' as section,
    check_type,
    notifications_created,
    status,
    created_at
FROM health_check_log
ORDER BY created_at DESC
LIMIT 5;

-- ================================================================
-- FINAL INSTRUCTIONS
-- ================================================================

SELECT '
╔═══════════════════════════════════════════════════════════════╗
║           ✅ HEALTH CHECK FUNCTIONS CREATED                   ║
╚═══════════════════════════════════════════════════════════════╝

✅ WHAT WAS DONE:
   1. Created health_check_log table
   2. Created should_run_health_check() function
   3. Created record_health_check_run() function
   4. Granted necessary permissions

🧪 NEXT STEPS:
   1. Refresh your application (Ctrl+R)
   2. The health check error should disappear
   3. Health checks will now run every 15 minutes

🔍 VERIFY IT WORKS:
   - No more "404 should_run_health_check" errors
   - Console shows: "✅ Health checks scheduled"
   - Check logs: SELECT * FROM health_check_log;

⚠️  NOTE:
   This is separate from login tracking (which already works!)
   Health checks are for low stock/expiry notifications

═══════════════════════════════════════════════════════════════
' as instructions;
