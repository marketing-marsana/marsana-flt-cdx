-- 001_bootstrap.sql
-- Seed core branches (idempotent)
insert into public.branches (name, code, type, status)
values
  ('Jeddah HQ', 'JED-HQ', 'HQ', 'ACTIVE'),
  ('Riyadh Corporate', 'RYD-CORP', 'B2B', 'ACTIVE'),
  ('Dammam Corporate', 'DAM-CORP', 'B2B', 'ACTIVE'),
  ('Al Sulaimaniyyah', 'RYD-SUL', 'B2C', 'ACTIVE'),
  ('Garnatha', 'RYD-GRN', 'B2C', 'ACTIVE')
on conflict (code) do nothing;

-- Bootstrap the FIRST Super Admin (run ONCE)
-- 1) Create an auth user in Supabase Auth (Dashboard or Admin API)
-- 2) Copy the new auth user UUID
-- 3) Run the function below, replacing the placeholders
--
-- select public.bootstrap_super_admin(
--   '00000000-0000-0000-0000-000000000000', -- p_user_id (auth.users.id)
--   'Full Name',
--   'admin@example.com',
--   'Super Admin',
--   null -- optional branch_id
-- );
