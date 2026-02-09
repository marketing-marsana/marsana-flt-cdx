-- 072_maintenance_logs_rls.sql
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS maintenance_logs_select ON public.maintenance_logs;
CREATE POLICY maintenance_logs_select ON public.maintenance_logs
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('maintenance', 'view')
      AND branch_id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS maintenance_logs_insert ON public.maintenance_logs;
CREATE POLICY maintenance_logs_insert ON public.maintenance_logs
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('maintenance', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS maintenance_logs_update ON public.maintenance_logs;
CREATE POLICY maintenance_logs_update ON public.maintenance_logs
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('maintenance', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('maintenance', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS maintenance_logs_delete ON public.maintenance_logs;
CREATE POLICY maintenance_logs_delete ON public.maintenance_logs
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('maintenance', 'delete')
  );
