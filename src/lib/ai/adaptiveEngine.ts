import { Type, Schema } from "@google/genai";
import { generateStructuredJson } from "./gemini";
import { Mission } from "./planGenerator";

export interface DailyReport {
  mood: string;
  energy: string;
  completion_percentage: number;
  notes?: string;
}

export interface AdaptiveResult {
  reasoning: string;
  adjusted_missions: Mission[];
}

const AdaptiveSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reasoning: { type: Type.STRING, description: "Brief explanation of how the schedule was adapted based on the report" },
    adjusted_missions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          duration: { type: Type.INTEGER },
          priority: { type: Type.STRING },
          category: { type: Type.STRING },
        },
        required: ["title", "description", "duration", "priority", "category"],
      },
    },
  },
  required: ["reasoning", "adjusted_missions"],
};

export async function generateAdaptiveMissions(
  report: DailyReport,
  currentMissions: Mission[],
  goal: string
): Promise<AdaptiveResult> {
  const systemInstruction = `You are the KAIZEN.SYS Adaptive Engine.
Your job is to read a user's daily performance report and dynamically recalibrate their missions for tomorrow.
If energy is low, reduce workload and prioritize recovery.
If completion is high, increase difficulty slightly.
If tasks were missed, reschedule them intelligently without destroying their streak.
Maintain the core categories: focus, workout, learning, reflection.`;

  const prompt = `
CURRENT GOAL: ${goal}

USER'S DAILY REPORT:
Mood: ${report.mood}
Energy: ${report.energy}
Completion: ${report.completion_percentage}%
Notes: ${report.notes || "None"}

CURRENT MISSIONS SCHEDULED FOR TOMORROW:
${JSON.stringify(currentMissions, null, 2)}

Provide the adjusted missions and the reasoning for your adjustments.`;

  return generateStructuredJson<AdaptiveResult>(prompt, {
    systemInstruction,
    schema: AdaptiveSchema,
    temperature: 0.5,
  });
}
