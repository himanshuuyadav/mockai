import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

type SyncOAuthUserInput = {
  email: string;
  name?: string | null;
  image?: string | null;
};

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
    .select("name email image subscriptionTier createdAt")
    .lean<{
      name: string;
      email: string;
      image: string;
      subscriptionTier: "free" | "pro" | "enterprise";
      createdAt: Date;
    } | null>();
}
