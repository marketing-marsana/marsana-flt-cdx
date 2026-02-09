-- 040_functions.sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_branch_id()
returns uuid
language sql
stable
as $$
  select branch_id
  from public.user_profiles
  where user_id = auth.uid()
    and deleted_at is null;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select coalesce((
    select is_super_admin
    from public.user_profiles
    where user_id = auth.uid()
      and deleted_at is null
  ), false);
$$;

create or replace function public.has_permission(
  p_module permission_module,
  p_action text
)
returns boolean
language sql
stable
as $$
  select
    case p_action
      when 'view' then coalesce(can_view, false)
      when 'create' then coalesce(can_create, false)
      when 'edit' then coalesce(can_edit, false)
      when 'delete' then coalesce(can_delete, false)
      else false
    end
  from public.user_permissions
  where user_id = auth.uid()
    and module = p_module;
$$;

create or replace function public.prevent_super_admin_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.is_super_admin is true and auth.uid() is not null and public.is_super_admin() is false then
    raise exception 'Only a super admin can assign super admin privileges.';
  end if;
  return new;
end;
$$;

create or replace function public.bootstrap_super_admin(
  p_user_id uuid,
  p_full_name text,
  p_email text,
  p_designation text default null,
  p_branch_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_exists boolean;
begin
  select exists (
    select 1 from public.user_profiles where is_super_admin = true and deleted_at is null
  ) into v_exists;

  if v_exists then
    raise exception 'Super admin already exists. Bootstrap is locked.';
  end if;

  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Caller does not match target user.';
  end if;

  insert into public.user_profiles (
    user_id,
    branch_id,
    full_name,
    email,
    designation,
    is_super_admin,
    is_active
  ) values (
    p_user_id,
    p_branch_id,
    p_full_name,
    p_email,
    p_designation,
    true,
    true
  );

  insert into public.user_permissions (
    user_id,
    module,
    can_view,
    can_create,
    can_edit,
    can_delete
  )
  select
    p_user_id,
    m,
    true,
    true,
    true,
    true
  from unnest(enum_range(null::permission_module)) as m
  on conflict (user_id, module) do nothing;

  insert into public.app_config (key, value)
  values (
    'bootstrap_completed',
    jsonb_build_object(
      'super_admin_user_id', p_user_id,
      'completed_at', now()
    )
  )
  on conflict (key) do nothing;
end;
$$;

create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger user_permissions_set_updated_at
before update on public.user_permissions
for each row execute function public.set_updated_at();

create trigger app_config_set_updated_at
before update on public.app_config
for each row execute function public.set_updated_at();

create trigger user_profiles_prevent_super_admin_escalation
before insert or update on public.user_profiles
for each row execute function public.prevent_super_admin_escalation();

revoke all on function public.bootstrap_super_admin(uuid, text, text, text, uuid) from public;
grant execute on function public.bootstrap_super_admin(uuid, text, text, text, uuid) to authenticated, service_role;
