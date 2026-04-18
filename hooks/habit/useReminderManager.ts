import { useCallback, useEffect, useRef } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";
import { AppState, AppStateStatus } from "react-native";

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
import { reconcileReminderNotifications, type ReminderReconcileReason } from "@/utils/reminderScheduler";

const TODAY_ROUTE = "/(tabs)/today";

export const useReminderManager = () => {
  const appStateRef = useRef(AppState.currentState);
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const habits = useHabitStore((state) => state.habits);
  const reminderTaskQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastHandledResponseKeyRef = useRef<string | null>(null);

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

  const reconcile = useCallback(
    (reason: ReminderReconcileReason) => enqueueReminderTask(() => reconcileReminderNotifications({ reason })),
    [enqueueReminderTask]
  );

  const handleReminderNotificationResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const reminderData = getReminderNotificationData(response);
      const stopData = getReminderQueueStopNotificationData(response);
      if (!reminderData && !stopData) {
        return;
      }

      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (lastHandledResponseKeyRef.current === responseKey) {
        return;
      }
      lastHandledResponseKeyRef.current = responseKey;

      if (stopData) {
        router.replace(TODAY_ROUTE);
        await reconcileReminderNotifications({ reason: "notification-response" });
        Notifications.clearLastNotificationResponse();
        return;
      }

      if (!reminderData) {
        return;
      }

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

      await reconcileReminderNotifications({ reason: "notification-response" });
      Notifications.clearLastNotificationResponse();
    },
    [clearHabitReminderSnooze, completeHabitFromReminder, setHabitReminderSnooze]
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void enqueueReminderTask(() => reconcileReminderNotifications({ reason: "habit-change", habits }));
  }, [enqueueReminderTask, habits, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        const previousAppState = appStateRef.current;

        if (previousAppState.match(/inactive|background/) && nextAppState === "active") {
          void reconcile("foreground");
        }

        if (previousAppState === "active" && nextAppState.match(/inactive|background/)) {
          void reconcile("background");
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
  }, [isHydrated, reconcile]);

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
