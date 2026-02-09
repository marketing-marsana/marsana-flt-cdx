-- 073_expense_logs_table.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM ('toll', 'parking', 'petty_cash', 'misc', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_payment_method') THEN
    CREATE TYPE expense_payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.expense_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  related_vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  related_trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  expense_date timestamptz NOT NULL,
  category expense_category NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method expense_payment_method NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER expense_logs_set_updated_at
BEFORE UPDATE ON public.expense_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
