import type { WorkoutTrack } from "../types";

/**
 * HOME · BEGINNER — Absolute control. Bodyweight fundamentals.
 *
 * Philosophy: master the basics before adding intensity. Push, pull,
 * legs, plus mobility. Three full sessions per week with active
 * recovery and rest baked in for joint and CNS recovery.
 */
export const homeBeginner: WorkoutTrack = {
  id:          "home_beginner",
  label:       "Home · Beginner",
  location:    "home",
  level:       "beginner",
  weeklyFocus: "Build the base. Form before fatigue.",
  cycle: [
    {
      day: 1,
      title: "Push — Foundation",
      kind:  "push",
      target: ["Chest", "Shoulders", "Triceps", "Core"],
      strategy: "Slow eccentrics. Full range. Stop 2 reps before failure.",
      duration_min: 30,
      exercises: [
        { name: "Incline pushup (hands on chair/wall)", sets: 3, reps: "8-12", rest: "60 sec", notes: "Lower for 3 seconds, push for 1." },
        { name: "Pike pushup",                          sets: 3, reps: "6-10", rest: "60 sec", notes: "Hips high, head between hands." },
        { name: "Bench dip (knees bent)",               sets: 3, reps: "10-12", rest: "60 sec" },
        { name: "Plank hold",                           sets: 3, reps: "30 sec", rest: "45 sec", notes: "Glutes tight, no sag." }
      ],
      rest: "60 sec between sets",
      recovery: "Hydrate. Stretch chest and shoulders 5 min.",
      motivation: "Quiet reps build loud results."
    },
    {
      day: 2,
      title: "Pull — Foundation",
      kind:  "pull",
      target: ["Back", "Biceps", "Rear delts", "Core"],
      strategy: "Squeeze and pause. Pull with your back, not arms.",
      duration_min: 30,
      exercises: [
        { name: "Doorway row (towel grip)",            sets: 3, reps: "10-12", rest: "60 sec", notes: "Pull elbows back, chest up." },
        { name: "Superman hold",                        sets: 3, reps: "20 sec", rest: "45 sec" },
        { name: "Reverse snow angel (face down)",       sets: 3, reps: "12",    rest: "45 sec" },
        { name: "Hollow body hold",                     sets: 3, reps: "20 sec", rest: "45 sec" }
      ],
      rest: "60 sec between sets",
      recovery: "Scapular squeezes 2×20. Foam roll upper back if available.",
      motivation: "The back you can't see is the back that pulls."
    },
    {
      day: 3,
      title: "Legs — Foundation",
      kind:  "legs",
      target: ["Quads", "Glutes", "Hamstrings", "Calves"],
      strategy: "Depth over speed. Squeeze the glutes at the top.",
      duration_min: 32,
      exercises: [
        { name: "Bodyweight squat",      sets: 3, reps: "12-15", rest: "60 sec", notes: "Knees track over toes." },
        { name: "Reverse lunge",         sets: 3, reps: "10/side", rest: "60 sec" },
        { name: "Glute bridge",          sets: 3, reps: "15",    rest: "45 sec", notes: "Squeeze for 2 sec at top." },
        { name: "Calf raise (slow)",     sets: 3, reps: "15-20", rest: "30 sec" }
      ],
      rest: "60 sec between sets",
      recovery: "Couch stretch each side 60 sec. Hamstring stretch 60 sec.",
      motivation: "Strong legs carry the whole system."
    },
    {
      day: 4,
      title: "Mobility Flow",
      kind:  "mobility",
      target: ["Hips", "Shoulders", "Spine"],
      strategy: "Move slowly. Breathe through each position.",
      duration_min: 20,
      exercises: [
        { name: "Cat-cow",               sets: 2, reps: "10",    rest: "15 sec" },
        { name: "World's greatest stretch", sets: 2, reps: "5/side", rest: "15 sec" },
        { name: "90/90 hip rotation",    sets: 2, reps: "8/side", rest: "15 sec" },
        { name: "Thoracic windmill",     sets: 2, reps: "8/side", rest: "15 sec" }
      ],
      rest: "15-30 sec between sets",
      recovery: "Box breathing 5 rounds. Walk 5 min.",
      motivation: "Mobility is the foundation under every lift."
    },
    {
      day: 5,
      title: "Push — Volume Day",
      kind:  "push",
      target: ["Chest", "Shoulders", "Triceps"],
      strategy: "Add one rep over last week. Same form.",
      duration_min: 32,
      exercises: [
        { name: "Knee or full pushup",     sets: 4, reps: "8-10",  rest: "75 sec" },
        { name: "Diamond pushup (modified)", sets: 3, reps: "6-8", rest: "75 sec" },
        { name: "Pike shoulder press",     sets: 3, reps: "8",     rest: "75 sec" },
        { name: "Plank to pushup",         sets: 3, reps: "8",     rest: "60 sec" }
      ],
      rest: "75 sec between sets",
      recovery: "Pec stretch each side 60 sec.",
      motivation: "Showing up is the rep that matters most."
    },
    {
      day: 6,
      title: "Pull + Core",
      kind:  "pull",
      target: ["Back", "Biceps", "Core"],
      strategy: "Pause and squeeze at peak contraction.",
      duration_min: 30,
      exercises: [
        { name: "Inverted row (under table)", sets: 3, reps: "8-10",  rest: "75 sec" },
        { name: "Bird-dog",                    sets: 3, reps: "10/side", rest: "45 sec" },
        { name: "Dead bug",                    sets: 3, reps: "10/side", rest: "45 sec" },
        { name: "Side plank",                  sets: 2, reps: "20 sec/side", rest: "30 sec" }
      ],
      rest: "60 sec between sets",
      recovery: "Child's pose 60 sec. Deep breaths 10x.",
      motivation: "Discipline compounds — one quiet day at a time."
    },
    {
      day: 7,
      title: "Active Recovery",
      kind:  "active_recovery",
      target: ["Whole body"],
      strategy: "Move, don't strain. Recovery is part of the program.",
      duration_min: 20,
      exercises: [
        { name: "20-minute walk outside",      sets: 1, reps: "20 min", rest: "—" },
        { name: "Full body stretch routine",   sets: 1, reps: "10 min", rest: "—" }
      ],
      rest: "—",
      recovery: "Hydrate. Sleep 7+ hours tonight.",
      motivation: "Rest is not weakness — it's where growth happens."
    }
  ]
};
