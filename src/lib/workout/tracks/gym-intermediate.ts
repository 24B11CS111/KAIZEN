import type { WorkoutTrack } from "../types";

/**
 * GYM · INTERMEDIATE — Hypertrophy-focused PPL with increased frequency.
 * Progressive overload via reps × weight × form quality.
 */
export const gymIntermediate: WorkoutTrack = {
  id:          "gym_intermediate",
  label:       "Gym · Intermediate",
  location:    "gym",
  level:       "intermediate",
  weeklyFocus: "Push, pull, legs — twice through the week. Drive volume.",
  cycle: [
    {
      day: 1,
      title: "Push A — Chest Focus",
      kind:  "push",
      target: ["Chest", "Shoulders", "Triceps"],
      strategy: "Compound first, isolation after. Stop 1-2 reps short of failure.",
      duration_min: 60,
      exercises: [
        { name: "Barbell bench press",       sets: 4, reps: "6-8",   rest: "120 sec" },
        { name: "Incline dumbbell press",    sets: 4, reps: "8-10",  rest: "90 sec" },
        { name: "Standing overhead press",   sets: 3, reps: "6-8",   rest: "120 sec" },
        { name: "Cable chest fly",           sets: 3, reps: "10-12", rest: "60 sec" },
        { name: "Lateral raise",             sets: 4, reps: "12-15", rest: "60 sec" },
        { name: "Tricep rope pushdown",      sets: 3, reps: "10-12", rest: "60 sec" }
      ],
      rest: "60-120 sec between sets",
      recovery: "Chest + delt stretch 5 min. Protein within 60 min.",
      motivation: "Hypertrophy is the sum of clean reps over time."
    },
    {
      day: 2,
      title: "Pull A — Back Width",
      kind:  "pull",
      target: ["Back", "Biceps", "Rear delts"],
      strategy: "Pull with elbows, not arms. Squeeze at peak.",
      duration_min: 60,
      exercises: [
        { name: "Pull-up (weighted if able)", sets: 4, reps: "6-10", rest: "120 sec" },
        { name: "Barbell row (Pendlay)",      sets: 4, reps: "8",    rest: "120 sec" },
        { name: "Lat pulldown (wide)",        sets: 3, reps: "10-12", rest: "75 sec" },
        { name: "Seated cable row",           sets: 3, reps: "10-12", rest: "75 sec" },
        { name: "Face pull",                  sets: 4, reps: "15",   rest: "60 sec" },
        { name: "Dumbbell bicep curl",        sets: 3, reps: "10-12", rest: "60 sec" }
      ],
      rest: "60-120 sec between sets",
      recovery: "Lat stretch each side 60 sec. Decompress hang 30 sec.",
      motivation: "The back is built by reps you don't see in the mirror."
    },
    {
      day: 3,
      title: "Legs A — Quad Focus",
      kind:  "legs",
      target: ["Quads", "Glutes", "Calves"],
      strategy: "Squat heavy, leg press for volume. Drive through the heels.",
      duration_min: 65,
      exercises: [
        { name: "Barbell back squat",        sets: 5, reps: "5-6",   rest: "150 sec" },
        { name: "Bulgarian split squat",     sets: 3, reps: "10/side", rest: "90 sec" },
        { name: "Leg press",                 sets: 4, reps: "10-12", rest: "90 sec" },
        { name: "Leg extension",             sets: 3, reps: "12-15", rest: "60 sec" },
        { name: "Standing calf raise",       sets: 4, reps: "12-15", rest: "60 sec" }
      ],
      rest: "60-150 sec between sets",
      recovery: "Pigeon pose + couch stretch each side 90 sec.",
      motivation: "Heavy legs build heavy character."
    },
    {
      day: 4,
      title: "Push B — Shoulder Focus",
      kind:  "push",
      target: ["Shoulders", "Chest", "Triceps"],
      strategy: "Lighter compounds, heavier isolation. Time-under-tension on raises.",
      duration_min: 55,
      exercises: [
        { name: "Seated dumbbell shoulder press", sets: 4, reps: "8-10", rest: "90 sec" },
        { name: "Incline barbell press",     sets: 4, reps: "8-10", rest: "90 sec" },
        { name: "Dumbbell lateral raise",    sets: 5, reps: "12-15", rest: "45 sec" },
        { name: "Cable chest fly (high to low)", sets: 3, reps: "12", rest: "60 sec" },
        { name: "Overhead tricep extension", sets: 3, reps: "10-12", rest: "60 sec" }
      ],
      rest: "45-90 sec between sets",
      recovery: "Shoulder mobility 5 min. Pec doorway stretch.",
      motivation: "Caps build the silhouette. Train shoulders with respect."
    },
    {
      day: 5,
      title: "Pull B — Back Thickness",
      kind:  "pull",
      target: ["Back", "Biceps", "Forearms"],
      strategy: "Row-heavy day. Squeeze and pause 1 sec at top.",
      duration_min: 60,
      exercises: [
        { name: "Deadlift",                   sets: 4, reps: "5",     rest: "180 sec" },
        { name: "T-bar row (or chest-supported)", sets: 4, reps: "8-10", rest: "90 sec" },
        { name: "Single-arm dumbbell row",    sets: 3, reps: "10/side", rest: "75 sec" },
        { name: "Hammer curl",                sets: 3, reps: "10-12", rest: "60 sec" },
        { name: "Reverse pec deck (rear delt)", sets: 3, reps: "12-15", rest: "60 sec" }
      ],
      rest: "60-180 sec between sets",
      recovery: "Decompression hang 60 sec. Hip flexor stretch.",
      motivation: "Pull harder. Stand taller."
    },
    {
      day: 6,
      title: "Legs B — Posterior Chain",
      kind:  "legs",
      target: ["Hamstrings", "Glutes", "Calves"],
      strategy: "Hinge-focused. Slow eccentrics on RDLs.",
      duration_min: 60,
      exercises: [
        { name: "Romanian deadlift",          sets: 4, reps: "8-10", rest: "120 sec" },
        { name: "Hip thrust",                 sets: 4, reps: "10-12", rest: "90 sec" },
        { name: "Walking lunge",              sets: 3, reps: "12/side", rest: "75 sec" },
        { name: "Lying leg curl",             sets: 3, reps: "12-15", rest: "60 sec" },
        { name: "Seated calf raise",          sets: 4, reps: "15-20", rest: "45 sec" }
      ],
      rest: "45-120 sec between sets",
      recovery: "Hamstring + glute stretch 6 min.",
      motivation: "Posterior chain wins the race."
    },
    {
      day: 7,
      title: "Active Recovery",
      kind:  "active_recovery",
      target: ["Cardiovascular", "Mobility"],
      strategy: "Zone-2 cardio. Mobility flow. No CNS strain.",
      duration_min: 35,
      exercises: [
        { name: "Cycle / row / incline walk",  sets: 1, reps: "25 min", rest: "—" },
        { name: "Full-body mobility flow",     sets: 1, reps: "10 min", rest: "—" }
      ],
      rest: "—",
      recovery: "Sleep 8 hours. Track next week's lifts.",
      motivation: "Plan the week. Earn the body."
    }
  ]
};
