-- Migration 0016: Gemini AI Engine Schema Updates

-- Update Profiles table with the 13 required AI fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wake_time TEXT,
ADD COLUMN IF NOT EXISTS sleep_time TEXT,
ADD COLUMN IF NOT EXISTS available_hours INTEGER,
ADD COLUMN IF NOT EXISTS discipline_level TEXT,
ADD COLUMN IF NOT EXISTS workout_preference TEXT,
ADD COLUMN IF NOT EXISTS energy_level TEXT,
ADD COLUMN IF NOT EXISTS study_timing TEXT,
ADD COLUMN IF NOT EXISTS work_type TEXT,
ADD COLUMN IF NOT EXISTS distractions TEXT,
ADD COLUMN IF NOT EXISTS skills_to_learn TEXT;

-- Create daily_reports table
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  energy TEXT NOT NULL,
  completion_percentage INTEGER NOT NULL CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS daily_reports_user_idx ON public.daily_reports (user_id, created_at DESC);

-- Ensure ai_plans has required columns
ALTER TABLE public.ai_plans
ADD COLUMN IF NOT EXISTS generated_plan JSONB,
ADD COLUMN IF NOT EXISTS prompt_used TEXT,
ADD COLUMN IF NOT EXISTS llm_response_raw JSONB,
ADD COLUMN IF NOT EXISTS generation_model TEXT;

-- Enable RLS on daily_reports
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Policies for daily_reports
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'daily_reports' AND policyname = 'daily_reports_select_own'
    ) THEN
        CREATE POLICY daily_reports_select_own ON public.daily_reports FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'daily_reports' AND policyname = 'daily_reports_insert_own'
    ) THEN
        CREATE POLICY daily_reports_insert_own ON public.daily_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
