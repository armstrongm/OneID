-- migrations/003_create_import_tasks_fixed.sql

-- First, let's see what we're working with
SELECT 'Current connections table structure:' as info;
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'connections' AND column_name = 'id';

-- Drop the table if it exists
DROP TABLE IF EXISTS import_tasks CASCADE;

-- Create import_tasks table with INTEGER connection_id to match your connections.id
CREATE TABLE import_tasks (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL, -- Changed to INTEGER to match connections.id
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
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Add foreign key constraint with correct data type
  CONSTRAINT fk_import_tasks_connection 
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
);

-- Update users table to handle both scenarios
DO $$
DECLARE
  connections_id_type TEXT;
BEGIN
  -- Get the actual data type of connections.id
  SELECT data_type INTO connections_id_type
  FROM information_schema.columns 
  WHERE table_name = 'connections' AND column_name = 'id';
  
  RAISE NOTICE 'connections.id data type is: %', connections_id_type;
  
  -- Add external_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'external_id') THEN
    ALTER TABLE users ADD COLUMN external_id VARCHAR(255);
    RAISE NOTICE 'Added external_id column to users table';
  END IF;
  
  -- Add import_task_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'import_task_id') THEN
    ALTER TABLE users ADD COLUMN import_task_id INTEGER;
    RAISE NOTICE 'Added import_task_id column to users table';
  END IF;
  
  -- Handle source_connection_id based on connections table type
  IF connections_id_type = 'integer' THEN
    -- connections.id is INTEGER, so source_connection_id should be INTEGER
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'source_connection_id') THEN
      ALTER TABLE users ADD COLUMN source_connection_id INTEGER;
      RAISE NOTICE 'Added source_connection_id (INTEGER) column to users table';
    ELSE
      -- Check if it's the wrong type and fix it
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'source_connection_id' AND data_type != 'integer') THEN
        -- Drop constraints first
        ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_source_connection;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_source_connection_id_fkey;
        
        -- Change the column type
        ALTER TABLE users ALTER COLUMN source_connection_id TYPE INTEGER USING source_connection_id::INTEGER;
        RAISE NOTICE 'Changed source_connection_id to INTEGER type';
      END IF;
    END IF;
  ELSE
    -- connections.id is VARCHAR, so source_connection_id should be VARCHAR
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'source_connection_id') THEN
      ALTER TABLE users ADD COLUMN source_connection_id VARCHAR(255);
      RAISE NOTICE 'Added source_connection_id (VARCHAR) column to users table';
    ELSE
      -- Check if it's the wrong type and fix it
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'source_connection_id' AND data_type = 'integer') THEN
        -- Drop constraints first
        ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_source_connection;
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_source_connection_id_fkey;
        
        -- Change the column type
        ALTER TABLE users ALTER COLUMN source_connection_id TYPE VARCHAR(255);
        RAISE NOTICE 'Changed source_connection_id to VARCHAR type';
      END IF;
    END IF;
  END IF;
END $$;

-- Add foreign key constraints
-- Drop existing constraints first
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_import_task;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_source_connection;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_source_connection_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_import_task_id_fkey;

-- Add the constraints back
ALTER TABLE users 
ADD CONSTRAINT fk_users_import_task 
FOREIGN KEY (import_task_id) REFERENCES import_tasks(id) ON DELETE SET NULL;

ALTER TABLE users 
ADD CONSTRAINT fk_users_source_connection 
FOREIGN KEY (source_connection_id) REFERENCES connections(id) ON DELETE SET NULL;

-- Create indexes safely
DROP INDEX IF EXISTS idx_import_tasks_connection_id;
DROP INDEX IF EXISTS idx_import_tasks_status;
DROP INDEX IF EXISTS idx_users_external_id;
DROP INDEX IF EXISTS idx_users_source_connection;

CREATE INDEX idx_import_tasks_connection_id ON import_tasks(connection_id);
CREATE INDEX idx_import_tasks_status ON import_tasks(status);
CREATE INDEX idx_users_external_id ON users(external_id);
CREATE INDEX idx_users_source_connection ON users(source_connection_id);

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

-- Final verification
SELECT 'Migration completed. Final table structure:' as info;
SELECT 
  t.table_name,
  c.column_name, 
  c.data_type,
  c.character_maximum_length,
  c.is_nullable
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_name IN ('import_tasks', 'users', 'connections')
  AND c.column_name IN ('id', 'connection_id', 'source_connection_id', 'import_task_id', 'external_id')
ORDER BY t.table_name, c.column_name;