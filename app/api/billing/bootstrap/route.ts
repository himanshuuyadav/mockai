import { AppError } from "@/lib/errors";
import { withErrorHandler } from "@/lib/api-handler";
import { getEnv } from "@/lib/env";
import { RateLimitRules } from "@/lib/rate-limit";
import { billingBootstrapSchema } from "@/lib/schemas/api";
import { createStripeProductAndPrice } from "@/services/stripe.service";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(
  async (request: Request) => {
    const token = request.headers.get("x-billing-bootstrap-token");
    const expectedToken = getEnv("BILLING_BOOTSTRAP_TOKEN");

    if (!expectedToken || token !== expectedToken) {
      throw new AppError("Unauthorized", { statusCode: 401 });
    }

    const payload = billingBootstrapSchema.parse(await request.json());

    const created = await createStripeProductAndPrice({
      productName: payload.productName,
      amountInCents: payload.amountInCents,
      currency: payload.currency,
      interval: payload.interval,
    });

    return created;
  },
  {
    route: "api.billing.bootstrap",
    rateLimit: RateLimitRules.billingOps,
  },
);
