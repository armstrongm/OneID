-- test_logging_system.sql
-- Run this after the migration to test the logging system

-- Test the log_entry function with different log levels
SELECT log_entry('DEBUG', 'TEST', 'Debug message for testing', 
  jsonb_build_object('test_data', 'debug_value'), 'test_script');

SELECT log_entry('INFO', 'TEST', 'Info message for testing', 
  jsonb_build_object('test_data', 'info_value'), 'test_script');

SELECT log_entry('WARN', 'TEST', 'Warning message for testing', 
  jsonb_build_object('test_data', 'warn_value'), 'test_script');

SELECT log_entry('ERROR', 'TEST', 'Error message for testing', 
  jsonb_build_object('test_data', 'error_value', 'error_code', 500), 'test_script');

-- Insert a connection test log entry
SELECT log_entry('INFO', 'CONNECTION_TEST', 'Test connection log entry', 
  jsonb_build_object(
    'connection_type', 'PINGONE',
    'environment_id', 'test-env-123',
    'region', 'NA',
    'test_result', 'success'
  ), 
  'test_script',
  'req_test_' || extract(epoch from now())::text
);

-- Query the logs to verify they were inserted
SELECT 
  id,
  level,
  category,
  message,
  source,
  request_id,
  created_at,
  details
FROM system_logs 
WHERE source = 'test_script'
ORDER BY created_at DESC;

-- Test log statistics
SELECT 
  level,
  category,
  COUNT(*) as count
FROM system_logs 
GROUP BY level, category
ORDER BY level, count DESC;

-- Show table structure
\d system_logs

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'system_logs'
ORDER BY indexname;

-- Test cleanup function (this won't delete anything recent)
SELECT cleanup_old_logs();

-- Final verification
SELECT 
  COUNT(*) as total_logs,
  COUNT(CASE WHEN level = 'ERROR' THEN 1 END) as error_count,
  COUNT(CASE WHEN level = 'INFO' THEN 1 END) as info_count,
  MIN(created_at) as oldest_log,
  MAX(created_at) as newest_log
FROM system_logs;