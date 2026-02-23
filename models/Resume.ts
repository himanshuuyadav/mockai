import { Schema, model, models } from "mongoose";

const resumeStructuredSchema = new Schema(
  {
    skills: [{ type: String, default: "" }],
    achievements: [{ type: String, default: "" }],
    projects: [
      {
        name: { type: String, default: "" },
        tech: [{ type: String, default: "" }],
        description: { type: String, default: "" },
      },
    ],
    experience: [
      {
        role: { type: String, default: "" },
        company: { type: String, default: "" },
        duration: { type: String, default: "" },
      },
    ],
    extracurricularExperience: [
      {
        activity: { type: String, default: "" },
        organization: { type: String, default: "" },
        duration: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],
    education: [{ type: String, default: "" }],
  },
  { _id: false },
);

const resumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalFileUrl: { type: String, required: true },
    extractedText: { type: String, required: true },
    structuredData: { type: resumeStructuredSchema, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Resume = models.Resume || model("Resume", resumeSchema);
