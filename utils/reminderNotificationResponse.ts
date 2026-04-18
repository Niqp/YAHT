import dayjs from "dayjs";
import * as Notifications from "expo-notifications";

import { useHabitStore } from "@/store/habitStore";
import { CompletionType } from "@/types/habit";
import {
  cancelReminderNotificationSeries,
  DEFAULT_REMINDER_SNOOZE_MS,
  getReminderNotificationData,
  getReminderQueueStopNotificationData,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_OPEN_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
} from "@/utils/notifications";
import { claimReminderResponse } from "@/utils/reminderResponseLedger";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

const TODAY_ROUTE = "/(tabs)/today" as const;

export type ReminderNotificationResponseResult = {
  handled: boolean;
  shouldNavigateToToday: boolean;
  selectedDate?: string;
};

type ReminderNotificationResponseOptions = {
  allowNavigation?: boolean;
  nowMs?: number;
};

const emptyResult: ReminderNotificationResponseResult = {
  handled: false,
  shouldNavigateToToday: false,
};

export const getReminderNotificationResponseKey = (response: Notifications.NotificationResponse) =>
  `${response.notification.request.identifier}:${response.actionIdentifier}`;

export const isReminderQuickActionResponse = (response: Notifications.NotificationResponse) =>
  response.actionIdentifier === REMINDER_ACTION_DONE_IDENTIFIER ||
  response.actionIdentifier === REMINDER_ACTION_SNOOZE_IDENTIFIER;

export const getTodayReminderRoute = () => TODAY_ROUTE;

const clearLastNotificationResponse = () => {
  try {
    Notifications.clearLastNotificationResponse();
  } catch {
    // The last response cache is best-effort cleanup only.
  }
};

const clearHabitReminderSnooze = async (habitId: string, reminderDate: string) => {
  const { habits: currentHabits, updateHabit } = useHabitStore.getState();
  const habit = currentHabits[habitId];
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

const setHabitReminderSnooze = async (habitId: string, reminderDate: string, snoozedUntilMs: number) => {
  const { habits: currentHabits, updateHabit } = useHabitStore.getState();
  const habit = currentHabits[habitId];
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

const completeHabitFromReminder = async (habitId: string, reminderDate: string) => {
  const { habits: currentHabits, updateCompletion } = useHabitStore.getState();
  const habit = currentHabits[habitId];
  if (!habit) {
    return;
  }

  if (habit.completionHistory[reminderDate]?.isCompleted) {
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

export const handleReminderNotificationResponse = async (
  response: Notifications.NotificationResponse,
  { allowNavigation = true, nowMs = Date.now() }: ReminderNotificationResponseOptions = {}
): Promise<ReminderNotificationResponseResult> => {
  const reminderData = getReminderNotificationData(response);
  const stopData = getReminderQueueStopNotificationData(response);
  if (!reminderData && !stopData) {
    return emptyResult;
  }

  const isKnownReminderAction =
    response.actionIdentifier === REMINDER_ACTION_DONE_IDENTIFIER ||
    response.actionIdentifier === REMINDER_ACTION_SNOOZE_IDENTIFIER ||
    response.actionIdentifier === REMINDER_ACTION_OPEN_IDENTIFIER ||
    response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;

  if (reminderData && !isKnownReminderAction) {
    return emptyResult;
  }

  const responseKey = getReminderNotificationResponseKey(response);
  if (!claimReminderResponse(responseKey, nowMs)) {
    clearLastNotificationResponse();
    return emptyResult;
  }

  if (stopData) {
    await reconcileReminderNotifications({ reason: "notification-response" });
    clearLastNotificationResponse();
    return {
      handled: true,
      shouldNavigateToToday: allowNavigation,
    };
  }

  if (!reminderData) {
    return emptyResult;
  }

  await cancelReminderNotificationSeries(reminderData.reminderSeriesId);

  switch (response.actionIdentifier) {
    case REMINDER_ACTION_DONE_IDENTIFIER:
      await clearHabitReminderSnooze(reminderData.habitId, reminderData.reminderDate);
      await completeHabitFromReminder(reminderData.habitId, reminderData.reminderDate);
      break;
    case REMINDER_ACTION_SNOOZE_IDENTIFIER: {
      const snoozedUntilMs = dayjs(nowMs).add(DEFAULT_REMINDER_SNOOZE_MS, "ms").valueOf();
      await setHabitReminderSnooze(reminderData.habitId, reminderData.reminderDate, snoozedUntilMs);
      break;
    }
    case REMINDER_ACTION_OPEN_IDENTIFIER:
    case Notifications.DEFAULT_ACTION_IDENTIFIER:
      break;
    default:
      return emptyResult;
  }

  await reconcileReminderNotifications({ reason: "notification-response" });
  clearLastNotificationResponse();

  return {
    handled: true,
    shouldNavigateToToday:
      allowNavigation &&
      (response.actionIdentifier === REMINDER_ACTION_OPEN_IDENTIFIER ||
        response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER),
    selectedDate:
      response.actionIdentifier === REMINDER_ACTION_OPEN_IDENTIFIER ||
      response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
        ? reminderData.reminderDate
        : undefined,
  };
};
