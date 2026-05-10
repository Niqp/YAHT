import { useHabitStore } from "@/store/habitStore";
import { CompletionType } from "@/types/habit";
import { REMINDER_ACTION_DONE_IDENTIFIER, REMINDER_ACTION_SNOOZE_IDENTIFIER } from "@/utils/notifications";

export type NativeReminderActionRecord = {
  responseKey: string;
  actionIdentifier: string;
  habitId: string;
  reminderDate: string;
  handledAtMs: number;
  snoozedUntilMs?: number;
};

export const isNativeReminderActionRecord = (value: unknown): value is NativeReminderActionRecord => {
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

export const parseNativeReminderActionRecords = (rawValue: string | undefined): NativeReminderActionRecord[] => {
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

export const clearHabitReminderSnoozeInMemory = async (habitId: string, reminderDate: string) => {
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

export const completeHabitInMemory = async (habitId: string, reminderDate: string) => {
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

export const snoozeHabitInMemory = async (habitId: string, reminderDate: string, snoozedUntilMs?: number) => {
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

export const replayNativeReminderActionRecords = async (records: NativeReminderActionRecord[]) => {
  for (const record of records) {
    if (record.actionIdentifier === REMINDER_ACTION_DONE_IDENTIFIER) {
      await clearHabitReminderSnoozeInMemory(record.habitId, record.reminderDate);
      await completeHabitInMemory(record.habitId, record.reminderDate);
    } else if (record.actionIdentifier === REMINDER_ACTION_SNOOZE_IDENTIFIER) {
      await snoozeHabitInMemory(record.habitId, record.reminderDate, record.snoozedUntilMs);
    }
  }
};
