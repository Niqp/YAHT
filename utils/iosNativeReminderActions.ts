import { Platform } from "react-native";

import { useHabitStore } from "@/store/habitStore";
import { CompletionType } from "@/types/habit";
import {
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
  IOS_NATIVE_REMINDER_ACTION_STORAGE_ID,
  IOS_NATIVE_REMINDER_ACTION_STORAGE_KEY,
} from "@/utils/notifications";

type PlainStorage = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

type NativeReminderActionRecord = {
  responseKey: string;
  actionIdentifier: string;
  habitId: string;
  reminderDate: string;
  handledAtMs: number;
  snoozedUntilMs?: number;
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

const isNativeReminderActionRecord = (value: unknown): value is NativeReminderActionRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<NativeReminderActionRecord>;
  return (
    typeof candidate.responseKey === "string" &&
    typeof candidate.actionIdentifier === "string" &&
    typeof candidate.habitId === "string" &&
    typeof candidate.reminderDate === "string" &&
    typeof candidate.handledAtMs === "number"
  );
};

const getNativeReminderActionRecords = (): NativeReminderActionRecord[] => {
  const rawValue = getStorage()?.getString(IOS_NATIVE_REMINDER_ACTION_STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isNativeReminderActionRecord) : [];
  } catch {
    return [];
  }
};

const clearNativeReminderActionRecords = () => {
  getStorage()?.delete(IOS_NATIVE_REMINDER_ACTION_STORAGE_KEY);
};

const clearHabitReminderSnoozeInMemory = async (habitId: string, reminderDate: string) => {
  const { habits, updateHabit } = useHabitStore.getState();
  const habit = habits[habitId];
  if (!habit?.reminder) {
    return;
  }

  if (habit.reminder.snoozedDate !== reminderDate && typeof habit.reminder.snoozedUntilMs !== "number") {
    return;
  }

  await updateHabit(habitId, {
    reminder: {
      ...habit.reminder,
      snoozedDate: undefined,
      snoozedUntilMs: undefined,
    },
  });
};

const completeHabitInMemory = async (habitId: string, reminderDate: string) => {
  const { habits, updateCompletion } = useHabitStore.getState();
  const habit = habits[habitId];
  if (!habit || habit.completionHistory[reminderDate]?.isCompleted) {
    return;
  }

  if (habit.completion.type === CompletionType.SIMPLE) {
    await updateCompletion({ id: habitId, date: reminderDate });
    return;
  }

  if (habit.completion.goal) {
    await updateCompletion({ id: habitId, date: reminderDate, value: habit.completion.goal });
  }
};

const snoozeHabitInMemory = async (habitId: string, reminderDate: string, snoozedUntilMs?: number) => {
  if (typeof snoozedUntilMs !== "number") {
    return;
  }

  const { habits, updateHabit } = useHabitStore.getState();
  const habit = habits[habitId];
  if (!habit?.reminder) {
    return;
  }

  await updateHabit(habitId, {
    reminder: {
      ...habit.reminder,
      snoozedDate: reminderDate,
      snoozedUntilMs,
    },
  });
};

export const drainIosNativeReminderActions = async () => {
  if (Platform.OS !== "ios") {
    return;
  }

  const records = getNativeReminderActionRecords();
  if (records.length === 0) {
    return;
  }

  for (const record of records) {
    if (record.actionIdentifier === REMINDER_ACTION_DONE_IDENTIFIER) {
      await clearHabitReminderSnoozeInMemory(record.habitId, record.reminderDate);
      await completeHabitInMemory(record.habitId, record.reminderDate);
    } else if (record.actionIdentifier === REMINDER_ACTION_SNOOZE_IDENTIFIER) {
      await snoozeHabitInMemory(record.habitId, record.reminderDate, record.snoozedUntilMs);
    }
  }

  clearNativeReminderActionRecords();
};

export const setIosNativeReminderActionStorageForTests = (nextStorage: PlainStorage | undefined) => {
  storage = nextStorage;
};
