-- 010_enums.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_type') THEN
    CREATE TYPE branch_type AS ENUM ('HQ', 'B2B', 'B2C');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_status') THEN
    CREATE TYPE branch_status AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_module') THEN
    CREATE TYPE permission_module AS ENUM (
      'branches',
      'users',
      'vehicles',
      'handshakes',
      'inspections',
      'rentals',
      'maintenance',
      'corporates',
      'alerts',
      'dashboards',
      'driver_portal',
      'audit_logs',
      'reports',
      'settings'
    );
  END IF;
END$$;
