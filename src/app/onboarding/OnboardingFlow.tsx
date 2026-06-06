"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle,
  User, Cake, UserCircle2, Briefcase, GraduationCap, Clock,
  Sparkles, Target, Sword, Cpu, Brain, Wrench, BookOpen,
  Hammer, FlaskConical, Sigma, RadioTower, Zap, Cog,
  Database, ShieldCheck, Building2, Rocket, Dumbbell
} from "lucide-react";
import { OnboardingSchema } from "@/lib/validation";

// ---------------- Types ----------------

type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
type Occupation =
  | "school_student"
  | "intermediate_student"
  | "college_student"
  | "working_professional"
  | "job_seeker"
  | "self_employed"
  | "other";
type Skill = "beginner" | "intermediate" | "advanced";
type Goal =
  | "crack_placements"
  | "full_stack_dev"
  | "improve_discipline"
  | "aiml_mastery"
  | "build_projects"
  | "learn_programming"
  | "prepare_exams"
  | "other";

type WorkoutPreference = "gym" | "home_workout" | "calisthenics" | "cardio" | "none";
type SleepTiming = "early_bird" | "night_owl" | "irregular";
type ProductivityHabits = "pomodoro" | "deep_work" | "multitasking" | "chaotic";
type DisciplineLevel = "poor" | "average" | "good" | "elite";
type StudyTiming = "morning" | "afternoon" | "evening" | "late_night";

interface State {
  full_name: string;
  age: string;
  gender: Gender | "";
  occupation: Occupation | "";
  field_of_study: string;
  daily_time_min: number | 0;
  skill_level: Skill | "";
  main_goal: Goal | "";
  main_goal_other: string;
  workout_preference: WorkoutPreference | "";
  sleep_timing: SleepTiming | "";
  productivity_habits: ProductivityHabits | "";
  discipline_level: DisciplineLevel | "";
  study_timing: StudyTiming | "";
}
// ---------------- Static option sets ----------------

const GENDERS: { value: Gender; label: string; icon: any }[] = [
  { value: "male", label: "Male", icon: UserCircle2 },
  { value: "female", label: "Female", icon: UserCircle2 },
  { value: "non_binary", label: "Non-binary", icon: UserCircle2 },
  { value: "prefer_not_to_say", label: "Prefer not to say", icon: ShieldCheck }
];

const OCCUPATIONS: { value: Occupation; label: string; icon: any; hint?: string }[] = [
  { value: "school_student", label: "School student", icon: BookOpen, hint: "Class 9–10" },
  { value: "intermediate_student", label: "Intermediate", icon: GraduationCap, hint: "Class 11–12" },
  { value: "college_student", label: "College student", icon: Building2, hint: "B.Tech / B.Sc / etc." },
  { value: "working_professional", label: "Working professional", icon: Briefcase },
  { value: "job_seeker", label: "Job seeker", icon: Target },
  { value: "self_employed", label: "Self-employed", icon: Rocket },
  { value: "other", label: "Other", icon: User }
];

const FIELD_SUGGESTIONS = [
  { label: "CSE", icon: Cpu },
  { label: "AIML", icon: Brain },
  { label: "Data Science", icon: Database },
  { label: "ECE", icon: RadioTower },
  { label: "EEE", icon: Zap },
  { label: "Mechanical", icon: Cog },
  { label: "Civil", icon: Hammer },
  { label: "MPC", icon: Sigma },
  { label: "BiPC", icon: FlaskConical }
];

const DAILY_TIMES = [
  { value: 30,  label: "30 minutes", hint: "Light cadence" },
  { value: 60,  label: "1 hour",     hint: "Steady builder" },
  { value: 90,  label: "1.5 hours",  hint: "Focused" },
  { value: 120, label: "2 hours",    hint: "Serious" },
  { value: 180, label: "3+ hours",   hint: "Obsessed" }
];

const SKILL_LEVELS: { value: Skill; label: string; hint: string; icon: any }[] = [
  { value: "beginner",     label: "Beginner",     hint: "Just starting out",    icon: Sparkles },
  { value: "intermediate", label: "Intermediate", hint: "I know the basics",    icon: Wrench },
  { value: "advanced",     label: "Advanced",     hint: "I build real things",  icon: Sword }
];

const GOALS: { value: Goal; label: string; icon: any; hint: string }[] = [
  { value: "crack_placements",   label: "Crack placements",       icon: Target,     hint: "Land that offer" },
  { value: "full_stack_dev",     label: "Become a full-stack dev", icon: Cpu,        hint: "Frontend + backend" },
  { value: "improve_discipline", label: "Improve discipline",     icon: ShieldCheck, hint: "Daily consistency" },
  { value: "aiml_mastery",       label: "AI / ML mastery",        icon: Brain,      hint: "Models, math, ship" },
  { value: "build_projects",     label: "Build real projects",    icon: Rocket,     hint: "Portfolio worth showing" },
  { value: "learn_programming",  label: "Learn programming",      icon: BookOpen,   hint: "From zero to confident" },
  { value: "prepare_exams",      label: "Prepare for exams",      icon: GraduationCap, hint: "JEE / EAMCET / GATE" },
  { value: "other",              label: "Something else",         icon: Sparkles,   hint: "I'll tell you" }
];

const WORKOUTS: { value: WorkoutPreference; label: string; icon: any }[] = [
  { value: "gym", label: "Gym (Weights)", icon: Dumbbell },
  { value: "home_workout", label: "Home Workout", icon: Target },
  { value: "calisthenics", label: "Calisthenics", icon: Sword },
  { value: "cardio", label: "Cardio / Running", icon: Zap },
  { value: "none", label: "None yet", icon: User }
];

const SLEEP: { value: SleepTiming; label: string; icon: any }[] = [
  { value: "early_bird", label: "Early Bird", icon: Sparkles },
  { value: "night_owl", label: "Night Owl", icon: Clock },
  { value: "irregular", label: "Irregular", icon: AlertTriangle }
];

const HABITS: { value: ProductivityHabits; label: string; icon: any }[] = [
  { value: "pomodoro", label: "Pomodoro Focus", icon: Target },
  { value: "deep_work", label: "Long Deep Work", icon: Brain },
  { value: "multitasking", label: "Multitasking", icon: Zap },
  { value: "chaotic", label: "No system (Chaotic)", icon: AlertTriangle }
];

const DISCIPLINE: { value: DisciplineLevel; label: string; icon: any }[] = [
  { value: "poor", label: "Poor (Procrastinate a lot)", icon: AlertTriangle },
  { value: "average", label: "Average (Inconsistent)", icon: User },
  { value: "good", label: "Good (Mostly consistent)", icon: Check },
  { value: "elite", label: "Elite (Unbreakable)", icon: ShieldCheck }
];

const STUDY: { value: StudyTiming; label: string; icon: any }[] = [
  { value: "morning", label: "Morning", icon: Sparkles },
  { value: "afternoon", label: "Afternoon", icon: Clock },
  { value: "evening", label: "Evening", icon: Zap },
  { value: "late_night", label: "Late Night", icon: Target }
];

const TOTAL_STEPS = 13;
const STEP_LABELS = [
  "Name", "Age", "Gender", "Occupation",
  "Field", "Time", "Level", "Goal",
  "Workout", "Sleep", "Habits", "Discipline", "Focus Time"
];

// ---------------- Helpers ----------------

function paneVariants() {
  return {
    initial: { opacity: 0, x: 28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -28 },
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const }
  };
}

// ---------------- Component ----------------

interface Props {
  defaultEmail: string;
  defaultName?: string;
}

export function OnboardingFlow({ defaultEmail, defaultName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [state, setState] = useState<State>({
    full_name: defaultName ?? "",
    age: "",
    gender: "",
    occupation: "",
    field_of_study: "",
    daily_time_min: 120,
    skill_level: "",
    main_goal: "",
    main_goal_other: "",
    workout_preference: "",
    sleep_timing: "",
    productivity_habits: "",
    discipline_level: "",
    study_timing: ""
  });

  // Reset error whenever step changes so a stale error doesn't bleed across panes.
  useEffect(() => { setError(null); }, [step]);

  const update = useCallback(<K extends keyof State>(k: K, v: State[K]) => {
    setState((s) => ({ ...s, [k]: v }));
  }, []);

  // Per-step gate. Each returns true when the user may advance.
  const canAdvance = useMemo<boolean>(() => {
    switch (step) {
      case 1: return state.full_name.trim().length >= 2;
      case 2: {
        const n = Number(state.age);
        return Number.isFinite(n) && n >= 10 && n <= 120;
      }
      case 3: return state.gender !== "";
      case 4: return state.occupation !== "";
      case 5: return state.field_of_study.trim().length >= 2;
      case 6: return state.daily_time_min > 0;
      case 7: return state.skill_level !== "";
      case 8:
        if (state.main_goal === "") return false;
        if (state.main_goal === "other" && state.main_goal_other.trim().length < 2) return false;
        return true;
      case 9: return state.workout_preference !== "";
      case 10: return state.sleep_timing !== "";
      case 11: return state.productivity_habits !== "";
      case 12: return state.discipline_level !== "";
      case 13: return state.study_timing !== "";
      default: return false;
    }
  }, [step, state]);

  const advance = () => {
    if (!canAdvance) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      submit();
    }
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const submit = async () => {
    setError(null);
    const payload = {
      full_name: state.full_name,
      age: Number(state.age),
      gender: state.gender as Gender,
      occupation: state.occupation as Occupation,
      field_of_study: state.field_of_study.trim(),
      daily_time_min: state.daily_time_min,
      skill_level: state.skill_level as Skill,
      main_goal: state.main_goal as Goal,
      main_goal_other: state.main_goal === "other" ? state.main_goal_other.trim() : null,
      workout_preference: state.workout_preference as WorkoutPreference,
      sleep_timing: state.sleep_timing as SleepTiming,
      productivity_habits: state.productivity_habits as ProductivityHabits,
      discipline_level: state.discipline_level as DisciplineLevel,
      study_timing: state.study_timing as StudyTiming
    };
    const parsed = OnboardingSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Could not save. Please try again.");
      setDone(true);
      // Soft delay so the user sees the success state, then route on.
      setTimeout(() => {
        router.replace("/dojo");
        router.refresh();
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ---------------- DONE STATE ----------------
  if (done) {
    return (
      <main className="min-h-[100svh] grid place-items-center px-6 bg-obsidian">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-sm"
        >
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 14 }}
            className="grid place-items-center h-20 w-20 mx-auto rounded-full bg-blood-500/15 border border-blood-500/50 shadow-blood-lg"
          >
            <Check className="h-10 w-10 text-blood-500" strokeWidth={3} />
          </motion.div>
          <h1 className="mt-7 text-3xl font-semibold tracking-tight">
            Path locked in.
          </h1>
          <p className="mt-3 text-sm text-white/60 leading-relaxed">
            Your dojo is being prepared. Discipline starts now.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 text-xs text-blood-500 uppercase tracking-[0.18em]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Entering the dojo
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-obsidian text-white flex flex-col">
      {/* ===== Top: progress + step indicator ===== */}
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-3 sticky top-0 z-20 backdrop-blur-md bg-obsidian/85 border-b border-white/[0.04]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/55">
            <button
              type="button"
              onClick={back}
              disabled={step === 1 || busy}
              className="inline-flex items-center gap-1 disabled:opacity-30 hover:text-white transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <span>
              Step <span className="text-white">{step}</span> / {TOTAL_STEPS}
            </span>
            <span className="text-blood-500">{STEP_LABELS[step - 1]}</span>
          </div>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>
      </header>

      {/* ===== Middle: animated pane ===== */}
      <section className="flex-1 px-5 pt-7 pb-4 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Pane key="1" icon={User} eyebrow="Identity" title="What should we call you?" subtitle="The name on your dojo plaque.">
                <Input
                  value={state.full_name}
                  onChange={(v) => update("full_name", v)}
                  placeholder="Anurag K."
                  autoFocus
                  autoComplete="name"
                />
                <Helper>
                  Signed in as <span className="text-white/75">{defaultEmail}</span>
                </Helper>
              </Pane>
            )}

            {step === 2 && (
              <Pane key="2" icon={Cake} eyebrow="Background" title="How old are you?" subtitle="So we can tune your missions.">
                <Input
                  value={state.age}
                  onChange={(v) => update("age", v.replace(/\D/g, "").slice(0, 3))}
                  placeholder="18"
                  inputMode="numeric"
                  type="text"
                  centerLarge
                  autoFocus
                />
              </Pane>
            )}

            {step === 3 && (
              <Pane key="3" icon={UserCircle2} eyebrow="Background" title="How do you identify?" subtitle="Pick what fits. Used only for stats.">
                <CardGrid>
                  {GENDERS.map((g) => (
                    <ChoiceCard
                      key={g.value}
                      selected={state.gender === g.value}
                      onClick={() => { update("gender", g.value); setTimeout(advance, 180); }}
                      icon={g.icon}
                      label={g.label}
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 4 && (
              <Pane key="4" icon={Briefcase} eyebrow="Background" title="What's your current role?" subtitle="So we can speak your language.">
                <CardGrid cols={2}>
                  {OCCUPATIONS.map((o) => (
                    <ChoiceCard
                      key={o.value}
                      selected={state.occupation === o.value}
                      onClick={() => { update("occupation", o.value); setTimeout(advance, 180); }}
                      icon={o.icon}
                      label={o.label}
                      hint={o.hint}
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 5 && (
              <Pane key="5" icon={GraduationCap} eyebrow="Field" title="What do you study or focus on?" subtitle="Type freely, or tap a quick pick.">
                <Input
                  value={state.field_of_study}
                  onChange={(v) => update("field_of_study", v)}
                  placeholder="e.g. Computer Science"
                  autoFocus
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {FIELD_SUGGESTIONS.map((f) => {
                    const active = state.field_of_study.toLowerCase() === f.label.toLowerCase();
                    return (
                      <button
                        key={f.label}
                        type="button"
                        onClick={() => update("field_of_study", f.label)}
                        className={
                          "btn-tap inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs transition-all " +
                          (active
                            ? "border-blood-500/70 bg-blood-500/15 text-white"
                            : "border-white/10 bg-white/[0.02] text-white/65 hover:text-white hover:border-white/25")
                        }
                      >
                        <f.icon className="h-3.5 w-3.5" />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </Pane>
            )}

            {step === 6 && (
              <Pane key="6" icon={Clock} eyebrow="Commitment" title="How much time can you give daily?" subtitle="Honest answer. We'll build around it.">
                <div className="grid gap-2.5">
                  {DAILY_TIMES.map((d) => (
                    <RowCard
                      key={d.value}
                      selected={state.daily_time_min === d.value}
                      onClick={() => { update("daily_time_min", d.value); setTimeout(advance, 180); }}
                      label={d.label}
                      hint={d.hint}
                    />
                  ))}
                </div>
              </Pane>
            )}

            {step === 7 && (
              <Pane key="7" icon={Sparkles} eyebrow="Level" title="Where are you right now?" subtitle="No judgment. Just calibration.">
                <CardGrid cols={1}>
                  {SKILL_LEVELS.map((s) => (
                    <ChoiceCard
                      key={s.value}
                      selected={state.skill_level === s.value}
                      onClick={() => { update("skill_level", s.value); setTimeout(advance, 180); }}
                      icon={s.icon}
                      label={s.label}
                      hint={s.hint}
                      wide
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 8 && (
              <Pane key="8" icon={Target} eyebrow="Goal" title="What's your main goal?" subtitle="Your 30-day path will lean into this.">
                <CardGrid cols={2}>
                  {GOALS.map((g) => (
                    <ChoiceCard
                      key={g.value}
                      selected={state.main_goal === g.value}
                      onClick={() => update("main_goal", g.value)}
                      icon={g.icon}
                      label={g.label}
                      hint={g.hint}
                    />
                  ))}
                </CardGrid>
                {state.main_goal === "other" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 overflow-hidden"
                  >
                    <Input
                      value={state.main_goal_other}
                      onChange={(v) => update("main_goal_other", v.slice(0, 120))}
                      placeholder="In one sentence..."
                      autoFocus
                    />
                  </motion.div>
                )}
              </Pane>
            )}

            {step === 9 && (
              <Pane key="9" icon={Dumbbell} eyebrow="Fitness" title="How do you stay active?" subtitle="We will schedule workouts into your roadmap.">
                <CardGrid cols={2}>
                  {WORKOUTS.map((w) => (
                    <ChoiceCard
                      key={w.value}
                      selected={state.workout_preference === w.value}
                      onClick={() => { update("workout_preference", w.value); setTimeout(advance, 180); }}
                      icon={w.icon}
                      label={w.label}
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 10 && (
              <Pane key="10" icon={Clock} eyebrow="Recovery" title="When do you sleep?" subtitle="Optimizing your circadian rhythm.">
                <CardGrid cols={1}>
                  {SLEEP.map((s) => (
                    <ChoiceCard
                      key={s.value}
                      selected={state.sleep_timing === s.value}
                      onClick={() => { update("sleep_timing", s.value); setTimeout(advance, 180); }}
                      icon={s.icon}
                      label={s.label}
                      wide
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 11 && (
              <Pane key="11" icon={Brain} eyebrow="Systems" title="How do you currently work?" subtitle="Understanding your productivity habits.">
                <CardGrid cols={1}>
                  {HABITS.map((h) => (
                    <ChoiceCard
                      key={h.value}
                      selected={state.productivity_habits === h.value}
                      onClick={() => { update("productivity_habits", h.value); setTimeout(advance, 180); }}
                      icon={h.icon}
                      label={h.label}
                      wide
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 12 && (
              <Pane key="12" icon={ShieldCheck} eyebrow="Reality Check" title="Current discipline level?" subtitle="Be honest. The AI adapts to this.">
                <CardGrid cols={1}>
                  {DISCIPLINE.map((d) => (
                    <ChoiceCard
                      key={d.value}
                      selected={state.discipline_level === d.value}
                      onClick={() => { update("discipline_level", d.value); setTimeout(advance, 180); }}
                      icon={d.icon}
                      label={d.label}
                      wide
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 13 && (
              <Pane key="13" icon={Target} eyebrow="Execution" title="When are you most focused?" subtitle="We will slot your hardest missions here.">
                <CardGrid cols={2}>
                  {STUDY.map((s) => (
                    <ChoiceCard
                      key={s.value}
                      selected={state.study_timing === s.value}
                      onClick={() => { update("study_timing", s.value); setTimeout(advance, 180); }}
                      icon={s.icon}
                      label={s.label}
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 text-xs text-blood-500 px-3 py-2.5 rounded-lg bg-blood-500/10 border border-blood-500/30 inline-flex items-start gap-2 w-full"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* ===== Bottom: CTA bar (always visible, mobile-app-like) ===== */}
      <footer className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 sticky bottom-0 z-20 backdrop-blur-md bg-obsidian/90 border-t border-white/[0.04]">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={advance}
            disabled={!canAdvance || busy}
            className="btn-primary btn-tap w-full disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 py-4 text-[15px] font-semibold"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sealing your path...
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                Enter the dojo
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </footer>
    </main>
  );
}

// ---------------- Subcomponents ----------------

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="mt-3 h-1 w-full rounded-full bg-white/8 overflow-hidden">
      <motion.div
        initial={false}
        animate={{ width: pct + "%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-gradient-to-r from-blood-700 via-blood-500 to-blood-400 shadow-[0_0_12px_rgba(208,0,0,0.55)]"
      />
    </div>
  );
}

interface PaneProps {
  icon: any;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

function Pane({ icon: Icon, eyebrow, title, subtitle, children }: PaneProps) {
  const v = paneVariants();
  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={v.transition}
      className="pb-6"
    >
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-blood-500">
        <span className="grid place-items-center h-6 w-6 rounded-md bg-blood-500/10 border border-blood-500/30">
          <Icon className="h-3 w-3" />
        </span>
        {eyebrow}
      </span>
      <h1 className="mt-3 text-[26px] leading-[1.15] font-semibold tracking-tight">
        {title}
      </h1>
      <p className="mt-2 text-sm text-white/55 leading-relaxed">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </motion.div>
  );
}

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric";
  autoComplete?: string;
  autoFocus?: boolean;
  centerLarge?: boolean;
}

function Input({
  value, onChange, placeholder, type = "text", inputMode,
  autoComplete, autoFocus, centerLarge
}: InputProps) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 focus-within:border-blood-500/60 transition-colors"
      }
    >
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={
          "bg-transparent outline-none w-full text-white placeholder-white/30 " +
          (centerLarge
            ? "text-3xl font-semibold text-center tracking-tight"
            : "text-[16px]")
        }
      />
    </div>
  );
}

function Helper({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-[11px] text-white/45 leading-relaxed">{children}</p>
  );
}

function CardGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={"grid gap-2.5 " + (cols === 1 ? "grid-cols-1" : "grid-cols-2")}>
      {children}
    </div>
  );
}

interface ChoiceCardProps {
  selected: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  hint?: string;
  wide?: boolean;
}

function ChoiceCard({ selected, onClick, icon: Icon, label, hint, wide }: ChoiceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={
        "tap-card btn-tap relative text-left rounded-xl border p-4 transition-all " +
        (selected
          ? "border-blood-500/70 bg-blood-500/[0.08] shadow-[inset_0_0_0_1px_rgba(208,0,0,0.25)]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25") +
        (wide ? " py-5" : "")
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            "grid place-items-center h-9 w-9 rounded-md border shrink-0 transition-colors " +
            (selected
              ? "bg-blood-500/20 border-blood-500/50 text-blood-500"
              : "bg-white/[0.03] border-white/10 text-white/70")
          }
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">{label}</div>
          {hint && (
            <div className="text-[11px] text-white/50 mt-1 leading-snug">{hint}</div>
          )}
        </div>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-2.5 right-2.5 grid place-items-center h-4 w-4 rounded-full bg-blood-500 text-white"
          >
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}

interface RowCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}

function RowCard({ selected, onClick, label, hint }: RowCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={
        "tap-card btn-tap w-full text-left rounded-xl border p-4 flex items-center justify-between gap-3 transition-all " +
        (selected
          ? "border-blood-500/70 bg-blood-500/[0.08]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25")
      }
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-white/50 mt-0.5">{hint}</div>
      </div>
      <span
        className={
          "grid place-items-center h-5 w-5 rounded-full border transition-colors " +
          (selected
            ? "bg-blood-500 border-blood-500 text-white"
            : "border-white/20 text-transparent")
        }
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </motion.button>
  );
}
