-- KAIZEN.SYS migration 0002 - path_type + branch on profiles

do $$ begin
  create type path_type_t as enum ('intermediate', 'btech');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists path_type path_type_t,
  add column if not exists branch text;

create or replace function public.validate_path_branch()
returns trigger as $$
begin
  if new.path_type = 'intermediate' then
    if new.branch is not null and new.branch not in ('MPC','BiPC') then
      raise exception 'invalid intermediate branch: %', new.branch;
    end if;
  elsif new.path_type = 'btech' then
    if new.branch is not null and new.branch not in
       ('CSE','AIML','DS','ECE','EEE','MECH','CIVIL') then
      raise exception 'invalid btech branch: %', new.branch;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_validate_branch on public.profiles;
create trigger profiles_validate_branch
  before insert or update of path_type, branch on public.profiles
  for each row execute function public.validate_path_branch();

create index if not exists profiles_path_idx on public.profiles (path_type);
create index if not exists profiles_branch_idx on public.profiles (branch);
