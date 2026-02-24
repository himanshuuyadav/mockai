import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      subscriptionTier?: "free" | "pro";
      subscriptionStatus?: string;
      interviewsRemaining?: number;
    };
  }
}
