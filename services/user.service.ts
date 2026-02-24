import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { FREE_INTERVIEWS_PER_MONTH, type SubscriptionTier } from "@/lib/subscription";
import { InterviewSession } from "@/models/InterviewSession";
import { User } from "@/models/User";

type SyncOAuthUserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
};

type BillingSnapshot = {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  interviewsRemaining: number;
};

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function syncOAuthUser({ email, name, image }: SyncOAuthUserInput) {
  await connectToDatabase();

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        name: name ?? "",
        image: image ?? "",
      },
      $setOnInsert: {
        subscriptionTier: "free",
        subscriptionStatus: "inactive",
        interviewsRemaining: FREE_INTERVIEWS_PER_MONTH,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function findUserIdByEmail(email: string) {
  await connectToDatabase();

  const user = await User.findOne({ email }).select("_id").exec();
  return user?._id?.toString() ?? null;
}

export async function findUserProfileById(userId: string) {
  await connectToDatabase();

  return User.findById(userId)
    .select("name email image subscriptionTier subscriptionStatus stripeCustomerId stripeSubscriptionId interviewsRemaining createdAt")
    .lean<{
      name: string;
      email: string;
      image: string;
      subscriptionTier: SubscriptionTier;
      subscriptionStatus: string;
      stripeCustomerId: string;
      stripeSubscriptionId: string;
      interviewsRemaining: number;
      createdAt: Date;
    } | null>();
}

export async function getBillingSnapshotByUserId(userId: string): Promise<BillingSnapshot | null> {
  await connectToDatabase();

  const user = await User.findById(userId)
    .select("subscriptionTier subscriptionStatus stripeCustomerId stripeSubscriptionId interviewsRemaining")
    .lean<BillingSnapshot | null>();

  return user;
}

export async function syncMonthlyInterviewAllowance(userId: string) {
  await connectToDatabase();

  const user = await User.findById(userId)
    .select("subscriptionTier interviewsRemaining")
    .lean<{ subscriptionTier: SubscriptionTier; interviewsRemaining: number } | null>();

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.subscriptionTier === "pro") {
    if (user.interviewsRemaining !== FREE_INTERVIEWS_PER_MONTH) {
      await User.findByIdAndUpdate(userId, { $set: { interviewsRemaining: FREE_INTERVIEWS_PER_MONTH } });
    }
    return {
      canStartInterview: true,
      subscriptionTier: user.subscriptionTier,
      interviewsRemaining: FREE_INTERVIEWS_PER_MONTH,
    };
  }

  const monthStart = getCurrentMonthStart();
  const interviewsUsed = await InterviewSession.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    createdAt: { $gte: monthStart },
  });

  const remaining = Math.max(0, FREE_INTERVIEWS_PER_MONTH - interviewsUsed);
  if (user.interviewsRemaining !== remaining) {
    await User.findByIdAndUpdate(userId, { $set: { interviewsRemaining: remaining } });
  }

  return {
    canStartInterview: remaining > 0,
    subscriptionTier: user.subscriptionTier,
    interviewsRemaining: remaining,
  };
}

export async function assertInterviewAccess(userId: string) {
  const allowance = await syncMonthlyInterviewAllowance(userId);

  if (!allowance.canStartInterview) {
    throw new Error("Free plan monthly interview limit reached. Upgrade to Pro to continue.");
  }

  return allowance;
}

export async function upsertStripeCustomerForUser(input: {
  userId: string;
  stripeCustomerId: string;
}) {
  await connectToDatabase();

  await User.findByIdAndUpdate(input.userId, {
    $set: {
      stripeCustomerId: input.stripeCustomerId,
    },
  }).exec();
}

export async function activateProSubscriptionByUserId(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: string;
}) {
  await connectToDatabase();

  await User.findByIdAndUpdate(input.userId, {
    $set: {
      subscriptionTier: "pro",
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      subscriptionStatus: input.subscriptionStatus,
      interviewsRemaining: FREE_INTERVIEWS_PER_MONTH,
    },
  }).exec();
}

export async function updateSubscriptionByCustomerId(input: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: string;
}) {
  await connectToDatabase();

  const nextTier: SubscriptionTier =
    input.subscriptionStatus === "active" ||
    input.subscriptionStatus === "trialing" ||
    input.subscriptionStatus === "past_due"
      ? "pro"
      : "free";

  await User.findOneAndUpdate(
    { stripeCustomerId: input.stripeCustomerId },
    {
      $set: {
        subscriptionTier: nextTier,
        stripeSubscriptionId: input.stripeSubscriptionId,
        subscriptionStatus: input.subscriptionStatus,
        interviewsRemaining: FREE_INTERVIEWS_PER_MONTH,
      },
    },
  ).exec();
}

export async function handleSubscriptionCanceledByCustomerId(input: {
  stripeCustomerId: string;
}) {
  await connectToDatabase();

  await User.findOneAndUpdate(
    { stripeCustomerId: input.stripeCustomerId },
    {
      $set: {
        subscriptionTier: "free",
        subscriptionStatus: "canceled",
        stripeSubscriptionId: "",
      },
    },
  ).exec();
}

export async function getUserUsageStats(userId: string) {
  await connectToDatabase();

  const sessions = await InterviewSession.find({ userId })
    .sort({ createdAt: -1 })
    .select("type status createdAt finalReport")
    .lean<
      Array<{
        type: "technical" | "hr";
        status: "active" | "ended";
        createdAt: Date;
        finalReport?: {
          confidenceScore?: number;
        } | null;
      }>
    >();

  const ended = sessions.filter((session) => session.status === "ended");

  return {
    totalSessions: sessions.length,
    completedSessions: ended.length,
    avgConfidence: ended.length
      ? Math.round(
          ended.reduce((sum, session) => sum + (session.finalReport?.confidenceScore ?? 0), 0) / ended.length,
        )
      : 0,
    recentSessions: sessions.slice(0, 6),
  };
}
