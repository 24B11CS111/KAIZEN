-- =============================================================
-- KAIZEN.SYS - Content + progression system
-- Run AFTER 0000_combined.sql.
--
-- Adds:
--   - branches              (CSE, AIML, DS, ECE, EEE, MECH, CIVIL)
--   - roadmaps              (per branch, e.g. "B.Tech 4-year roadmap")
--   - semesters             (1..8 within a roadmap)
--   - modules               (ordered groups within a semester)
--   - lessons               (content items inside a module)
--   - missions              (daily-task templates per branch)
--   - certifications        (branch-tagged cert paths)
--   - projects              (mission-style build deliverables)
--   - skills                (per-branch skill nodes for the skill tree)
--   - user_mission_completions
--   - user_certification_progress
--   - user_project_progress
--   - user_skill_progress
--
-- Public-readable content; user-scoped progress under RLS.
-- =============================================================

-- ===== ENUMS =====
do $$ begin
  create type difficulty_t as enum ('beginner','intermediate','advanced','expert');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mission_kind_t as enum (
    'coding','certification','revision','communication',
    'project','ai_learning','aptitude','reading','build','reflection'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type cert_provider_t as enum (
    'microsoft','google','aws','oracle','cisco','meta','ibm','nvidia','other'
  );
exception when duplicate_object then null; end $$;

-- ===== CONTENT TABLES (publicly readable) =====

create table if not exists public.branches (
  code         text primary key,
  name         text not null,
  description  text,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.roadmaps (
  id          uuid primary key default gen_random_uuid(),
  branch_code text not null references public.branches(code) on delete cascade,
  slug        text not null,
  title       text not null,
  description text,
  duration_months int default 48,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (branch_code, slug)
);

create table if not exists public.semesters (
  id          uuid primary key default gen_random_uuid(),
  roadmap_id  uuid not null references public.roadmaps(id) on delete cascade,
  number      int not null check (number between 1 and 8),
  title       text not null,
  theme       text,
  unique (roadmap_id, number)
);

create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete cascade,
  slug        text not null,
  title       text not null,
  description text,
  sort_order  int not null default 0,
  difficulty  difficulty_t not null default 'beginner',
  unique (semester_id, slug)
);

create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules(id) on delete cascade,
  slug        text not null,
  title       text not null,
  body        text,
  resource_url text,
  estimated_minutes int default 30,
  xp_reward   int not null default 50,
  sort_order  int not null default 0,
  unique (module_id, slug)
);

create table if not exists public.missions (
  id              uuid primary key default gen_random_uuid(),
  branch_code     text not null references public.branches(code) on delete cascade,
  kind            mission_kind_t not null,
  title           text not null,
  description     text,
  resource_url    text,
  difficulty      difficulty_t not null default 'beginner',
  estimated_minutes int default 30,
  xp_reward       int not null default 50,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.certifications (
  id              uuid primary key default gen_random_uuid(),
  branch_code     text not null references public.branches(code) on delete cascade,
  provider        cert_provider_t not null,
  name            text not null,
  url             text,
  difficulty      difficulty_t not null default 'intermediate',
  estimated_hours int default 40,
  xp_reward       int not null default 500,
  badge_emoji     text,
  is_active       boolean not null default true
);

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  branch_code     text not null references public.branches(code) on delete cascade,
  slug            text not null,
  title           text not null,
  description     text,
  difficulty      difficulty_t not null default 'beginner',
  estimated_hours int default 8,
  xp_reward       int not null default 200,
  sort_order      int not null default 0,
  is_active       boolean not null default true,
  unique (branch_code, slug)
);

create table if not exists public.skills (
  id              uuid primary key default gen_random_uuid(),
  branch_code     text not null references public.branches(code) on delete cascade,
  slug            text not null,
  name            text not null,
  description     text,
  parent_skill_id uuid references public.skills(id) on delete set null,
  sort_order      int not null default 0,
  unique (branch_code, slug)
);

-- ===== USER PROGRESS TABLES =====

create table if not exists public.user_mission_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  mission_id   uuid not null references public.missions(id) on delete cascade,
  completed_at timestamptz not null default now(),
  xp_earned    int not null default 0,
  unique (user_id, mission_id, completed_at)
);

create table if not exists public.user_certification_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  certification_id uuid not null references public.certifications(id) on delete cascade,
  status          text not null default 'in_progress', -- in_progress | completed | abandoned
  progress_pct    int not null default 0 check (progress_pct between 0 and 100),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  unique (user_id, certification_id)
);

create table if not exists public.user_project_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  status       text not null default 'in_progress',
  progress_pct int not null default 0 check (progress_pct between 0 and 100),
  repo_url     text,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, project_id)
);

create table if not exists public.user_skill_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  skill_id     uuid not null references public.skills(id) on delete cascade,
  xp           int not null default 0,
  level        int not null default 0,
  unlocked_at  timestamptz not null default now(),
  unique (user_id, skill_id)
);

-- ===== INDEXES =====
create index if not exists roadmaps_branch_idx        on public.roadmaps (branch_code);
create index if not exists semesters_roadmap_idx      on public.semesters (roadmap_id);
create index if not exists modules_semester_idx       on public.modules (semester_id, sort_order);
create index if not exists lessons_module_idx         on public.lessons (module_id, sort_order);
create index if not exists missions_branch_active_idx on public.missions (branch_code, is_active);
create index if not exists certs_branch_idx           on public.certifications (branch_code);
create index if not exists projects_branch_idx        on public.projects (branch_code, sort_order);
create index if not exists skills_branch_idx          on public.skills (branch_code, sort_order);

create index if not exists umc_user_idx       on public.user_mission_completions (user_id, completed_at desc);
create index if not exists ucp_user_idx       on public.user_certification_progress (user_id);
create index if not exists upp_user_idx       on public.user_project_progress (user_id);
create index if not exists usp_user_idx       on public.user_skill_progress (user_id);

-- ===== RLS =====

-- Content tables: world-readable (no PII), admin-writable
alter table public.branches        enable row level security;
alter table public.roadmaps        enable row level security;
alter table public.semesters       enable row level security;
alter table public.modules         enable row level security;
alter table public.lessons         enable row level security;
alter table public.missions        enable row level security;
alter table public.certifications  enable row level security;
alter table public.projects        enable row level security;
alter table public.skills          enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'branches','roadmaps','semesters','modules','lessons',
    'missions','certifications','projects','skills'
  ])
  loop
    execute format('drop policy if exists %I_select_all on public.%I;', t, t);
    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format(
      'create policy %I_select_all on public.%I for select using (true);',
      t, t
    );
    execute format(
      'create policy %I_admin_write on public.%I for all using (public.is_admin()) with check (public.is_admin());',
      t, t
    );
  end loop;
end $$;

-- User progress tables: own-only + admin-read
alter table public.user_mission_completions    enable row level security;
alter table public.user_certification_progress enable row level security;
alter table public.user_project_progress       enable row level security;
alter table public.user_skill_progress         enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'user_mission_completions','user_certification_progress',
    'user_project_progress','user_skill_progress'
  ])
  loop
    execute format('drop policy if exists %I_own on public.%I;', t, t);
    execute format('drop policy if exists %I_own_write on public.%I;', t, t);
    execute format('drop policy if exists %I_admin_read on public.%I;', t, t);
    execute format(
      'create policy %I_own on public.%I for select using (auth.uid() = user_id);',
      t, t
    );
    execute format(
      'create policy %I_own_write on public.%I for insert with check (auth.uid() = user_id);',
      t, t
    );
    execute format(
      'create policy %I_admin_read on public.%I for select using (public.is_admin());',
      t, t
    );
  end loop;
end $$;

-- ===== REALTIME =====
do $$ begin alter publication supabase_realtime add table public.user_mission_completions;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.user_skill_progress;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.user_certification_progress;
exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.user_project_progress;
exception when others then null; end $$;

-- ===== SEED: branches =====
insert into public.branches (code, name, description, sort_order) values
  ('CSE',   'Computer Science',           'Software, algorithms, systems.', 1),
  ('AIML',  'AI & Machine Learning',      'Machine learning, deep learning, GenAI.', 2),
  ('DS',    'Data Science',               'Statistics, data engineering, analytics.', 3),
  ('ECE',   'Electronics & Communication','Circuits, signals, embedded systems.', 4),
  ('EEE',   'Electrical & Electronics',   'Power systems, control, electronics.', 5),
  ('MECH',  'Mechanical',                 'Design, manufacturing, thermodynamics.', 6),
  ('CIVIL', 'Civil',                      'Structures, materials, transportation.', 7)
on conflict (code) do update set name = excluded.name, description = excluded.description;

-- ===== SEED: CSE roadmap (the rest are unlocked the same way later) =====
insert into public.roadmaps (branch_code, slug, title, description)
values ('CSE', 'btech-4yr', 'B.Tech CSE - 4-year evolution', 'Foundations to placement in 8 semesters.')
on conflict (branch_code, slug) do nothing;

-- semesters
insert into public.semesters (roadmap_id, number, title, theme)
select r.id, s.number, s.title, s.theme
from public.roadmaps r
cross join (values
  (1, 'Foundations',         'C basics, math foundations, problem solving'),
  (2, 'Core Skills',         'OOP, data structures, web fundamentals'),
  (3, 'Projects',            'Build full-stack apps, contribute on GitHub'),
  (4, 'Advanced Systems',    'OS, networks, databases, system design intro'),
  (5, 'Industry Preparation','DSA mastery, framework depth, internships'),
  (6, 'Placement Readiness', 'Interview prep, mock systems, certifications'),
  (7, 'Specialization',      'Cloud, AI, distributed systems'),
  (8, 'Capstone',            'Production project + offers')
) as s(number, title, theme)
where r.branch_code = 'CSE' and r.slug = 'btech-4yr'
on conflict (roadmap_id, number) do nothing;

-- ===== SEED: CSE skills (skill-tree nodes) =====
insert into public.skills (branch_code, slug, name, description, sort_order) values
  ('CSE', 'c',          'C',                      'Memory model + procedural fundamentals.', 1),
  ('CSE', 'cpp',        'C++',                    'Object-oriented + STL.',                   2),
  ('CSE', 'java',       'Java',                   'JVM ecosystem + enterprise patterns.',     3),
  ('CSE', 'python',     'Python',                 'Scripting, scientific, web.',              4),
  ('CSE', 'dsa',        'Data Structures + Algos','The compounding interview skill.',         5),
  ('CSE', 'fullstack',  'Full Stack',             'React, Node, Postgres, deploy.',           6),
  ('CSE', 'sysdesign',  'System Design',          'Scalable distributed systems.',            7),
  ('CSE', 'ai-basics',  'AI Basics',              'ML intuition, working with LLMs.',         8)
on conflict (branch_code, slug) do nothing;

-- ===== SEED: CSE missions (samples) =====
insert into public.missions (branch_code, kind, title, description, resource_url, difficulty, estimated_minutes, xp_reward) values
  ('CSE','coding',       'Solve 2 LeetCode easy problems',     'Aim for clean solutions, not just AC.', 'https://leetcode.com/problemset/all/?difficulty=EASY', 'beginner',     30, 60),
  ('CSE','revision',     'Revise yesterday''s concept',        '10-minute spaced repetition.',           NULL,                                            'beginner',     10, 20),
  ('CSE','communication','Speak 5 mins on a CS topic',         'Record yourself. Listen back.',          NULL,                                            'beginner',     10, 30),
  ('CSE','project',      'Push 1 commit to GitHub',            'Anything that ships counts.',            'https://github.com',                            'beginner',     20, 40),
  ('CSE','ai_learning',  'Read 1 ML primer',                   'Concept depth > paper count.',           'https://distill.pub',                           'intermediate', 25, 50),
  ('CSE','aptitude',     'Solve 5 quant problems',             'Speed + accuracy.',                      NULL,                                            'beginner',     20, 30),
  ('CSE','build',        'Ship one tangible artifact',         'CLI, page, API, anything real.',         NULL,                                            'intermediate', 60, 100)
on conflict do nothing;

-- ===== SEED: CSE certifications (samples) =====
insert into public.certifications (branch_code, provider, name, url, difficulty, estimated_hours, xp_reward, badge_emoji) values
  ('CSE','google',    'Google Cloud Digital Leader',  'https://cloud.google.com/learn/certification/cloud-digital-leader', 'beginner',     30,  500, 'GCP'),
  ('CSE','aws',       'AWS Cloud Practitioner',       'https://aws.amazon.com/certification/certified-cloud-practitioner', 'beginner',     40,  600, 'AWS'),
  ('CSE','microsoft', 'Microsoft AZ-900 Fundamentals','https://learn.microsoft.com/en-us/certifications/azure-fundamentals','beginner',    35,  500, 'AZ'),
  ('CSE','oracle',    'Oracle Java SE Foundations',   'https://education.oracle.com',                                       'intermediate', 60,  800, 'JV'),
  ('CSE','meta',      'Meta Front-End Developer',     'https://www.coursera.org/professional-certificates/meta-front-end-developer','intermediate', 80, 1000, 'FE'),
  ('CSE','cisco',     'CCNA',                         'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html','advanced',120, 1500, 'NW')
on conflict do nothing;

-- ===== SEED: CSE projects (mission-style) =====
insert into public.projects (branch_code, slug, title, description, difficulty, estimated_hours, xp_reward, sort_order) values
  ('CSE','portfolio',         'Mission 1 - Portfolio website',        'Static personal site with one cool interaction.',                'beginner',     6,  200, 1),
  ('CSE','fullstack-auth',    'Mission 2 - Full-stack auth app',      'Sign-up, login, JWT, profile page.',                             'intermediate', 16, 400, 2),
  ('CSE','ai-chatbot',        'Mission 3 - AI chatbot',               'Wrap an LLM with a chat UI + system prompt + memory.',          'intermediate', 20, 500, 3),
  ('CSE','saas-platform',     'Mission 4 - SaaS platform',            'Multi-tenant app with billing, auth, dashboard.',                'advanced',     60, 1200, 4),
  ('CSE','production-ai',     'Mission 5 - Production AI system',     'Deployed, monitored, observability, eval loop.',                 'expert',       120,2500, 5)
on conflict (branch_code, slug) do nothing;

-- =============================================================
-- DONE. Verify with:
--   select code, name from public.branches order by sort_order;
--   select count(*) from public.missions where branch_code='CSE';
-- =============================================================
