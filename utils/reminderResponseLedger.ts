import { Platform } from "react-native";

export const REMINDER_RESPONSE_LEDGER_TTL_MS = 48 * 60 * 60 * 1000;

const REMINDER_RESPONSE_LEDGER_KEY = "reminder-response-ledger";

type PlainStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type ReminderResponseLedgerEntry = {
  responseKey: string;
  handledAtMs: number;
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require("react-native-mmkv");
  const nativeStorage = new MMKV({ id: "reminder-response-ledger" });

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

const isReminderResponseLedgerEntry = (value: unknown): value is ReminderResponseLedgerEntry => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReminderResponseLedgerEntry>;
  return typeof candidate.responseKey === "string" && typeof candidate.handledAtMs === "number";
};

const getLedgerEntries = (): ReminderResponseLedgerEntry[] => {
  try {
    const rawValue = getStorage().getItem(REMINDER_RESPONSE_LEDGER_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isReminderResponseLedgerEntry) : [];
  } catch {
    return [];
  }
};

const saveLedgerEntries = (entries: ReminderResponseLedgerEntry[]) => {
  getStorage().setItem(REMINDER_RESPONSE_LEDGER_KEY, JSON.stringify(entries));
};

export const claimReminderResponse = (responseKey: string, nowMs = Date.now()): boolean => {
  const cutoffMs = nowMs - REMINDER_RESPONSE_LEDGER_TTL_MS;
  const entries = getLedgerEntries().filter((entry) => entry.handledAtMs >= cutoffMs);

  if (entries.some((entry) => entry.responseKey === responseKey)) {
    saveLedgerEntries(entries);
    return false;
  }

  saveLedgerEntries([...entries, { responseKey, handledAtMs: nowMs }]);
  return true;
};

export const clearReminderResponseLedger = () => {
  getStorage().removeItem(REMINDER_RESPONSE_LEDGER_KEY);
};

export const setReminderResponseLedgerStorageForTests = (nextStorage: PlainStorage | undefined) => {
  storage = nextStorage;
  memoryValues.clear();
};
