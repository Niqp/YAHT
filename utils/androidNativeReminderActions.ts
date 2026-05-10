import { Platform } from "react-native";

import {
  ANDROID_NATIVE_REMINDER_ACTION_STORAGE_ID,
  ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY,
} from "@/utils/notifications";
import {
  parseNativeReminderActionRecords,
  replayNativeReminderActionRecords,
  type NativeReminderActionRecord,
} from "@/utils/nativeReminderActionReplay";

type PlainStorage = {
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
};

const ANDROID_NATIVE_REMINDER_ACTION_FILE_NAME = "yaht-android-native-reminder-actions.json";

let storage: PlainStorage | undefined;

const createStorage = (): PlainStorage | undefined => {
  if (Platform.OS !== "android") {
    return undefined;
  }

  try {
    // Dynamic require so web/test bundles do not eagerly initialize MMKV.
    const { MMKV } = require("react-native-mmkv");
    return new MMKV({ id: ANDROID_NATIVE_REMINDER_ACTION_STORAGE_ID });
  } catch {
    return undefined;
  }
};

const getStorage = () => {
  storage ??= createStorage();
  return storage;
};

const getNativeReminderActionFile = () => {
  try {
    const { File, Paths } = require("expo-file-system");
    return new File(Paths.document, ANDROID_NATIVE_REMINDER_ACTION_FILE_NAME);
  } catch {
    return undefined;
  }
};

const getNativeReminderActionRecords = async (): Promise<NativeReminderActionRecord[]> => {
  const recordsByKey = new Map<string, NativeReminderActionRecord>();

  for (const record of parseNativeReminderActionRecords(
    getStorage()?.getString(ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY)
  )) {
    recordsByKey.set(record.responseKey, record);
  }

  try {
    const file = getNativeReminderActionFile();
    if (file?.exists) {
      for (const record of parseNativeReminderActionRecords(await file.text())) {
        recordsByKey.set(record.responseKey, record);
      }
    }
  } catch {
    // The file mirror is a fallback channel; MMKV records are still usable.
  }

  return Array.from(recordsByKey.values()).sort((a, b) => a.handledAtMs - b.handledAtMs);
};

const clearNativeReminderActionRecords = () => {
  getStorage()?.delete(ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY);

  try {
    const file = getNativeReminderActionFile();
    if (file?.exists) {
      file.delete();
    }
  } catch {
    // Best-effort cleanup only.
  }
};

export const drainAndroidNativeReminderActions = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  const records = await getNativeReminderActionRecords();
  if (records.length === 0) {
    return;
  }

  await replayNativeReminderActionRecords(records);
  clearNativeReminderActionRecords();
};

export const setAndroidNativeReminderActionStorageForTests = (nextStorage: PlainStorage | undefined) => {
  storage = nextStorage;
};
