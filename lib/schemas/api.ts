import { z } from "zod";

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required."),
});

export const createInterviewSessionBodySchema = z.object({
  type: z.enum(["technical", "hr"]),
  jdInfo: z.string().max(3000).optional(),
});

export const submitInterviewAnswerSchema = z.object({
  transcript: z.string().trim().min(1, "Transcript is required."),
});

export const endInterviewSchema = z.object({
  reason: z.enum(["manual", "auto_time_limit"]).default("manual"),
});

export const billingBootstrapSchema = z.object({
  productName: z.string().min(1, "productName is required."),
  amountInCents: z.number().int().positive("amountInCents must be > 0."),
  currency: z.string().min(3).max(3).optional(),
  interval: z.enum(["month", "year"]).optional(),
});
