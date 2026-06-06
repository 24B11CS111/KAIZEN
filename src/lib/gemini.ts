import { GoogleGenAI, Type, Schema } from "@google/genai";
import { OnboardingInput } from "./validation";
import { PlanDay } from "./ai-plan/types";

// The schema matching PlanDay[]
const planSchema: Schema = {
  type: Type.ARRAY,
  description: "A 30-day premium execution roadmap.",
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.INTEGER, description: "Day number from 1 to 30" },
      title: { type: Type.STRING, description: "Short motivational/tactical title for the day" },
      study: { type: Type.STRING, description: "What to study based on goal/skill level" },
      practice: { type: Type.STRING, description: "What to practice (problems/drills)" },
      build: { type: Type.STRING, description: "What to build (tangible artifact)" },
      exercise: { type: Type.STRING, description: "Fitness/workout task based on preference" },
      discipline: { type: Type.STRING, description: "Discipline/habit task" },
      productivity: { type: Type.STRING, description: "Small productivity habit based on selected system" }
    },
    required: ["day", "title", "study", "practice", "build", "exercise", "discipline", "productivity"]
  }
};

export async function generate30DayRoadmap(userProfile: OnboardingInput): Promise<PlanDay[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "placeholder") {
    // If no key is configured, fallback to a deterministic-like safe response for dev.
    console.warn("[gemini] GEMINI_API_KEY not configured. Falling back to mock data.");
    return generateMockRoadmap(userProfile);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are KAIZEN, an elite, highly tactical AI execution engine. Your job is to generate a personalized 30-day progression roadmap.
The system must be highly tactical, realistic, avoiding overwhelming tasks, and geared toward elite discipline. 

User Profile:
- Goal: ${userProfile.main_goal} (${userProfile.main_goal_other || 'N/A'})
- Age: ${userProfile.age}
- Occupation: ${userProfile.occupation}
- Field/Branch: ${userProfile.field_of_study}
- Skill Level: ${userProfile.skill_level}
- Time Commitment: ${userProfile.daily_time_min} minutes/day
- Focus Window: ${userProfile.study_timing}
- Fitness: ${userProfile.workout_preference}
- Sleep: ${userProfile.sleep_timing}
- Productivity System: ${userProfile.productivity_habits}
- Current Discipline: ${userProfile.discipline_level}

Instructions:
1. Generate exactly 30 days.
2. Escalate difficulty logically over the 30 days.
3. Keep task descriptions brief and actionable (under 15 words per task).
4. Do NOT output generic motivational fluff. Be specific.
5. Align workouts with ${userProfile.workout_preference}.
6. Align productivity hacks with ${userProfile.productivity_habits}.

Output strictly as a JSON array of objects.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: planSchema,
        temperature: 0.7,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response text from Gemini");
    
    const parsed = JSON.parse(jsonText);
    return parsed as PlanDay[];
  } catch (error) {
    console.error("[gemini] Generation failed:", error);
    // Fallback to avoid breaking the user experience entirely
    return generateMockRoadmap(userProfile);
  }
}

function generateMockRoadmap(userProfile: OnboardingInput): PlanDay[] {
  const days: PlanDay[] = [];
  for (let i = 1; i <= 30; i++) {
    days.push({
      day: i,
      title: `Day ${i} Protocol`,
      study: `Review core concepts for ${userProfile.field_of_study}`,
      practice: `Complete 2 drills tailored to ${userProfile.skill_level}`,
      build: `Iterate on ${userProfile.main_goal} project`,
      exercise: `30 min ${userProfile.workout_preference}`,
      discipline: `Maintain ${userProfile.sleep_timing} sleep schedule`,
      productivity: `Use ${userProfile.productivity_habits} during focus block`
    });
  }
  return days;
}
