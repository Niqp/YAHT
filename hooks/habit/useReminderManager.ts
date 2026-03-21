import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { useHabitStore } from "@/store/habitStore";
import dayjs from "dayjs";
import { scheduleReminderNotification } from "@/utils/notifications";
import { shouldShowHabitOnDate } from "@/utils/date";
import * as Notifications from "expo-notifications";

const MAX_LOOKAHEAD_DAYS = 7;
const MAX_NAG_HOURS = 12;

export const useReminderManager = () => {
  const appStateRef = useRef(AppState.currentState);
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const habits = useHabitStore((state) => state.habits);

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

  const scheduleBackgroundReminderNotifications = useCallback(async () => {
    try {
      await clearReminderNotifications();

      const schedulingTasks: Promise<unknown>[] = [];
      const now = dayjs();

      for (const [habitId, habit] of Object.entries(habits)) {
        if (!habit.reminder?.enabled) continue;

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

          if (scheduleTime.isAfter(now)) {
            schedulingTasks.push(scheduleReminderNotification(habit.id, habit.title, scheduleTime.valueOf()));

            if (habit.reminder.repeatIfNotCompleted && habit.reminder.repeatIntervalMs) {
              let nextNag = scheduleTime.add(habit.reminder.repeatIntervalMs, "ms");
              const endOfDay = targetDate.endOf("day");

              while (nextNag.isBefore(endOfDay) && nextNag.diff(scheduleTime, "hour") < MAX_NAG_HOURS) {
                schedulingTasks.push(scheduleReminderNotification(habit.id, habit.title, nextNag.valueOf()));
                nextNag = nextNag.add(habit.reminder.repeatIntervalMs, "ms");
              }
            }
          } else if (dayOffset === 0 && habit.reminder.repeatIfNotCompleted && habit.reminder.repeatIntervalMs) {
            const diffMs = now.diff(scheduleTime);
            if (diffMs > 0 && diffMs < MAX_NAG_HOURS * 3600000) {
              const intervalsPassed = Math.floor(diffMs / habit.reminder.repeatIntervalMs);
              let nextNag = scheduleTime.add((intervalsPassed + 1) * habit.reminder.repeatIntervalMs, "ms");
              const endOfDay = targetDate.endOf("day");

              while (nextNag.isBefore(endOfDay) && nextNag.diff(scheduleTime, "hour") < MAX_NAG_HOURS) {
                if (nextNag.isAfter(now)) {
                  schedulingTasks.push(scheduleReminderNotification(habit.id, habit.title, nextNag.valueOf()));
                }
                nextNag = nextNag.add(habit.reminder.repeatIntervalMs, "ms");
              }
            }
          }
        }
      }

      const scheduleResults = await Promise.allSettled(schedulingTasks);
      scheduleResults.forEach((r) => {
        if (r.status === "rejected") console.error("Failed to schedule background reminder notification:", r.reason);
      });
    } catch (error) {
      if (error instanceof Error)
        console.error(`Error scheduling background reminder notifications: ${error.message}`, error);
    }
  }, [clearReminderNotifications, habits]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (AppState.currentState === "active") {
      void clearReminderNotifications();
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        const previousAppState = appStateRef.current;

        if (previousAppState.match(/inactive|background/) && nextAppState === "active") {
          void clearReminderNotifications();
        }

        if (previousAppState === "active" && nextAppState.match(/inactive|background/)) {
          void scheduleBackgroundReminderNotifications();
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
  }, [clearReminderNotifications, isHydrated, scheduleBackgroundReminderNotifications]);
};
