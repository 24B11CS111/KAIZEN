import { z } from "zod";

const sanitize = (s: string) =>
  s.replace(/[ -]/g, "").trim();

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
  .transform(sanitize)
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

export const PathTypeSchema = z.enum(["intermediate", "btech"]);
export const IntermediateBranchSchema = z.enum(["MPC", "BiPC"]);
export const BtechBranchSchema = z.enum([
  "CSE", "AIML", "DS", "ECE", "EEE", "MECH", "CIVIL"
]);
export const BranchSchema = z.union([IntermediateBranchSchema, BtechBranchSchema]);

export const RegisterAccountSchema = z.object({
  full_name: NameSchema,
  email: EmailSchema,
  password: PasswordSchema,
  whatsapp: WhatsappSchema.optional()
});

export const RegisterPathSchema = z
  .object({ path_type: PathTypeSchema, branch: BranchSchema })
  .superRefine((val, ctx) => {
    if (val.path_type === "intermediate" && !["MPC", "BiPC"].includes(val.branch)) {
      ctx.addIssue({ code: "custom", message: "Invalid branch for Intermediate path" });
    }
    if (val.path_type === "btech" &&
        !["CSE","AIML","DS","ECE","EEE","MECH","CIVIL"].includes(val.branch)) {
      ctx.addIssue({ code: "custom", message: "Invalid branch for B.Tech path" });
    }
  });

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
  user_id: z.string().uuid().optional()
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

export const AgeSchema = z
  .number({ invalid_type_error: "Age must be a number" })
  .int("Age must be a whole number")
  .min(10, "You must be at least 10")
  .max(120, "Enter a valid age");

export const DailyTimeSchema = z
  .number({ invalid_type_error: "Pick a time commitment" })
  .int()
  .min(15, "At least 15 minutes a day")
  .max(600, "Be realistic, warrior");

export const FieldOfStudySchema = z
  .string()
  .min(2, "Tell us your field of study")
  .max(80, "Too long");

export const OnboardingSchema = z.object({
  full_name: NameSchema,
  age: AgeSchema,
  gender: GenderSchema,
  occupation: OccupationSchema,
  field_of_study: FieldOfStudySchema,
  daily_time_min: DailyTimeSchema,
  skill_level: SkillLevelSchema,
  main_goal: MainGoalSchema,
  main_goal_other: z.string().max(120).optional().nullable()
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
