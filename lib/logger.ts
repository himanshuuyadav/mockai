import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Record<string, unknown> | undefined;

const isProduction = process.env.NODE_ENV === "production";

function write(level: LogLevel, message: string, meta?: LogMeta) {
  if (level === "debug" && isProduction) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  const output = JSON.stringify(payload);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(output);
    return;
  }
  if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(output);
    return;
  }
  // eslint-disable-next-line no-console
  console.log(output);
}

export const logger = {
  debug(message: string, meta?: LogMeta) {
    write("debug", message, meta);
  },
  info(message: string, meta?: LogMeta) {
    write("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    write("warn", message, meta);
  },
  error(message: string, meta?: LogMeta) {
    write("error", message, meta);
  },
};

export async function withLatencyLog<T>(operation: string, fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info("latency", { operation, durationMs: Date.now() - start });
    return result;
  } catch (error) {
    logger.error("latency_error", {
      operation,
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
