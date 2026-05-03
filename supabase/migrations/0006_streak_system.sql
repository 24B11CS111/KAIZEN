-- =============================================================
-- KAIZEN.SYS - 0006: streak break detection + reset RPC
--
-- The streak rule: any gap of more than one calendar day between
-- consecutive completions resets current_streak to 0. longest_streak
-- is preserved as a record. complete_day() already enforces the
-- forward path (incrementing on consecutive days). This migration
-- adds a server-side detector users hit on page load so the UI
-- can show "streak broken" the moment they return after a miss.
-- =============================================================

create or replace function public.reset_stale_streak()
returns table(was_reset boolean, current_streak int, longest_streak int)
language plpgsql security definer set search_path = public
as $$
declare
  v_user     uuid := auth.uid();
  v_today    date := (now() at time zone 'UTC')::date;
  v_last     date;
  v_current  int;
  v_longest  int;
  v_reset    boolean := false;
begin
  if v_user is null then
    return query select false, 0, 0;
    return;
  end if;

  select s.last_completed_date, s.current_streak, s.longest_streak
    into v_last, v_current, v_longest
  from public.streaks s where s.user_id = v_user;

  -- No row yet -> nothing to reset
  if not found then
    return query select false, 0, 0;
    return;
  end if;

  -- A gap of 2+ days means the streak is broken.
  if v_last is not null
     and coalesce(v_current, 0) > 0
     and v_last < (v_today - 1) then
    update public.streaks
       set current_streak = 0,
           updated_at     = now()
     where user_id = v_user;
    v_reset   := true;
    v_current := 0;
  end if;

  return query select v_reset, coalesce(v_current, 0), coalesce(v_longest, 0);
end;
$$;

revoke all on function public.reset_stale_streak() from public;
grant execute on function public.reset_stale_streak() to authenticated;
