-- 060_drivers_rls.sql
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drivers_select ON public.drivers;
CREATE POLICY drivers_select ON public.drivers
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('drivers', 'view')
      AND branch_id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS drivers_insert ON public.drivers;
CREATE POLICY drivers_insert ON public.drivers
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('drivers', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS drivers_update ON public.drivers;
CREATE POLICY drivers_update ON public.drivers
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('drivers', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('drivers', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS drivers_delete ON public.drivers;
CREATE POLICY drivers_delete ON public.drivers
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('drivers', 'delete')
  );
