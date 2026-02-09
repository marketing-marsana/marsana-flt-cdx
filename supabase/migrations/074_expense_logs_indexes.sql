-- 074_expense_logs_indexes.sql
CREATE INDEX IF NOT EXISTS expense_logs_branch_id_idx ON public.expense_logs (branch_id);
CREATE INDEX IF NOT EXISTS expense_logs_related_vehicle_id_idx ON public.expense_logs (related_vehicle_id);
CREATE INDEX IF NOT EXISTS expense_logs_related_trip_id_idx ON public.expense_logs (related_trip_id);
CREATE INDEX IF NOT EXISTS expense_logs_expense_date_idx ON public.expense_logs (expense_date);
CREATE INDEX IF NOT EXISTS expense_logs_deleted_at_idx ON public.expense_logs (deleted_at);
