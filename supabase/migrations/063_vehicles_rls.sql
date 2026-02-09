-- 063_vehicles_rls.sql
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vehicles_select ON public.vehicles;
CREATE POLICY vehicles_select ON public.vehicles
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('vehicles', 'view')
      AND branch_id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS vehicles_insert ON public.vehicles;
CREATE POLICY vehicles_insert ON public.vehicles
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('vehicles', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS vehicles_update ON public.vehicles;
CREATE POLICY vehicles_update ON public.vehicles
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('vehicles', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('vehicles', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS vehicles_delete ON public.vehicles;
CREATE POLICY vehicles_delete ON public.vehicles
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('vehicles', 'delete')
  );
