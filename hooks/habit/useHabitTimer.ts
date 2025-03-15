import { useCallback, useEffect } from 'react';
import { useTimerStore } from '@/store/timerStore';
import * as Notifications from 'expo-notifications';

/**
 * A custom hook that manages timer functionality for habits with notification support
 * 
 * @param habitId - The id of the habit to track
 * @param goalTimeMs - The target time in milliseconds
 * @param selectedDate - Current selected date for tracking
 */
export const useHabitTimer = (
  habitId: string,
  goalTimeMs: number, 
  selectedDate: string
) => {
  // Get timer functions from store
  const { 
    startTimer: storeStartTimer, 
    pauseTimer: storePauseTimer, 
    resetTimer: storeResetTimer,
    getElapsedTime,
    isGoalReached,
    timers
  } = useTimerStore();

  // Check if timer is currently active
  const timerActive = useCallback(() => {
    return !!timers[habitId]?.isActive;
  }, [habitId, timers]);

  // Get the total elapsed time for this habit's timer
  const getTotalElapsedTime = useCallback(() => {
    return getElapsedTime(habitId);
  }, [habitId, getElapsedTime]);

  /**
   * Schedule a notification for when the timer completes
   */
  const scheduleTimerNotification = useCallback(async () => {
    try {
      // Cancel any existing notifications first
      await Notifications.cancelScheduledNotificationAsync(`timer-${habitId}`);
      
      // Calculate when the notification should trigger
      const currentElapsedTime = getTotalElapsedTime();
      const remainingTimeMs = Math.max(1000, goalTimeMs - currentElapsedTime);
      
      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Timer Complete!",
          body: "Your timed habit has reached its goal.",
          data: { habitId, selectedDate }
        },
        trigger: { 
          seconds: Math.ceil(remainingTimeMs / 1000),
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
        identifier: `timer-${habitId}`
      });
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }, [habitId, goalTimeMs, selectedDate, getTotalElapsedTime]);

  /**
   * Cancel any scheduled notifications for this timer
   */
  const cancelTimerNotification = useCallback(async () => {
    try {
      await Notifications.cancelScheduledNotificationAsync(`timer-${habitId}`);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }, [habitId]);

  /**
   * Start the timer and schedule a completion notification
   */
  const startTimer = useCallback(async () => {
    storeStartTimer(habitId, goalTimeMs);
    await scheduleTimerNotification();
  }, [habitId, goalTimeMs, storeStartTimer, scheduleTimerNotification]);

  /**
   * Pause the timer and cancel any pending notifications
   */
  const pauseTimer = useCallback(async () => {
    storePauseTimer(habitId);
    await cancelTimerNotification();
  }, [habitId, storePauseTimer, cancelTimerNotification]);

  /**
   * Reset the timer and cancel any pending notifications
   */
  const resetTimer = useCallback(async () => {
    storeResetTimer(habitId);
    await cancelTimerNotification();
  }, [habitId, storeResetTimer, cancelTimerNotification]);

  // Clean up notifications when component unmounts
  useEffect(() => {
    return () => {
      cancelTimerNotification();
    };
  }, [cancelTimerNotification]);

  return {
    timerActive: timerActive(),
    getTotalElapsedTime,
    startTimer,
    pauseTimer,
    resetTimer
  };
};

/**
 * Export the previous hook name to maintain backward compatibility
 */
export const useTimerLogic = useHabitTimer;
