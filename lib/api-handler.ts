import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { AppError, RateLimitError, UnauthorizedError, getErrorStatusCode, getUserFriendlyErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/rate-limit";

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type WithErrorHandlerOptions = {
  route: string;
  rateLimit?: RateLimitConfig;
};

type HandlerContext = Record<string, unknown>;

type HandlerResult = unknown | Response | NextResponse;

type Handler<TContext extends HandlerContext = HandlerContext> = (
  request: Request,
  context: TContext,
) => Promise<HandlerResult>;

export function successResponse<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    init,
  );
}

export function errorResponse(error: string, status = 400, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { ...(init ?? {}), status },
  );
}

export function withErrorHandler<TContext extends HandlerContext = HandlerContext>(
  handler: Handler<TContext>,
  options: WithErrorHandlerOptions,
) {
  return async function wrapped(request: Request, context: TContext = {} as TContext) {
    const start = Date.now();

    try {
      if (options.rateLimit) {
        enforceRateLimit(request, options.rateLimit);
      }

      logger.info("request_start", {
        route: options.route,
        method: request.method,
      });

      const result = await handler(request, context);

      if (result instanceof Response) {
        logger.info("request_end", {
          route: options.route,
          method: request.method,
          status: result.status,
          durationMs: Date.now() - start,
        });
        return result;
      }

      logger.info("request_end", {
        route: options.route,
        method: request.method,
        status: 200,
        durationMs: Date.now() - start,
      });
      return successResponse(result);
    } catch (error) {
      const status = getErrorStatusCode(error);
      const message = getUserFriendlyErrorMessage(error);
      const isRateLimitError = error instanceof RateLimitError;

      logger.error("request_error", {
        route: options.route,
        method: request.method,
        status,
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (isRateLimitError) {
        return errorResponse(message, status, {
          headers: {
            "Retry-After": String(error.retryAfterSeconds ?? 1),
          },
        });
      }

      return errorResponse(message, status);
    }
  };
}

export async function requireSessionUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new UnauthorizedError();
  }
  if (!/^[a-fA-F0-9]{24}$/.test(userId)) {
    throw new UnauthorizedError("Invalid session identity.");
  }
  return session.user;
}

export function assertFound<T>(value: T | null | undefined, message = "Resource not found.") {
  if (!value) {
    throw new AppError(message, { statusCode: 404 });
  }
  return value;
}
