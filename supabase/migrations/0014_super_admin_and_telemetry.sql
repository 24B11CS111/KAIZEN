-- Migration: 0014_super_admin_and_telemetry.sql
-- Goal: Ensure super admin persistence for hrixofficial@gmail.com and setup is_suspended field

-- Add is_suspended if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='profiles' AND column_name='is_suspended') THEN
        ALTER TABLE public.profiles ADD COLUMN is_suspended boolean DEFAULT false NOT NULL;
    END IF;
END $$;

-- Update existing profile for hrixofficial@gmail.com to be admin if it exists
UPDATE public.profiles 
SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'hrixofficial@gmail.com'
);

-- Create a trigger function to automatically grant admin rights to this email on insert/update
CREATE OR REPLACE FUNCTION public.ensure_super_admin()
RETURNS trigger AS $$
BEGIN
  -- If the profile belongs to the super admin email, enforce is_admin = true
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id AND email = 'hrixofficial@gmail.com') THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to recreate
DROP TRIGGER IF EXISTS ensure_super_admin_trigger ON public.profiles;

CREATE TRIGGER ensure_super_admin_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_super_admin();
