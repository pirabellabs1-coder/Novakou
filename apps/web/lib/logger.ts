/**
 * Structured JSON logger — drop-in replacement for `console.*`.
 *
 * Use this everywhere we currently call `console.error("[scope]", err)` for
 * production-grade observability. Each log line is a single JSON object
 * with timestamp + level + message + arbitrary context, queryable via
 * Vercel logs (or future Sentry forward).
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("checkout.init", { userId, amount });
 *   logger.error("webhook.failed", { provider: "moneroo", err: err.message });
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3, fatal: 4,
};

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[MIN_LEVEL]) return;

  const entry = {
    level,
    message,
    ts: new Date().toISOString(),
    env: process.env.NODE_ENV ?? "unknown",
    rev: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    ...(context ?? {}),
  };

  // Sanitize Error objects (won't JSON.stringify by default)
  const safe = JSON.stringify(entry, (_k, v) => {
    if (v instanceof Error) {
      return { name: v.name, message: v.message, stack: v.stack };
    }
    return v;
  });

  if (level === "error" || level === "fatal") console.error(safe);
  else if (level === "warn") console.warn(safe);
  else console.log(safe);
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, c),
  info:  (m: string, c?: Record<string, unknown>) => emit("info", m, c),
  warn:  (m: string, c?: Record<string, unknown>) => emit("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => emit("error", m, c),
  fatal: (m: string, c?: Record<string, unknown>) => emit("fatal", m, c),
};
