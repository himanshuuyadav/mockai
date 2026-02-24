import { NextResponse } from "next/server";

import { getEnv } from "@/lib/env";
import { createStripeProductAndPrice } from "@/services/stripe.service";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("x-billing-bootstrap-token");
    const expectedToken = getEnv("BILLING_BOOTSTRAP_TOKEN");

    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as {
      productName?: string;
      amountInCents?: number;
      currency?: string;
      interval?: "month" | "year";
    };

    if (!payload.productName || !payload.amountInCents) {
      return NextResponse.json({ error: "productName and amountInCents are required." }, { status: 400 });
    }

    const created = await createStripeProductAndPrice({
      productName: payload.productName,
      amountInCents: payload.amountInCents,
      currency: payload.currency,
      interval: payload.interval,
    });

    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to bootstrap billing.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
