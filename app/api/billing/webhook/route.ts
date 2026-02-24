import { NextResponse } from "next/server";

import {
  parseStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "@/services/stripe.service";
import {
  activateProSubscriptionByUserId,
  handleSubscriptionCanceledByCustomerId,
  updateSubscriptionByCustomerId,
} from "@/services/user.service";

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const rawBody = await request.text();
    verifyStripeWebhookSignature({
      rawBody,
      signatureHeader: signature,
    });

    const event = parseStripeWebhookEvent(rawBody);

    switch (event.type) {
      case "checkout.session.completed": {
        const checkout = event.data.object as {
          customer?: string;
          subscription?: string;
          metadata?: { userId?: string };
          payment_status?: string;
        };

        if (
          checkout.customer &&
          checkout.subscription &&
          checkout.metadata?.userId &&
          checkout.payment_status === "paid"
        ) {
          await activateProSubscriptionByUserId({
            userId: checkout.metadata.userId,
            stripeCustomerId: checkout.customer,
            stripeSubscriptionId: checkout.subscription,
            subscriptionStatus: "active",
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as {
          id?: string;
          customer?: string;
          status?: string;
        };

        if (subscription.id && subscription.customer && subscription.status) {
          await updateSubscriptionByCustomerId({
            stripeCustomerId: subscription.customer,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as {
          customer?: string;
        };

        if (subscription.customer) {
          await handleSubscriptionCanceledByCustomerId({
            stripeCustomerId: subscription.customer,
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
