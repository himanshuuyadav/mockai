import { GoogleGenAI } from "@google/genai";

import { getRequiredEnv } from "@/lib/env";

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: getRequiredEnv("GEMINI_API_KEY"),
    });
  }

  return geminiClient;
}

export function getGeminiResponseText(response: { text?: string | null }) {
  return (response.text ?? "").trim();
}
