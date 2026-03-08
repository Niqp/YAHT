import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useHabitStore } from "@/store/habitStore";
import { cancelAllTimerNotifications, scheduleTimerNotification } from "@/utils/notifications";
import { getTimerRemainingMs } from "@/utils/timer";

const TIMER_UPDATE_INTERVAL = 1000; // 1 second

/**
 * Hook to manage timer updates based on timestamp approach
 */
export const useTimerManager = () => {
  // References
  const appStateRef = useRef(AppState.currentState);

  // Use individual selectors instead of returning an object
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const activeTimers = useHabitStore((state) => state.activeTimers);
  const habits = useHabitStore((state) => state.habits);
  const tickForeground = useHabitStore((state) => state.tickForeground);
  const reconcileActiveTimers = useHabitStore((state) => state.reconcileActiveTimers);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isColdLaunch = useRef(true);

  const reconcileTimers = useCallback(async () => {
    try {
      await reconcileActiveTimers();
    } catch (error) {
      if (error instanceof Error) console.error(`Error reconciling active timers: ${error.message}`, error);
    }
  }, [reconcileActiveTimers]);

  const updateAllActiveTimers = useCallback(() => {
    tickForeground(Date.now());
  }, [tickForeground]);

  const clearTimerNotifications = useCallback(async () => {
    try {
      await cancelAllTimerNotifications();
    } catch (error) {
      if (error instanceof Error) console.error(`Error clearing timer notifications: ${error.message}`, error);
    }
  }, []);

  const scheduleBackgroundTimerNotifications = useCallback(async () => {
    try {
      await cancelAllTimerNotifications();

      const nowMs = Date.now();
      const schedulingTasks: Promise<unknown>[] = [];

      for (const [habitId, dateTimers] of Object.entries(activeTimers)) {
        const habit = habits[habitId];
        if (!habit) continue;

        for (const [date, timer] of Object.entries(dateTimers)) {
          const remainingMs = getTimerRemainingMs(habit, date, timer, nowMs);
          if (remainingMs === null) continue;

          schedulingTasks.push(scheduleTimerNotification(timer.id, habit.title, remainingMs));
        }
      }

      await Promise.all(schedulingTasks);
    } catch (error) {
      if (error instanceof Error)
        console.error(`Error scheduling background timer notifications: ${error.message}`, error);
    }
  }, [activeTimers, habits]);

  useLayoutEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const hasActiveTimers = Object.keys(activeTimers).length > 0;

    if (!hasActiveTimers) {
      void clearTimerNotifications();
    }

    if (hasActiveTimers && appStateRef.current === "active") {
      void clearTimerNotifications();
      timerIntervalRef.current = setInterval(updateAllActiveTimers, TIMER_UPDATE_INTERVAL);
    }

    // Clean up on unmount or when dependencies change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [activeTimers, clearTimerNotifications, isHydrated, updateAllActiveTimers]);

  // Handle app state changes
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        const previousAppState = appStateRef.current;

        if (previousAppState.match(/inactive|background/) && nextAppState === "active") {
          void clearTimerNotifications();
          void reconcileTimers();
        }

        if (previousAppState === "active" && nextAppState.match(/inactive|background/)) {
          void scheduleBackgroundTimerNotifications();
        }

        appStateRef.current = nextAppState;
      } catch (error) {
        if (error instanceof Error) console.error(`Error handling app state change: ${error.message}`, error);
      }
    };

    if (isColdLaunch.current) {
      // App was launched from a cold state, reconcile all active timers once.
      void clearTimerNotifications();
      void reconcileTimers();
      isColdLaunch.current = false;
    }

    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription.remove();

      // Best-effort only: app kill does not guarantee this cleanup runs on mobile.
      void clearTimerNotifications();
      void reconcileTimers();
    };
  }, [clearTimerNotifications, isHydrated, reconcileTimers, scheduleBackgroundTimerNotifications]);
};
