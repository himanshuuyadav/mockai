export const FREE_INTERVIEWS_PER_MONTH = 5;

export type SubscriptionTier = "free" | "pro";

export function isProTier(tier?: string | null) {
  return tier === "pro";
}
