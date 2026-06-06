-- 1. Extend profiles with new AI onboarding fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS workout_preference TEXT,
ADD COLUMN IF NOT EXISTS sleep_timing TEXT,
ADD COLUMN IF NOT EXISTS productivity_habits TEXT,
ADD COLUMN IF NOT EXISTS discipline_level TEXT,
ADD COLUMN IF NOT EXISTS study_timing TEXT;

-- 2. Extend profiles with subscription and trial fields
-- We'll use a text column instead of an enum to avoid complex migrations for simple changes
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- 3. Extend ai_plans table for LLM integration
-- The existing ai_plans table might already have what we need, but let's add LLM-specific raw metadata
ALTER TABLE public.ai_plans
ADD COLUMN IF NOT EXISTS prompt_used TEXT,
ADD COLUMN IF NOT EXISTS llm_response_raw JSONB,
ADD COLUMN IF NOT EXISTS generation_model TEXT;

-- 4. Create In-App Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'reminder', 'alert', 'streak', 'upgrade'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
    ) THEN
        CREATE POLICY "Users can view their own notifications"
            ON public.notifications FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications'
    ) THEN
        CREATE POLICY "Users can update their own notifications"
            ON public.notifications FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;
END $$;
