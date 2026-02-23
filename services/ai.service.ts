import OpenAI from "openai";
import { z } from "zod";

import { getRequiredEnv } from "@/lib/env";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: getRequiredEnv("OPENAI_API_KEY"),
    });
  }

  return openaiClient;
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
  const prompt = `Create 8 concise interview questions for a ${input.level} ${input.role} candidate based on this resume summary:\n${input.resumeSummary}`;

  const response = await getOpenAIClient().responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  return response.output_text
    .split("\n")
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

  const response = await getOpenAIClient().responses.create({
    model: "gpt-4.1-mini",
    input: `You are an interview evaluator for ${input.role}. Score from 0-100 and give concise feedback.\n\n${joined}`,
  });

  return response.output_text;
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

  const response = await getOpenAIClient().responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const raw = response.output_text.trim();
  const jsonStartIndex = raw.indexOf("{");
  const jsonEndIndex = raw.lastIndexOf("}");

  if (jsonStartIndex === -1 || jsonEndIndex === -1) {
    throw new Error("OpenAI did not return valid JSON for resume structuring.");
  }

  const parsed = JSON.parse(raw.slice(jsonStartIndex, jsonEndIndex + 1)) as unknown;
  return resumeStructuredSchema.parse(parsed);
}
