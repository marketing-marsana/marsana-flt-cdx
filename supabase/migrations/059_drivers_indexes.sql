-- 059_drivers_indexes.sql
CREATE INDEX IF NOT EXISTS drivers_branch_id_idx ON public.drivers (branch_id);
CREATE INDEX IF NOT EXISTS drivers_status_idx ON public.drivers (status);
CREATE INDEX IF NOT EXISTS drivers_deleted_at_idx ON public.drivers (deleted_at);
CREATE INDEX IF NOT EXISTS drivers_license_number_idx ON public.drivers (license_number);

CREATE UNIQUE INDEX IF NOT EXISTS drivers_branch_license_unique
ON public.drivers (branch_id, license_number)
WHERE deleted_at IS NULL;
