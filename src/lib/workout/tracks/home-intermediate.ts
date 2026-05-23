import type { WorkoutTrack } from "../types";

/**
 * HOME · INTERMEDIATE — High-volume PPL with unilateral progressions.
 * Time-under-tension is the lever. Tempo, pause, and density training.
 */
export const homeIntermediate: WorkoutTrack = {
  id:          "home_intermediate",
  label:       "Home · Intermediate",
  location:    "home",
  level:       "intermediate",
  weeklyFocus: "Volume, tempo, control. Time-under-tension is the lever.",
  cycle: [
    {
      day: 1,
      title: "Push — Volume",
      kind:  "push",
      target: ["Chest", "Shoulders", "Triceps"],
      strategy: "3-1-1 tempo (3s down, 1s pause, 1s up). Stop 1 rep short of failure.",
      duration_min: 45,
      exercises: [
        { name: "Decline pushup",                  sets: 4, reps: "10-12", rest: "75 sec" },
        { name: "Archer pushup (each side)",       sets: 3, reps: "6/side", rest: "75 sec", notes: "Shift weight to one arm." },
        { name: "Pike pushup (feet elevated)",     sets: 4, reps: "8-10", rest: "75 sec" },
        { name: "Diamond pushup",                  sets: 3, reps: "8-10", rest: "60 sec" },
        { name: "Bench dip (legs straight)",       sets: 3, reps: "12-15", rest: "60 sec" }
      ],
      rest: "60-75 sec between sets",
      recovery: "Pec, lat, and tricep stretch 5 min.",
      motivation: "Tempo is the difference between exercise and training."
    },
    {
      day: 2,
      title: "Pull — Density",
      kind:  "pull",
      target: ["Back", "Biceps", "Rear delts"],
      strategy: "Rest-pause sets. 10 reps, 15s rest, 5 reps, 15s, AMRAP.",
      duration_min: 45,
      exercises: [
        { name: "Inverted row",                  sets: 4, reps: "10-12", rest: "75 sec" },
        { name: "Towel chin (door pullup alt)",  sets: 4, reps: "AMRAP", rest: "90 sec", notes: "Use sturdy door + towel." },
        { name: "Reverse fly (water bottles)",   sets: 3, reps: "12-15", rest: "60 sec" },
        { name: "Superman + hold",               sets: 3, reps: "12", rest: "60 sec", notes: "Hold top 3 sec." },
        { name: "Hollow rock",                   sets: 3, reps: "15", rest: "45 sec" }
      ],
      rest: "60-90 sec between sets",
      recovery: "Pull-apart band or face-pull motion 2×15.",
      motivation: "Density training builds work capacity."
    },
    {
      day: 3,
      title: "Legs — Unilateral",
      kind:  "legs",
      target: ["Quads", "Glutes", "Hamstrings", "Calves"],
      strategy: "Single-leg focus. Imbalances surface fast — fix them.",
      duration_min: 45,
      exercises: [
        { name: "Bulgarian split squat (foot on chair)", sets: 4, reps: "10/side", rest: "75 sec" },
        { name: "Pistol squat (or assisted)",            sets: 3, reps: "5-8/side", rest: "90 sec" },
        { name: "Single-leg glute bridge",               sets: 3, reps: "12/side", rest: "60 sec" },
        { name: "Reverse lunge with knee drive",         sets: 3, reps: "10/side", rest: "60 sec" },
        { name: "Calf raise (single-leg)",               sets: 3, reps: "15/side", rest: "45 sec" }
      ],
      rest: "60-90 sec between sets",
      recovery: "Couch stretch + pigeon pose 2 min each side.",
      motivation: "One leg at a time exposes everything you've hidden."
    },
    {
      day: 4,
      title: "Mobility + Core",
      kind:  "mobility",
      target: ["Spine", "Hips", "Core"],
      strategy: "Active mobility. Strength in stretched positions.",
      duration_min: 30,
      exercises: [
        { name: "Cossack squat",            sets: 3, reps: "8/side", rest: "45 sec" },
        { name: "Hanging knee raise (or lying)", sets: 3, reps: "10-12", rest: "60 sec" },
        { name: "Side plank with reach",    sets: 3, reps: "8/side", rest: "45 sec" },
        { name: "Jefferson curl (slow)",    sets: 3, reps: "8", rest: "60 sec", notes: "Light load if available." },
        { name: "L-sit hold (tucked)",      sets: 3, reps: "15-20 sec", rest: "60 sec" }
      ],
      rest: "45-60 sec between sets",
      recovery: "Spinal decompression — hang from a bar 30 sec.",
      motivation: "Mobility is strength in a wider range."
    },
    {
      day: 5,
      title: "Push — Strength",
      kind:  "push",
      target: ["Chest", "Shoulders", "Triceps"],
      strategy: "Heavier mechanical leverage. Lower reps, slower tempo.",
      duration_min: 40,
      exercises: [
        { name: "Pseudo-planche pushup",      sets: 5, reps: "5-8", rest: "90 sec", notes: "Hands by hips, lean forward." },
        { name: "Decline pike pushup",        sets: 4, reps: "6-8", rest: "90 sec" },
        { name: "Tricep extension (door)",    sets: 3, reps: "10-12", rest: "75 sec" },
        { name: "Plank reach-out",            sets: 3, reps: "10/side", rest: "60 sec" }
      ],
      rest: "75-90 sec between sets",
      recovery: "Wrist circles + thoracic stretches 5 min.",
      motivation: "Strength is built in the boring sets."
    },
    {
      day: 6,
      title: "Pull — Hypertrophy",
      kind:  "pull",
      target: ["Back", "Biceps"],
      strategy: "Higher reps. Mind-muscle connection. Squeeze peak contraction 2 sec.",
      duration_min: 40,
      exercises: [
        { name: "Wide-grip inverted row",      sets: 4, reps: "10-12", rest: "75 sec" },
        { name: "Towel curl (isometric)",      sets: 3, reps: "30 sec", rest: "60 sec" },
        { name: "Backpack bicep curl",         sets: 4, reps: "10-12", rest: "60 sec", notes: "Loaded backpack works fine." },
        { name: "Y-T-W raises (face down)",    sets: 3, reps: "8 each", rest: "60 sec" },
        { name: "Wall scapular pull-up",       sets: 3, reps: "12-15", rest: "45 sec" }
      ],
      rest: "60-75 sec between sets",
      recovery: "Lat stretch each side 60 sec. Decompress 30 sec.",
      motivation: "Volume builds muscle. Consistency builds physique."
    },
    {
      day: 7,
      title: "Active Recovery",
      kind:  "active_recovery",
      target: ["Cardiovascular", "Whole body"],
      strategy: "Zone-2 cardio. Conversational pace. No strain.",
      duration_min: 35,
      exercises: [
        { name: "30-min easy run or fast walk", sets: 1, reps: "30 min", rest: "—" },
        { name: "Full-body mobility flow",      sets: 1, reps: "5 min",  rest: "—" }
      ],
      rest: "—",
      recovery: "Cold shower 60 sec. Sleep 7+ hours.",
      motivation: "Recovery is your secret weapon."
    }
  ]
};
