import { Platform } from "react-native";

import { sanitizeDiagnosticContext, type DiagnosticContext } from "@/utils/diagnostics/diagnosticRedaction";
import { YAHT_RUNTIME_STORAGE_ID } from "@/utils/storageIds";

export const DIAGNOSTIC_EVENTS_KEY = "diagnostic-events";
export const DIAGNOSTIC_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const DIAGNOSTIC_MAX_RECORDS = 1000;
export const DIAGNOSTIC_MAX_SERIALIZED_BYTES = 1024 * 1024;

export type DiagnosticLevel = "info" | "warn" | "error";

export type DiagnosticEvent = {
  timestamp: number;
  level: DiagnosticLevel;
  event: string;
  source: "js" | "android-native" | "ios-native";
  context: DiagnosticContext;
};

type PlainStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

type LogOptions = {
  nowMs?: number;
  source?: DiagnosticEvent["source"];
};

let storage: PlainStorage | undefined;
let memoryEvents = "";

const memoryStorage: PlainStorage = {
  getString: () => memoryEvents || undefined,
  set: (_key, value) => {
    memoryEvents = value;
  },
  delete: () => {
    memoryEvents = "";
  },
};

const createNativeStorage = (): PlainStorage => {
  const { MMKV } = require("react-native-mmkv");
  return new MMKV({ id: YAHT_RUNTIME_STORAGE_ID });
};

const getStorage = () => {
  if (storage) {
    return storage;
  }

  try {
    storage = Platform.OS === "web" ? memoryStorage : createNativeStorage();
  } catch {
    storage = memoryStorage;
  }

  return storage;
};

const isDiagnosticEvent = (value: unknown): value is DiagnosticEvent => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DiagnosticEvent>;
  return (
    typeof candidate.timestamp === "number" &&
    (candidate.level === "info" || candidate.level === "warn" || candidate.level === "error") &&
    typeof candidate.event === "string" &&
    (candidate.source === "js" || candidate.source === "android-native" || candidate.source === "ios-native") &&
    !!candidate.context &&
    typeof candidate.context === "object"
  );
};

const parseEvents = (rawValue: string | undefined): DiagnosticEvent[] => {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter(isDiagnosticEvent) : [];
  } catch {
    return [];
  }
};

const pruneEvents = (events: DiagnosticEvent[], nowMs: number) => {
  const cutoffMs = nowMs - DIAGNOSTIC_RETENTION_MS;
  let nextEvents = events.filter((event) => event.timestamp >= cutoffMs).slice(-DIAGNOSTIC_MAX_RECORDS);
  let serialized = JSON.stringify(nextEvents);

  while (serialized.length > DIAGNOSTIC_MAX_SERIALIZED_BYTES && nextEvents.length > 0) {
    nextEvents = nextEvents.slice(1);
    serialized = JSON.stringify(nextEvents);
  }

  return nextEvents;
};

const saveEvents = (events: DiagnosticEvent[]) => {
  getStorage().set(DIAGNOSTIC_EVENTS_KEY, JSON.stringify(events));
};

export const getDiagnosticEvents = ({ nowMs = Date.now() }: { nowMs?: number } = {}) => {
  const events = pruneEvents(parseEvents(getStorage().getString(DIAGNOSTIC_EVENTS_KEY)), nowMs);
  saveEvents(events);
  return events;
};

export const clearDiagnosticEvents = () => {
  getStorage().delete(DIAGNOSTIC_EVENTS_KEY);
};

export const logEvent = (
  event: string,
  context: unknown = {},
  { nowMs = Date.now(), source = "js" }: LogOptions = {}
) => {
  try {
    const nextEvent: DiagnosticEvent = {
      timestamp: nowMs,
      level: "info",
      event,
      source,
      context: sanitizeDiagnosticContext(context),
    };
    saveEvents(pruneEvents([...parseEvents(getStorage().getString(DIAGNOSTIC_EVENTS_KEY)), nextEvent], nowMs));
  } catch {
    // Diagnostics must never affect app behavior.
  }
};

export const logInfo = (event: string, context?: unknown, options?: LogOptions) => logEvent(event, context, options);

export const logWarn = (event: string, context?: unknown, options: LogOptions = {}) => {
  logWithLevel("warn", event, context, options);
};

export const logError = (event: string, context?: unknown, options: LogOptions = {}) => {
  logWithLevel("error", event, context, options);
};

const logWithLevel = (level: DiagnosticLevel, event: string, context: unknown = {}, options: LogOptions = {}) => {
  try {
    const nowMs = options.nowMs ?? Date.now();
    const nextEvent: DiagnosticEvent = {
      timestamp: nowMs,
      level,
      event,
      source: options.source ?? "js",
      context: sanitizeDiagnosticContext(context),
    };
    saveEvents(pruneEvents([...parseEvents(getStorage().getString(DIAGNOSTIC_EVENTS_KEY)), nextEvent], nowMs));
  } catch {
    // Diagnostics must never affect app behavior.
  }
};

export const setDiagnosticStorageForTests = (nextStorage: PlainStorage | undefined) => {
  storage = nextStorage;
  memoryEvents = "";
};
