import OpenAI from "openai";

import { getRequiredEnv } from "@/lib/env";

const client = new OpenAI({
  apiKey: getRequiredEnv("OPENAI_API_KEY"),
});

export async function generateInterviewQuestions(input: {
  role: string;
  level: string;
  resumeSummary: string;
}) {
  const prompt = `Create 8 concise interview questions for a ${input.level} ${input.role} candidate based on this resume summary:\n${input.resumeSummary}`;

  const response = await client.responses.create({
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

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `You are an interview evaluator for ${input.role}. Score from 0-100 and give concise feedback.\n\n${joined}`,
  });

  return response.output_text;
}
