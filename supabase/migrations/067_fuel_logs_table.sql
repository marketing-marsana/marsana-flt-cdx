-- 067_fuel_logs_table.sql
CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  filled_at timestamptz NOT NULL,
  quantity_liters numeric NOT NULL CHECK (quantity_liters > 0),
  price_per_liter numeric NOT NULL CHECK (price_per_liter >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  odometer numeric NOT NULL CHECK (odometer >= 0),
  fuel_station text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (total_amount = quantity_liters * price_per_liter)
);

CREATE TRIGGER fuel_logs_set_updated_at
BEFORE UPDATE ON public.fuel_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
