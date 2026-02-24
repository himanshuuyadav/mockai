import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, unique: true, index: true },
    image: { type: String, default: "" },
    subscriptionTier: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
      index: true,
    },
    stripeCustomerId: { type: String, default: "", index: true },
    stripeSubscriptionId: { type: String, default: "", index: true },
    subscriptionStatus: { type: String, default: "inactive", index: true },
    interviewsRemaining: { type: Number, default: 5 },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User = models.User || model("User", userSchema);
