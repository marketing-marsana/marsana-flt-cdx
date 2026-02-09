-- 057_user_profiles_phone.sql
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS phone text;

CREATE INDEX IF NOT EXISTS user_profiles_phone_idx ON public.user_profiles (phone);
