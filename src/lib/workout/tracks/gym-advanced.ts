import type { WorkoutTrack } from "../types";

/**
 * GYM · ADVANCED — Pro-level bodybuilding split.
 * 6 training days / 1 rest. Intensity techniques: dropsets, supersets,
 * rest-pause, partial reps, mechanical drops.
 */
export const gymAdvanced: WorkoutTrack = {
  id:          "gym_advanced",
  label:       "Gym · Advanced",
  location:    "gym",
  level:       "advanced",
  weeklyFocus: "Bro split + intensity techniques. Train to RIR 0-1 on last set.",
  cycle: [
    {
      day: 1,
      title: "Chest — Mass + Detail",
      kind:  "chest",
      target: ["Chest", "Triceps", "Core"],
      strategy: "Heavy compound, dropset finisher. RIR 0 on last set.",
      duration_min: 70,
      exercises: [
        { name: "Barbell bench press",            sets: 5, reps: "4-6",   rest: "150 sec" },
        { name: "Incline dumbbell press",         sets: 4, reps: "8-10",  rest: "90 sec" },
        { name: "Weighted dip",                   sets: 4, reps: "8-10",  rest: "90 sec" },
        { name: "Cable fly (high-to-low + low-to-high superset)", sets: 4, reps: "12+12", rest: "75 sec" },
        { name: "Pec deck — DROPSET finish",      sets: 3, reps: "10 → 8 → 6", rest: "90 sec", notes: "Drop weight 20% each step." }
      ],
      rest: "75-150 sec between sets",
      recovery: "Chest stretch + foam roll thoracic 8 min.",
      motivation: "Failure is the cost of growth."
    },
    {
      day: 2,
      title: "Back — Width + Thickness",
      kind:  "back",
      target: ["Lats", "Mid back", "Rear delts", "Biceps"],
      strategy: "Width compounds first, then thickness rows. Mind-muscle on every rep.",
      duration_min: 75,
      exercises: [
        { name: "Weighted pull-up",               sets: 5, reps: "5-7",   rest: "150 sec" },
        { name: "Barbell row (Pendlay)",          sets: 4, reps: "6-8",   rest: "120 sec" },
        { name: "T-bar row",                      sets: 4, reps: "8-10",  rest: "90 sec" },
        { name: "Single-arm cable row",           sets: 3, reps: "10/side", rest: "75 sec" },
        { name: "Straight-arm pulldown — REST-PAUSE", sets: 3, reps: "12+4+4", rest: "120 sec", notes: "15 sec rests between mini-sets." },
        { name: "Face pull",                      sets: 4, reps: "15",   rest: "45 sec" }
      ],
      rest: "45-150 sec between sets",
      recovery: "Lat stretch 90 sec each side. Decompress hang 60 sec.",
      motivation: "Back day is character day."
    },
    {
      day: 3,
      title: "Legs — Quads + Glutes",
      kind:  "legs",
      target: ["Quads", "Glutes", "Calves"],
      strategy: "Heavy squat. Volume on accessories. Long sets, short rest on calves.",
      duration_min: 80,
      exercises: [
        { name: "Barbell back squat",             sets: 6, reps: "3-5",   rest: "180 sec" },
        { name: "Front squat",                    sets: 3, reps: "8",     rest: "120 sec" },
        { name: "Walking lunge (loaded)",         sets: 3, reps: "12/side", rest: "90 sec" },
        { name: "Leg extension — MECHANICAL DROP", sets: 4, reps: "10 → 10 → 8", rest: "90 sec", notes: "Drop weight 20% each phase." },
        { name: "Standing calf raise — REST-PAUSE", sets: 3, reps: "15+5+5", rest: "60 sec" }
      ],
      rest: "60-180 sec between sets",
      recovery: "Pigeon + couch stretch 2 min each side. Cold contrast shower.",
      motivation: "Quad day separates committed from curious."
    },
    {
      day: 4,
      title: "Shoulders — Caps + Rear",
      kind:  "shoulders",
      target: ["Front delts", "Side delts", "Rear delts", "Traps"],
      strategy: "Volume on lateral raises. 5+ sets minimum.",
      duration_min: 65,
      exercises: [
        { name: "Standing barbell press",         sets: 4, reps: "6-8",   rest: "120 sec" },
        { name: "Seated dumbbell press",          sets: 4, reps: "8-10",  rest: "90 sec" },
        { name: "Lateral raise — GIANT SET (5 rounds, no rest)", sets: 5, reps: "12-15", rest: "60 sec after the round" },
        { name: "Cable rear delt fly",            sets: 4, reps: "12-15", rest: "45 sec" },
        { name: "Barbell shrug",                  sets: 4, reps: "10-12", rest: "60 sec" },
        { name: "Plate front raise",              sets: 3, reps: "10",    rest: "60 sec" }
      ],
      rest: "45-120 sec between sets",
      recovery: "Shoulder mobility 8 min. Foam roll upper traps.",
      motivation: "Round shoulders. Sharper silhouette."
    },
    {
      day: 5,
      title: "Arms — Bi + Tri Specialization",
      kind:  "arms",
      target: ["Biceps", "Triceps", "Forearms"],
      strategy: "Alternate bi/tri supersets. Pump-focused.",
      duration_min: 55,
      exercises: [
        { name: "Barbell curl + Skullcrusher SUPERSET", sets: 4, reps: "10 + 10", rest: "90 sec" },
        { name: "Incline dumbbell curl + Overhead extension SUPERSET", sets: 4, reps: "10 + 10", rest: "75 sec" },
        { name: "Hammer curl + Rope pushdown SUPERSET",  sets: 4, reps: "12 + 12", rest: "60 sec" },
        { name: "Cable curl — 21s",                sets: 3, reps: "7+7+7", rest: "60 sec" },
        { name: "Tricep dip (weighted)",           sets: 3, reps: "10-12", rest: "75 sec" },
        { name: "Wrist curl",                      sets: 3, reps: "15-20", rest: "45 sec" }
      ],
      rest: "45-90 sec between sets",
      recovery: "Bicep + tricep stretch 4 min.",
      motivation: "Detail work is the difference between strong and impressive."
    },
    {
      day: 6,
      title: "Legs — Posterior + Weak Point",
      kind:  "weak_point",
      target: ["Hamstrings", "Glutes", "Calves", "Weak point of the week"],
      strategy: "Hinge-heavy. Weak-point block at the end (your call).",
      duration_min: 75,
      exercises: [
        { name: "Conventional deadlift",          sets: 5, reps: "3-5",   rest: "180 sec" },
        { name: "Romanian deadlift",              sets: 4, reps: "8",     rest: "120 sec" },
        { name: "Hip thrust (heavy)",             sets: 4, reps: "8-10",  rest: "90 sec" },
        { name: "Lying leg curl",                 sets: 4, reps: "10-12", rest: "60 sec" },
        { name: "Seated calf raise — GIANT SET",  sets: 4, reps: "20+15+10", rest: "75 sec" },
        { name: "Weak point bonus (your choice)", sets: 3, reps: "12-15", rest: "60 sec", notes: "Lagging muscle: forearms, abs, rear delts, etc." }
      ],
      rest: "60-180 sec between sets",
      recovery: "Hamstring + glute stretch 6 min. Sleep 8+ hours.",
      motivation: "Your weak point is the doorway to your next level."
    },
    {
      day: 7,
      title: "Rest + Mobility",
      kind:  "rest",
      target: ["Whole body"],
      strategy: "Full rest from lifting. Restorative movement only.",
      duration_min: 20,
      exercises: [
        { name: "Walking 20-30 min",              sets: 1, reps: "20 min", rest: "—" },
        { name: "Full-body mobility / yoga flow", sets: 1, reps: "15 min", rest: "—" }
      ],
      rest: "—",
      recovery: "Plan next week's progression. Track PRs.",
      motivation: "Recovery is when you grow. Honor it."
    }
  ]
};
