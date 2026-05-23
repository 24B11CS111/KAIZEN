-- =============================================================
-- KAIZEN.SYS — Workout preferences on profiles
-- Two optional columns: where the user trains and their fitness level.
-- Both default to NULL; the picker falls back to home + beginner.
-- Idempotent.
-- =============================================================

do $$ begin
  create type workout_location_t as enum ('home','gym');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fitness_level_t as enum ('beginner','intermediate','advanced');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists workout_location workout_location_t;

alter table public.profiles
  add column if not exists fitness_level fitness_level_t;

-- =============================================================
-- Verify:
--   select column_name from information_schema.columns
--     where table_name='profiles' and column_name in ('workout_location','fitness_level');
-- =============================================================
