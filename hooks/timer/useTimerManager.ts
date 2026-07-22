import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useHabitStore } from "@/store/habitStore";
import { useTimerClockStore } from "@/store/timerClockStore";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
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
  const tickForeground = useHabitStore((state) => state.tickForeground);
  const reconcileActiveTimers = useHabitStore((state) => state.reconcileActiveTimers);

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isColdLaunch = useRef(true);
  const isReconcilingRef = useRef(false);
  const shouldRunForegroundTickerRef = useRef(true);

  const stopForegroundTicker = useCallback(() => {
    if (!timerIntervalRef.current) return;

    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  }, []);

  const updateAllActiveTimers = useCallback(() => {
    const nowMs = Date.now();
    useTimerClockStore.getState().setNowMs(nowMs);
    void tickForeground(nowMs);
  }, [tickForeground]);

  const startForegroundTicker = useCallback(() => {
    stopForegroundTicker();

    if (Object.keys(useHabitStore.getState().activeTimers).length === 0) return;

    updateAllActiveTimers();
    timerIntervalRef.current = setInterval(updateAllActiveTimers, TIMER_UPDATE_INTERVAL);
  }, [stopForegroundTicker, updateAllActiveTimers]);

  const reconcileTimers = useCallback(async () => {
    isReconcilingRef.current = true;
    stopForegroundTicker();

    try {
      await reconcileActiveTimers();
    } catch (error) {
      if (error instanceof Error) console.error(`Error reconciling active timers: ${error.message}`, error);
      logError("timer.reconcile.failed", { operation: "reconcileActiveTimers", error });
    } finally {
      isReconcilingRef.current = false;
      if (shouldRunForegroundTickerRef.current) {
        startForegroundTicker();
      }
    }
  }, [reconcileActiveTimers, startForegroundTicker, stopForegroundTicker]);

  const clearTimerNotifications = useCallback(async () => {
    try {
      await cancelAllTimerNotifications();
      logEvent("timer.notifications.cleared", { operation: "cancelAllTimerNotifications" });
    } catch (error) {
      if (error instanceof Error) console.error(`Error clearing timer notifications: ${error.message}`, error);
      logError("timer.notifications.clearFailed", { operation: "cancelAllTimerNotifications", error });
    }
  }, []);

  const scheduleBackgroundTimerNotifications = useCallback(async () => {
    try {
      await cancelAllTimerNotifications();

      const nowMs = Date.now();
      const schedulingTasks: Promise<unknown>[] = [];

      const { activeTimers: currentActiveTimers, habits: currentHabits } = useHabitStore.getState();

      for (const [habitId, dateTimers] of Object.entries(currentActiveTimers)) {
        const habit = currentHabits[habitId];
        if (!habit) continue;

        for (const [date, timer] of Object.entries(dateTimers)) {
          const remainingMs = getTimerRemainingMs(habit, date, timer, nowMs);
          if (remainingMs === null) continue;

          schedulingTasks.push(scheduleTimerNotification(timer.id, habit.title, remainingMs));
        }
      }

      await Promise.all(schedulingTasks);
      logEvent("timer.notifications.scheduled", { count: schedulingTasks.length });
    } catch (error) {
      if (error instanceof Error)
        console.error(`Error scheduling background timer notifications: ${error.message}`, error);
      logError("timer.notifications.scheduleFailed", {
        operation: "scheduleBackgroundTimerNotifications",
        error,
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (!isHydrated) return;

    const hasActiveTimers = Object.keys(activeTimers).length > 0;

    if (!hasActiveTimers) {
      stopForegroundTicker();
      void clearTimerNotifications();
    } else if (shouldRunForegroundTickerRef.current && !isColdLaunch.current && !isReconcilingRef.current) {
      void clearTimerNotifications();
      startForegroundTicker();
    }

    return stopForegroundTicker;
  }, [activeTimers, clearTimerNotifications, isHydrated, startForegroundTicker, stopForegroundTicker]);

  // Handle app state changes
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        const previousAppState = appStateRef.current;
        appStateRef.current = nextAppState;

        if (nextAppState.match(/inactive|background/)) {
          shouldRunForegroundTickerRef.current = false;
          stopForegroundTicker();
          void scheduleBackgroundTimerNotifications();
        } else if (
          nextAppState === "active" &&
          (previousAppState === "inactive" || previousAppState === "background")
        ) {
          shouldRunForegroundTickerRef.current = true;
          void clearTimerNotifications();
          void reconcileTimers();
        }

        logEvent("timer.appStateHandled", { appState: nextAppState });
      } catch (error) {
        if (error instanceof Error) console.error(`Error handling app state change: ${error.message}`, error);
        logError("timer.appStateFailed", { operation: "handleAppStateChange", error });
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    if (isColdLaunch.current) {
      // Reconcile persisted timestamps before starting the foreground ticker.
      isColdLaunch.current = false;
      void clearTimerNotifications();
      void reconcileTimers();
    }

    // Cleanup on unmount
    return () => {
      subscription.remove();
    };
  }, [
    clearTimerNotifications,
    isHydrated,
    reconcileTimers,
    scheduleBackgroundTimerNotifications,
    stopForegroundTicker,
  ]);
};
