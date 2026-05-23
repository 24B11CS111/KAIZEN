-- =============================================================
-- KAIZEN.SYS - AI-generated user plans
--
-- One personalized 30-day plan per user, stored as JSONB.
-- Multiple versions retained so regenerations can be compared.
-- The dashboard reads the most recent row per user.
--
-- Idempotent: safe to re-run.
-- =============================================================

create table if not exists public.user_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  track_id    text not null,
  track_label text not null,
  plan        jsonb not null,             -- array of PlanDay
  source      jsonb not null default '{}'::jsonb, -- PlanInput snapshot
  version     int  not null default 1,
  created_at  timestamptz not null default now()
);

create index if not exists user_plans_user_latest_idx
  on public.user_plans (user_id, created_at desc);

-- RLS — each user reads their own plans. Admins read all.
alter table public.user_plans enable row level security;

drop policy if exists user_plans_select_own on public.user_plans;
drop policy if exists user_plans_insert_own on public.user_plans;
drop policy if exists user_plans_admin_read on public.user_plans;

create policy user_plans_select_own on public.user_plans
  for select using (auth.uid() = user_id);

create policy user_plans_insert_own on public.user_plans
  for insert with check (auth.uid() = user_id);

create policy user_plans_admin_read on public.user_plans
  for select using (public.is_admin());

-- =============================================================
-- Verify with:
--   select count(*) from public.user_plans;
--   select user_id, track_id, version, created_at
--     from public.user_plans order by created_at desc limit 5;
-- =============================================================
