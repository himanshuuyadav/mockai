import { generateInterviewQuestions } from "@/services/ai.service";

export async function createInterviewPlan(input: {
  role: string;
  level: string;
  resumeSummary: string;
}) {
  const questions = await generateInterviewQuestions({
    role: input.role,
    level: input.level,
    resumeSummary: input.resumeSummary,
  });

  return {
    role: input.role,
    level: input.level,
    questions,
    totalQuestions: questions.length,
  };
}
