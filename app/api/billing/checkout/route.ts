import { AppError } from "@/lib/errors";
import { requireSessionUser, withErrorHandler } from "@/lib/api-handler";
import { getRequiredEnv } from "@/lib/env";
import { RateLimitRules } from "@/lib/rate-limit";
import { createOrReuseStripeCustomer, createStripeCheckoutSession } from "@/services/stripe.service";
import { findUserProfileById, upsertStripeCustomerForUser } from "@/services/user.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async () => {
    const user = await requireSessionUser();
    if (!user.email) {
      throw new AppError("Unauthorized", { statusCode: 401 });
    }

    const profile = await findUserProfileById(user.id);
    if (!profile) {
      throw new AppError("User not found.", { statusCode: 404 });
    }
    if (profile.subscriptionTier === "pro" && profile.subscriptionStatus !== "canceled") {
      throw new AppError("User already has an active Pro subscription.", { statusCode: 400 });
    }

    const customerId = await createOrReuseStripeCustomer({
      stripeCustomerId: profile.stripeCustomerId,
      email: user.email,
      name: profile.name,
    });

    if (!profile.stripeCustomerId) {
      await upsertStripeCustomerForUser({
        userId: user.id,
        stripeCustomerId: customerId,
      });
    }

    const origin = getRequiredEnv("NEXTAUTH_URL");
    const checkout = await createStripeCheckoutSession({
      customerId,
      userId: user.id,
      successUrl: `${origin}/dashboard?billing=success`,
      cancelUrl: `${origin}/dashboard?billing=cancelled`,
    });

    return { checkoutUrl: checkout.url };
  },
  {
    route: "api.billing.checkout",
    rateLimit: RateLimitRules.billingOps,
  },
);
