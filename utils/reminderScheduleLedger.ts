import { Platform } from "react-native";

import type { ReminderQueueJob, StopReminderQueueJob } from "@/utils/reminderQueue";

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

export const clearReminderScheduleLedger = () => {
  getStorage().removeItem(REMINDER_SCHEDULE_LEDGER_KEY);
};
