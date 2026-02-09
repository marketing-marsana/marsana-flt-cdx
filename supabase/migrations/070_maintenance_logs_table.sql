-- 070_maintenance_logs_table.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_type') THEN
    CREATE TYPE maintenance_type AS ENUM ('service', 'repair', 'parts', 'inspection', 'other');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  service_date timestamptz NOT NULL,
  maintenance_type maintenance_type NOT NULL,
  description text NOT NULL,
  vendor_or_workshop text,
  cost_amount numeric NOT NULL CHECK (cost_amount >= 0),
  odometer numeric NOT NULL CHECK (odometer >= 0),
  next_service_odometer numeric,
  next_service_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER maintenance_logs_set_updated_at
BEFORE UPDATE ON public.maintenance_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
