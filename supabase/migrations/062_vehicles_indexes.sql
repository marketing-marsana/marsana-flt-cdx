-- 062_vehicles_indexes.sql
CREATE INDEX IF NOT EXISTS vehicles_branch_id_idx ON public.vehicles (branch_id);
CREATE INDEX IF NOT EXISTS vehicles_status_idx ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS vehicles_deleted_at_idx ON public.vehicles (deleted_at);
CREATE INDEX IF NOT EXISTS vehicles_registration_idx ON public.vehicles (registration_number);
CREATE INDEX IF NOT EXISTS vehicles_vin_idx ON public.vehicles (vin);

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_branch_registration_unique
ON public.vehicles (branch_id, registration_number)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_vin_unique
ON public.vehicles (vin)
WHERE vin IS NOT NULL;
