-- 065_trips_indexes.sql
CREATE INDEX IF NOT EXISTS trips_branch_id_idx ON public.trips (branch_id);
CREATE INDEX IF NOT EXISTS trips_driver_id_idx ON public.trips (driver_id);
CREATE INDEX IF NOT EXISTS trips_vehicle_id_idx ON public.trips (vehicle_id);
CREATE INDEX IF NOT EXISTS trips_status_idx ON public.trips (status);
CREATE INDEX IF NOT EXISTS trips_scheduled_start_idx ON public.trips (scheduled_start_at);
CREATE INDEX IF NOT EXISTS trips_scheduled_end_idx ON public.trips (scheduled_end_at);
CREATE INDEX IF NOT EXISTS trips_deleted_at_idx ON public.trips (deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS trips_branch_trip_code_unique
ON public.trips (branch_id, trip_code)
WHERE deleted_at IS NULL;
