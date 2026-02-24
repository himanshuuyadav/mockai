import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getRequiredEnv } from "@/lib/env";
import { createOrReuseStripeCustomer, createStripeCheckoutSession } from "@/services/stripe.service";
import { findUserProfileById, upsertStripeCustomerForUser } from "@/services/user.service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await findUserProfileById(session.user.id);
    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (profile.subscriptionTier === "pro" && profile.subscriptionStatus !== "canceled") {
      return NextResponse.json({ error: "User already has an active Pro subscription." }, { status: 400 });
    }

    const customerId = await createOrReuseStripeCustomer({
      stripeCustomerId: profile.stripeCustomerId,
      email: session.user.email,
      name: profile.name,
    });

    if (!profile.stripeCustomerId) {
      await upsertStripeCustomerForUser({
        userId: session.user.id,
        stripeCustomerId: customerId,
      });
    }

    const origin = getRequiredEnv("NEXTAUTH_URL");
    const checkout = await createStripeCheckoutSession({
      customerId,
      userId: session.user.id,
      successUrl: `${origin}/dashboard?billing=success`,
      cancelUrl: `${origin}/pricing?billing=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
