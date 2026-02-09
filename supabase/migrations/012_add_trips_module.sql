-- 012_add_trips_module.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'permission_module'
      AND e.enumlabel = 'trips'
  ) THEN
    ALTER TYPE permission_module ADD VALUE 'trips';
  END IF;
END$$;
