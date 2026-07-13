import { logger } from "./logger";

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  logger.error({ error, ...context }, "captured error");
  try {
    const Sentry = require("@sentry/nextjs");
    if (Sentry?.captureException) {
      Sentry.captureException(error, { extra: context });
    }
  } catch {
    // sentry not configured
  }
}

export function captureMessage(message: string, level: "info" | "warn" | "error" = "info", context?: Record<string, unknown>): void {
  logger[level]({ ...context }, message);
  try {
    const Sentry = require("@sentry/nextjs");
    if (Sentry?.captureMessage) {
      const sentryLevel = (level === "warn" ? "warning" : level) as "fatal" | "error" | "warning" | "log" | "info" | "debug";
      Sentry.captureMessage(message, { level: sentryLevel, extra: context });
    }
  } catch {
    // sentry not configured
  }
}
