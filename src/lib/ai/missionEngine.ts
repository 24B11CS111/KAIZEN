import { Mission } from "./planGenerator";
import { AIProfilePayload } from "./promptBuilder";

/**
 * Fallback to deterministic mission generation if AI fails.
 * Prioritizes based on goal, profession, available hours, and energy level.
 */
export function generateDeterministicMissions(profile: AIProfilePayload): Mission[] {
  const missions: Mission[] = [];
  const hours = profile.available_hours || 2;
  const isLowEnergy = profile.energy_level === "low";

  // 1. Morning Routine / Warmup
  missions.push({
    title: "Morning Prime",
    description: "Hydrate, review today's goal, and clear distractions.",
    duration: 15,
    priority: "high",
    category: "focus",
  });

  // 2. Deep Work (scaled by available hours)
  const focusDuration = isLowEnergy ? Math.min(60, hours * 30) : Math.min(120, hours * 45);
  missions.push({
    title: `${profile.main_goal} Execution`,
    description: `Deep work block focused on your primary objective. Disable all notifications.`,
    duration: focusDuration,
    priority: "high",
    category: "focus",
  });

  // 3. Exercise
  if (profile.workout_preference !== "none") {
    missions.push({
      title: `${profile.workout_preference.replace("_", " ").toUpperCase()}`,
      description: isLowEnergy ? "Light movement and stretching." : "Intense physical training session.",
      duration: isLowEnergy ? 20 : 45,
      priority: "medium",
      category: "workout",
    });
  }

  // 4. Learning
  if (profile.skills_to_learn) {
    missions.push({
      title: "Skill Acquisition",
      description: `Study and practice: ${profile.skills_to_learn}`,
      duration: 30,
      priority: "medium",
      category: "learning",
    });
  }

  // 5. Night Reflection
  missions.push({
    title: "Evening Reflection",
    description: "Log your daily report, review what went wrong, and prepare for tomorrow.",
    duration: 15,
    priority: "high",
    category: "reflection",
  });

  return missions;
}
