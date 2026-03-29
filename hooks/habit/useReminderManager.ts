import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useHabitStore } from "@/store/habitStore";
import dayjs from "dayjs";
import { prepareReminderNotifications, schedulePreparedReminderNotification } from "@/utils/notifications";
import { shouldShowHabitOnDate } from "@/utils/date";
import * as Notifications from "expo-notifications";

const MAX_LOOKAHEAD_DAYS = 7;
const MAX_NAG_WINDOW_MS = 12 * 60 * 60 * 1000;
const MIN_REPEAT_INTERVAL_MS = 5 * 60 * 1000;
const MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE = 10;
const MAX_CONCURRENT_REMINDER_NOTIFICATIONS = 500;

type ReminderCandidate = {
  habitId: string;
  habitTitle: string;
  timestamp: number;
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

const addReminderCandidate = (
  candidates: ReminderCandidate[],
  candidateIds: Set<string>,
  habitId: string,
  habitTitle: string,
  timestamp: number
) => {
  if (!Number.isFinite(timestamp)) {
    return;
  }

  const candidateId = `${habitId}-${timestamp}`;
  if (candidateIds.has(candidateId)) {
    return;
  }

  candidateIds.add(candidateId);
  candidates.push({ habitId, habitTitle, timestamp });
};

export const useReminderManager = () => {
  const appStateRef = useRef(AppState.currentState);
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const habits = useHabitStore((state) => state.habits);
  const habitsRef = useRef(habits);
  const reminderTaskQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  const clearReminderNotifications = useCallback(async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const reminderNotifications = scheduled.filter((n) => n.identifier.startsWith("reminder-"));

      const cancelResults = await Promise.allSettled([
        ...reminderNotifications.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
      ]);
      cancelResults.forEach((r) => {
        if (r.status === "rejected") console.error("Failed to cancel scheduled reminder notification:", r.reason);
      });

      if (Platform.OS !== "web") {
        // dismiss delivered reminders
        const delivered = await Notifications.getPresentedNotificationsAsync();
        const deliveredReminders = delivered.filter((n) => n.request.identifier.startsWith("reminder-"));
        if (deliveredReminders.length > 0) {
          const dismissResults = await Promise.allSettled(
            deliveredReminders.map((n) => Notifications.dismissNotificationAsync(n.request.identifier))
          );
          dismissResults.forEach((r) => {
            if (r.status === "rejected") console.error("Failed to dismiss delivered reminder notification:", r.reason);
          });
        }
      }
    } catch (error) {
      if (error instanceof Error) console.error(`Error clearing reminder notifications: ${error.message}`, error);
    }
  }, []);

  const enqueueReminderTask = useCallback((task: () => Promise<void>) => {
    const nextTask = reminderTaskQueueRef.current.then(task, task);
    reminderTaskQueueRef.current = nextTask.catch(() => undefined);
    return nextTask;
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
        if (!habit.reminder?.enabled) continue;

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
          const dateString = targetDate.format("YYYY-MM-DD");
          if (!shouldShowHabitOnDate(habit, dateString)) continue;

          const isCompleted = habit.completionHistory[dateString]?.isCompleted;
          if (isCompleted) continue;

          const scheduleTime = targetDate
            .hour(habit.reminder.hour)
            .minute(habit.reminder.minute)
            .second(0)
            .millisecond(0);

          if (!scheduleTime.isBefore(now)) {
            addReminderCandidate(reminderCandidates, candidateIds, habit.id, habit.title, scheduleTime.valueOf());

            if (repeatIntervalMs) {
              let nextNag = scheduleTime.add(repeatIntervalMs, "ms");
              const endOfDay = targetDate.endOf("day");
              let followUpReminderCount = 0;

              while (
                nextNag.isBefore(endOfDay) &&
                nextNag.diff(scheduleTime) < MAX_NAG_WINDOW_MS &&
                followUpReminderCount < MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE
              ) {
                addReminderCandidate(reminderCandidates, candidateIds, habit.id, habit.title, nextNag.valueOf());
                followUpReminderCount += 1;
                nextNag = nextNag.add(repeatIntervalMs, "ms");
              }
            }
          } else if (dayOffset === 0 && repeatIntervalMs) {
            const diffMs = now.diff(scheduleTime);
            if (diffMs > 0 && diffMs < MAX_NAG_WINDOW_MS) {
              const intervalsPassed = Math.floor(diffMs / repeatIntervalMs);
              let nextNag = scheduleTime.add((intervalsPassed + 1) * repeatIntervalMs, "ms");
              const endOfDay = targetDate.endOf("day");
              let followUpReminderCount = intervalsPassed + 1;

              while (
                nextNag.isBefore(endOfDay) &&
                nextNag.diff(scheduleTime) < MAX_NAG_WINDOW_MS &&
                followUpReminderCount <= MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE
              ) {
                if (nextNag.isAfter(now)) {
                  addReminderCandidate(reminderCandidates, candidateIds, habit.id, habit.title, nextNag.valueOf());
                }
                followUpReminderCount += 1;
                nextNag = nextNag.add(repeatIntervalMs, "ms");
              }
            }
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

      const schedulingTasks = nextReminderBatch.map(({ habitId, habitTitle, timestamp }) =>
        schedulePreparedReminderNotification(habitId, habitTitle, timestamp)
      );
      const scheduleResults = await Promise.allSettled(schedulingTasks);
      scheduleResults.forEach((r) => {
        if (r.status === "rejected") console.error("Failed to schedule background reminder notification:", r.reason);
      });
    } catch (error) {
      if (error instanceof Error)
        console.error(`Error scheduling background reminder notifications: ${error.message}`, error);
    }
  }, [clearReminderNotifications]);

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
        if (error instanceof Error) console.error(`Error handling app state change: ${error.message}`, error);
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [clearReminderNotifications, enqueueReminderTask, isHydrated, scheduleBackgroundReminderNotifications]);
};
