export type DiagnosticPrimitive = string | number | boolean | null;
export type DiagnosticContext = Record<string, DiagnosticPrimitive | DiagnosticPrimitive[] | undefined>;

const SAFE_STRING_KEYS = new Set([
  "action",
  "actionId",
  "actionIdentifier",
  "appState",
  "category",
  "completionMode",
  "completionType",
  "date",
  "eventSource",
  "habitId",
  "level",
  "mode",
  "notificationId",
  "operation",
  "platform",
  "reason",
  "reminderDate",
  "reminderSeriesId",
  "repetitionType",
  "responseKey",
  "route",
  "selectedDate",
  "source",
  "state",
  "status",
  "timerId",
  "timeZone",
]);

const SAFE_NUMBER_KEYS = new Set([
  "attemptNumber",
  "completedCount",
  "count",
  "deletedCount",
  "dismissedCount",
  "durationMs",
  "elapsedMs",
  "generatedAtMs",
  "goal",
  "habitCount",
  "ledgerCount",
  "maxAttempts",
  "newOffsetMinutes",
  "normalCount",
  "nowMs",
  "oldOffsetMinutes",
  "repeatIntervalMs",
  "scheduledAtMs",
  "scheduledCount",
  "scheduledFor",
  "snoozedUntilMs",
  "timestamp",
  "timerCount",
  "totalCount",
  "updatedCount",
  "utcOffsetMinutes",
  "value",
]);

const SAFE_BOOLEAN_KEYS = new Set([
  "allowNavigation",
  "canSchedule",
  "changed",
  "completed",
  "didComplete",
  "didMutate",
  "enabled",
  "handled",
  "hasOverflow",
  "hydrated",
  "isCompleted",
  "isForeground",
  "needsFullReconcile",
  "navigate",
  "reminderEnabled",
  "repeatIfNotCompleted",
  "shouldNavigateToToday",
  "targeted",
]);

const UNSAFE_KEYS = new Set([
  "body",
  "content",
  "data",
  "detail",
  "fileContent",
  "habit",
  "habitTitle",
  "icon",
  "importedHabits",
  "message",
  "raw",
  "stack",
  "text",
  "title",
]);

const isSafeArray = (value: unknown): value is DiagnosticPrimitive[] =>
  Array.isArray(value) &&
  value.every(
    (item) => item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean"
  );

const sanitizeError = (error: Error) => ({
  errorName: error.name || "Error",
  errorCategory: "caught-error",
});

export const sanitizeDiagnosticContext = (context: unknown): DiagnosticContext => {
  if (!context || typeof context !== "object") {
    return {};
  }

  const sanitized: DiagnosticContext = {};
  for (const [key, value] of Object.entries(context as Record<string, unknown>)) {
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }

    if (key === "error" && value instanceof Error) {
      Object.assign(sanitized, sanitizeError(value));
      continue;
    }

    if (SAFE_STRING_KEYS.has(key) && typeof value === "string") {
      sanitized[key] = value;
      continue;
    }

    if (SAFE_NUMBER_KEYS.has(key) && typeof value === "number" && Number.isFinite(value)) {
      sanitized[key] = value;
      continue;
    }

    if (SAFE_BOOLEAN_KEYS.has(key) && typeof value === "boolean") {
      sanitized[key] = value;
      continue;
    }

    if ((SAFE_STRING_KEYS.has(key) || SAFE_NUMBER_KEYS.has(key)) && isSafeArray(value)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
