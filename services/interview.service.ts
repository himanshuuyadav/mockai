import { connectToDatabase } from "@/lib/db";
import { InterviewSession } from "@/models/InterviewSession";
import { generateContextualInterviewQuestion, type InterviewType } from "@/services/interview-question.service";
import type { StructuredResumeData } from "@/services/ai.service";

type CreateInterviewSessionInput = {
  userId: string;
  resumeId: string;
  type: InterviewType;
  jdInfo?: string;
  structuredResume: StructuredResumeData;
};

export async function createInterviewSession(input: CreateInterviewSessionInput) {
  const firstQuestion = await generateContextualInterviewQuestion({
    structuredResume: input.structuredResume,
    type: input.type,
    jdInfo: input.jdInfo,
  });

  await connectToDatabase();

  const session = await InterviewSession.create({
    userId: input.userId,
    resumeId: input.resumeId,
    type: input.type,
    jdInfo: input.jdInfo ?? "",
    questions: [firstQuestion],
    answers: [""],
    scores: [],
  });

  return {
    id: session._id.toString(),
    type: session.type as InterviewType,
    jdInfo: session.jdInfo as string,
    questions: session.questions as string[],
    createdAt: session.createdAt as Date,
  };
}
