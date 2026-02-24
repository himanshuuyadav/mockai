import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  exposeMessage: boolean;
  code?: string;

  constructor(message: string, options?: { statusCode?: number; exposeMessage?: boolean; code?: string }) {
    super(message);
    this.name = "AppError";
    this.statusCode = options?.statusCode ?? 500;
    this.exposeMessage = options?.exposeMessage ?? true;
    this.code = options?.code;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, { statusCode: 401, code: "UNAUTHORIZED" });
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid request input.") {
    super(message, { statusCode: 400, code: "VALIDATION_ERROR" });
  }
}

export class RateLimitError extends AppError {
  retryAfterSeconds?: number;

  constructor(message = "Too many requests. Please try again later.", retryAfterSeconds?: number) {
    super(message, { statusCode: 429, code: "RATE_LIMIT" });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function getErrorStatusCode(error: unknown) {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (error instanceof ZodError) {
    return 400;
  }
  return 500;
}

export function getUserFriendlyErrorMessage(error: unknown) {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return firstIssue?.message || "Invalid request input.";
  }
  if (error instanceof Error) {
    return error.message || "Unexpected server error.";
  }
  return "Unexpected server error.";
}
