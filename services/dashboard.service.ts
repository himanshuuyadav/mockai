import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { InterviewSession } from "@/models/InterviewSession";

type TrendPoint = {
  label: string;
  confidence: number;
  fillerWords: number;
};

export async function getDashboardData(userId: string) {
  await connectToDatabase();

  const sessions = await InterviewSession.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ createdAt: -1 })
    .select("type status createdAt finalReport scores")
    .lean<
      Array<{
        _id: { toString(): string };
        type: "technical" | "hr";
        status: "active" | "ended";
        createdAt: Date;
        finalReport?: {
          confidenceScore?: number;
          fillerWordsCount?: number;
        } | null;
        scores: number[];
      }>
    >();

  const ended = sessions.filter((session) => session.status === "ended");
  const avgConfidence = ended.length
    ? Math.round(
        ended.reduce((sum, session) => sum + (session.finalReport?.confidenceScore ?? 0), 0) / ended.length,
      )
    : 0;
  const avgScore = ended.length
    ? Math.round(
        ended.reduce((sum, session) => {
          const valid = session.scores.filter((score) => score > 0);
          if (!valid.length) {
            return sum;
          }
          const sessionAvg = valid.reduce((acc, value) => acc + value, 0) / valid.length;
          return sum + sessionAvg;
        }, 0) / ended.length,
      )
    : 0;

  const trend: TrendPoint[] = ended
    .slice(0, 8)
    .reverse()
    .map((session, index) => ({
      label: `S${index + 1}`,
      confidence: session.finalReport?.confidenceScore ?? 0,
      fillerWords: session.finalReport?.fillerWordsCount ?? 0,
    }));

  return {
    totalSessions: sessions.length,
    endedSessions: ended.length,
    avgConfidence,
    avgScore,
    trend,
    recent: sessions.slice(0, 5).map((session) => ({
      id: session._id.toString(),
      type: session.type,
      status: session.status,
      createdAt: session.createdAt,
      confidence: session.finalReport?.confidenceScore ?? 0,
    })),
  };
}
