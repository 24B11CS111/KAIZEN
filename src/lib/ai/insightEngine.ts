import { Type, Schema } from "@google/genai";
import { generateStructuredJson } from "./gemini";
import { DailyReport } from "./adaptiveEngine";

export interface AIInsight {
  type: "productivity" | "energy" | "habit" | "balance";
  message: string;
}

export interface InsightResult {
  insights: AIInsight[];
}

const InsightSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["productivity", "energy", "habit", "balance"] },
          message: { type: Type.STRING },
        },
        required: ["type", "message"],
      },
    },
  },
  required: ["insights"],
};

export async function generateInsights(
  reports: DailyReport[],
  wakeTime: string,
  sleepTime: string
): Promise<InsightResult> {
  const systemInstruction = `You are the KAIZEN.SYS Insight Engine.
Analyze the user's historical daily reports, wake time, and sleep time.
Produce exactly 3 short, punchy insights based on their trends.
Examples:
- "Your highest productivity window is 8 AM-11 AM."
- "Your energy consistently drops after 7 PM."
- "Remote work is reducing your focus."
Do not be generic. Be analytical and precise.`;

  const prompt = `
USER CONTEXT:
Wake Time: ${wakeTime}
Sleep Time: ${sleepTime}

RECENT REPORTS (Last 7 days):
${JSON.stringify(reports, null, 2)}

Generate 3 powerful insights from this data.`;

  return generateStructuredJson<InsightResult>(prompt, {
    systemInstruction,
    schema: InsightSchema,
    temperature: 0.6,
  });
}
