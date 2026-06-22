-- Migration 0019: Set Defaults to harden signup flow

ALTER TABLE public.profiles 
ALTER COLUMN subscription_tier SET DEFAULT 'trial';

ALTER TABLE public.profiles 
ALTER COLUMN trial_expires_at SET DEFAULT (now() + interval '3 days');
