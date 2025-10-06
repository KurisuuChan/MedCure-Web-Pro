-- Check the actual structure of system_settings table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'system_settings'
ORDER BY ordinal_position;

-- Also check the constraint
SELECT
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
    AND constraint_name LIKE '%system_settings%';
