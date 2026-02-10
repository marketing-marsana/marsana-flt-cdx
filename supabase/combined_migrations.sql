-- 001_extensions.sql
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- 010_enums.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_type') THEN
    CREATE TYPE branch_type AS ENUM ('HQ', 'B2B', 'B2C');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'branch_status') THEN
    CREATE TYPE branch_status AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_module') THEN
    CREATE TYPE permission_module AS ENUM (
      'branches',
      'users',
      'vehicles',
      'handshakes',
      'inspections',
      'rentals',
      'maintenance',
      'corporates',
      'alerts',
      'dashboards',
      'driver_portal',
      'audit_logs',
      'reports',
      'settings'
    );
  END IF;
END$$;

-- 011_add_drivers_module.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'permission_module'
      AND e.enumlabel = 'drivers'
  ) THEN
    ALTER TYPE permission_module ADD VALUE 'drivers';
  END IF;
END$$;

-- 012_add_trips_module.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'permission_module'
      AND e.enumlabel = 'trips'
  ) THEN
    ALTER TYPE permission_module ADD VALUE 'trips';
  END IF;
END$$;

-- 013_add_fuel_module.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'permission_module'
      AND e.enumlabel = 'fuel'
  ) THEN
    ALTER TYPE permission_module ADD VALUE 'fuel';
  END IF;
END$$;

-- 014_add_expenses_module.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'permission_module'
      AND e.enumlabel = 'expenses'
  ) THEN
    ALTER TYPE permission_module ADD VALUE 'expenses';
  END IF;
END$$;

-- 020_tables.sql
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  type branch_type not null,
  address text,
  contact_number text,
  status branch_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint branches_name_unique unique (name),
  constraint branches_code_unique unique (code)
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  email text not null,
  designation text,
  is_super_admin boolean not null default false,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint user_profiles_email_unique unique (email)
);

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  module permission_module not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_permissions_user_module_unique unique (user_id, module)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- 057_user_profiles_phone.sql
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone text;

CREATE INDEX IF NOT EXISTS user_profiles_phone_idx ON public.user_profiles (phone);

-- 058_drivers_table.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
    CREATE TYPE driver_status AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  phone text NOT NULL,
  license_number text NOT NULL,
  license_expiry_date date,
  status driver_status NOT NULL DEFAULT 'ACTIVE',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER drivers_set_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 059_drivers_indexes.sql
CREATE INDEX IF NOT EXISTS drivers_branch_id_idx ON public.drivers (branch_id);
CREATE INDEX IF NOT EXISTS drivers_status_idx ON public.drivers (status);
CREATE INDEX IF NOT EXISTS drivers_deleted_at_idx ON public.drivers (deleted_at);
CREATE INDEX IF NOT EXISTS drivers_license_number_idx ON public.drivers (license_number);

CREATE UNIQUE INDEX IF NOT EXISTS drivers_branch_license_unique
ON public.drivers (branch_id, license_number)
WHERE deleted_at IS NULL;

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

-- 061_vehicles_table.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
    CREATE TYPE vehicle_status AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  registration_number text NOT NULL,
  make text,
  model text,
  year integer,
  color text,
  vin text,
  fuel_type text,
  odometer integer NOT NULL DEFAULT 0,
  status vehicle_status NOT NULL DEFAULT 'ACTIVE',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER vehicles_set_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 062_vehicles_indexes.sql
CREATE INDEX IF NOT EXISTS vehicles_branch_id_idx ON public.vehicles (branch_id);
CREATE INDEX IF NOT EXISTS vehicles_status_idx ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS vehicles_deleted_at_idx ON public.vehicles (deleted_at);
CREATE INDEX IF NOT EXISTS vehicles_registration_idx ON public.vehicles (registration_number);
CREATE INDEX IF NOT EXISTS vehicles_vin_idx ON public.vehicles (vin);

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_branch_registration_unique
ON public.vehicles (branch_id, registration_number)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS vehicles_vin_unique
ON public.vehicles (vin)
WHERE vin IS NOT NULL;

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

-- 064_trips_table.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE trip_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  trip_code text NOT NULL,
  customer_name text,
  customer_phone text,
  pickup_location text NOT NULL,
  dropoff_location text NOT NULL,
  scheduled_start_at timestamptz NOT NULL,
  scheduled_end_at timestamptz,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  distance_km numeric,
  fare_amount numeric,
  status trip_status NOT NULL DEFAULT 'SCHEDULED',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER trips_set_updated_at
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 065_trips_indexes.sql
CREATE INDEX IF NOT EXISTS trips_branch_id_idx ON public.trips (branch_id);
CREATE INDEX IF NOT EXISTS trips_driver_id_idx ON public.trips (driver_id);
CREATE INDEX IF NOT EXISTS trips_vehicle_id_idx ON public.trips (vehicle_id);
CREATE INDEX IF NOT EXISTS trips_status_idx ON public.trips (status);
CREATE INDEX IF NOT EXISTS trips_scheduled_start_idx ON public.trips (scheduled_start_at);
CREATE INDEX IF NOT EXISTS trips_scheduled_end_idx ON public.trips (scheduled_end_at);
CREATE INDEX IF NOT EXISTS trips_deleted_at_idx ON public.trips (deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS trips_branch_trip_code_unique
ON public.trips (branch_id, trip_code)
WHERE deleted_at IS NULL;

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

-- 067_fuel_logs_table.sql
CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  filled_at timestamptz NOT NULL,
  quantity_liters numeric NOT NULL CHECK (quantity_liters > 0),
  price_per_liter numeric NOT NULL CHECK (price_per_liter >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  odometer numeric NOT NULL CHECK (odometer >= 0),
  fuel_station text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (total_amount = quantity_liters * price_per_liter)
);

CREATE TRIGGER fuel_logs_set_updated_at
BEFORE UPDATE ON public.fuel_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 068_fuel_logs_indexes.sql
CREATE INDEX IF NOT EXISTS fuel_logs_branch_id_idx ON public.fuel_logs (branch_id);
CREATE INDEX IF NOT EXISTS fuel_logs_vehicle_id_idx ON public.fuel_logs (vehicle_id);
CREATE INDEX IF NOT EXISTS fuel_logs_trip_id_idx ON public.fuel_logs (trip_id);
CREATE INDEX IF NOT EXISTS fuel_logs_filled_at_idx ON public.fuel_logs (filled_at);
CREATE INDEX IF NOT EXISTS fuel_logs_deleted_at_idx ON public.fuel_logs (deleted_at);

-- 069_fuel_logs_rls.sql
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fuel_logs_select ON public.fuel_logs;
CREATE POLICY fuel_logs_select ON public.fuel_logs
  FOR SELECT
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'view')
      AND branch_id = public.current_user_branch_id()
      AND deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS fuel_logs_insert ON public.fuel_logs;
CREATE POLICY fuel_logs_insert ON public.fuel_logs
  FOR INSERT
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'create')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS fuel_logs_update ON public.fuel_logs;
CREATE POLICY fuel_logs_update ON public.fuel_logs
  FOR UPDATE
  USING (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR (
      public.has_permission('fuel', 'edit')
      AND branch_id = public.current_user_branch_id()
    )
  );

DROP POLICY IF EXISTS fuel_logs_delete ON public.fuel_logs;
CREATE POLICY fuel_logs_delete ON public.fuel_logs
  FOR DELETE
  USING (
    public.is_super_admin()
    OR public.has_permission('fuel', 'delete')
  );

-- 070_maintenance_logs_table.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_type') THEN
    CREATE TYPE maintenance_type AS ENUM ('service', 'repair', 'parts', 'inspection', 'other');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  service_date timestamptz NOT NULL,
  maintenance_type maintenance_type NOT NULL,
  description text NOT NULL,
  vendor_or_workshop text,
  cost_amount numeric NOT NULL CHECK (cost_amount >= 0),
  odometer numeric NOT NULL CHECK (odometer >= 0),
  next_service_odometer numeric,
  next_service_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER maintenance_logs_set_updated_at
BEFORE UPDATE ON public.maintenance_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 071_maintenance_logs_indexes.sql
CREATE INDEX IF NOT EXISTS maintenance_logs_branch_id_idx ON public.maintenance_logs (branch_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_vehicle_id_idx ON public.maintenance_logs (vehicle_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_trip_id_idx ON public.maintenance_logs (trip_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_service_date_idx ON public.maintenance_logs (service_date);
CREATE INDEX IF NOT EXISTS maintenance_logs_deleted_at_idx ON public.maintenance_logs (deleted_at);

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

-- 073_expense_logs_table.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_category') THEN
    CREATE TYPE expense_category AS ENUM ('toll', 'parking', 'petty_cash', 'misc', 'other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_payment_method') THEN
    CREATE TYPE expense_payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.expense_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  related_vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  related_trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  expense_date timestamptz NOT NULL,
  category expense_category NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method expense_payment_method NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TRIGGER expense_logs_set_updated_at
BEFORE UPDATE ON public.expense_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 074_expense_logs_indexes.sql
CREATE INDEX IF NOT EXISTS expense_logs_branch_id_idx ON public.expense_logs (branch_id);
CREATE INDEX IF NOT EXISTS expense_logs_related_vehicle_id_idx ON public.expense_logs (related_vehicle_id);
CREATE INDEX IF NOT EXISTS expense_logs_related_trip_id_idx ON public.expense_logs (related_trip_id);
CREATE INDEX IF NOT EXISTS expense_logs_expense_date_idx ON public.expense_logs (expense_date);
CREATE INDEX IF NOT EXISTS expense_logs_deleted_at_idx ON public.expense_logs (deleted_at);

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

