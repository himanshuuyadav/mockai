import { getGeminiClient, getGeminiResponseText } from "@/lib/gemini";
import { AppError } from "@/lib/errors";
import { logger, withLatencyLog } from "@/lib/logger";
import type { StructuredResumeData } from "@/services/ai.service";

export type InterviewType = "technical" | "hr";

type GenerateInterviewQuestionInput = {
  structuredResume: StructuredResumeData;
  type: InterviewType;
  jdInfo?: string;
};

function createPrompt(input: GenerateInterviewQuestionInput) {
  const modeInstructions =
    input.type === "technical"
      ? [
          "Mode: Technical interview.",
          "Focus on skills, projects, tech stack depth, tradeoffs, and system thinking.",
          "Ask a practical and contextual technical question grounded in the candidate resume.",
        ]
      : [
          "Mode: HR interview.",
          "Focus on behavioral signals: leadership, conflict resolution, communication, and strengths/weaknesses.",
          "Ask a realistic HR question grounded in the candidate profile.",
        ];

  return [
    "Generate exactly one interview question.",
    "Return only the question text, without numbering or commentary.",
    ...modeInstructions,
    input.jdInfo ? `Job description context:\n${input.jdInfo}` : "Job description context: not provided.",
    "Structured resume JSON:",
    JSON.stringify(input.structuredResume),
  ].join("\n\n");
}

export async function generateContextualInterviewQuestion(input: GenerateInterviewQuestionInput) {
  try {
    const response = await withLatencyLog("ai.generateContextualInterviewQuestion", () =>
      getGeminiClient().models.generateContent({
        model: "gemini-2.5-flash",
        contents: createPrompt(input),
      }),
    );

    return getGeminiResponseText(response).replace(/^\d+[\).\s-]*/, "").trim();
  } catch (error) {
    logger.error("ai_generate_contextual_question_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AppError("Unable to generate interview question right now.", { statusCode: 503 });
  }
}

type GenerateFollowUpQuestionInput = {
  structuredResume: StructuredResumeData;
  previousQuestion: string;
  userTranscriptAnswer: string;
  type: InterviewType;
  jdInfo?: string;
};

type FollowUpResult = {
  score: number;
  feedback: string;
  followUpQuestion: string;
};

function normalizeScore(score: unknown) {
  const numeric = typeof score === "number" ? score : Number(score);
  if (Number.isNaN(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

export async function generateFollowUpQuestion(
  input: GenerateFollowUpQuestionInput,
): Promise<FollowUpResult> {
  const modeGuide =
    input.type === "technical"
      ? "Technical mode: evaluate technical clarity, project depth, tradeoff thinking, and system design understanding."
      : "HR mode: evaluate behavioral depth, leadership, conflict handling, communication, and self-awareness.";

  const prompt = [
    "You are simulating a real interviewer.",
    "Return strict JSON only with keys: score, feedback, followUpQuestion.",
    "score must be an integer 0-100.",
    "feedback must be concise (max 2 sentences).",
    "followUpQuestion must be one clear interviewer question.",
    modeGuide,
    input.jdInfo ? `JD context:\n${input.jdInfo}` : "JD context: not provided.",
    `Previous question:\n${input.previousQuestion}`,
    `Candidate answer transcript:\n${input.userTranscriptAnswer}`,
    `Structured resume:\n${JSON.stringify(input.structuredResume)}`,
  ].join("\n\n");

  try {
    const response = await withLatencyLog("ai.generateFollowUpQuestion", () =>
      getGeminiClient().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      }),
    );

    const raw = getGeminiResponseText(response);
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("Gemini did not return valid follow-up JSON.");
    }

    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      score?: unknown;
      feedback?: unknown;
      followUpQuestion?: unknown;
    };

    return {
      score: normalizeScore(parsed.score),
      feedback: typeof parsed.feedback === "string" ? parsed.feedback.trim() : "No feedback available.",
      followUpQuestion:
        typeof parsed.followUpQuestion === "string" && parsed.followUpQuestion.trim()
          ? parsed.followUpQuestion.trim()
          : "Can you elaborate further on that example?",
    };
  } catch (error) {
    logger.error("ai_generate_followup_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AppError("Unable to generate follow-up question right now.", { statusCode: 503 });
  }
}
