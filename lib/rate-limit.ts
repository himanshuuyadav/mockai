import { RateLimitError } from "@/lib/errors";

type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getNow() {
  return Date.now();
}

function cleanupExpiredEntries(now: number) {
  if (store.size < 500) {
    return;
  }
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp || "unknown";
}

export function enforceRateLimit(request: Request, rule: RateLimitRule) {
  const now = getNow();
  cleanupExpiredEntries(now);

  const ip = getClientIp(request);
  const bucketKey = `${rule.key}:${ip}`;
  const existing = store.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    store.set(bucketKey, {
      count: 1,
      resetAt: now + rule.windowMs,
    });
    return;
  }

  existing.count += 1;
  store.set(bucketKey, existing);

  if (existing.count > rule.limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    throw new RateLimitError(
      "Too many requests from your IP. Please wait before trying again.",
      retryAfterSeconds,
    );
  }
}

export const RateLimitRules = {
  aiCalls: { key: "ai_calls", limit: 40, windowMs: 60 * 1000 },
  interviewCreate: { key: "interview_create", limit: 10, windowMs: 60 * 1000 },
  resumeUpload: { key: "resume_upload", limit: 8, windowMs: 60 * 1000 },
  billingOps: { key: "billing_ops", limit: 20, windowMs: 60 * 1000 },
} as const;
