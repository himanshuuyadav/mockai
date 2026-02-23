import { Schema, model, models } from "mongoose";

const interviewSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume", required: true, index: true },
    type: { type: String, enum: ["technical", "hr"], required: true, index: true },
    jdInfo: { type: String, default: "" },
    questions: [{ type: String, required: true }],
    answers: [{ type: String, default: "" }],
    scores: [{ type: Number, default: 0 }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const InterviewSession =
  models.InterviewSession || model("InterviewSession", interviewSessionSchema);
