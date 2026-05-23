-- =============================================================
-- KAIZEN.SYS - 0003: branch identity columns + seed
-- Run AFTER 0002_branch_seed.sql.
-- Idempotent.
-- =============================================================

alter table public.branches add column if not exists purpose             text;
alter table public.branches add column if not exists career_direction    text;
alter table public.branches add column if not exists industry_focus      text;
alter table public.branches add column if not exists transformation_goal text;
alter table public.branches add column if not exists tagline             text;

update public.branches set
  purpose             = 'Engineer software, systems, and intelligence.',
  career_direction    = 'Software engineer, full-stack developer, AI engineer.',
  industry_focus      = 'Tech product companies, startups, cloud, AI labs.',
  transformation_goal = 'Become a builder who ships real systems and reasons about scale.',
  tagline             = 'Build the world. In code.'
where code = 'CSE';

update public.branches set
  purpose             = 'Build intelligent systems that learn.',
  career_direction    = 'ML engineer, applied scientist, GenAI engineer.',
  industry_focus      = 'AI labs, research orgs, GenAI startups, big-tech AI teams.',
  transformation_goal = 'Become an engineer who deploys models that change product behavior.',
  tagline             = 'Teach machines. Then teach them better.'
where code = 'AIML';

update public.branches set
  purpose             = 'Turn raw data into decisions.',
  career_direction    = 'Data scientist, analyst, data / analytics engineer.',
  industry_focus      = 'Fintech, e-commerce, healthcare, growth teams.',
  transformation_goal = 'Become the person whose dashboard the CEO opens daily.',
  tagline             = 'See what others miss.'
where code = 'DS';

update public.branches set
  purpose             = 'Bridge silicon and the physical world.',
  career_direction    = 'Embedded engineer, IoT engineer, RF / VLSI engineer.',
  industry_focus      = 'Semiconductor, telecom, automotive, defense, IoT.',
  transformation_goal = 'Become the engineer who ships hardware that talks to the cloud.',
  tagline             = 'From transistor to system.'
where code = 'ECE';

update public.branches set
  purpose             = 'Master energy from generation to control.',
  career_direction    = 'Power engineer, control systems engineer, EV / renewables.',
  industry_focus      = 'Power grids, EV manufacturers, renewables, automation.',
  transformation_goal = 'Become the engineer who keeps the lights on - sustainably.',
  tagline             = 'Power the future.'
where code = 'EEE';

update public.branches set
  purpose             = 'Design and build the physical machines of the world.',
  career_direction    = 'Design engineer, manufacturing engineer, mechatronics, automotive.',
  industry_focus      = 'Aerospace, automotive, manufacturing, robotics, energy.',
  transformation_goal = 'Become the engineer whose CAD becomes a working machine.',
  tagline             = 'Design. Build. Move.'
where code = 'MECH';

update public.branches set
  purpose             = 'Shape the infrastructure people live in.',
  career_direction    = 'Structural engineer, transport planner, project manager, BIM specialist.',
  industry_focus      = 'Construction, urban planning, infrastructure, sustainability.',
  transformation_goal = 'Become the engineer whose drawings stand for a hundred years.',
  tagline             = 'Build the world. In concrete.'
where code = 'CIVIL';
