import { useCallback, useEffect, useRef } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { AppState, AppStateStatus } from "react-native";

import { useHabitStore } from "@/store/habitStore";
import {
  getTodayReminderRoute,
  handleReminderNotificationResponse as handleReminderNotificationResponseBase,
} from "@/utils/reminderNotificationResponse";
import { reconcileReminderNotifications, type ReminderReconcileReason } from "@/utils/reminderScheduler";
import { syncNativeReminderActionState } from "@/utils/nativeReminderActions";

export const useReminderManager = () => {
  const appStateRef = useRef(AppState.currentState);
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const habits = useHabitStore((state) => state.habits);
  const reminderTaskQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  const enqueueReminderTask = useCallback(<T>(task: () => Promise<T>) => {
    const nextTask = reminderTaskQueueRef.current.then(task, task);
    reminderTaskQueueRef.current = nextTask.then(
      () => undefined,
      () => undefined
    );
    return nextTask;
  }, []);

  const reconcile = useCallback(
    (reason: ReminderReconcileReason) =>
      enqueueReminderTask(async () => {
        await syncNativeReminderActionState();
        await reconcileReminderNotifications({ reason });
      }),
    [enqueueReminderTask]
  );

  const handleReminderNotificationResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const result = await enqueueReminderTask(() =>
        handleReminderNotificationResponseBase(response, { allowNavigation: true })
      );

      if (!result.shouldNavigateToToday) {
        return;
      }

      if (result.selectedDate) {
        useHabitStore.getState().setSelectedDate(result.selectedDate);
      }
      router.replace(getTodayReminderRoute());
    },
    [enqueueReminderTask]
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void enqueueReminderTask(async () => {
      await syncNativeReminderActionState();
      await reconcileReminderNotifications({ reason: "habit-change", habits: useHabitStore.getState().habits });
    });
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
