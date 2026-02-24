import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { InterviewSession } from "@/models/InterviewSession";
import { Resume } from "@/models/Resume";
import type { StructuredResumeData } from "@/services/ai.service";
import {
  analyzeInterviewAnswer,
  buildFinalInterviewReport,
  type AnswerAnalysisReport,
} from "@/services/answer-analysis.service";
import { uploadInterviewVideoToCloudinary } from "@/services/cloudinary.service";
import {
  generateContextualInterviewQuestion,
  generateFollowUpQuestion,
  type InterviewType,
} from "@/services/interview-question.service";

type CreateInterviewSessionInput = {
  userId: string;
  resumeId: string;
  type: InterviewType;
  jdInfo?: string;
  structuredResume: StructuredResumeData;
  subscriptionTier?: "free" | "pro";
};

type SubmitInterviewAnswerInput = {
  sessionId: string;
  userId: string;
  transcript: string;
  videoFile?: File;
};

export async function createInterviewSession(input: CreateInterviewSessionInput) {
  let firstQuestion = "";
  try {
    firstQuestion = await generateContextualInterviewQuestion({
      structuredResume: input.structuredResume,
      type: input.type,
      jdInfo: input.jdInfo,
    });
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : "Unable to generate first interview question.",
      { statusCode: 503 },
    );
  }

  await connectToDatabase();

  let session;
  try {
    session = await InterviewSession.create({
      userId: input.userId,
      resumeId: input.resumeId,
      subscriptionTier: input.subscriptionTier ?? "free",
      type: input.type,
      jdInfo: input.jdInfo ?? "",
      questions: [firstQuestion],
      answers: [""],
      transcripts: [""],
      answerVideoUrls: [""],
      scores: [],
      feedbacks: [],
      analysisReports: [],
      status: "active",
    });
  } catch (error) {
    logger.error("interview_session_create_failed", {
      userId: input.userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw new AppError("Unable to create interview session.", { statusCode: 500 });
  }

  return {
    id: session._id.toString(),
    type: session.type as InterviewType,
    jdInfo: session.jdInfo as string,
    questions: session.questions as string[],
    subscriptionTier: session.subscriptionTier as "free" | "pro",
    createdAt: session.createdAt as Date,
  };
}

function isFreeTierExpired(sessionCreatedAt: Date, subscriptionTier: string) {
  if (subscriptionTier !== "free") {
    return false;
  }
  const elapsedMs = Date.now() - new Date(sessionCreatedAt).getTime();
  return elapsedMs >= 5 * 60 * 1000;
}

async function getSessionAndResume(input: { sessionId: string; userId: string }) {
  const session = await InterviewSession.findOne({
    _id: input.sessionId,
    userId: new mongoose.Types.ObjectId(input.userId),
  }).exec();

  if (!session) {
    throw new AppError("Interview session not found.", { statusCode: 404 });
  }

  const resume = await Resume.findById(session.resumeId).select("structuredData").lean<{
    structuredData: StructuredResumeData;
  } | null>();

  if (!resume) {
    throw new AppError("Resume not found for this interview session.", { statusCode: 404 });
  }

  return { session, resume };
}

function extractSavedAnalyses(session: mongoose.Document & Record<string, unknown>) {
  const stored = (session.analysisReports as unknown[]) ?? [];
  return stored.filter(Boolean) as AnswerAnalysisReport[];
}

export async function submitInterviewAnswerAndGenerateFollowUp(input: SubmitInterviewAnswerInput) {
  await connectToDatabase();

  const { session, resume } = await getSessionAndResume({
    sessionId: input.sessionId,
    userId: input.userId,
  });

  if ((session.status as string) === "ended") {
    throw new AppError("Interview session has already ended.", { statusCode: 400 });
  }

  if (isFreeTierExpired(session.createdAt as Date, session.subscriptionTier as string)) {
    await endInterviewSession({
      sessionId: input.sessionId,
      userId: input.userId,
      reason: "auto_time_limit",
    });
    throw new AppError("Free-tier interview time limit reached. Session ended.", { statusCode: 403 });
  }

  const currentQuestionIndex = Math.max((session.questions as string[]).length - 1, 0);
  const previousQuestion = ((session.questions as string[])[currentQuestionIndex] ?? "").trim();

  let videoUrl = "";
  if (input.videoFile) {
    try {
      const videoBuffer = Buffer.from(await input.videoFile.arrayBuffer());
      const upload = await uploadInterviewVideoToCloudinary({
        fileBuffer: videoBuffer,
        userId: input.userId,
        sessionId: session._id.toString(),
        questionIndex: currentQuestionIndex,
      });
      videoUrl = upload.secureUrl;
    } catch (error) {
      logger.error("interview_video_upload_failed", {
        userId: input.userId,
        sessionId: session._id.toString(),
        questionIndex: currentQuestionIndex,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new AppError("Unable to upload answer video.", { statusCode: 502 });
    }
  }

  const analysis = analyzeInterviewAnswer(input.transcript, session.type as InterviewType);
  const followUp = await generateFollowUpQuestion({
    structuredResume: resume.structuredData,
    previousQuestion,
    userTranscriptAnswer: input.transcript,
    type: session.type as InterviewType,
    jdInfo: session.jdInfo as string,
  });

  (session.answers as string[])[currentQuestionIndex] = input.transcript;
  (session.transcripts as string[])[currentQuestionIndex] = input.transcript;
  (session.scores as number[])[currentQuestionIndex] = followUp.score;
  (session.feedbacks as string[])[currentQuestionIndex] = followUp.feedback;
  (session.answerVideoUrls as string[])[currentQuestionIndex] = videoUrl;
  (session.analysisReports as unknown[])[currentQuestionIndex] = analysis;

  (session.questions as string[]).push(followUp.followUpQuestion);
  (session.answers as string[]).push("");
  (session.transcripts as string[]).push("");
  (session.answerVideoUrls as string[]).push("");
  (session.scores as number[]).push(0);
  (session.feedbacks as string[]).push("");
  (session.analysisReports as unknown[]).push(null);

  await session.save();

  return {
    score: followUp.score,
    feedback: followUp.feedback,
    followUpQuestion: followUp.followUpQuestion,
    videoUrl,
    sessionId: session._id.toString(),
    questionIndex: currentQuestionIndex + 1,
    analysis,
  };
}

export async function endInterviewSession(input: {
  sessionId: string;
  userId: string;
  reason: "manual" | "auto_time_limit";
  transcript?: string;
  videoFile?: File;
}) {
  await connectToDatabase();

  const session = await InterviewSession.findOne({
    _id: input.sessionId,
    userId: new mongoose.Types.ObjectId(input.userId),
  }).exec();

  if (!session) {
    throw new AppError("Interview session not found.", { statusCode: 404 });
  }

  if ((session.status as string) === "ended") {
    return {
      sessionId: session._id.toString(),
      status: "ended",
      endReason: session.endReason as string,
    };
  }

  const currentQuestionIndex = Math.max((session.questions as string[]).length - 1, 0);
  const existingAnswer = ((session.answers as string[])[currentQuestionIndex] ?? "").trim();
  const draftTranscript = (input.transcript ?? "").trim();

  if (!existingAnswer && draftTranscript) {
    let videoUrl = (session.answerVideoUrls as string[])[currentQuestionIndex] ?? "";

    if (input.videoFile && !videoUrl) {
      try {
        const videoBuffer = Buffer.from(await input.videoFile.arrayBuffer());
        const upload = await uploadInterviewVideoToCloudinary({
          fileBuffer: videoBuffer,
          userId: input.userId,
          sessionId: session._id.toString(),
          questionIndex: currentQuestionIndex,
        });
        videoUrl = upload.secureUrl;
      } catch (error) {
        logger.error("interview_end_video_upload_failed", {
          userId: input.userId,
          sessionId: session._id.toString(),
          questionIndex: currentQuestionIndex,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw new AppError("Unable to upload answer video while ending session.", { statusCode: 502 });
      }
    }

    const analysis = analyzeInterviewAnswer(draftTranscript, session.type as InterviewType);
    const derivedScore = Math.round((analysis.confidenceScore + analysis.domainDepth + analysis.sentenceClarity) / 3);
    const derivedFeedback = analysis.improvementSuggestions.slice(0, 2).join(" ");

    (session.answers as string[])[currentQuestionIndex] = draftTranscript;
    (session.transcripts as string[])[currentQuestionIndex] = draftTranscript;
    (session.scores as number[])[currentQuestionIndex] = derivedScore;
    (session.feedbacks as string[])[currentQuestionIndex] = derivedFeedback;
    (session.answerVideoUrls as string[])[currentQuestionIndex] = videoUrl;
    (session.analysisReports as unknown[])[currentQuestionIndex] = analysis;
  }

  const savedAnalyses = extractSavedAnalyses(session);
  const finalReport = buildFinalInterviewReport(savedAnalyses, session.type as InterviewType);

  session.finalReport = finalReport;
  session.status = "ended";
  session.endReason = input.reason;
  session.endedAt = new Date();

  await session.save();

  return {
    sessionId: session._id.toString(),
    status: "ended",
    endReason: input.reason,
  };
}

export async function getInterviewReportBySessionId(input: { sessionId: string; userId: string }) {
  await connectToDatabase();

  const session = await InterviewSession.findOne({
    _id: input.sessionId,
    userId: new mongoose.Types.ObjectId(input.userId),
  })
    .select(
      "type questions transcripts scores feedbacks analysisReports finalReport status endReason createdAt endedAt",
    )
    .lean<{
      type: InterviewType;
      questions: string[];
      transcripts: string[];
      scores: number[];
      feedbacks: string[];
      analysisReports: Array<AnswerAnalysisReport | null>;
      finalReport: ReturnType<typeof buildFinalInterviewReport> | null;
      status: "active" | "ended";
      endReason: string;
      createdAt: Date;
      endedAt: Date | null;
    } | null>();

  return session;
}

export async function getInterviewSessionRuntime(input: { sessionId: string; userId: string }) {
  await connectToDatabase();

  const session = await InterviewSession.findOne({
    _id: input.sessionId,
    userId: new mongoose.Types.ObjectId(input.userId),
  })
    .select("type questions subscriptionTier status createdAt")
    .lean<{
      type: InterviewType;
      questions: string[];
      subscriptionTier: "free" | "pro";
      status: "active" | "ended";
      createdAt: Date;
    } | null>();

  return session;
}
