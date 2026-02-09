-- 066_trips_rls.sql
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trips_select ON public.trips;
CREATE POLICY trips_select ON public.trips
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('trips', 'view')
      AND branch_id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS trips_insert ON public.trips;
CREATE POLICY trips_insert ON public.trips
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('trips', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS trips_update ON public.trips;
CREATE POLICY trips_update ON public.trips
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('trips', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('trips', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS trips_delete ON public.trips;
CREATE POLICY trips_delete ON public.trips
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('trips', 'delete')
  );
