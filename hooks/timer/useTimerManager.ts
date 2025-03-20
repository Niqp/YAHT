import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useHabitStore } from "@/store/habitStore";
import { TimerElapsedTimeMap, TimerMap } from "@/types/timer";

const TIMER_UPDATE_INTERVAL = 1000; // 1 second

/**
 * Hook to manage timer updates based on timestamp approach
 */
export const useTimerManager = () => {
  // References
  const appStateRef = useRef(AppState.currentState);

  // Use individual selectors instead of returning an object
  const activeTimers = useHabitStore((state) => state.activeTimers);
  const incrementAllTimers = useHabitStore((state) => state.incrementAllTimers);
  const mergeTimerUpdates = useHabitStore((state) => state.mergeTimerUpdates);
  const mergeTimerElapsedTimeUpdates = useHabitStore((state) => state.mergeTimerElapsedTimeUpdates);
  const resetAllElapsedTime = useHabitStore((state) => state.resetAllElapsedTime);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update all active timers by calculating elapsed time since their lastResumedAt
  const mergeBackgroundTimerUpdates = useCallback(() => {
    try {
      // Track habits that need updates
      const updatedTimerMap: TimerMap = {};
      const updatedElapsedTimeMap: TimerElapsedTimeMap = {};
      const activeTimers = useHabitStore.getState().activeTimers;

      Object.entries(activeTimers).forEach(([habitId, dateTimers]) => {
        Object.entries(dateTimers).forEach(([date, timer]) => {
          if (!timer.lastResumedAt) return;

          const now = Date.now();
          const lastResumed = new Date(timer.lastResumedAt).getTime();
          const elapsedSinceResume = now - lastResumed;
          updatedElapsedTimeMap[timer.id] = elapsedSinceResume;

          const newTimeStamp = new Date(now).toISOString();

          // Validate elapsed time - skip if negative
          if (elapsedSinceResume < 0) {
            console.warn(`Invalid elapsed time detected: ${elapsedSinceResume}ms for habit ${habitId}`);
            return;
          }

          // Store the update for batch processing
          if (!updatedTimerMap[habitId]) {
            updatedTimerMap[habitId] = {};
          }
          updatedTimerMap[habitId][date] = {
            ...timer,
            lastResumedAt: newTimeStamp,
          };
        });
      });

      // Apply all updates
      if (Object.keys(updatedTimerMap).length > 0) {
        mergeTimerElapsedTimeUpdates(updatedElapsedTimeMap);
        mergeTimerUpdates(updatedTimerMap);
        resetAllElapsedTime();
      }
    } catch (error) {
      if (error instanceof Error) console.error(`Error updating active timers: ${error.message}`, error);
    }
  }, [resetAllElapsedTime, mergeTimerUpdates]);

  const updateAllActiveTimers = useCallback(() => {
    incrementAllTimers(TIMER_UPDATE_INTERVAL);
  }, [incrementAllTimers]);

  useLayoutEffect(() => {
    // Clear any existing interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
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
          // App has come to the foreground - update all active timers
          mergeBackgroundTimerUpdates();
        }
        // App is going to background - we don't need to do anything
        // since we're using timestamps, the elapsed time will be
        // calculated correctly when the app returns to the foreground

        appStateRef.current = nextAppState;
      } catch (error) {
        if (error instanceof Error) console.error(`Error handling app state change: ${error.message}`, error);
      }
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription.remove();

      // Update timers on unmount to ensure latest state is saved
      mergeBackgroundTimerUpdates();
    };
  }, [mergeBackgroundTimerUpdates]);
};
