-- 030_indexes.sql
create index if not exists branches_status_idx on public.branches (status);
create index if not exists branches_deleted_at_idx on public.branches (deleted_at);

create index if not exists user_profiles_user_id_idx on public.user_profiles (user_id);
create index if not exists user_profiles_branch_id_idx on public.user_profiles (branch_id);
create index if not exists user_profiles_deleted_at_idx on public.user_profiles (deleted_at);
create index if not exists user_profiles_is_super_admin_idx on public.user_profiles (is_super_admin);

create index if not exists user_permissions_user_id_idx on public.user_permissions (user_id);
create index if not exists user_permissions_module_idx on public.user_permissions (module);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_branch_id_idx on public.audit_logs (branch_id);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_entity_type_idx on public.audit_logs (entity_type);
