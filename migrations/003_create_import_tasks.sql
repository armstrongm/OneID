-- migrations/003_create_import_tasks.sql - FIXED VERSION

-- First, let's check the actual structure of your connections table
-- You can run this to see the current structure:
-- \d connections

-- Drop the table if it exists (to handle the failed creation)
DROP TABLE IF EXISTS import_tasks CASCADE;

-- Import Tasks Table with correct data types
CREATE TABLE import_tasks (
  id SERIAL PRIMARY KEY,
  connection_id VARCHAR(255) NOT NULL,
  task_type VARCHAR(50) NOT NULL, -- 'users', 'groups'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- percentage 0-100
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  created_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_message TEXT,
  preview_data JSONB, -- Store preview data
  import_config JSONB, -- Store import configuration
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint separately (this allows us to handle the connection properly)
-- We'll reference the connections table, but we need to make sure the data types match
-- If your connections.id is VARCHAR, this should work:
ALTER TABLE import_tasks 
ADD CONSTRAINT fk_import_tasks_connection 
FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE;

-- If the above fails, you might need to check what your connections table actually looks like
-- Run: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'connections' AND column_name = 'id';

-- Add columns to existing users table (with IF NOT EXISTS checks)
DO $$
BEGIN
  -- Add external_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'external_id') THEN
    ALTER TABLE users ADD COLUMN external_id VARCHAR(255);
  END IF;
  
  -- Add import_task_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'import_task_id') THEN
    ALTER TABLE users ADD COLUMN import_task_id INTEGER;
  END IF;
  
  -- Update source_connection_id to match connections table type if needed
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'source_connection_id' AND data_type = 'character varying') THEN
    -- If source_connection_id exists as INTEGER, we need to change it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'source_connection_id') THEN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_source_connection;
      ALTER TABLE users ALTER COLUMN source_connection_id TYPE VARCHAR(255);
    ELSE
      ALTER TABLE users ADD COLUMN source_connection_id VARCHAR(255);
    END IF;
  END IF;
END $$;

-- Add foreign key constraints for users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_import_task;
ALTER TABLE users 
ADD CONSTRAINT fk_users_import_task 
FOREIGN KEY (import_task_id) REFERENCES import_tasks(id) ON DELETE SET NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_source_connection;
ALTER TABLE users 
ADD CONSTRAINT fk_users_source_connection 
FOREIGN KEY (source_connection_id) REFERENCES connections(id) ON DELETE SET NULL;

-- Create indexes (drop first if they exist)
DROP INDEX IF EXISTS idx_import_tasks_connection_id;
DROP INDEX IF EXISTS idx_import_tasks_status;
DROP INDEX IF EXISTS idx_users_external_id;

CREATE INDEX idx_import_tasks_connection_id ON import_tasks(connection_id);
CREATE INDEX idx_import_tasks_status ON import_tasks(status);
CREATE INDEX idx_users_external_id ON users(external_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_import_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_import_tasks_updated_at_trigger ON import_tasks;
CREATE TRIGGER update_import_tasks_updated_at_trigger
    BEFORE UPDATE ON import_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_import_tasks_updated_at();

-- Verify the tables were created correctly
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('import_tasks', 'users', 'connections')
  AND column_name IN ('id', 'connection_id', 'source_connection_id', 'import_task_id')
ORDER BY table_name, column_name;