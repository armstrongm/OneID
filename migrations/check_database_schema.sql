-- check_database_schema.sql
-- Run this to see what tables and structure you currently have

\echo '=== DATABASE INSPECTION REPORT ==='
\echo ''

-- Check if we're connected to the right database
SELECT 'Connected to database: ' || current_database() as database_info;

\echo ''
\echo '=== EXISTING TABLES ==='

-- List all tables in the current database
SELECT 
  schemaname as schema,
  tablename as table_name,
  tableowner as owner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '=== TABLE DETAILS ==='

-- Check if specific tables exist and show their structure
DO $$
DECLARE
  table_name TEXT;
  table_exists BOOLEAN;
BEGIN
  -- Check each important table
  FOR table_name IN VALUES ('connections'), ('users'), ('groups'), ('group_memberships'), ('system_logs') 
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = table_name
    ) INTO table_exists;
    
    IF table_exists THEN
      RAISE NOTICE 'Table % exists ✓', table_name;
    ELSE
      RAISE NOTICE 'Table % does NOT exist ✗', table_name;
    END IF;
  END LOOP;
END $$;

\echo ''
\echo '=== CONNECTIONS TABLE DETAILS (if exists) ==='

-- Show connections table structure if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') THEN
    RAISE NOTICE 'Connections table exists - showing structure:';
  ELSE
    RAISE NOTICE 'Connections table does not exist';
  END IF;
END $$;

-- Show table structure only if table exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'connections' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

\echo ''
\echo '=== EXISTING CONSTRAINTS ==='

-- Show constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('connections', 'users', 'groups', 'group_memberships', 'system_logs')
ORDER BY tc.table_name, tc.constraint_type;

\echo ''
\echo '=== EXISTING INDEXES ==='

-- Show indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('connections', 'users', 'groups', 'group_memberships', 'system_logs')
ORDER BY tablename, indexname;

\echo ''
\echo '=== MIGRATION RECOMMENDATION ==='

-- Provide migration recommendation
DO $$
DECLARE
  connections_exists BOOLEAN;
  users_exists BOOLEAN;
  system_logs_exists BOOLEAN;
BEGIN
  -- Check table existence
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') INTO connections_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') INTO users_exists;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') INTO system_logs_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE 'MIGRATION RECOMMENDATIONS:';
  RAISE NOTICE '========================';
  
  IF NOT connections_exists THEN
    RAISE NOTICE '1. Run: 002_create_connections_table.sql (creates connections, users, groups tables)';
  ELSE
    RAISE NOTICE '1. Connections table exists - you may need to add PingOne columns';
  END IF;
  
  IF NOT system_logs_exists THEN
    RAISE NOTICE '2. Run: 003_add_logging_system.sql (creates logging system)';
  ELSE
    RAISE NOTICE '2. Logging system already exists';
  END IF;
  
  RAISE NOTICE '3. Create API endpoints and components';
  RAISE NOTICE '4. Test the system';
END $$;