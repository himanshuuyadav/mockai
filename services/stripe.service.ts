import { createHmac, timingSafeEqual } from "crypto";

import { getRequiredEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

type StripeCheckoutSession = {
  id: string;
  url: string;
  customer: string | null;
  subscription: string | null;
  metadata?: Record<string, string>;
};

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
};

type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

function getStripeSecretKey() {
  return getRequiredEnv("STRIPE_SECRET_KEY");
}

function toStripeBody(params: Record<string, string>) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    body.append(key, value);
  });
  return body;
}

async function stripeRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    logger.error("stripe_request_failed", {
      path,
      method: init?.method ?? "GET",
      status: response.status,
    });
    const message = typeof payload.error === "object" && payload.error && "message" in payload.error
      ? String((payload.error as { message?: string }).message ?? "Stripe API request failed.")
      : "Stripe API request failed.";
    throw new Error(message);
  }

  return payload;
}

export async function createOrReuseStripeCustomer(input: {
  stripeCustomerId?: string;
  email: string;
  name?: string;
}) {
  if (input.stripeCustomerId) {
    return input.stripeCustomerId;
  }

  const payload = (await stripeRequest("/customers", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toStripeBody({
      email: input.email,
      name: input.name ?? "",
    }),
  })) as { id: string };

  return payload.id;
}

export async function createStripeCheckoutSession(input: {
  customerId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const payload = (await stripeRequest("/checkout/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toStripeBody({
      mode: "subscription",
      customer: input.customerId,
      "line_items[0][price]": getRequiredEnv("STRIPE_PRO_PRICE_ID"),
      "line_items[0][quantity]": "1",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      "metadata[userId]": input.userId,
      allow_promotion_codes: "true",
    }),
  })) as StripeCheckoutSession;

  if (!payload.url) {
    throw new Error("Stripe checkout URL was not returned.");
  }

  return payload;
}

export async function createStripeProductAndPrice(input: {
  productName: string;
  amountInCents: number;
  currency?: string;
  interval?: "month" | "year";
}) {
  const product = (await stripeRequest("/products", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toStripeBody({
      name: input.productName,
    }),
  })) as { id: string };

  const price = (await stripeRequest("/prices", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toStripeBody({
      product: product.id,
      unit_amount: String(input.amountInCents),
      currency: input.currency ?? "usd",
      "recurring[interval]": input.interval ?? "month",
    }),
  })) as { id: string };

  return {
    productId: product.id,
    priceId: price.id,
  };
}

export async function setSubscriptionCancelAtPeriodEnd(input: {
  stripeSubscriptionId: string;
}) {
  return (await stripeRequest(`/subscriptions/${input.stripeSubscriptionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: toStripeBody({
      cancel_at_period_end: "true",
    }),
  })) as StripeSubscription;
}

export function verifyStripeWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string;
}) {
  const webhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");
  const parts = input.signatureHeader.split(",").map((value) => value.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signaturePart = parts.find((part) => part.startsWith("v1="));

  if (!timestampPart || !signaturePart) {
    logger.warn("stripe_signature_invalid_header");
    throw new Error("Invalid Stripe signature header.");
  }

  const timestamp = timestampPart.replace("t=", "");
  const providedSignature = signaturePart.replace("v1=", "");
  const signedPayload = `${timestamp}.${input.rawBody}`;
  const expectedSignature = createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const provided = Buffer.from(providedSignature, "hex");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    logger.warn("stripe_signature_mismatch");
    throw new Error("Stripe signature verification failed.");
  }
}

export function parseStripeWebhookEvent(rawBody: string) {
  return JSON.parse(rawBody) as StripeWebhookEvent;
}
