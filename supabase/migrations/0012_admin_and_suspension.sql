-- 0012_admin_and_suspension.sql

-- 1. Add suspension fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS suspension_reason text;

-- 2. Enforce admin privileges for hrixofficial@gmail.com
UPDATE public.profiles
SET is_admin = true,
    role = 'admin'
WHERE email = 'hrixofficial@gmail.com';

-- 3. Ensure the admin flag stays forever for hrixofficial@gmail.com (by updating the sync trigger or doing it explicitly)
-- The sync trigger already keeps `is_admin` and `role = 'admin'` in sync, so step 2 is sufficient for persistence,
-- but just to be absolutely bulletproof, we can create a trigger that prevents demoting the super admin.

CREATE OR REPLACE FUNCTION public.protect_super_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.email = 'hrixofficial@gmail.com' AND (NEW.is_admin = false OR NEW.role != 'admin') THEN
    NEW.is_admin := true;
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_super_admin ON public.profiles;
CREATE TRIGGER enforce_super_admin
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin();
