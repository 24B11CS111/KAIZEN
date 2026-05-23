import type { WorkoutTrack } from "../types";

/**
 * HOME · ADVANCED — Mechanical disadvantage, density, overload.
 * Treats bodyweight as a programmable resistance via leverage.
 */
export const homeAdvanced: WorkoutTrack = {
  id:          "home_advanced",
  label:       "Home · Advanced",
  location:    "home",
  level:       "advanced",
  weeklyFocus: "Leverage > load. Mechanical disadvantage creates overload.",
  cycle: [
    {
      day: 1,
      title: "Push — Planche Progression",
      kind:  "push",
      target: ["Chest", "Shoulders", "Triceps", "Core"],
      strategy: "RPE 8-9. Long pauses in disadvantaged positions.",
      duration_min: 55,
      exercises: [
        { name: "Tuck planche hold",                sets: 5, reps: "10-20 sec", rest: "120 sec" },
        { name: "Pseudo-planche pushup (deep)",     sets: 5, reps: "5-8", rest: "120 sec" },
        { name: "One-arm pushup (negative)",        sets: 4, reps: "3/side", rest: "120 sec", notes: "5-sec lower." },
        { name: "Handstand pushup (wall)",          sets: 4, reps: "4-6", rest: "90 sec" },
        { name: "Ring or chair dip",                sets: 4, reps: "8-10", rest: "90 sec" }
      ],
      rest: "90-120 sec between sets",
      recovery: "Shoulder mobility 8 min. Wrist prep 3 min.",
      motivation: "Mastery is repetition with intent."
    },
    {
      day: 2,
      title: "Pull — Front Lever Progression",
      kind:  "pull",
      target: ["Lats", "Biceps", "Core"],
      strategy: "Tension is the strength. Stay tight, breathe under load.",
      duration_min: 50,
      exercises: [
        { name: "Tuck front lever hold",            sets: 5, reps: "10-15 sec", rest: "120 sec" },
        { name: "Pull-up (slow / weighted backpack)", sets: 5, reps: "5-7", rest: "120 sec" },
        { name: "Archer pull-up",                   sets: 4, reps: "3-5/side", rest: "120 sec" },
        { name: "Inverted row (tucked legs)",       sets: 4, reps: "10-12", rest: "90 sec" },
        { name: "Bicep chin-up (close grip)",       sets: 3, reps: "6-8", rest: "90 sec" }
      ],
      rest: "90-120 sec between sets",
      recovery: "Lat stretch + thoracic opener 8 min.",
      motivation: "Calluses are honest reps in physical form."
    },
    {
      day: 3,
      title: "Legs — Pistol + Density",
      kind:  "legs",
      target: ["Quads", "Glutes", "Hamstrings"],
      strategy: "Density sets. 20 min, max quality reps with minimum rest.",
      duration_min: 50,
      exercises: [
        { name: "Pistol squat",                       sets: 5, reps: "5-8/side", rest: "120 sec" },
        { name: "Shrimp squat (assisted ok)",         sets: 4, reps: "5/side", rest: "120 sec" },
        { name: "Nordic curl (eccentric)",            sets: 4, reps: "4-6", rest: "120 sec", notes: "Use anchor for feet." },
        { name: "Jump lunge",                         sets: 4, reps: "10/side", rest: "60 sec" },
        { name: "Single-leg calf raise (loaded)",     sets: 4, reps: "15/side", rest: "45 sec" }
      ],
      rest: "60-120 sec between sets",
      recovery: "Foam roll quads + hamstrings 8 min. Pigeon pose.",
      motivation: "Strong legs change the way you walk through life."
    },
    {
      day: 4,
      title: "Skill + Mobility",
      kind:  "mobility",
      target: ["Hips", "Shoulders", "CNS"],
      strategy: "Quality skill practice. Active recovery for tomorrow.",
      duration_min: 40,
      exercises: [
        { name: "Handstand wall hold",        sets: 5, reps: "30-60 sec", rest: "90 sec" },
        { name: "L-sit (parallel bars/floor)", sets: 5, reps: "15-25 sec", rest: "90 sec" },
        { name: "Pancake stretch",            sets: 3, reps: "60 sec", rest: "30 sec" },
        { name: "Bridge hold (back arch)",    sets: 3, reps: "30 sec", rest: "60 sec" },
        { name: "Jefferson curl (loaded)",    sets: 3, reps: "8", rest: "60 sec" }
      ],
      rest: "30-90 sec between sets",
      recovery: "Box breathing 10 rounds. Cold shower optional.",
      motivation: "Skill work compounds — every rep is data."
    },
    {
      day: 5,
      title: "Push — Density / EMOM",
      kind:  "push",
      target: ["Chest", "Shoulders", "Triceps"],
      strategy: "Every minute on the minute (EMOM). 20 min total.",
      duration_min: 45,
      exercises: [
        { name: "EMOM — 8 pseudo-planche pushups",    sets: 10, reps: "8/min", rest: "remainder of minute" },
        { name: "Ring fly (rings or sliders)",        sets: 4, reps: "8-10", rest: "90 sec" },
        { name: "Tricep extension (rings/door)",      sets: 4, reps: "10-12", rest: "75 sec" },
        { name: "Plank to handstand walk-up",         sets: 3, reps: "5", rest: "75 sec" }
      ],
      rest: "Variable — see strategy",
      recovery: "Wrist + shoulder rotations 5 min each.",
      motivation: "Density training reveals what consistency built."
    },
    {
      day: 6,
      title: "Pull — Lever / Skill",
      kind:  "pull",
      target: ["Back", "Biceps", "Core"],
      strategy: "Front lever and back lever skill work. RPE 8.",
      duration_min: 45,
      exercises: [
        { name: "Front lever raises (tucked)",     sets: 5, reps: "5-6", rest: "120 sec" },
        { name: "One-arm row (heavy backpack)",    sets: 4, reps: "6-8/side", rest: "90 sec" },
        { name: "Skin-the-cat (rings)",            sets: 3, reps: "3-5", rest: "90 sec" },
        { name: "Hanging leg raise",               sets: 4, reps: "8-10", rest: "75 sec" },
        { name: "Hollow body rock",                sets: 3, reps: "30 sec", rest: "60 sec" }
      ],
      rest: "75-120 sec between sets",
      recovery: "Dead hang 3×30 sec. Lat stretch 5 min.",
      motivation: "Quiet practice beats loud failure."
    },
    {
      day: 7,
      title: "Active Recovery",
      kind:  "active_recovery",
      target: ["CNS", "Cardiovascular"],
      strategy: "Restore. Walk, breathe, sleep early.",
      duration_min: 30,
      exercises: [
        { name: "Easy 30-min walk or zone-2 cycle",   sets: 1, reps: "30 min", rest: "—" },
        { name: "Full body mobility flow",            sets: 1, reps: "10 min", rest: "—" }
      ],
      rest: "—",
      recovery: "8 hours sleep. Cold shower in morning.",
      motivation: "Iron rests too. Smart athletes plan recovery."
    }
  ]
};
