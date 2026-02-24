import { AppError } from "@/lib/errors";
import { requireSessionUser, withErrorHandler } from "@/lib/api-handler";
import { RateLimitRules } from "@/lib/rate-limit";
import { setSubscriptionCancelAtPeriodEnd } from "@/services/stripe.service";
import { getBillingSnapshotByUserId, updateSubscriptionByCustomerId } from "@/services/user.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async () => {
    const user = await requireSessionUser();

    const billing = await getBillingSnapshotByUserId(user.id);
    if (!billing?.stripeSubscriptionId || !billing.stripeCustomerId) {
      throw new AppError("No active Stripe subscription found.", { statusCode: 400 });
    }

    const subscription = await setSubscriptionCancelAtPeriodEnd({
      stripeSubscriptionId: billing.stripeSubscriptionId,
    });

    await updateSubscriptionByCustomerId({
      stripeCustomerId: billing.stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    });

    return {
      message: "Subscription cancellation scheduled at period end.",
      status: subscription.status,
    };
  },
  {
    route: "api.billing.cancel",
    rateLimit: RateLimitRules.billingOps,
  },
);
