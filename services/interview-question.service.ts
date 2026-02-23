import { getGeminiClient, getGeminiResponseText } from "@/lib/gemini";
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
  const response = await getGeminiClient().models.generateContent({
    model: "gemini-2.5-flash",
    contents: createPrompt(input),
  });

  return getGeminiResponseText(response).replace(/^\d+[\).\s-]*/, "").trim();
}
