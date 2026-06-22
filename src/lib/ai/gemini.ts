import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
// We define a fallback so the app won't crash instantly if key is missing,
// but actual calls will fail unless it's configured.
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});

export const GEMINI_MODELS = {
  default: "gemini-2.5-flash",
  pro: "gemini-2.5-pro",
};

export interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  schema?: Schema;
  temperature?: number;
}

/**
 * Wrapper around Gemini generateContent for structured JSON outputs.
 */
export async function generateStructuredJson<T>(prompt: string, options?: GenerateOptions): Promise<T> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const modelName = options?.model || GEMINI_MODELS.default;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: options?.systemInstruction,
      responseMimeType: "application/json",
      responseSchema: options?.schema,
      temperature: options?.temperature ?? 0.7,
    },
  });

  if (!response.text) {
    throw new Error("Empty response from Gemini");
  }

  try {
    return JSON.parse(response.text) as T;
  } catch (err) {
    console.error("Failed to parse Gemini output:", response.text);
    throw new Error("Invalid JSON structure from Gemini");
  }
}
