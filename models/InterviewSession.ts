import { Schema, model, models } from "mongoose";

const interviewSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    subscriptionTier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
      index: true,
    },
    type: { type: String, enum: ["technical", "hr"], required: true, index: true },
    jdInfo: { type: String, default: "" },
    questions: [{ type: String, required: true }],
    answers: [{ type: String, default: "" }],
    transcripts: [{ type: String, default: "" }],
    answerVideoUrls: [{ type: String, default: "" }],
    scores: [{ type: Number, default: 0 }],
    feedbacks: [{ type: String, default: "" }],
    analysisReports: [{ type: Schema.Types.Mixed, default: null }],
    finalReport: { type: Schema.Types.Mixed, default: null },
    status: { type: String, enum: ["active", "ended"], default: "active", index: true },
    endReason: { type: String, default: "" },
    endedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const InterviewSession =
  models.InterviewSession || model("InterviewSession", interviewSessionSchema);
