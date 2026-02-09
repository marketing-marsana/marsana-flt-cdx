-- 069_fuel_logs_rls.sql
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fuel_logs_select ON public.fuel_logs;
CREATE POLICY fuel_logs_select ON public.fuel_logs
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'view')
      AND branch_id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS fuel_logs_insert ON public.fuel_logs;
CREATE POLICY fuel_logs_insert ON public.fuel_logs
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS fuel_logs_update ON public.fuel_logs;
CREATE POLICY fuel_logs_update ON public.fuel_logs
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS fuel_logs_delete ON public.fuel_logs;
CREATE POLICY fuel_logs_delete ON public.fuel_logs
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('fuel', 'delete')
  );
