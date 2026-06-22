import { Type, Schema } from "@google/genai";
import { generateStructuredJson } from "./gemini";
import { buildSystemPrompt, buildOnboardingPrompt, AIProfilePayload } from "./promptBuilder";

export interface Mission {
  title: string;
  description: string;
  duration: number;
  priority: "high" | "medium" | "low";
  category: "focus" | "workout" | "learning" | "reflection" | "custom";
}

export interface GeneratedPlan {
  monthly_strategy: string;
  week_1: string;
  week_2: string;
  week_3: string;
  week_4: string;
  daily_missions: Mission[];
}

const PlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    monthly_strategy: { type: Type.STRING },
    week_1: { type: Type.STRING },
    week_2: { type: Type.STRING },
    week_3: { type: Type.STRING },
    week_4: { type: Type.STRING },
    daily_missions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          duration: { type: Type.INTEGER, description: "Duration in minutes" },
          priority: { type: Type.STRING },
          category: { type: Type.STRING },
        },
        required: ["title", "description", "duration", "priority", "category"],
      },
    },
  },
  required: ["monthly_strategy", "week_1", "week_2", "week_3", "week_4", "daily_missions"],
};

export async function generateInitialPlan(profile: AIProfilePayload): Promise<GeneratedPlan> {
  const systemInstruction = buildSystemPrompt();
  const prompt = buildOnboardingPrompt(profile);

  return generateStructuredJson<GeneratedPlan>(prompt, {
    systemInstruction,
    schema: PlanSchema,
    temperature: 0.7,
  });
}
