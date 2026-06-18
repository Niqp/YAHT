import dayjs from "dayjs";
import * as Notifications from "expo-notifications";

import { useHabitStore } from "@/store/habitStore";
import { CompletionType, RepetitionType } from "@/types/habit";
import type { ReminderQueueJob } from "@/utils/reminderQueue";
import {
  cancelReminderNotificationSeries,
  DEFAULT_REMINDER_SNOOZE_MS,
  getReminderNotificationData,
  getReminderNotificationSeriesId,
  getReminderQueueStopNotificationData,
  MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_OPEN_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
  schedulePreparedReminderNotification,
} from "@/utils/notifications";
import {
  removeReminderScheduleLedgerEntriesForSeries,
  replaceReminderScheduleLedgerEntriesForSeries,
} from "@/utils/reminderScheduleLedger";
import { logEvent, logWarn } from "@/utils/diagnostics/diagnosticLogger";
import { appendReminderActionDebugRecord } from "@/utils/reminderActionDebugLog";
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
  completionMode?: "full" | "targeted-background";
  nowMs?: number;
};

const emptyResult: ReminderNotificationResponseResult = {
  handled: false,
  shouldNavigateToToday: false,
};

type TargetedReminderSeriesJob = Omit<ReminderQueueJob, "notificationId">;

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

const clearHabitReminderSnooze = async (habitId: string, reminderDate: string): Promise<boolean> => {
  const { habits: currentHabits, updateHabit } = useHabitStore.getState();
  const habit = currentHabits[habitId];
  if (!habit?.reminder) {
    return false;
  }

  if (habit.reminder.snoozedDate !== reminderDate && typeof habit.reminder.snoozedUntilMs !== "number") {
    return false;
  }

  await updateHabit(habitId, {
    reminder: {
      ...habit.reminder,
      snoozedDate: undefined,
      snoozedUntilMs: undefined,
    },
  });
  return true;
};

const setHabitReminderSnooze = async (
  habitId: string,
  reminderDate: string,
  snoozedUntilMs: number
): Promise<boolean> => {
  const { habits: currentHabits, updateHabit } = useHabitStore.getState();
  const habit = currentHabits[habitId];
  if (!habit?.reminder) {
    return false;
  }

  await updateHabit(habitId, {
    reminder: {
      ...habit.reminder,
      snoozedDate: reminderDate,
      snoozedUntilMs,
    },
  });
  return true;
};

const completeHabitFromReminder = async (habitId: string, reminderDate: string): Promise<boolean> => {
  const { habits: currentHabits, updateCompletion } = useHabitStore.getState();
  const habit = currentHabits[habitId];
  if (!habit) {
    return false;
  }

  if (habit.completionHistory[reminderDate]?.isCompleted) {
    return false;
  }

  if (habit.completion.type === CompletionType.SIMPLE) {
    await updateCompletion({ id: habitId, date: reminderDate });
    return true;
  }

  if (habit.completion.goal) {
    await updateCompletion({ id: habitId, date: reminderDate, value: habit.completion.goal });
    return true;
  }

  return false;
};

const buildTargetedReminderSeriesJobs = ({
  habitId,
  habitTitle,
  reminderDate,
  reminderSeriesId,
  firstReminderTimestamp,
  maxAttempts,
  repeatIntervalMs,
}: {
  habitId: string;
  habitTitle: string;
  reminderDate: string;
  reminderSeriesId: string;
  firstReminderTimestamp: number;
  maxAttempts: number;
  repeatIntervalMs?: number;
}): TargetedReminderSeriesJob[] => {
  const normalizedMaxAttempts = Number.isFinite(maxAttempts) ? Math.max(1, Math.floor(maxAttempts)) : 1;
  const jobs: TargetedReminderSeriesJob[] = [
    {
      habitId,
      habitTitle,
      timestamp: firstReminderTimestamp,
      reminderDate,
      reminderSeriesId,
      attemptNumber: 0,
      maxAttempts: normalizedMaxAttempts,
      repeatIntervalMs,
    },
  ];

  if (typeof repeatIntervalMs !== "number" || !Number.isFinite(repeatIntervalMs) || repeatIntervalMs <= 0) {
    return jobs;
  }

  for (let attemptNumber = 1; attemptNumber < normalizedMaxAttempts; attemptNumber += 1) {
    jobs.push({
      habitId,
      habitTitle,
      timestamp: firstReminderTimestamp + repeatIntervalMs * attemptNumber,
      reminderDate,
      reminderSeriesId,
      attemptNumber,
      maxAttempts: normalizedMaxAttempts,
      repeatIntervalMs,
    });
  }

  return jobs;
};

const scheduleTargetedReminderSeries = async (reminderSeriesId: string, jobs: TargetedReminderSeriesJob[]) => {
  const scheduledJobs = [];
  for (const job of jobs) {
    const scheduledId = await schedulePreparedReminderNotification(job);
    if (scheduledId) {
      scheduledJobs.push({
        ...job,
        notificationId: scheduledId,
      });
    }
  }

  if (scheduledJobs.length > 0) {
    replaceReminderScheduleLedgerEntriesForSeries(reminderSeriesId, scheduledJobs);
  }
};

const scheduleNextIntervalReminderSeries = async ({
  habitId,
  habitTitle,
  reminderDate,
  intervalDays,
  reminderHour,
  reminderMinute,
  repeatIfNotCompleted,
  repeatIntervalMs,
  nowMs,
}: {
  habitId: string;
  habitTitle: string;
  reminderDate: string;
  intervalDays: number;
  reminderHour: number;
  reminderMinute: number;
  repeatIfNotCompleted: boolean;
  repeatIntervalMs?: number;
  nowMs: number;
}) => {
  let nextReminderDate = dayjs(reminderDate).add(intervalDays, "day");
  let nextReminderTime = nextReminderDate.hour(reminderHour).minute(reminderMinute).second(0).millisecond(0);

  while (!nextReminderTime.isAfter(nowMs)) {
    nextReminderDate = nextReminderDate.add(intervalDays, "day");
    nextReminderTime = nextReminderDate.hour(reminderHour).minute(reminderMinute).second(0).millisecond(0);
  }

  const nextReminderDateStamp = nextReminderDate.format("YYYY-MM-DD");
  const nextReminderSeriesId = getReminderNotificationSeriesId(habitId, nextReminderDateStamp);
  const normalizedRepeatIntervalMs = repeatIfNotCompleted ? repeatIntervalMs : undefined;
  const jobs = buildTargetedReminderSeriesJobs({
    habitId,
    habitTitle,
    reminderDate: nextReminderDateStamp,
    reminderSeriesId: nextReminderSeriesId,
    firstReminderTimestamp: nextReminderTime.valueOf(),
    maxAttempts: normalizedRepeatIntervalMs ? MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE + 1 : 1,
    repeatIntervalMs: normalizedRepeatIntervalMs,
  });

  await scheduleTargetedReminderSeries(nextReminderSeriesId, jobs);
};

export const handleReminderNotificationResponse = async (
  response: Notifications.NotificationResponse,
  { allowNavigation = true, completionMode = "full", nowMs = Date.now() }: ReminderNotificationResponseOptions = {}
): Promise<ReminderNotificationResponseResult> => {
  appendReminderActionDebugRecord({
    event: "js-response-received",
    actionId: response.actionIdentifier,
    notificationId: response.notification.request.identifier,
    detail: `mode=${completionMode}; navigation=${allowNavigation}`,
  });
  logEvent("reminder.response.received", {
    actionId: response.actionIdentifier,
    notificationId: response.notification.request.identifier,
    completionMode,
    allowNavigation,
  });

  const reminderData = getReminderNotificationData(response);
  const stopData = getReminderQueueStopNotificationData(response);
  if (!reminderData && !stopData) {
    appendReminderActionDebugRecord({
      event: "js-response-ignored",
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      detail: "no reminder data",
    });
    logWarn("reminder.response.ignored", {
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      reason: "no-reminder-data",
    });
    return emptyResult;
  }

  const isKnownReminderAction =
    response.actionIdentifier === REMINDER_ACTION_DONE_IDENTIFIER ||
    response.actionIdentifier === REMINDER_ACTION_SNOOZE_IDENTIFIER ||
    response.actionIdentifier === REMINDER_ACTION_OPEN_IDENTIFIER ||
    response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;

  if (reminderData && !isKnownReminderAction) {
    appendReminderActionDebugRecord({
      event: "js-response-ignored",
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      habitId: reminderData.habitId,
      reminderDate: reminderData.reminderDate,
      reminderSeriesId: reminderData.reminderSeriesId,
      detail: "unknown action",
    });
    logWarn("reminder.response.ignored", {
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      habitId: reminderData.habitId,
      reminderDate: reminderData.reminderDate,
      reminderSeriesId: reminderData.reminderSeriesId,
      reason: "unknown-action",
    });
    return emptyResult;
  }

  const responseKey = getReminderNotificationResponseKey(response);
  if (!claimReminderResponse(responseKey, nowMs)) {
    appendReminderActionDebugRecord({
      event: "js-response-duplicate",
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      detail: responseKey,
    });
    logWarn("reminder.response.duplicate", {
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      responseKey,
    });
    clearLastNotificationResponse();
    return emptyResult;
  }

  if (stopData) {
    await reconcileReminderNotifications({ reason: "notification-response" });
    clearLastNotificationResponse();
    logEvent("reminder.response.stopHandled", {
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      scheduledFor: stopData.scheduledFor,
      timestamp: stopData.overflowTimestamp,
    });
    return {
      handled: true,
      shouldNavigateToToday: allowNavigation,
    };
  }

  if (!reminderData) {
    return emptyResult;
  }

  const usesTargetedCompletion = completionMode === "targeted-background" && isReminderQuickActionResponse(response);
  const habitBeforeAction = useHabitStore.getState().habits[reminderData.habitId];
  let needsFullReconcile = !usesTargetedCompletion;
  appendReminderActionDebugRecord({
    event: "js-response-handling",
    actionId: response.actionIdentifier,
    notificationId: response.notification.request.identifier,
    habitId: reminderData.habitId,
    reminderDate: reminderData.reminderDate,
    reminderSeriesId: reminderData.reminderSeriesId,
    scheduledFor: reminderData.scheduledFor,
    detail: `targeted=${usesTargetedCompletion}; habitFound=${!!habitBeforeAction}; completed=${!!habitBeforeAction?.completionHistory[reminderData.reminderDate]?.isCompleted}`,
  });
  logEvent("reminder.response.handling", {
    actionId: response.actionIdentifier,
    notificationId: response.notification.request.identifier,
    habitId: reminderData.habitId,
    reminderDate: reminderData.reminderDate,
    reminderSeriesId: reminderData.reminderSeriesId,
    scheduledFor: reminderData.scheduledFor,
    targeted: usesTargetedCompletion,
    completed: !!habitBeforeAction?.completionHistory[reminderData.reminderDate]?.isCompleted,
  });
  await cancelReminderNotificationSeries(reminderData.reminderSeriesId);
  if (usesTargetedCompletion) {
    removeReminderScheduleLedgerEntriesForSeries(reminderData.reminderSeriesId);
  }

  switch (response.actionIdentifier) {
    case REMINDER_ACTION_DONE_IDENTIFIER: {
      await clearHabitReminderSnooze(reminderData.habitId, reminderData.reminderDate);
      const didCompleteHabit = await completeHabitFromReminder(reminderData.habitId, reminderData.reminderDate);
      if (usesTargetedCompletion && habitBeforeAction?.repetition.type === RepetitionType.INTERVAL) {
        const reminder = habitBeforeAction.reminder;
        if (reminder?.enabled) {
          await scheduleNextIntervalReminderSeries({
            habitId: habitBeforeAction.id,
            habitTitle: habitBeforeAction.title,
            reminderDate: reminderData.reminderDate,
            intervalDays: habitBeforeAction.repetition.days,
            reminderHour: reminder.hour,
            reminderMinute: reminder.minute,
            repeatIfNotCompleted: reminder.repeatIfNotCompleted,
            repeatIntervalMs: reminder.repeatIntervalMs,
            nowMs,
          });
        }
      } else {
        needsFullReconcile =
          needsFullReconcile || (didCompleteHabit && habitBeforeAction?.repetition.type === RepetitionType.INTERVAL);
      }
      break;
    }
    case REMINDER_ACTION_SNOOZE_IDENTIFIER: {
      const snoozedUntilMs = dayjs(nowMs).add(DEFAULT_REMINDER_SNOOZE_MS, "ms").valueOf();
      const didSetSnooze = await setHabitReminderSnooze(
        reminderData.habitId,
        reminderData.reminderDate,
        snoozedUntilMs
      );
      if (usesTargetedCompletion && didSetSnooze) {
        // Full reconciliation also treats a snooze as a fresh series starting at snoozedUntilMs.
        const jobs = buildTargetedReminderSeriesJobs({
          habitId: reminderData.habitId,
          habitTitle: reminderData.habitTitle,
          reminderDate: reminderData.reminderDate,
          reminderSeriesId: reminderData.reminderSeriesId,
          firstReminderTimestamp: snoozedUntilMs,
          maxAttempts: reminderData.maxAttempts,
          repeatIntervalMs: reminderData.repeatIntervalMs,
        });

        await scheduleTargetedReminderSeries(reminderData.reminderSeriesId, jobs);
      }
      break;
    }
    case REMINDER_ACTION_OPEN_IDENTIFIER:
    case Notifications.DEFAULT_ACTION_IDENTIFIER:
      break;
    default:
      return emptyResult;
  }

  if (needsFullReconcile) {
    await reconcileReminderNotifications(
      isReminderQuickActionResponse(response)
        ? { reason: "notification-response", dismissPresented: false }
        : { reason: "notification-response" }
    );
  }
  clearLastNotificationResponse();

  const result = {
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
  appendReminderActionDebugRecord({
    event: "js-response-handled",
    actionId: response.actionIdentifier,
    notificationId: response.notification.request.identifier,
    habitId: reminderData.habitId,
    reminderDate: reminderData.reminderDate,
    reminderSeriesId: reminderData.reminderSeriesId,
    scheduledFor: reminderData.scheduledFor,
    detail: `handled=${result.handled}; navigate=${result.shouldNavigateToToday}; completed=${!!useHabitStore.getState().habits[reminderData.habitId]?.completionHistory[reminderData.reminderDate]?.isCompleted}`,
  });
  logEvent("reminder.response.handled", {
    actionId: response.actionIdentifier,
    notificationId: response.notification.request.identifier,
    habitId: reminderData.habitId,
    reminderDate: reminderData.reminderDate,
    reminderSeriesId: reminderData.reminderSeriesId,
    scheduledFor: reminderData.scheduledFor,
    handled: result.handled,
    navigate: result.shouldNavigateToToday,
    completed:
      !!useHabitStore.getState().habits[reminderData.habitId]?.completionHistory[reminderData.reminderDate]
        ?.isCompleted,
  });
  return result;
};
