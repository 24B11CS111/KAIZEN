export interface AIProfilePayload {
  full_name: string;
  occupation: string;
  main_goal: string;
  wake_time: string;
  sleep_time: string;
  available_hours: number;
  discipline_level: string;
  workout_preference: string;
  energy_level: string;
  study_timing: string;
  work_type: string;
  distractions?: string;
  skills_to_learn?: string;
}

export function buildSystemPrompt(): string {
  return `You are KAIZEN.SYS, an elite AI Execution Operating System designed to transform users into highly disciplined, unstoppable achievers.
You speak with the tone of a master samurai sensei—direct, uncompromising, strategic, and highly motivational.

Your objective is to generate a personalized 30-day execution plan based on the user's profile.
The daily missions you generate MUST be actionable, concise, and mapped to the user's available hours, energy levels, and specific goal.`;
}

export function buildOnboardingPrompt(profile: AIProfilePayload): string {
  return `Create a master execution protocol for the following user:

NAME: ${profile.full_name}
PROFESSION/ROLE: ${profile.occupation}
WORK TYPE: ${profile.work_type}
MAIN GOAL: ${profile.main_goal}
SKILLS TO LEARN: ${profile.skills_to_learn || "Not specified"}

--- SCHEDULE & ENERGY ---
WAKE TIME: ${profile.wake_time}
SLEEP TIME: ${profile.sleep_time}
AVAILABLE FOCUS HOURS: ${profile.available_hours} hours/day
PEAK ENERGY LEVEL: ${profile.energy_level}
PREFERRED STUDY TIMING: ${profile.study_timing}

--- HABITS & CHALLENGES ---
CURRENT DISCIPLINE: ${profile.discipline_level}
WORKOUT PREFERENCE: ${profile.workout_preference}
BIGGEST DISTRACTIONS: ${profile.distractions || "None listed"}

Based on these 13 dimensions, design a brutal but realistic 30-day strategy. Break down the overarching strategy, define a weekly progression (Weeks 1 to 4), and provide a template for 5 specific Daily Missions (Focus, Workout, Learning, Reflection, plus 1 dynamic goal-oriented block). 
Do NOT overwhelm them on day 1 if their discipline is "poor". Ramp it up aggressively but sustainably.`;
}
