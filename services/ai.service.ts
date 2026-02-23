import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { getRequiredEnv } from "@/lib/env";

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: getRequiredEnv("GEMINI_API_KEY"),
    });
  }

  return geminiClient;
}

function getGeminiResponseText(response: { text?: string | null }) {
  return (response.text ?? "").trim();
}

const resumeStructuredSchema = z.object({
  skills: z.array(z.string()).default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        tech: z.array(z.string()).default([]),
        description: z.string().default(""),
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        role: z.string().default(""),
        company: z.string().default(""),
        duration: z.string().default(""),
      }),
    )
    .default([]),
  education: z.array(z.string()).default([]),
});

export type StructuredResumeData = z.infer<typeof resumeStructuredSchema>;

export async function generateInterviewQuestions(input: {
  role: string;
  level: string;
  resumeSummary: string;
}) {
  const prompt = [
    `Create 8 concise interview questions for a ${input.level} ${input.role} candidate.`,
    "Base them on this resume summary.",
    "Return one question per line, with no extra commentary.",
    "",
    input.resumeSummary,
  ].join("\n");

  const response = await getGeminiClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return getGeminiResponseText(response)
    .split("\n")
    .map((line) => line.replace(/^\d+[\).\s-]*/, "").trim())
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function evaluateInterviewAnswers(input: {
  role: string;
  questions: string[];
  answers: string[];
}) {
  const joined = input.questions
    .map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${input.answers[i] ?? ""}`)
    .join("\n\n");

  const response = await getGeminiClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are an interview evaluator for ${input.role}. Score from 0-100 and give concise feedback.\n\n${joined}`,
  });

  return getGeminiResponseText(response);
}

export async function structureResumeData(extractedText: string): Promise<StructuredResumeData> {
  const prompt = [
    "Extract and structure this resume text into strict JSON only.",
    "Return shape:",
    "{",
    '  "skills": string[],',
    '  "projects": [{"name": string, "tech": string[], "description": string}],',
    '  "experience": [{"role": string, "company": string, "duration": string}],',
    '  "education": string[]',
    "}",
    "",
    "Resume text:",
    extractedText,
  ].join("\n");

  const response = await getGeminiClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const raw = getGeminiResponseText(response);
  const jsonStartIndex = raw.indexOf("{");
  const jsonEndIndex = raw.lastIndexOf("}");

  if (jsonStartIndex === -1 || jsonEndIndex === -1) {
    throw new Error("Gemini did not return valid JSON for resume structuring.");
  }

  const parsed = JSON.parse(raw.slice(jsonStartIndex, jsonEndIndex + 1)) as unknown;
  return resumeStructuredSchema.parse(parsed);
}
