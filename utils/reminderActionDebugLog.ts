import { YAHT_RUNTIME_STORAGE_ID } from "@/utils/storageIds";

const DEBUG_LEDGER_KEY = "reminder-action-debug-ledger";
const DEBUG_FILE_NAME = "yaht-reminder-action-debug.json";
const MAX_DEBUG_RECORDS = 40;

export type ReminderActionDebugRecord = {
  handledAtMs: number;
  event: string;
  source?: string;
  actionId?: string;
  notificationId?: string;
  habitId?: string;
  reminderDate?: string;
  reminderSeriesId?: string;
  scheduledFor?: number;
  detail?: string;
};

type WritableReminderActionDebugRecord = Omit<ReminderActionDebugRecord, "handledAtMs"> & {
  handledAtMs?: number;
};

const isReminderActionDebugRecord = (value: unknown): value is ReminderActionDebugRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReminderActionDebugRecord>;
  return typeof candidate.handledAtMs === "number" && typeof candidate.event === "string";
};

const getDebugStorage = () => {
  try {
    const { MMKV } = require("react-native-mmkv");
    return new MMKV({ id: YAHT_RUNTIME_STORAGE_ID });
  } catch {
    return null;
  }
};

const parseReminderActionDebugRecords = (rawValue: string | undefined, limit = MAX_DEBUG_RECORDS) => {
  if (!rawValue) {
    return [];
  }

  const parsedValue = JSON.parse(rawValue);
  return Array.isArray(parsedValue)
    ? parsedValue
        .filter(isReminderActionDebugRecord)
        .map((record) => {
          const { habitTitle: _habitTitle, ...sanitizedRecord } = record as ReminderActionDebugRecord & {
            habitTitle?: string;
          };
          return sanitizedRecord;
        })
        .slice(-limit)
    : [];
};

const getStoredReminderActionDebugRecords = (limit = MAX_DEBUG_RECORDS): ReminderActionDebugRecord[] => {
  try {
    const storage = getDebugStorage();
    return parseReminderActionDebugRecords(storage?.getString(DEBUG_LEDGER_KEY), limit);
  } catch {
    return [];
  }
};

export const getReminderActionDebugRecords = (limit = MAX_DEBUG_RECORDS): ReminderActionDebugRecord[] =>
  getStoredReminderActionDebugRecords(limit)
    .reverse()
    .map((record) => ({ ...record, source: record.source ?? "mmkv" }));

const getNativeFileDebugRecords = async (limit = MAX_DEBUG_RECORDS): Promise<ReminderActionDebugRecord[]> => {
  try {
    const { File, Paths } = require("expo-file-system");
    const file = new File(Paths.document, DEBUG_FILE_NAME);
    if (!file.exists) {
      return [];
    }

    return parseReminderActionDebugRecords(await file.text(), limit)
      .reverse()
      .map((record) => ({ ...record, source: record.source ?? "native-file" }));
  } catch {
    return [];
  }
};

const debugRecordKey = (record: ReminderActionDebugRecord) =>
  [
    record.handledAtMs,
    record.event,
    record.actionId,
    record.notificationId,
    record.habitId,
    record.reminderDate,
    record.detail,
  ].join("|");

export const getCombinedReminderActionDebugRecords = async (
  limit = MAX_DEBUG_RECORDS
): Promise<ReminderActionDebugRecord[]> => {
  const recordsByKey = new Map<string, ReminderActionDebugRecord>();
  const mmkvRecords = getReminderActionDebugRecords(limit);
  const fileRecords = await getNativeFileDebugRecords(limit);

  for (const record of [...mmkvRecords, ...fileRecords]) {
    const key = debugRecordKey(record);
    const existingRecord = recordsByKey.get(key);
    if (existingRecord) {
      const sources = new Set([...(existingRecord.source?.split("+") ?? []), ...(record.source?.split("+") ?? [])]);
      recordsByKey.set(key, {
        ...existingRecord,
        source: Array.from(sources).filter(Boolean).join("+"),
      });
    } else {
      recordsByKey.set(key, record);
    }
  }

  return Array.from(recordsByKey.values())
    .sort((a, b) => b.handledAtMs - a.handledAtMs)
    .slice(0, limit);
};

export const appendReminderActionDebugRecord = (record: WritableReminderActionDebugRecord) => {
  try {
    const storage = getDebugStorage();
    if (!storage) {
      return;
    }

    const currentRecords = getStoredReminderActionDebugRecords(MAX_DEBUG_RECORDS);
    const nextRecords = [
      ...currentRecords,
      {
        handledAtMs: record.handledAtMs ?? Date.now(),
        ...record,
      },
    ].slice(-MAX_DEBUG_RECORDS);

    storage.set(DEBUG_LEDGER_KEY, JSON.stringify(nextRecords));
  } catch {
    // Debug logging must not affect notification action handling.
  }
};
