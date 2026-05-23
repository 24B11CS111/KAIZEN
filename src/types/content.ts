/**
 * KAIZEN.SYS - Content + progression types.
 * Mirrors the schema from supabase/migrations/0001_content_system.sql.
 */

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type MissionKind =
  | "coding" | "certification" | "revision" | "communication"
  | "project" | "ai_learning" | "aptitude" | "reading" | "build" | "reflection";

export type CertProvider =
  | "microsoft" | "google" | "aws" | "oracle" | "cisco"
  | "meta" | "ibm" | "nvidia" | "other";

export interface Branch {
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  purpose: string | null;
  career_direction: string | null;
  industry_focus: string | null;
  transformation_goal: string | null;
  tagline: string | null;
}

export interface Roadmap {
  id: string;
  branch_code: string;
  slug: string;
  title: string;
  description: string | null;
  duration_months: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Semester {
  id: string;
  roadmap_id: string;
  number: number;
  title: string;
  theme: string | null;
}

export interface Module {
  id: string;
  semester_id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  difficulty: Difficulty;
}

export interface Lesson {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  body: string | null;
  resource_url: string | null;
  estimated_minutes: number | null;
  xp_reward: number;
  sort_order: number;
}

export interface Mission {
  id: string;
  branch_code: string;
  kind: MissionKind;
  title: string;
  description: string | null;
  resource_url: string | null;
  difficulty: Difficulty;
  estimated_minutes: number | null;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface Certification {
  id: string;
  branch_code: string;
  provider: CertProvider;
  name: string;
  url: string | null;
  difficulty: Difficulty;
  estimated_hours: number | null;
  xp_reward: number;
  badge_emoji: string | null;
  is_active: boolean;
}

export interface Project {
  id: string;
  branch_code: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: Difficulty;
  estimated_hours: number | null;
  xp_reward: number;
  sort_order: number;
  is_active: boolean;
}

export interface Skill {
  id: string;
  branch_code: string;
  slug: string;
  name: string;
  description: string | null;
  parent_skill_id: string | null;
  sort_order: number;
}

export interface UserMissionCompletion {
  id: string;
  user_id: string;
  mission_id: string;
  completed_at: string;
  xp_earned: number;
}

export interface UserCertificationProgress {
  id: string;
  user_id: string;
  certification_id: string;
  status: "in_progress" | "completed" | "abandoned";
  progress_pct: number;
  started_at: string;
  completed_at: string | null;
}

export interface UserProjectProgress {
  id: string;
  user_id: string;
  project_id: string;
  status: "in_progress" | "completed" | "abandoned";
  progress_pct: number;
  repo_url: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface UserSkillProgress {
  id: string;
  user_id: string;
  skill_id: string;
  xp: number;
  level: number;
  unlocked_at: string;
}
