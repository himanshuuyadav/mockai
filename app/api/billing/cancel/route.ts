import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { setSubscriptionCancelAtPeriodEnd } from "@/services/stripe.service";
import { getBillingSnapshotByUserId, updateSubscriptionByCustomerId } from "@/services/user.service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billing = await getBillingSnapshotByUserId(session.user.id);
    if (!billing?.stripeSubscriptionId || !billing.stripeCustomerId) {
      return NextResponse.json({ error: "No active Stripe subscription found." }, { status: 400 });
    }

    const subscription = await setSubscriptionCancelAtPeriodEnd({
      stripeSubscriptionId: billing.stripeSubscriptionId,
    });

    await updateSubscriptionByCustomerId({
      stripeCustomerId: billing.stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
    });

    return NextResponse.json({
      message: "Subscription cancellation scheduled at period end.",
      status: subscription.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to cancel subscription.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
