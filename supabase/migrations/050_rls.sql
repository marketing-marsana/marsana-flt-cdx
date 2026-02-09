-- 050_rls.sql
alter table public.branches enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_config enable row level security;

-- Branches policies
DROP POLICY IF EXISTS branches_select ON public.branches;
CREATE POLICY branches_select ON public.branches
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('branches', 'view')
      AND id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS branches_insert ON public.branches;
CREATE POLICY branches_insert ON public.branches
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR public.has_permission('branches', 'create')
  );

DROP POLICY IF EXISTS branches_update ON public.branches;
CREATE POLICY branches_update ON public.branches
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('branches', 'edit')
      AND id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('branches', 'edit')
      AND id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS branches_delete ON public.branches;
CREATE POLICY branches_delete ON public.branches
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('branches', 'delete')
  );

-- User profiles policies
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
    OR (
      public.has_permission('users', 'view')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
CREATE POLICY user_profiles_insert ON public.user_profiles
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR public.has_permission('users', 'create')
  );

DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
    OR (
      public.has_permission('users', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR user_id = auth.uid()
    OR (
      public.has_permission('users', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS user_profiles_delete ON public.user_profiles;
CREATE POLICY user_profiles_delete ON public.user_profiles
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('users', 'delete')
  );

-- User permissions policies
DROP POLICY IF EXISTS user_permissions_select ON public.user_permissions;
CREATE POLICY user_permissions_select ON public.user_permissions
  FOR SELECT
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS user_permissions_insert ON public.user_permissions;
CREATE POLICY user_permissions_insert ON public.user_permissions
  FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS user_permissions_update ON public.user_permissions;
CREATE POLICY user_permissions_update ON public.user_permissions
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS user_permissions_delete ON public.user_permissions;
CREATE POLICY user_permissions_delete ON public.user_permissions
  FOR DELETE
  USING (public.is_super_admin());

-- Audit logs policies
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('audit_logs', 'view')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('audit_logs', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS audit_logs_update ON public.audit_logs;
CREATE POLICY audit_logs_update ON public.audit_logs
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS audit_logs_delete ON public.audit_logs;
CREATE POLICY audit_logs_delete ON public.audit_logs
  FOR DELETE
  USING (public.is_super_admin());

-- App config policies
DROP POLICY IF EXISTS app_config_select ON public.app_config;
CREATE POLICY app_config_select ON public.app_config
  FOR SELECT
  USING (public.is_super_admin());

DROP POLICY IF EXISTS app_config_insert ON public.app_config;
CREATE POLICY app_config_insert ON public.app_config
  FOR INSERT
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS app_config_update ON public.app_config;
CREATE POLICY app_config_update ON public.app_config
  FOR UPDATE
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS app_config_delete ON public.app_config;
CREATE POLICY app_config_delete ON public.app_config
  FOR DELETE
  USING (public.is_super_admin());
