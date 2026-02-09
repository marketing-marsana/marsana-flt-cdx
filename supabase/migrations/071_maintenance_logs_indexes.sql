-- 071_maintenance_logs_indexes.sql
CREATE INDEX IF NOT EXISTS maintenance_logs_branch_id_idx ON public.maintenance_logs (branch_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_vehicle_id_idx ON public.maintenance_logs (vehicle_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_trip_id_idx ON public.maintenance_logs (trip_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_service_date_idx ON public.maintenance_logs (service_date);
CREATE INDEX IF NOT EXISTS maintenance_logs_deleted_at_idx ON public.maintenance_logs (deleted_at);
