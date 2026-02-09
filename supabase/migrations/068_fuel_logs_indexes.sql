-- 068_fuel_logs_indexes.sql
CREATE INDEX IF NOT EXISTS fuel_logs_branch_id_idx ON public.fuel_logs (branch_id);
CREATE INDEX IF NOT EXISTS fuel_logs_vehicle_id_idx ON public.fuel_logs (vehicle_id);
CREATE INDEX IF NOT EXISTS fuel_logs_trip_id_idx ON public.fuel_logs (trip_id);
CREATE INDEX IF NOT EXISTS fuel_logs_filled_at_idx ON public.fuel_logs (filled_at);
CREATE INDEX IF NOT EXISTS fuel_logs_deleted_at_idx ON public.fuel_logs (deleted_at);
