-- =============================================================
-- KAIZEN.SYS - 0007: real-time tracking infrastructure
--
-- Adds:
--   - xp_log         : every XP transaction with reason + timestamp
--   - activity_log   : structured event stream for analytics
--   - get_you_vs_you : RPC returning this-week vs last-week deltas
--   - log_progress() : trigger on user_progress -> writes xp_log + activity_log
--
-- Realtime: enable replication for user_progress, streaks, xp_log.
-- All tables have RLS; users only see their own rows.
-- =============================================================

-- ---------- xp_log ----------
create table if not exists public.xp_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  amount      int  not null,
  reason      text not null,
  day_number  int,
  created_at  timestamptz not null default now()
);

create index if not exists xp_log_user_created_idx
  on public.xp_log (user_id, created_at desc);

alter table public.xp_log enable row level security;

drop policy if exists "xp_log_select_own" on public.xp_log;
create policy "xp_log_select_own"
  on public.xp_log for select
  using (auth.uid() = user_id);

drop policy if exists "xp_log_admin_read" on public.xp_log;
create policy "xp_log_admin_read"
  on public.xp_log for select
  using (public.is_admin());

-- ---------- activity_log ----------
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_user_created_idx
  on public.activity_log (user_id, created_at desc);

create index if not exists activity_log_user_type_idx
  on public.activity_log (user_id, type);

alter table public.activity_log enable row level security;

drop policy if exists "activity_log_select_own" on public.activity_log;
create policy "activity_log_select_own"
  on public.activity_log for select
  using (auth.uid() = user_id);

drop policy if exists "activity_log_admin_read" on public.activity_log;
create policy "activity_log_admin_read"
  on public.activity_log for select
  using (public.is_admin());

-- ---------- TRIGGER: when a day is sealed, log XP + activity ----------
create or replace function public.log_progress()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_xp int := 100;
begin
  -- Insert XP credit
  insert into public.xp_log (user_id, amount, reason, day_number)
  values (new.user_id, v_xp, 'day_completed', new.day);

  -- Insert activity event
  insert into public.activity_log (user_id, type, metadata)
  values (new.user_id, 'day_sealed', jsonb_build_object(
    'day', new.day,
    'completed_at', new.completed_at,
    'xp', v_xp
  ));

  return new;
end;
$$;

drop trigger if exists user_progress_log on public.user_progress;
create trigger user_progress_log
  after insert on public.user_progress
  for each row execute function public.log_progress();

-- Backfill XP for existing user_progress rows that pre-date this trigger
insert into public.xp_log (user_id, amount, reason, day_number, created_at)
select user_id, 100, 'day_completed', day, completed_at
from public.user_progress
where completed = true
  and not exists (
    select 1 from public.xp_log x
     where x.user_id = user_progress.user_id
       and x.day_number = user_progress.day
       and x.reason = 'day_completed'
  );

-- ---------- RPC: get_you_vs_you ----------
-- Returns weekly comparison of THIS user vs THEMSELVES (this week vs last).
create or replace function public.get_you_vs_you()
returns table(
  this_week_days       int,
  last_week_days       int,
  this_week_xp         int,
  last_week_xp         int,
  current_streak       int,
  longest_streak       int,
  consistency_pct      int,
  improvement_pct      int
)
language plpgsql security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now  date := (now() at time zone 'UTC')::date;
  v_this_start date := v_now - extract(dow from v_now)::int;
  v_last_start date := v_this_start - 7;
  v_this_days int;
  v_last_days int;
  v_this_xp   int;
  v_last_xp   int;
  v_cur       int;
  v_long      int;
begin
  if v_user is null then
    return;
  end if;

  select count(*)::int into v_this_days
  from public.user_progress
  where user_id = v_user
    and completed = true
    and (completed_at at time zone 'UTC')::date >= v_this_start
    and (completed_at at time zone 'UTC')::date <  v_this_start + 7;

  select count(*)::int into v_last_days
  from public.user_progress
  where user_id = v_user
    and completed = true
    and (completed_at at time zone 'UTC')::date >= v_last_start
    and (completed_at at time zone 'UTC')::date <  v_this_start;

  select coalesce(sum(amount), 0)::int into v_this_xp
  from public.xp_log
  where user_id = v_user
    and (created_at at time zone 'UTC')::date >= v_this_start
    and (created_at at time zone 'UTC')::date <  v_this_start + 7;

  select coalesce(sum(amount), 0)::int into v_last_xp
  from public.xp_log
  where user_id = v_user
    and (created_at at time zone 'UTC')::date >= v_last_start
    and (created_at at time zone 'UTC')::date <  v_this_start;

  select coalesce(s.current_streak, 0), coalesce(s.longest_streak, 0)
    into v_cur, v_long
  from public.streaks s where s.user_id = v_user;

  return query select
    v_this_days,
    v_last_days,
    v_this_xp,
    v_last_xp,
    coalesce(v_cur, 0),
    coalesce(v_long, 0),
    (case when extract(dow from v_now)::int + 1 > 0
          then (v_this_days * 100 / greatest(1, extract(dow from v_now)::int + 1))::int
          else 0 end),
    (case when v_last_xp > 0
          then ((v_this_xp - v_last_xp) * 100 / v_last_xp)::int
          else 0 end);
end;
$$;

revoke all on function public.get_you_vs_you() from public;
grant execute on function public.get_you_vs_you() to authenticated;

-- ---------- REALTIME publication ----------
-- Enable WAL replication on the tables that drive the live dashboard.
-- (Safe to re-run; ALTER PUBLICATION ADD TABLE errors if already added,
-- so we wrap in DO/EXCEPTION blocks.)
do $$ begin
  alter publication supabase_realtime add table public.user_progress;
exception when duplicate_object or others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.streaks;
exception when duplicate_object or others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.xp_log;
exception when duplicate_object or others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object or others then null; end $$;
