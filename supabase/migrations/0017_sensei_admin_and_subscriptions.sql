-- Migration 0017: Sensei Admin Dashboard & Subscription Tiers

-- 1. Create the new subscription tier enum
DO $$ BEGIN
  CREATE TYPE subscription_tier_t AS ENUM ('trial', 'ronin', 'shogun', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Add tier column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier_t NOT NULL DEFAULT 'trial';

-- 3. Data Migration: active -> shogun, else -> expired (if not trial)
UPDATE public.profiles
SET subscription_tier = 'shogun'
WHERE subscription_status = 'active';

UPDATE public.profiles
SET subscription_tier = 'expired'
WHERE subscription_status IN ('expired', 'rejected', 'banned');

-- 4. Create payment_submissions table
DO $$ BEGIN
  CREATE TYPE payment_status_t AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('ronin', 'shogun')),
  amount INTEGER NOT NULL,
  transaction_id TEXT NOT NULL,
  payment_screenshot TEXT NOT NULL, -- points to storage path
  status payment_status_t NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure index for fast querying
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON public.payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_user_id ON public.payment_submissions(user_id);

-- Enable RLS
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY payment_submissions_select_own ON public.payment_submissions
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY payment_submissions_insert_own ON public.payment_submissions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 5. Set up receipts Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('receipts', 'receipts', false, 5242880, '{image/png,image/jpeg,image/webp,image/jpg}')
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  allowed_mime_types = '{image/png,image/jpeg,image/webp,image/jpg}';

-- Set up RLS for storage.objects (receipts bucket)
DO $$ BEGIN
    CREATE POLICY "Users can upload receipts" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can view their own receipts" ON storage.objects
        FOR SELECT USING (bucket_id = 'receipts' AND auth.uid() = owner);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Admin policies are handled globally or via application logic with service role key,
-- but we can explicitly add a policy if the user is an admin.
DO $$ BEGIN
    CREATE POLICY "Admins can view all receipts" ON storage.objects
        FOR SELECT USING (bucket_id = 'receipts' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6. Enable Realtime Replication
DO $$ BEGIN
  -- Supabase realtime requires adding tables to the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'payment_submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_submissions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'daily_reports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_reports;
  END IF;
END $$;
