-- 055_branches_rls_strict.sql
-- Enforce Super Admin only for branch mutation operations.
DROP POLICY IF EXISTS branches_insert ON public.branches;
CREATE POLICY branches_insert ON public.branches
  FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS branches_update ON public.branches;
CREATE POLICY branches_update ON public.branches
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS branches_delete ON public.branches;
CREATE POLICY branches_delete ON public.branches
  FOR DELETE
  USING (public.is_super_admin());
