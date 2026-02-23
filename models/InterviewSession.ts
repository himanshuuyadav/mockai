import { Schema, model, models } from "mongoose";

const interviewSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    questions: [{ type: String, required: true }],
    answers: [{ type: String, default: "" }],
    score: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
  },
  { timestamps: true },
);

export const InterviewSession =
  models.InterviewSession || model("InterviewSession", interviewSessionSchema);
