import { z } from "zod";

import { getGeminiClient, getGeminiResponseText } from "@/lib/gemini";

const resumeStructuredSchema = z.object({
  skills: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
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
  extracurricularExperience: z
    .array(
      z.object({
        activity: z.string().default(""),
        organization: z.string().default(""),
        duration: z.string().default(""),
        description: z.string().default(""),
      }),
    )
    .default([]),
  education: z.array(z.string()).default([]),
});

export type StructuredResumeData = z.infer<typeof resumeStructuredSchema>;

function splitResumeLines(extractedText: string) {
  return extractedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function sanitizeBulletText(line: string) {
  return line.replace(/^[-*\u2022]\s*/, "").trim();
}

function isSectionHeading(line: string) {
  return /^[A-Z][A-Za-z\s/&-]{2,}$/.test(line) && !/^[-*\u2022]/.test(line);
}

function extractAchievementFallback(extractedText: string) {
  const lines = splitResumeLines(extractedText);
  const keywordRegex =
    /\b(achievement|achievements|award|awards|honou?r|honou?rs|accomplishment|accomplishments|distinction|scholarship|winner|rank|ranked|topper)\b/i;

  const headingIndex = lines.findIndex((line) => keywordRegex.test(line));
  if (headingIndex === -1) {
    return [];
  }

  const fallback: string[] = [];
  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (isSectionHeading(line)) {
      break;
    }

    const cleaned = sanitizeBulletText(line);
    if (cleaned.length > 4) {
      fallback.push(cleaned);
    }
  }

  return Array.from(new Set(fallback)).slice(0, 10);
}

function extractExtracurricularFallback(extractedText: string) {
  const lines = splitResumeLines(extractedText);
  const keywordRegex =
    /\b(extracurricular|co-curricular|cocurricular|volunteer|voluntary|leadership|clubs?|societies|community)\b/i;
  const headingIndex = lines.findIndex((line) => keywordRegex.test(line));

  if (headingIndex === -1) {
    return [];
  }

  const fallback: Array<{
    activity: string;
    organization: string;
    duration: string;
    description: string;
  }> = [];

  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (isSectionHeading(line)) {
      break;
    }

    const cleaned = sanitizeBulletText(line);
    if (!cleaned) {
      continue;
    }

    fallback.push({
      activity: cleaned,
      organization: "",
      duration: "",
      description: cleaned,
    });
  }

  return fallback.slice(0, 10);
}

function normalizeStructuredResumeData(
  rawData: unknown,
  extractedText: string,
): StructuredResumeData {
  const candidate = (rawData ?? {}) as Record<string, unknown>;

  const achievementsFromAltKeys =
    (candidate.achievements as string[] | undefined) ??
    (candidate.accomplishments as string[] | undefined) ??
    (candidate.awards as string[] | undefined) ??
    (candidate.honors as string[] | undefined);

  const extracurricularFromAltKeys =
    (candidate.extracurricularExperience as StructuredResumeData["extracurricularExperience"] | undefined) ??
    (candidate.coCurricular as StructuredResumeData["extracurricularExperience"] | undefined) ??
    (candidate.coCurricularActivities as StructuredResumeData["extracurricularExperience"] | undefined) ??
    (candidate.volunteerExperience as StructuredResumeData["extracurricularExperience"] | undefined) ??
    (candidate.voluntaryExperience as StructuredResumeData["extracurricularExperience"] | undefined);

  const normalized = {
    ...candidate,
    achievements: achievementsFromAltKeys ?? extractAchievementFallback(extractedText),
    extracurricularExperience: extracurricularFromAltKeys ?? extractExtracurricularFallback(extractedText),
  };

  return resumeStructuredSchema.parse(normalized);
}

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
    "Always populate achievements when any achievements/awards/accomplishments are present.",
    "Always populate extracurricularExperience for co-curricular, extracurricular, leadership, volunteering, or community sections.",
    "Return shape:",
    "{",
    '  "skills": string[],',
    '  "achievements": string[],',
    '  "projects": [{"name": string, "tech": string[], "description": string}],',
    '  "experience": [{"role": string, "company": string, "duration": string}],',
    '  "extracurricularExperience": [{"activity": string, "organization": string, "duration": string, "description": string}],',
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
  return normalizeStructuredResumeData(parsed, extractedText);
}
