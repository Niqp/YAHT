import { Platform } from "react-native";

import { IOS_NATIVE_REMINDER_ACTION_STORAGE_ID, IOS_NATIVE_REMINDER_ACTION_STORAGE_KEY } from "@/utils/notifications";
import {
  parseNativeReminderActionRecords,
  replayNativeReminderActionRecords,
  type NativeReminderActionRecord,
} from "@/utils/nativeReminderActionReplay";

type PlainStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

let storage: PlainStorage | undefined;

const createStorage = (): PlainStorage | undefined => {
  if (Platform.OS !== "ios") {
    return undefined;
  }

  try {
    // Dynamic require so web/test bundles do not eagerly initialize MMKV.
    const { MMKV } = require("react-native-mmkv");
    return new MMKV({ id: IOS_NATIVE_REMINDER_ACTION_STORAGE_ID });
  } catch {
    return undefined;
  }
};

const getStorage = () => {
  storage ??= createStorage();
  return storage;
};

const getNativeReminderActionRecords = (): NativeReminderActionRecord[] => {
  return parseNativeReminderActionRecords(getStorage()?.getString(IOS_NATIVE_REMINDER_ACTION_STORAGE_KEY));
};

const clearNativeReminderActionRecords = () => {
  getStorage()?.delete(IOS_NATIVE_REMINDER_ACTION_STORAGE_KEY);
};

export const drainIosNativeReminderActions = async () => {
  if (Platform.OS !== "ios") {
    return;
  }

  const records = getNativeReminderActionRecords();
  if (records.length === 0) {
    return;
  }

  await replayNativeReminderActionRecords(records);
  clearNativeReminderActionRecords();
};

export const setIosNativeReminderActionStorageForTests = (nextStorage: PlainStorage | undefined) => {
  storage = nextStorage;
};
