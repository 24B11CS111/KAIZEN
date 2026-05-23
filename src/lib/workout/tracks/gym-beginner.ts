import type { WorkoutTrack } from "../types";

/**
 * GYM · BEGINNER — Full body + basic split foundation.
 * 3 lifting sessions per week, plus active recovery / cardio.
 */
export const gymBeginner: WorkoutTrack = {
  id:          "gym_beginner",
  label:       "Gym · Beginner",
  location:    "gym",
  level:       "beginner",
  weeklyFocus: "Learn the big lifts. Movement quality > weight.",
  cycle: [
    {
      day: 1,
      title: "Full Body — Foundation A",
      kind:  "full_body",
      target: ["Chest", "Back", "Legs", "Core"],
      strategy: "Master the form. Add 2.5 kg next session only if all reps were clean.",
      duration_min: 50,
      exercises: [
        { name: "Barbell back squat",       sets: 3, reps: "5-8",  rest: "120 sec" },
        { name: "Barbell bench press",      sets: 3, reps: "5-8",  rest: "120 sec" },
        { name: "Lat pulldown",             sets: 3, reps: "8-10", rest: "90 sec" },
        { name: "Seated cable row",         sets: 3, reps: "10",   rest: "90 sec" },
        { name: "Plank hold",               sets: 3, reps: "30 sec", rest: "60 sec" }
      ],
      rest: "90-120 sec between sets",
      recovery: "Hip + chest stretch 5 min. Hydrate.",
      motivation: "The basics never stop working."
    },
    {
      day: 2,
      title: "Active Recovery",
      kind:  "active_recovery",
      target: ["Cardiovascular"],
      strategy: "Walk, swim, or cycle. Conversational pace.",
      duration_min: 30,
      exercises: [
        { name: "Treadmill incline walk",   sets: 1, reps: "30 min", rest: "—" },
        { name: "Full-body stretch routine", sets: 1, reps: "10 min", rest: "—" }
      ],
      rest: "—",
      recovery: "Foam roll legs + upper back 5 min.",
      motivation: "Easy days make hard days possible."
    },
    {
      day: 3,
      title: "Full Body — Foundation B",
      kind:  "full_body",
      target: ["Legs", "Shoulders", "Back", "Triceps"],
      strategy: "Same lifts, same intent. Track every set in a notebook.",
      duration_min: 55,
      exercises: [
        { name: "Romanian deadlift",         sets: 3, reps: "6-8",  rest: "120 sec" },
        { name: "Overhead press (barbell)",  sets: 3, reps: "6-8",  rest: "120 sec" },
        { name: "Dumbbell row (one arm)",    sets: 3, reps: "10/side", rest: "90 sec" },
        { name: "Tricep rope pushdown",      sets: 3, reps: "10-12", rest: "60 sec" },
        { name: "Hanging knee raise",        sets: 3, reps: "10",   rest: "60 sec" }
      ],
      rest: "90-120 sec between sets",
      recovery: "Lat + hamstring stretch 5 min.",
      motivation: "Every lift is a vote for the person you're becoming."
    },
    {
      day: 4,
      title: "Active Recovery",
      kind:  "active_recovery",
      target: ["Cardiovascular", "Mobility"],
      strategy: "Recovery walk + mobility flow.",
      duration_min: 30,
      exercises: [
        { name: "Outdoor walk",              sets: 1, reps: "25 min", rest: "—" },
        { name: "Hip + shoulder mobility flow", sets: 1, reps: "10 min", rest: "—" }
      ],
      rest: "—",
      recovery: "Hydrate. Protein intake check.",
      motivation: "Recovery is where adaptation happens."
    },
    {
      day: 5,
      title: "Full Body — Foundation C",
      kind:  "full_body",
      target: ["Chest", "Back", "Legs", "Biceps"],
      strategy: "Repeat A's lifts but at higher reps. Pump and form.",
      duration_min: 55,
      exercises: [
        { name: "Goblet squat",              sets: 3, reps: "10-12", rest: "90 sec" },
        { name: "Incline dumbbell press",    sets: 3, reps: "8-10",  rest: "90 sec" },
        { name: "Assisted pull-up",          sets: 3, reps: "6-8",   rest: "90 sec" },
        { name: "Cable face pull",           sets: 3, reps: "12-15", rest: "60 sec" },
        { name: "Dumbbell bicep curl",       sets: 3, reps: "10-12", rest: "60 sec" }
      ],
      rest: "60-90 sec between sets",
      recovery: "Chest doorway stretch each side 60 sec.",
      motivation: "The boring sets build the body people notice."
    },
    {
      day: 6,
      title: "Active Recovery / Optional Cardio",
      kind:  "active_recovery",
      target: ["Cardiovascular"],
      strategy: "Light cardio of choice. Zone 2.",
      duration_min: 25,
      exercises: [
        { name: "Cycle / row / incline walk",  sets: 1, reps: "25 min", rest: "—" }
      ],
      rest: "—",
      recovery: "Sleep 8 hours tonight.",
      motivation: "Cardio is the engine. Lifting is the chassis."
    },
    {
      day: 7,
      title: "Full Rest",
      kind:  "rest",
      target: ["Whole body"],
      strategy: "No training. Eat, hydrate, sleep.",
      duration_min: 0,
      exercises: [
        { name: "Walking / stretching as you feel like", sets: 1, reps: "freeform", rest: "—" }
      ],
      rest: "—",
      recovery: "Plan tomorrow's session. Pack gym bag.",
      motivation: "Rest with intent — tomorrow you ascend."
    }
  ]
};
