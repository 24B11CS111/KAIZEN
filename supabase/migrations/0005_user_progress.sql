-- =============================================================
-- KAIZEN.SYS - 0005: user_progress table + daily-reset rules
--
-- Adds a clean per-spec user_progress table while keeping the
-- legacy progress_logs in sync. Updates complete_day() to:
--   - reject duplicate days
--   - reject more than one completion per calendar day
--   - update streak atomically
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- TABLE ----------
create table if not exists public.user_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  day          int  not null check (day between 1 and 30),
  completed    boolean not null default true,
  completed_at timestamptz not null default now(),
  -- prevent the same day being completed twice
  unique (user_id, day)
);

-- one completion per calendar day (daily reset)
create unique index if not exists user_progress_one_per_day_idx
  on public.user_progress (user_id, ((completed_at AT TIME ZONE 'UTC')::date));

create index if not exists user_progress_user_idx
  on public.user_progress (user_id);

-- ---------- RLS ----------
alter table public.user_progress enable row level security;

drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own"
  on public.user_progress for select
  using (auth.uid() = user_id);

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

-- admins read all
drop policy if exists "user_progress_admin_read" on public.user_progress;
create policy "user_progress_admin_read"
  on public.user_progress for select
  using (public.is_admin());

-- ---------- BACKFILL FROM progress_logs ----------
insert into public.user_progress (user_id, day, completed, completed_at)
select user_id, day_number, true, coalesce(completed_at, now())
from public.progress_logs
where completed = true
on conflict (user_id, day) do nothing;

-- ---------- RPC: complete_day ----------
-- Atomic: enforces subscription, valid range, no dup-day,
-- daily reset, mirrors to legacy progress_logs, updates streak.
create or replace function public.complete_day(p_day int)
returns table(current_streak int, longest_streak int)
language plpgsql security definer set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_today    date := (now() AT TIME ZONE 'UTC')::date;
  v_status   subscription_status_t;
  v_last     date;
  v_current  int;
  v_longest  int;
begin
  if v_user is null then
    raise exception 'unauthorized';
  end if;

  if p_day < 1 or p_day > 30 then
    raise exception 'invalid day';
  end if;

  select subscription_status into v_status
    from public.profiles where id = v_user for update;
  if v_status is null or v_status <> 'active' then
    raise exception 'subscription not active';
  end if;

  -- DAILY RESET: only one completion per calendar day
  if exists (
    select 1 from public.user_progress
     where user_id = v_user
       and (completed_at AT TIME ZONE 'UTC')::date = v_today
  ) then
    raise exception 'daily limit reached';
  end if;

  -- DUPLICATE GUARD: same day cannot be completed twice
  if exists (
    select 1 from public.user_progress
     where user_id = v_user and day = p_day
  ) then
    raise exception 'already completed';
  end if;

  -- Insert into the new table
  insert into public.user_progress (user_id, day, completed, completed_at)
  values (v_user, p_day, true, now());

  -- Mirror to legacy progress_logs (back-compat for old reads)
  insert into public.progress_logs (user_id, day_number, completed, completed_at)
  values (v_user, p_day, true, now())
  on conflict (user_id, day_number) do update
    set completed = true,
        completed_at = excluded.completed_at;

  -- Update streak
  select s.current_streak, s.longest_streak, s.last_completed_date
    into v_current, v_longest, v_last
  from public.streaks s where s.user_id = v_user;

  if v_last is null or v_last < v_today - 1 then
    v_current := 1;
  elsif v_last = v_today - 1 then
    v_current := coalesce(v_current, 0) + 1;
  end if;
  -- if v_last = v_today we wouldn't reach here (daily limit blocks it)
  v_longest := greatest(coalesce(v_longest, 0), v_current);

  insert into public.streaks (user_id, current_streak, longest_streak, last_completed_date)
  values (v_user, v_current, v_longest, v_today)
  on conflict (user_id) do update set
    current_streak      = excluded.current_streak,
    longest_streak      = excluded.longest_streak,
    last_completed_date = excluded.last_completed_date;

  return query select v_current, v_longest;
end;
$$;

revoke all on function public.complete_day(int) from public;
grant execute on function public.complete_day(int) to authenticated;
