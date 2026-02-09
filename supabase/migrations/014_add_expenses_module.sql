-- 014_add_expenses_module.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'permission_module'
      AND e.enumlabel = 'expenses'
  ) THEN
    ALTER TYPE permission_module ADD VALUE 'expenses';
  END IF;
END$$;
