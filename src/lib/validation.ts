import { z } from "zod";

const sanitize = (s: string) =>
  s.replace(/[ -]/g, "").trim();

const normalizeEmail = (s: string) => s.trim().toLowerCase();

export const PlanSchema = z.union([z.literal(49), z.literal(99)]);

export const NameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name too long")
  .transform(sanitize)
  .refine((s) => /^[\p{L} .'-]+$/u.test(s), "Name contains invalid characters");

export const EmailSchema = z
  .string()
  .min(3)
  .max(254)
  .transform(normalizeEmail)
  .pipe(z.string().email("Enter a valid email"));

export const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .refine(
    (s) => /[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s),
    "Password needs upper case, lower case, and a digit"
  );

export const WhatsappSchema = z
  .string()
  .transform(sanitize)
  .refine(
    (s) => /^(\+?91)?[6-9]\d{9}$/.test(s.replace(/\s|-/g, "")),
    "Enter a valid 10-digit Indian mobile number"
  )
  .transform((s) => "+91" + s.replace(/\D/g, "").slice(-10));

export const UtrSchema = z
  .string()
  .transform(sanitize)
  .refine((s) => /^\d{12}$/.test(s), "UTR must be exactly 12 digits");

export const PathTypeSchema = z.string();
export const IntermediateBranchSchema = z.string();
export const BtechBranchSchema = z.string();
export const BranchSchema = z.string().nullable().optional();

export const RegisterAccountSchema = z.object({
  full_name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  whatsapp: WhatsappSchema.optional()
});

export const RegisterPathSchema = z
  .object({ path_type: PathTypeSchema, branch: BranchSchema });

export const EnrollmentSchema = z.object({
  full_name: NameSchema,
  whatsapp: WhatsappSchema,
  utr_number: UtrSchema,
  plan_amount: PlanSchema
});

export type EnrollmentInput = z.infer<typeof EnrollmentSchema>;

export const DayCompletionSchema = z.object({
  day: z.number().int().min(1).max(30),
  notes: z.string().max(2000, "Notes too long").optional().nullable()
});

export const AdminActionSchema = z.object({
  utr_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  rejection_reason: z.string().trim().max(240, "Reason too long").optional().nullable()
});

// =============================================================
// ONBOARDING
// =============================================================

export const SignupSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const GenderSchema = z.enum([
  "male", "female", "non_binary", "prefer_not_to_say"
]);

export const OccupationSchema = z.enum([
  "school_student",
  "intermediate_student",
  "college_student",
  "working_professional",
  "job_seeker",
  "self_employed",
  "other"
]);

export const SkillLevelSchema = z.enum([
  "beginner", "intermediate", "advanced"
]);

export const MainGoalSchema = z.enum([
  "crack_placements",
  "full_stack_dev",
  "improve_discipline",
  "aiml_mastery",
  "build_projects",
  "learn_programming",
  "prepare_exams",
  "other"
]);

export const EnergyLevelSchema = z.enum(["low", "medium", "high"]);
export const WorkTypeSchema = z.enum(["remote", "office", "hybrid", "student"]);
export const WorkoutPreferenceSchema = z.enum(["gym", "home_workout", "calisthenics", "cardio", "none"]);
export const DisciplineLevelSchema = z.enum(["poor", "average", "good", "elite"]);
export const StudyTimingSchema = z.enum(["morning", "afternoon", "evening", "late_night", "none"]);

export const OnboardingSchema = z.object({
  full_name: NameSchema,
  occupation: OccupationSchema,
  main_goal: MainGoalSchema,
  wake_time: z.string().min(4, "Enter a valid time"),
  sleep_time: z.string().min(4, "Enter a valid time"),
  available_hours: z.number().min(1).max(24),
  discipline_level: DisciplineLevelSchema,
  workout_preference: WorkoutPreferenceSchema,
  energy_level: EnergyLevelSchema,
  study_timing: StudyTimingSchema,
  work_type: WorkTypeSchema,
  distractions: z.string().max(200).optional(),
  skills_to_learn: z.string().max(200).optional()
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
