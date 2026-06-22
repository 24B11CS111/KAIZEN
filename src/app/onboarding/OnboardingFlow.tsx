"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle,
  User, Briefcase, Clock, Target, Sword, Cpu,
  Brain, Zap, Dumbbell, ShieldCheck, Building2, Rocket, BookOpen
} from "lucide-react";
import { OnboardingSchema } from "@/lib/validation";

// ---------------- Types ----------------

type Occupation = "school_student" | "intermediate_student" | "college_student" | "working_professional" | "job_seeker" | "self_employed" | "other";
type Goal = "crack_placements" | "full_stack_dev" | "improve_discipline" | "aiml_mastery" | "build_projects" | "learn_programming" | "prepare_exams" | "other";
type WorkoutPreference = "gym" | "home_workout" | "calisthenics" | "cardio" | "none";
type DisciplineLevel = "poor" | "average" | "good" | "elite";
type StudyTiming = "morning" | "afternoon" | "evening" | "late_night" | "none";
type EnergyLevel = "low" | "medium" | "high";
type WorkType = "remote" | "office" | "hybrid" | "student";

interface State {
  full_name: string;
  occupation: Occupation | "";
  main_goal: Goal | "";
  wake_time: string;
  sleep_time: string;
  available_hours: number | "";
  discipline_level: DisciplineLevel | "";
  workout_preference: WorkoutPreference | "";
  energy_level: EnergyLevel | "";
  study_timing: StudyTiming | "";
  work_type: WorkType | "";
  distractions: string;
  skills_to_learn: string;
}

// ---------------- Static option sets ----------------

const OCCUPATIONS: { value: Occupation; label: string; icon: any; hint?: string }[] = [
  { value: "college_student", label: "University Student", icon: Building2, hint: "Degree / Academics" },
  { value: "working_professional", label: "Working Professional", icon: Briefcase, hint: "Career growth" },
  { value: "job_seeker", label: "Job Seeker", icon: Target, hint: "Skill building & hunting" },
  { value: "self_employed", label: "Creator / Entrepreneur", icon: Rocket, hint: "Building my own thing" },
  { value: "school_student", label: "High School Student", icon: BookOpen, hint: "Building early discipline" },
  { value: "other", label: "Other", icon: User }
];

const WORK_TYPES: { value: WorkType; label: string; icon: any }[] = [
  { value: "remote", label: "Remote / WFH", icon: Target },
  { value: "office", label: "In Office", icon: Building2 },
  { value: "hybrid", label: "Hybrid", icon: Briefcase },
  { value: "student", label: "Full-time Student", icon: BookOpen }
];

const GOALS: { value: Goal; label: string; icon: any; hint: string }[] = [
  { value: "improve_discipline", label: "Improve discipline", icon: ShieldCheck, hint: "Daily consistency" },
  { value: "build_projects", label: "Build a product", icon: Rocket, hint: "Launch something real" },
  { value: "learn_programming", label: "Learn tech skills", icon: Cpu, hint: "Programming, AI, etc." },
  { value: "crack_placements", label: "Land a job / offer", icon: Target, hint: "Career breakthrough" },
  { value: "prepare_exams", label: "Clear an exam", icon: BookOpen, hint: "Academics" },
  { value: "other", label: "Something else", icon: Zap, hint: "I'll tell you" }
];

const ENERGY_LEVELS: { value: EnergyLevel; label: string; icon: any }[] = [
  { value: "high", label: "High (Relentless)", icon: Zap },
  { value: "medium", label: "Medium (Steady)", icon: Brain },
  { value: "low", label: "Low (Burned out)", icon: AlertTriangle }
];

const STUDY_TIMING: { value: StudyTiming; label: string; icon: any }[] = [
  { value: "morning", label: "Early Morning", icon: Zap },
  { value: "afternoon", label: "Afternoon", icon: Target },
  { value: "evening", label: "Evening", icon: BookOpen },
  { value: "late_night", label: "Late Night", icon: Clock }
];

const WORKOUTS: { value: WorkoutPreference; label: string; icon: any }[] = [
  { value: "gym", label: "Gym (Weights)", icon: Dumbbell },
  { value: "home_workout", label: "Home Workout", icon: Target },
  { value: "calisthenics", label: "Calisthenics", icon: Sword },
  { value: "cardio", label: "Cardio / Running", icon: Zap },
  { value: "none", label: "None yet", icon: User }
];

const DISCIPLINE: { value: DisciplineLevel; label: string; icon: any }[] = [
  { value: "poor", label: "Poor (Procrastinate a lot)", icon: AlertTriangle },
  { value: "average", label: "Average (Inconsistent)", icon: User },
  { value: "good", label: "Good (Mostly consistent)", icon: Check },
  { value: "elite", label: "Elite (Unbreakable)", icon: ShieldCheck }
];

const TOTAL_STEPS = 10;

// ---------------- Animation Variants ----------------
const paneVariants = () => ({
  initial: { opacity: 0, x: 15, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit:    { opacity: 0, x: -15, filter: "blur(4px)" },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
});

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<State>({
    full_name: "",
    occupation: "",
    main_goal: "",
    wake_time: "",
    sleep_time: "",
    available_hours: "",
    discipline_level: "",
    workout_preference: "",
    energy_level: "",
    study_timing: "",
    work_type: "",
    distractions: "",
    skills_to_learn: ""
  });

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const update = (key: keyof State, val: any) => {
    setState((prev) => ({ ...prev, [key]: val }));
    setError(null);
  };

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1 && !state.full_name.trim()) {
      setError("Please enter your name.");
      return false;
    }
    if (step === 2 && !state.occupation) {
      setError("Please select your primary arena.");
      return false;
    }
    if (step === 3 && !state.work_type) {
      setError("Please select your work type.");
      return false;
    }
    if (step === 4 && (!state.wake_time || !state.sleep_time)) {
      setError("Please provide both wake and sleep times.");
      return false;
    }
    if (step === 5 && !state.main_goal) {
      setError("Please select a primary goal.");
      return false;
    }
    if (step === 6 && !state.available_hours) {
      setError("Please enter your available focus hours.");
      return false;
    }
    if (step === 7 && (!state.energy_level || !state.study_timing)) {
      setError("Please select your energy level and focus timing.");
      return false;
    }
    if (step === 8 && !state.discipline_level) {
      setError("Please honestly assess your discipline.");
      return false;
    }
    if (step === 9 && !state.workout_preference) {
      setError("Please select a workout preference.");
      return false;
    }
    return true;
  };

  const advance = async () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      await finish();
    }
  };

  const back = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      setError(null);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      const payload = OnboardingSchema.parse({
        ...state,
        available_hours: Number(state.available_hours)
      });
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to finalize your system.");
      }
      router.push("/dojo");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setBusy(false);
    }
  };

  const canAdvance = true;

  return (
    <main className="min-h-screen bg-obsidian text-white font-sans antialiased selection:bg-blood-500/30 flex flex-col relative overflow-hidden">
      {/* ===== Background Accents ===== */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blood-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blood-800/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* ===== Top Navbar ===== */}
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))] pb-3 sticky top-0 z-20 backdrop-blur-md bg-obsidian/80 border-b border-white/[0.04]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={back}
            className={"p-2 -ml-2 rounded-full transition-colors " + (step === 1 ? "opacity-0 pointer-events-none" : "hover:bg-white/5 active:bg-white/10")}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-white/70" />
          </button>
          <div className="text-[11px] font-medium tracking-widest text-white/40 uppercase">
            Phase {step} <span className="opacity-40">/</span> {TOTAL_STEPS}
          </div>
          <div className="w-9" />
        </div>
        <div className="max-w-md mx-auto">
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>
      </header>

      {/* ===== Scrollable Content ===== */}
      <section className="flex-1 overflow-y-auto px-5 pt-8 pb-32 z-10">
        <div className="max-w-md mx-auto h-full flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Pane key="s1" icon={User} eyebrow="IDENTITY" title="What is your name?" subtitle="How shall the system address you?">
                <Input
                  value={state.full_name}
                  onChange={(v: string) => update("full_name", v)}
                  placeholder="e.g. John Doe"
                  autoFocus
                  centerLarge
                />
              </Pane>
            )}

            {step === 2 && (
              <Pane key="s2" icon={Briefcase} eyebrow="ARENA" title="What is your primary arena?" subtitle="Identify your current professional state.">
                <CardGrid cols={1}>
                  {OCCUPATIONS.map((o) => (
                    <RowCard
                      key={o.value}
                      selected={state.occupation === o.value}
                      onClick={() => { update("occupation", o.value); setTimeout(advance, 180); }}
                      label={o.label}
                      hint={o.hint || ""}
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 3 && (
              <Pane key="s3" icon={Building2} eyebrow="ENVIRONMENT" title="How do you operate?" subtitle="Your physical work environment dictates your execution strategy.">
                <CardGrid>
                  {WORK_TYPES.map((w) => (
                    <ChoiceCard
                      key={w.value}
                      selected={state.work_type === w.value}
                      onClick={() => { update("work_type", w.value); setTimeout(advance, 180); }}
                      icon={w.icon}
                      label={w.label}
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 4 && (
              <Pane key="s4" icon={Clock} eyebrow="RHYTHM" title="Establish your biorhythm" subtitle="When do you rise and when do you rest? (e.g., 06:00 and 23:00)">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block uppercase tracking-wider font-semibold">Wake Time</label>
                    <Input type="time" value={state.wake_time} onChange={(v: string) => update("wake_time", v)} />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-2 block uppercase tracking-wider font-semibold">Sleep Time</label>
                    <Input type="time" value={state.sleep_time} onChange={(v: string) => update("sleep_time", v)} />
                  </div>
                </div>
              </Pane>
            )}

            {step === 5 && (
              <Pane key="s5" icon={Target} eyebrow="DIRECTIVE" title="What is your prime directive?" subtitle="The singular goal we are optimizing for over the next 30 days.">
                <CardGrid cols={1}>
                  {GOALS.map((g) => (
                    <RowCard
                      key={g.value}
                      selected={state.main_goal === g.value}
                      onClick={() => { update("main_goal", g.value); setTimeout(advance, 180); }}
                      label={g.label}
                      hint={g.hint}
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 6 && (
              <Pane key="s6" icon={Zap} eyebrow="CAPACITY" title="Available Execution Hours" subtitle="How many deep, uninterrupted hours can you commit daily towards this goal?">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={String(state.available_hours)}
                  onChange={(v: string) => update("available_hours", parseInt(v) || "")}
                  placeholder="e.g. 4"
                  centerLarge
                />
              </Pane>
            )}

            {step === 7 && (
              <Pane key="s7" icon={Brain} eyebrow="ENERGY" title="Energy & Timing" subtitle="Assess your peak biological states.">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-semibold">Overall Energy Level</label>
                    <CardGrid>
                      {ENERGY_LEVELS.map((e) => (
                        <ChoiceCard
                          key={e.value}
                          selected={state.energy_level === e.value}
                          onClick={() => update("energy_level", e.value)}
                          icon={e.icon}
                          label={e.label}
                        />
                      ))}
                    </CardGrid>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-3 block uppercase tracking-wider font-semibold">Preferred Deep Work Timing</label>
                    <CardGrid>
                      {STUDY_TIMING.map((s) => (
                        <ChoiceCard
                          key={s.value}
                          selected={state.study_timing === s.value}
                          onClick={() => update("study_timing", s.value)}
                          icon={s.icon}
                          label={s.label}
                        />
                      ))}
                    </CardGrid>
                  </div>
                </div>
              </Pane>
            )}

            {step === 8 && (
              <Pane key="s8" icon={ShieldCheck} eyebrow="ASSESSMENT" title="Assess your discipline" subtitle="Be brutally honest. The AI needs the truth to build a realistic ramp-up.">
                <CardGrid cols={1}>
                  {DISCIPLINE.map((d) => (
                    <RowCard
                      key={d.value}
                      selected={state.discipline_level === d.value}
                      onClick={() => { update("discipline_level", d.value); setTimeout(advance, 180); }}
                      label={d.label}
                      hint=""
                    />
                  ))}
                </CardGrid>
              </Pane>
            )}

            {step === 9 && (
              <Pane key="s9" icon={Dumbbell} eyebrow="PHYSICAL" title="How do you train?" subtitle="Physical exertion is required for high cognitive performance.">
                <CardGrid>
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
              <Pane key="s10" icon={Sword} eyebrow="ENEMIES & ARSENAL" title="Identify the gaps" subtitle="Name your worst distractions and the core skills you must learn.">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block uppercase tracking-wider font-semibold">Biggest Distractions</label>
                    <Input
                      value={state.distractions}
                      onChange={(v: string) => update("distractions", v)}
                      placeholder="e.g. Instagram, Gaming, Overthinking"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 mb-2 block uppercase tracking-wider font-semibold">Skills to acquire</label>
                    <Input
                      value={state.skills_to_learn}
                      onChange={(v: string) => update("skills_to_learn", v)}
                      placeholder="e.g. Next.js, System Design, Writing"
                    />
                  </div>
                </div>
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

      {/* ===== Bottom CTA ===== */}
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
                Generating AI Strategy...
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                Initialize System
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

function Pane({ icon: Icon, eyebrow, title, subtitle, children }: any) {
  const v = paneVariants();
  return (
    <motion.div initial={v.initial} animate={v.animate} exit={v.exit} transition={v.transition} className="pb-6">
      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-blood-500">
        <span className="grid place-items-center h-6 w-6 rounded-md bg-blood-500/10 border border-blood-500/30">
          <Icon className="h-3 w-3" />
        </span>
        {eyebrow}
      </span>
      <h1 className="mt-3 text-[26px] leading-[1.15] font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-white/55 leading-relaxed">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </motion.div>
  );
}

function Input({ value, onChange, placeholder, type = "text", centerLarge }: any) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 focus-within:border-blood-500/60 transition-colors">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={"bg-transparent outline-none w-full text-white placeholder-white/30 " + (centerLarge ? "text-3xl font-semibold text-center tracking-tight" : "text-[16px]")}
      />
    </div>
  );
}

function CardGrid({ children, cols = 2 }: any) {
  return <div className={"grid gap-2.5 " + (cols === 1 ? "grid-cols-1" : "grid-cols-2")}>{children}</div>;
}

function ChoiceCard({ selected, onClick, icon: Icon, label }: any) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={"tap-card btn-tap relative text-left rounded-xl border p-4 transition-all " + (selected ? "border-blood-500/70 bg-blood-500/[0.08] shadow-[inset_0_0_0_1px_rgba(208,0,0,0.25)]" : "border-white/10 bg-white/[0.02] hover:border-white/25")}
    >
      <div className="flex items-start gap-3">
        <span className={"grid place-items-center h-9 w-9 rounded-md border shrink-0 transition-colors " + (selected ? "bg-blood-500/20 border-blood-500/50 text-blood-500" : "bg-white/[0.03] border-white/10 text-white/70")}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight">{label}</div>
        </div>
        {selected && (
          <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute top-2.5 right-2.5 grid place-items-center h-4 w-4 rounded-full bg-blood-500 text-white">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}

function RowCard({ selected, onClick, label, hint }: any) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={"tap-card btn-tap w-full text-left rounded-xl border p-4 flex items-center justify-between gap-3 transition-all " + (selected ? "border-blood-500/70 bg-blood-500/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/25")}
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="text-[11px] text-white/50 mt-0.5">{hint}</div>}
      </div>
      <span className={"grid place-items-center h-5 w-5 rounded-full border transition-colors " + (selected ? "bg-blood-500 border-blood-500 text-white" : "border-white/20 text-transparent")}>
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </motion.button>
  );
}
