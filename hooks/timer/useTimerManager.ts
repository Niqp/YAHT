import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useHabitStore } from "@/store/habitStore";
import { cancelAllNotifications } from "@/utils/notifications";

const TIMER_UPDATE_INTERVAL = 1000; // 1 second

/**
 * Hook to manage timer updates based on timestamp approach
 */
export const useTimerManager = () => {
  // References
  const appStateRef = useRef(AppState.currentState);

  // Use individual selectors instead of returning an object
  const activeTimers = useHabitStore((state) => state.activeTimers);
  const tickForeground = useHabitStore((state) => state.tickForeground);
  const reconcileActiveTimers = useHabitStore((state) => state.reconcileActiveTimers);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  useLayoutEffect(() => {
    // Clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (Object.values(activeTimers).length === 0) {
      cancelAllNotifications();
    }

    if (Object.values(activeTimers).length > 0) {
      timerIntervalRef.current = setInterval(updateAllActiveTimers, TIMER_UPDATE_INTERVAL);
    }

    // Clean up on unmount or when dependencies change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [activeTimers, updateAllActiveTimers]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      try {
        if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
          reconcileTimers();
        }

        appStateRef.current = nextAppState;
      } catch (error) {
        if (error instanceof Error) console.error(`Error handling app state change: ${error.message}`, error);
      }
    };

    if (isColdLaunch.current) {
      // App was launched from a cold state, reconcile all active timers once.
      reconcileTimers();
      isColdLaunch.current = false;
    }

    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription.remove();

      // Best-effort only: app kill does not guarantee this cleanup runs on mobile.
      reconcileTimers();
    };
  }, [reconcileTimers]);
};
