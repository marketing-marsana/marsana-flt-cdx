-- 056_users_rls_strict.sql
-- Enforce Super Admin only for user profile mutations.
DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
CREATE POLICY user_profiles_insert ON public.user_profiles
  FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS user_profiles_delete ON public.user_profiles;
CREATE POLICY user_profiles_delete ON public.user_profiles
  FOR DELETE
  USING (public.is_super_admin());

-- Keep SELECT for self + super admin
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
  );
