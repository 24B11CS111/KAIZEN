-- Migration: 0020_daily_tasks_execution
-- Purpose: Support daily execution cockpit, combining AI missions and manual add-ons.

create table public.daily_tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    notes text,
    priority text default 'Medium' check (priority in ('Low', 'Medium', 'High')),
    duration int default 30,
    completed boolean default false,
    type text not null check (type in ('ai', 'manual')),
    day_number int not null,
    created_at timestamptz default now(),
    completed_at timestamptz
);

alter table public.daily_tasks enable row level security;

create policy "Users can view own daily_tasks"
    on public.daily_tasks for select
    using (auth.uid() = user_id);

create policy "Users can insert own daily_tasks"
    on public.daily_tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update own daily_tasks"
    on public.daily_tasks for update
    using (auth.uid() = user_id);

create policy "Users can delete own manual daily_tasks"
    on public.daily_tasks for delete
    using (auth.uid() = user_id and type = 'manual');

-- Add index for fast querying by day
create index idx_daily_tasks_user_day on public.daily_tasks(user_id, day_number);
