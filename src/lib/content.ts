/**
 * KAIZEN.SYS - Content & user-progress data accessors.
 * Reads from Supabase content tables (public-readable) and per-user
 * progress tables (RLS-scoped).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Branch, Roadmap, Semester, Module, Lesson, Mission,
  Certification, Project, Skill,
  UserMissionCompletion, UserCertificationProgress,
  UserProjectProgress, UserSkillProgress
} from "@/types/content";

// ---------- CONTENT (public) ----------
export async function listBranches(s: SupabaseClient): Promise<Branch[]> {
  const { data } = await s.from("branches")
    .select("*").eq("is_active", true).order("sort_order");
  return (data ?? []) as Branch[];
}

export async function getRoadmap(s: SupabaseClient, branchCode: string): Promise<Roadmap | null> {
  const { data } = await s.from("roadmaps")
    .select("*").eq("branch_code", branchCode).eq("is_active", true).maybeSingle();
  return (data as Roadmap) ?? null;
}

export async function listSemesters(s: SupabaseClient, roadmapId: string): Promise<Semester[]> {
  const { data } = await s.from("semesters")
    .select("*").eq("roadmap_id", roadmapId).order("number");
  return (data ?? []) as Semester[];
}

export async function listModules(s: SupabaseClient, semesterId: string): Promise<Module[]> {
  const { data } = await s.from("modules")
    .select("*").eq("semester_id", semesterId).order("sort_order");
  return (data ?? []) as Module[];
}

export async function listLessons(s: SupabaseClient, moduleId: string): Promise<Lesson[]> {
  const { data } = await s.from("lessons")
    .select("*").eq("module_id", moduleId).order("sort_order");
  return (data ?? []) as Lesson[];
}

export async function listMissions(s: SupabaseClient, branchCode: string): Promise<Mission[]> {
  const { data } = await s.from("missions")
    .select("*").eq("branch_code", branchCode).eq("is_active", true).order("kind");
  return (data ?? []) as Mission[];
}

export async function listCertifications(s: SupabaseClient, branchCode: string): Promise<Certification[]> {
  const { data } = await s.from("certifications")
    .select("*").eq("branch_code", branchCode).eq("is_active", true).order("difficulty");
  return (data ?? []) as Certification[];
}

export async function listProjects(s: SupabaseClient, branchCode: string): Promise<Project[]> {
  const { data } = await s.from("projects")
    .select("*").eq("branch_code", branchCode).eq("is_active", true).order("sort_order");
  return (data ?? []) as Project[];
}

export async function listSkills(s: SupabaseClient, branchCode: string): Promise<Skill[]> {
  const { data } = await s.from("skills")
    .select("*").eq("branch_code", branchCode).order("sort_order");
  return (data ?? []) as Skill[];
}

// ---------- USER PROGRESS (RLS-scoped) ----------
export async function listMyMissionCompletions(
  s: SupabaseClient, userId: string, sinceIso?: string
): Promise<UserMissionCompletion[]> {
  let q = s.from("user_mission_completions")
    .select("*").eq("user_id", userId).order("completed_at", { ascending: false });
  if (sinceIso) q = q.gte("completed_at", sinceIso);
  const { data } = await q;
  return (data ?? []) as UserMissionCompletion[];
}

export async function listMyCertProgress(
  s: SupabaseClient, userId: string
): Promise<UserCertificationProgress[]> {
  const { data } = await s.from("user_certification_progress")
    .select("*").eq("user_id", userId);
  return (data ?? []) as UserCertificationProgress[];
}

export async function listMyProjectProgress(
  s: SupabaseClient, userId: string
): Promise<UserProjectProgress[]> {
  const { data } = await s.from("user_project_progress")
    .select("*").eq("user_id", userId);
  return (data ?? []) as UserProjectProgress[];
}

export async function listMySkillProgress(
  s: SupabaseClient, userId: string
): Promise<UserSkillProgress[]> {
  const { data } = await s.from("user_skill_progress")
    .select("*").eq("user_id", userId);
  return (data ?? []) as UserSkillProgress[];
}

// ---------- PROGRESS WRITES ----------
export async function recordMissionCompletion(
  s: SupabaseClient, userId: string, missionId: string, xpEarned: number
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await s.from("user_mission_completions")
    .insert({ user_id: userId, mission_id: missionId, xp_earned: xpEarned });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function upsertProjectProgress(
  s: SupabaseClient, userId: string, projectId: string,
  patch: Partial<Pick<UserProjectProgress, "status" | "progress_pct" | "repo_url" | "completed_at">>
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await s.from("user_project_progress").upsert(
    { user_id: userId, project_id: projectId, ...patch },
    { onConflict: "user_id,project_id" }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function upsertCertProgress(
  s: SupabaseClient, userId: string, certId: string,
  patch: Partial<Pick<UserCertificationProgress, "status" | "progress_pct" | "completed_at">>
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await s.from("user_certification_progress").upsert(
    { user_id: userId, certification_id: certId, ...patch },
    { onConflict: "user_id,certification_id" }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function awardSkillXp(
  s: SupabaseClient, userId: string, skillId: string, xp: number
): Promise<{ ok: boolean; error?: string }> {
  // Read current
  const { data } = await s.from("user_skill_progress")
    .select("xp,level").eq("user_id", userId).eq("skill_id", skillId).maybeSingle();
  const cur: any = data;
  const newXp = (cur?.xp ?? 0) + xp;
  const newLevel = Math.floor(newXp / 200) + 1;
  const { error } = await s.from("user_skill_progress").upsert(
    { user_id: userId, skill_id: skillId, xp: newXp, level: newLevel },
    { onConflict: "user_id,skill_id" }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}
