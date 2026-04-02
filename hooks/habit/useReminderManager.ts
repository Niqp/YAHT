import { useCallback, useEffect, useRef } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";
import { AppState, AppStateStatus } from "react-native";

import { useHabitStore } from "@/store/habitStore";
import { CompletionType, type ReminderConfig } from "@/types/habit";
import { shouldShowHabitOnDate } from "@/utils/date";
import {
  cancelReminderNotificationSeries,
  clearReminderNotifications,
  DEFAULT_REMINDER_SNOOZE_MS,
  getReminderNotificationData,
  getReminderNotificationSeriesId,
  MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE,
  prepareReminderNotifications,
  REMINDER_ACTION_DONE_IDENTIFIER,
  REMINDER_ACTION_OPEN_IDENTIFIER,
  REMINDER_ACTION_SNOOZE_IDENTIFIER,
  schedulePreparedReminderNotification,
} from "@/utils/notifications";

const MAX_LOOKAHEAD_DAYS = 7;
const MAX_NAG_WINDOW_MS = 12 * 60 * 60 * 1000;
const MIN_REPEAT_INTERVAL_MS = 5 * 60 * 1000;
const MAX_CONCURRENT_REMINDER_NOTIFICATIONS = 500;
const TODAY_ROUTE = "/(tabs)/today";

type ReminderCandidate = {
  habitId: string;
  habitTitle: string;
  timestamp: number;
  reminderDate: string;
  reminderSeriesId: string;
  attemptNumber: number;
  maxAttempts: number;
  repeatIntervalMs?: number;
};

const getNormalizedRepeatIntervalMs = (repeatIntervalMs?: number) => {
  if (typeof repeatIntervalMs !== "number" || !Number.isFinite(repeatIntervalMs)) {
    return undefined;
  }

  const normalizedIntervalMs = Math.floor(repeatIntervalMs);
  if (normalizedIntervalMs < MIN_REPEAT_INTERVAL_MS) {
    return undefined;
  }

  return normalizedIntervalMs;
};

const getReminderStartTime = (scheduleTime: dayjs.Dayjs, reminder: ReminderConfig, reminderDate: string) => {
  if (reminder.snoozedDate !== reminderDate || typeof reminder.snoozedUntilMs !== "number") {
    return scheduleTime;
  }

  if (!Number.isFinite(reminder.snoozedUntilMs)) {
    return scheduleTime;
  }

  const snoozedUntil = dayjs(reminder.snoozedUntilMs);
  if (!snoozedUntil.isValid() || !snoozedUntil.isAfter(scheduleTime)) {
    return scheduleTime;
  }

  return snoozedUntil;
};

const addReminderCandidate = (
  candidates: ReminderCandidate[],
  candidateIds: Set<string>,
  candidate: ReminderCandidate
) => {
  if (!Number.isFinite(candidate.timestamp)) {
    return;
  }

  const candidateId = `${candidate.reminderSeriesId}-${candidate.timestamp}`;
  if (candidateIds.has(candidateId)) {
    return;
  }

  candidateIds.add(candidateId);
  candidates.push(candidate);
};

export const useReminderManager = () => {
  const appStateRef = useRef(AppState.currentState);
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const habits = useHabitStore((state) => state.habits);
  const habitsRef = useRef(habits);
  const reminderTaskQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastHandledResponseKeyRef = useRef<string | null>(null);

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  const enqueueReminderTask = useCallback((task: () => Promise<void>) => {
    const nextTask = reminderTaskQueueRef.current.then(task, task);
    reminderTaskQueueRef.current = nextTask.catch(() => undefined);
    return nextTask;
  }, []);

  const clearHabitReminderSnooze = useCallback(async (habitId: string, reminderDate: string) => {
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
  }, []);

  const setHabitReminderSnooze = useCallback(async (habitId: string, reminderDate: string, snoozedUntilMs: number) => {
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
  }, []);

  const completeHabitFromReminder = useCallback(async (habitId: string, reminderDate: string) => {
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
  }, []);

  const scheduleBackgroundReminderNotifications = useCallback(async () => {
    try {
      await clearReminderNotifications();
      const canScheduleReminders = await prepareReminderNotifications({ openAlarmSettings: false });
      if (!canScheduleReminders) {
        return;
      }

      const reminderCandidates: ReminderCandidate[] = [];
      const candidateIds = new Set<string>();
      const now = dayjs();

      for (const habit of Object.values(habitsRef.current)) {
        if (!habit.reminder?.enabled) {
          continue;
        }

        const repeatIntervalMs = habit.reminder.repeatIfNotCompleted
          ? getNormalizedRepeatIntervalMs(habit.reminder.repeatIntervalMs)
          : undefined;

        if (habit.reminder.repeatIfNotCompleted && !repeatIntervalMs) {
          console.warn(
            `Skipping repeating reminder nags for habit "${habit.title}" because repeatIntervalMs=${habit.reminder.repeatIntervalMs}ms is below the supported minimum of ${MIN_REPEAT_INTERVAL_MS}ms.`
          );
        }

        for (let dayOffset = 0; dayOffset < MAX_LOOKAHEAD_DAYS; dayOffset++) {
          const targetDate = now.add(dayOffset, "day");
          const reminderDate = targetDate.format("YYYY-MM-DD");
          if (!shouldShowHabitOnDate(habit, reminderDate)) {
            continue;
          }

          if (habit.completionHistory[reminderDate]?.isCompleted) {
            continue;
          }

          const configuredScheduleTime = targetDate
            .hour(habit.reminder.hour)
            .minute(habit.reminder.minute)
            .second(0)
            .millisecond(0);
          const reminderStartTime = getReminderStartTime(configuredScheduleTime, habit.reminder, reminderDate);
          const endOfDay = targetDate.endOf("day");

          if (reminderStartTime.isAfter(endOfDay)) {
            continue;
          }

          const reminderSeriesId = getReminderNotificationSeriesId(habit.id, reminderDate);
          const maxAttempts = repeatIntervalMs ? MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE + 1 : 1;

          if (!reminderStartTime.isBefore(now)) {
            addReminderCandidate(reminderCandidates, candidateIds, {
              habitId: habit.id,
              habitTitle: habit.title,
              timestamp: reminderStartTime.valueOf(),
              reminderDate,
              reminderSeriesId,
              attemptNumber: 0,
              maxAttempts,
              repeatIntervalMs,
            });
          }

          if (!repeatIntervalMs) {
            continue;
          }

          let nextAttemptNumber = 1;
          let nextNag = reminderStartTime.add(repeatIntervalMs, "ms");

          if (reminderStartTime.isBefore(now) && dayOffset === 0) {
            const diffMs = now.diff(reminderStartTime);
            if (diffMs <= 0 || diffMs >= MAX_NAG_WINDOW_MS) {
              continue;
            }

            const intervalsPassed = Math.floor(diffMs / repeatIntervalMs);
            nextAttemptNumber = intervalsPassed + 1;
            nextNag = reminderStartTime.add(nextAttemptNumber * repeatIntervalMs, "ms");
          }

          while (
            !nextNag.isAfter(endOfDay) &&
            nextNag.diff(reminderStartTime) < MAX_NAG_WINDOW_MS &&
            nextAttemptNumber <= MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE
          ) {
            if (!nextNag.isBefore(now)) {
              addReminderCandidate(reminderCandidates, candidateIds, {
                habitId: habit.id,
                habitTitle: habit.title,
                timestamp: nextNag.valueOf(),
                reminderDate,
                reminderSeriesId,
                attemptNumber: nextAttemptNumber,
                maxAttempts,
                repeatIntervalMs,
              });
            }

            nextAttemptNumber += 1;
            nextNag = nextNag.add(repeatIntervalMs, "ms");
          }
        }
      }

      const nextReminderBatch = reminderCandidates
        .sort((left, right) => left.timestamp - right.timestamp)
        .slice(0, MAX_CONCURRENT_REMINDER_NOTIFICATIONS);

      if (reminderCandidates.length > MAX_CONCURRENT_REMINDER_NOTIFICATIONS) {
        console.warn(
          `Reminder scheduling generated ${reminderCandidates.length} notifications. Scheduling the earliest ${MAX_CONCURRENT_REMINDER_NOTIFICATIONS} to stay below Android's concurrent alarm limit.`
        );
      }

      const schedulingTasks = nextReminderBatch.map((candidate) => schedulePreparedReminderNotification(candidate));
      const scheduleResults = await Promise.allSettled(schedulingTasks);
      scheduleResults.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Failed to schedule background reminder notification:", result.reason);
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error scheduling background reminder notifications: ${error.message}`, error);
      }
    }
  }, []);

  const handleReminderNotificationResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const reminderData = getReminderNotificationData(response);
      if (!reminderData) {
        return;
      }

      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (lastHandledResponseKeyRef.current === responseKey) {
        return;
      }
      lastHandledResponseKeyRef.current = responseKey;

      await cancelReminderNotificationSeries(reminderData.reminderSeriesId);

      switch (response.actionIdentifier) {
        case REMINDER_ACTION_DONE_IDENTIFIER:
          await clearHabitReminderSnooze(reminderData.habitId, reminderData.reminderDate);
          await completeHabitFromReminder(reminderData.habitId, reminderData.reminderDate);
          break;
        case REMINDER_ACTION_SNOOZE_IDENTIFIER: {
          const snoozedUntilMs = dayjs().add(DEFAULT_REMINDER_SNOOZE_MS, "ms").valueOf();
          await setHabitReminderSnooze(reminderData.habitId, reminderData.reminderDate, snoozedUntilMs);
          break;
        }
        case REMINDER_ACTION_OPEN_IDENTIFIER:
        case Notifications.DEFAULT_ACTION_IDENTIFIER:
          useHabitStore.getState().setSelectedDate(reminderData.reminderDate);
          router.replace(TODAY_ROUTE);
          break;
        default:
          break;
      }

      Notifications.clearLastNotificationResponse();
    },
    [clearHabitReminderSnooze, completeHabitFromReminder, setHabitReminderSnooze]
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (AppState.currentState === "active") {
      void enqueueReminderTask(clearReminderNotifications);
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        const previousAppState = appStateRef.current;

        if (previousAppState.match(/inactive|background/) && nextAppState === "active") {
          void enqueueReminderTask(clearReminderNotifications);
        }

        if (previousAppState === "active" && nextAppState.match(/inactive|background/)) {
          void enqueueReminderTask(scheduleBackgroundReminderNotifications);
        }

        appStateRef.current = nextAppState;
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error handling app state change: ${error.message}`, error);
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [enqueueReminderTask, isHydrated, scheduleBackgroundReminderNotifications]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const initialResponse = Notifications.getLastNotificationResponse();
    if (initialResponse) {
      void handleReminderNotificationResponse(initialResponse);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleReminderNotificationResponse(response);
    });

    return () => {
      subscription.remove();
    };
  }, [handleReminderNotificationResponse, isHydrated]);
};


