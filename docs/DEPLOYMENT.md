# Deployment Guide

## Prerequisites
- Node.js 20.x
- Supabase project ready
- Vercel account (for frontend)

## Environment Variables
Local development uses `apps/web/.env.local` (copy from `apps/web/.env.example`).

Production values should be set in the hosting provider:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `SENTRY_DSN` (optional)
- `RESEND_API_KEY` (optional)
- `CRON_SECRET` (optional)

## Supabase Production Setup
1. Create a Supabase project.
2. Apply migrations in order:
   - `supabase/migrations/001_extensions.sql`
   - `supabase/migrations/010_enums.sql`
   - `supabase/migrations/011_add_drivers_module.sql`
   - `supabase/migrations/012_add_trips_module.sql`
   - `supabase/migrations/013_add_fuel_module.sql`
   - `supabase/migrations/014_add_expenses_module.sql`
   - `supabase/migrations/020_tables.sql`
   - `supabase/migrations/030_indexes.sql`
   - `supabase/migrations/040_functions.sql`
   - `supabase/migrations/050_rls.sql`
   - `supabase/migrations/055_branches_rls_strict.sql`
   - `supabase/migrations/056_users_rls_strict.sql`
   - `supabase/migrations/057_user_profiles_phone.sql`
   - `supabase/migrations/058_drivers_table.sql`
   - `supabase/migrations/059_drivers_indexes.sql`
   - `supabase/migrations/060_drivers_rls.sql`
   - `supabase/migrations/061_vehicles_table.sql`
   - `supabase/migrations/062_vehicles_indexes.sql`
   - `supabase/migrations/063_vehicles_rls.sql`
   - `supabase/migrations/064_trips_table.sql`
   - `supabase/migrations/065_trips_indexes.sql`
   - `supabase/migrations/066_trips_rls.sql`
   - `supabase/migrations/067_fuel_logs_table.sql`
   - `supabase/migrations/068_fuel_logs_indexes.sql`
   - `supabase/migrations/069_fuel_logs_rls.sql`
   - `supabase/migrations/070_maintenance_logs_table.sql`
   - `supabase/migrations/071_maintenance_logs_indexes.sql`
   - `supabase/migrations/072_maintenance_logs_rls.sql`
   - `supabase/migrations/073_expense_logs_table.sql`
   - `supabase/migrations/074_expense_logs_indexes.sql`
   - `supabase/migrations/075_expense_logs_rls.sql`
3. Run seed:
   - `supabase/seed/001_bootstrap.sql`
4. Verify RLS:
   - Ensure all tables show `rowsecurity = true` in `pg_class`.

## Vercel Setup
1. Import repo in Vercel.
2. Set root directory: `apps/web`.
3. Build command: `npm run build`.
4. Output directory: `.next`.
5. Add environment variables (production values).

## Build Verification
Run locally:
```
cd apps/web
npm run build
npm run start
```

## Security Hardening Checklist
- RLS enabled on all tables (verified in migrations).
- No service role key exposed in client code.
- Security headers enabled in `next.config.mjs`.
- Rate limiting recommended at edge (Vercel or proxy).
- Auth cookies protected (Supabase session).

## Backups & Monitoring
- Enable daily Supabase backups.
- Configure Sentry (optional).
- Add uptime monitoring (e.g., UptimeRobot).
- Review audit logs weekly for anomalies.

