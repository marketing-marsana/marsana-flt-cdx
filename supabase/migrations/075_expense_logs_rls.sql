-- 075_expense_logs_rls.sql
ALTER TABLE public.expense_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expense_logs_select ON public.expense_logs;
CREATE POLICY expense_logs_select ON public.expense_logs
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('expenses', 'view')
      AND branch_id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS expense_logs_insert ON public.expense_logs;
CREATE POLICY expense_logs_insert ON public.expense_logs
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('expenses', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS expense_logs_update ON public.expense_logs;
CREATE POLICY expense_logs_update ON public.expense_logs
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('expenses', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('expenses', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS expense_logs_delete ON public.expense_logs;
CREATE POLICY expense_logs_delete ON public.expense_logs
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('expenses', 'delete')
  );
