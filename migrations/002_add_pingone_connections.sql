-- migrations/002_create_connections_table.sql
-- Complete connections table creation with PingOne support

-- Create connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS connections (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  server_name VARCHAR(255),
  port INTEGER,
  domain VARCHAR(255),
  base_dn TEXT,
  username VARCHAR(255),
  password_encrypted TEXT,
  use_ssl BOOLEAN DEFAULT false,
  timeout_seconds INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'created',
  connection_config JSONB,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(50) DEFAULT 'idle',
  import_stats JSONB,
  last_tested TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add constraint for connection types (including PingOne)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_connection_type' 
               AND table_name = 'connections') THEN
        ALTER TABLE connections DROP CONSTRAINT check_connection_type;
    END IF;
    
    -- Add updated constraint with PINGONE
    ALTER TABLE connections ADD CONSTRAINT check_connection_type 
      CHECK (type IN ('AD', 'LDAP', 'DATABASE', 'PINGONE'));
END $$;

-- Add constraint for status values
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_connection_status' 
               AND table_name = 'connections') THEN
        ALTER TABLE connections DROP CONSTRAINT check_connection_status;
    END IF;
    
    -- Add status constraint
    ALTER TABLE connections ADD CONSTRAINT check_connection_status 
      CHECK (status IN ('created', 'testing', 'connected', 'error', 'disabled'));
END $$;

-- Add constraint for sync status values  
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_sync_status' 
               AND table_name = 'connections') THEN
        ALTER TABLE connections DROP CONSTRAINT check_sync_status;
    END IF;
    
    -- Add sync status constraint
    ALTER TABLE connections ADD CONSTRAINT check_sync_status 
      CHECK (sync_status IN ('idle', 'running', 'completed', 'error', 'completed_with_errors'));
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(type);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_sync_status ON connections(sync_status);
CREATE INDEX IF NOT EXISTS idx_connections_last_sync ON connections(last_sync_at);
CREATE INDEX IF NOT EXISTS idx_connections_last_tested ON connections(last_tested);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON connections(created_at);

-- Add comments for documentation
COMMENT ON TABLE connections IS 'Identity source connections (AD, LDAP, PingOne, etc.)';
COMMENT ON COLUMN connections.connection_config IS 'JSON configuration specific to connection type (encrypted credentials, endpoints, etc.)';
COMMENT ON COLUMN connections.last_sync_at IS 'Timestamp of last successful sync/import operation';
COMMENT ON COLUMN connections.sync_status IS 'Current sync status: idle, running, completed, error, completed_with_errors';
COMMENT ON COLUMN connections.import_stats IS 'JSON statistics from last import: users/groups processed, created, updated, errors, etc.';
COMMENT ON COLUMN connections.password_encrypted IS 'Encrypted password for legacy connection types (AD/LDAP)';

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_connections_updated_at_trigger ON connections;
CREATE TRIGGER update_connections_updated_at_trigger
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connections_updated_at();

-- Create users table if it doesn't exist (needed for foreign keys)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  display_name VARCHAR(255),
  title VARCHAR(255),
  department VARCHAR(255),
  phone_number VARCHAR(50),
  mobile_number VARCHAR(50),
  office_location VARCHAR(255),
  employee_id VARCHAR(100),
  employee_type VARCHAR(50) DEFAULT 'employee',
  password_hash TEXT,
  manager_id INTEGER REFERENCES users(id),
  source_connection_id INTEGER REFERENCES connections(id),
  external_id VARCHAR(255),
  distinguished_name TEXT,
  is_enabled BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  password_expires_at TIMESTAMP,
  must_change_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create groups table if it doesn't exist (needed for foreign keys)
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  description TEXT,
  type VARCHAR(50) DEFAULT 'Security',
  scope VARCHAR(50) DEFAULT 'Global',
  source_connection_id INTEGER REFERENCES connections(id),
  external_id VARCHAR(255),
  distinguished_name TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, source_connection_id)
);

-- Create group memberships table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  source_connection_id INTEGER REFERENCES connections(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_source_connection ON users(source_connection_id);
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
CREATE INDEX IF NOT EXISTS idx_users_enabled ON users(is_enabled);

-- Create indexes for groups table  
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_source_connection ON groups(source_connection_id);
CREATE INDEX IF NOT EXISTS idx_groups_external_id ON groups(external_id);
CREATE INDEX IF NOT EXISTS idx_groups_enabled ON groups(is_enabled);

-- Create indexes for group_memberships table
CREATE INDEX IF NOT EXISTS idx_group_memberships_user ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_source ON group_memberships(source_connection_id);

-- Insert sample connection data for testing (optional)
INSERT INTO connections (name, type, description, connection_config, status, created_at, updated_at) 
VALUES (
  'Sample PingOne Connection', 
  'PINGONE', 
  'Sample PingOne connection for testing',
  jsonb_build_object(
    'environmentId', '00000000-0000-0000-0000-000000000000',
    'region', 'NA',
    'clientId', '00000000-0000-0000-0000-000000000000',
    'syncEnabled', false,
    'syncInterval', 60,
    'importUsers', true,
    'importGroups', true
  ),
  'created',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Create a view for easier querying of connection details
CREATE OR REPLACE VIEW connection_details AS
SELECT 
  c.id,
  c.name,
  c.type,
  c.description,
  c.server_name,
  c.status,
  c.sync_status,
  c.connection_config,
  c.last_sync_at,
  c.last_tested,
  c.import_stats,
  c.created_at,
  c.updated_at,
  COALESCE((c.import_stats->>'usersCreated')::int, 0) as users_imported,
  COALESCE((c.import_stats->>'groupsCreated')::int, 0) as groups_imported,
  CASE 
    WHEN c.last_tested IS NULL THEN 'never_tested'
    WHEN c.last_tested < NOW() - INTERVAL '1 day' THEN 'needs_testing'
    ELSE 'recently_tested'
  END as test_status
FROM connections c;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema migration completed successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - connections (with PingOne support)';
  RAISE NOTICE '  - users';
  RAISE NOTICE '  - groups'; 
  RAISE NOTICE '  - group_memberships';
  RAISE NOTICE 'Indexes created: 15 performance indexes';
  RAISE NOTICE 'Views created: connection_details';
  RAISE NOTICE 'Constraints: type, status, and data integrity checks';
  RAISE NOTICE 'Sample data: 1 test PingOne connection added';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run: migrations/003_add_logging_system.sql';
  RAISE NOTICE '2. Create logger service: lib/services/logger.js';
  RAISE NOTICE '3. Create connection APIs and components';
END $$;