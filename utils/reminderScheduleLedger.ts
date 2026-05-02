import { Platform } from "react-native";

import type { ReminderQueueJob, StopReminderQueueJob } from "@/utils/reminderQueue";
import { REMINDER_NOTIFICATION_PREFIX } from "@/utils/notifications";

export const REMINDER_SCHEDULE_LEDGER_VERSION = 1;

const REMINDER_SCHEDULE_LEDGER_KEY = "reminder-schedule-ledger";

export type ReminderScheduleLedgerEntry = ReminderQueueJob & {
  signature: string;
  scheduledAtMs: number;
};

export type StopReminderScheduleLedgerEntry = StopReminderQueueJob & {
  signature: string;
  scheduledAtMs: number;
};

export type ReminderScheduleLedger = {
  version: typeof REMINDER_SCHEDULE_LEDGER_VERSION;
  generatedAtMs: number;
  normalNotifications: ReminderScheduleLedgerEntry[];
  stopNotification?: StopReminderScheduleLedgerEntry;
};

type PlainStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

let storage: PlainStorage | undefined;

const webStorage: PlainStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Best effort only.
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Best effort only.
    }
  },
};

const memoryValues = new Map<string, string>();

const memoryStorage: PlainStorage = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => {
    memoryValues.set(key, value);
  },
  removeItem: (key) => {
    memoryValues.delete(key);
  },
};

const createNativeStorage = (): PlainStorage => {
  // Dynamic require so web/test bundles do not eagerly initialize MMKV.
  const { MMKV } = require("react-native-mmkv");
  const nativeStorage = new MMKV({ id: "reminder-schedule-ledger" });

  return {
    getItem: (key) => nativeStorage.getString(key) ?? null,
    setItem: (key, value) => {
      nativeStorage.set(key, value);
    },
    removeItem: (key) => {
      nativeStorage.delete(key);
    },
  };
};

const getStorage = () => {
  if (storage) {
    return storage;
  }

  try {
    storage = Platform.OS === "web" ? webStorage : createNativeStorage();
  } catch {
    storage = memoryStorage;
  }

  return storage;
};

export const createEmptyReminderScheduleLedger = (generatedAtMs = Date.now()): ReminderScheduleLedger => ({
  version: REMINDER_SCHEDULE_LEDGER_VERSION,
  generatedAtMs,
  normalNotifications: [],
});

const isReminderScheduleLedger = (value: unknown): value is ReminderScheduleLedger => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReminderScheduleLedger>;
  return (
    candidate.version === REMINDER_SCHEDULE_LEDGER_VERSION &&
    typeof candidate.generatedAtMs === "number" &&
    Array.isArray(candidate.normalNotifications)
  );
};

export const getReminderScheduleLedger = (): ReminderScheduleLedger => {
  try {
    const rawValue = getStorage().getItem(REMINDER_SCHEDULE_LEDGER_KEY);
    if (!rawValue) {
      return createEmptyReminderScheduleLedger();
    }

    const parsedValue = JSON.parse(rawValue);
    return isReminderScheduleLedger(parsedValue) ? parsedValue : createEmptyReminderScheduleLedger();
  } catch {
    return createEmptyReminderScheduleLedger();
  }
};

export const saveReminderScheduleLedger = (ledger: ReminderScheduleLedger) => {
  getStorage().setItem(REMINDER_SCHEDULE_LEDGER_KEY, JSON.stringify(ledger));
};

const createReminderSignature = (job: ReminderQueueJob) =>
  JSON.stringify({
    version: REMINDER_SCHEDULE_LEDGER_VERSION,
    platform: Platform.OS,
    type: "normal",
    habitId: job.habitId,
    habitTitle: job.habitTitle,
    timestamp: job.timestamp,
    reminderDate: job.reminderDate,
    reminderSeriesId: job.reminderSeriesId,
    attemptNumber: job.attemptNumber,
    maxAttempts: job.maxAttempts,
    repeatIntervalMs: job.repeatIntervalMs,
  });

export const removeReminderScheduleLedgerEntriesForSeries = (reminderSeriesId: string) => {
  const ledger = getReminderScheduleLedger();
  const notificationPrefix = `${REMINDER_NOTIFICATION_PREFIX}${reminderSeriesId}-`;
  const normalNotifications = ledger.normalNotifications.filter((entry) => {
    if (entry.reminderSeriesId === reminderSeriesId) {
      return false;
    }

    // Older/native ledger writers may only be identifiable by the stable notification ID prefix.
    return !entry.notificationId.startsWith(notificationPrefix);
  });

  saveReminderScheduleLedger({
    ...ledger,
    generatedAtMs: Date.now(),
    normalNotifications,
  });
};

export const replaceReminderScheduleLedgerEntriesForSeries = (
  reminderSeriesId: string,
  jobs: ReminderQueueJob[],
  scheduledAtMs = Date.now()
) => {
  const ledger = getReminderScheduleLedger();
  const normalNotifications = ledger.normalNotifications.filter((entry) => entry.reminderSeriesId !== reminderSeriesId);

  saveReminderScheduleLedger({
    ...ledger,
    generatedAtMs: scheduledAtMs,
    normalNotifications: [
      ...normalNotifications,
      ...jobs.map((job) => ({
        ...job,
        signature: createReminderSignature(job),
        scheduledAtMs,
      })),
    ],
  });
};

export const clearReminderScheduleLedger = () => {
  getStorage().removeItem(REMINDER_SCHEDULE_LEDGER_KEY);
};
