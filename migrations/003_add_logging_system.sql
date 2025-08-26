-- migrations/003_add_logging_system.sql
-- Fixed version - Create table first, then functions

-- Drop function if it exists (for re-running migration)
DROP FUNCTION IF EXISTS cleanup_old_logs();

-- Create logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')),
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  user_id INTEGER,
  connection_id INTEGER,
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  source VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraints only if the referenced tables exist
DO $$
BEGIN
    -- Check if users table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Add foreign key constraint if it doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'system_logs_user_id_fkey' 
                      AND table_name = 'system_logs') THEN
            ALTER TABLE system_logs ADD CONSTRAINT system_logs_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id);
        END IF;
    END IF;
    
    -- Check if connections table exists before adding foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') THEN
        -- Add foreign key constraint if it doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                      WHERE constraint_name = 'system_logs_connection_id_fkey' 
                      AND table_name = 'system_logs') THEN
            ALTER TABLE system_logs ADD CONSTRAINT system_logs_connection_id_fkey 
            FOREIGN KEY (connection_id) REFERENCES connections(id);
        END IF;
    END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_connection_id ON system_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_request_id ON system_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);

-- Add comments for documentation
COMMENT ON TABLE system_logs IS 'System activity logs for monitoring connections, errors, and user actions';
COMMENT ON COLUMN system_logs.level IS 'Log severity level: DEBUG, INFO, WARN, ERROR, FATAL';
COMMENT ON COLUMN system_logs.category IS 'Log category for filtering: CONNECTION_TEST, USER_IMPORT, AUTH, etc.';
COMMENT ON COLUMN system_logs.details IS 'Additional structured data in JSON format';
COMMENT ON COLUMN system_logs.request_id IS 'Unique identifier for tracing related log entries';
COMMENT ON COLUMN system_logs.source IS 'Source of the log entry: API endpoint, component, etc.';

-- Create function for automatic log cleanup (after table exists)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  -- Keep only last 30 days of DEBUG logs
  DELETE FROM system_logs 
  WHERE level = 'DEBUG' AND created_at < NOW() - INTERVAL '30 days';
  
  -- Keep only last 90 days of INFO logs
  DELETE FROM system_logs 
  WHERE level = 'INFO' AND created_at < NOW() - INTERVAL '90 days';
  
  -- Keep WARN logs for 6 months
  DELETE FROM system_logs 
  WHERE level = 'WARN' AND created_at < NOW() - INTERVAL '6 months';
  
  -- Keep ERROR and FATAL logs for 1 year
  DELETE FROM system_logs 
  WHERE level IN ('ERROR', 'FATAL') AND created_at < NOW() - INTERVAL '1 year';
  
  -- Log the cleanup operation
  INSERT INTO system_logs (level, category, message, source, details)
  VALUES ('INFO', 'SYSTEM', 'Automatic log cleanup completed', 'cleanup_old_logs()', 
          jsonb_build_object('cleanup_time', NOW()));
END;
$$ LANGUAGE plpgsql;

-- Create a simple log entry function for easier logging
CREATE OR REPLACE FUNCTION log_entry(
  p_level VARCHAR(20),
  p_category VARCHAR(50),
  p_message TEXT,
  p_details JSONB DEFAULT NULL,
  p_source VARCHAR(100) DEFAULT NULL,
  p_request_id VARCHAR(255) DEFAULT NULL,
  p_connection_id INTEGER DEFAULT NULL,
  p_user_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  log_id INTEGER;
BEGIN
  INSERT INTO system_logs (
    level, category, message, details, source, request_id, 
    connection_id, user_id, created_at
  ) VALUES (
    UPPER(p_level), p_category, p_message, p_details, p_source, 
    p_request_id, p_connection_id, p_user_id, NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Insert initial log entry to confirm setup
SELECT log_entry(
  'INFO', 
  'SYSTEM', 
  'Logging system initialized successfully',
  jsonb_build_object(
    'migration', '003_add_logging_system',
    'timestamp', NOW(),
    'version', '1.0'
  ),
  'migration_script'
);

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Logging system migration completed successfully!';
  RAISE NOTICE 'Table created: system_logs';
  RAISE NOTICE 'Indexes created: 7 performance indexes';
  RAISE NOTICE 'Functions created: cleanup_old_logs(), log_entry()';
  RAISE NOTICE 'You can now access logs at: /settings/logs';
END $$;