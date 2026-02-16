import type { StateCreator } from "zustand";
import type { HabitState } from "../habitStore";
import { TimerMap, TimerElapsedTimeMap } from "@/types/timer";
import * as Crypto from "expo-crypto";
import { calculateGoalCompletionDate, getCurrentIsoString } from "@/utils/date";
import { cancelNotification, setNotification } from "@/utils/notifications";
import { DateStamp } from "@/types/date";

export interface TimerSlice {
  activeTimers: TimerMap;
  timerElapsedTimeMap: TimerElapsedTimeMap;
  incrementAllTimers: (elapsedTime: number) => void;
  resetAllElapsedTime: () => void;
  mergeTimerElapsedTimeUpdates: (updatedTimers: TimerElapsedTimeMap) => void;
  activateTimer: (habitId: string, date: DateStamp) => void;
  removeTimer: (habitId: string, date: DateStamp) => void;
  mergeTimerUpdates: (updatedTimers: TimerMap) => void;
}

export const createTimerSlice: StateCreator<HabitState, [], [], TimerSlice> = (set) => ({
  activeTimers: {},
  timerElapsedTimeMap: {},

  incrementAllTimers: (addedTime) => {
    set((state) => {
      // Create a new object to avoid direct mutations
      const updatedElapsedTimeMap: TimerElapsedTimeMap = {};

      for (const habitId of Object.keys(state.activeTimers)) {
        const dateTimers = state.activeTimers[habitId];

        for (const [date, timer] of Object.entries(dateTimers)) {
          const elapsedTime = state.timerElapsedTimeMap[timer.id] || 0;
          const habit = state.habits[habitId];
          if (!habit) continue; // Skip if habit is not found
          const habitGoal = habit?.completion?.goal || 0;

          // Calculate new elapsed time (avoid direct mutation)
          const newElapsedTime = elapsedTime + addedTime;

          updatedElapsedTimeMap[timer.id] = newElapsedTime;

          // Check if habit should be completed
          const combinedTime = newElapsedTime + (habit.completionHistory[date]?.value || 0);
          if (habit && habitGoal <= combinedTime && !habit.completionHistory[date]?.isCompleted) {
            state.updateCompletion({ id: habitId, date, value: combinedTime });
            updatedElapsedTimeMap[timer.id] = 0; // Reset elapsed time after completion
          }
        }
      }

      return { timerElapsedTimeMap: updatedElapsedTimeMap };
    });
  },

  mergeTimerElapsedTimeUpdates: (updatedTimers: TimerElapsedTimeMap) => {
    set((state) => {
      return {
        timerElapsedTimeMap: {
          ...state.timerElapsedTimeMap,
          ...updatedTimers,
        },
      };
    });
  },

  mergeTimerUpdates: (updatedTimers) => {
    set((state) => {
      for (const habitId of Object.keys(updatedTimers)) {
        const dateTimers = updatedTimers[habitId];
        for (const [dateStamp, timer] of Object.entries(dateTimers)) {
          const elapsedTime = state.timerElapsedTimeMap[timer.id] || 0;

          const habit = state.habits[habitId];

          const storedTime = state.habits[habitId]?.completionHistory[dateStamp]?.value || 0;
          const combinedTime = elapsedTime + storedTime;

          if (timer.lastResumedAt && combinedTime && habit) {
            state.updateCompletion({ id: habitId, date: dateStamp, value: combinedTime });
          }
        }
      }
      return {
        activeTimers: {
          ...state.activeTimers,
          ...updatedTimers,
        },
      };
    });
  },

  resetAllElapsedTime: () => {
    set(() => ({
      timerElapsedTimeMap: {},
    }));
  },

  activateTimer: (habitId, date) => {
    const newLastResumedAt = getCurrentIsoString();
    set((state) => {
      const timerId = Crypto.randomUUID();
      const habit = state.habits[habitId];
      const habitGoal = habit?.completion?.goal || 0;
      const habitTitle = habit?.title || "Habit";
      const storeValue = habit?.completionHistory[date]?.value || 0;
      const completionDate = calculateGoalCompletionDate(habitGoal, storeValue);
      if (!habit?.completionHistory[date]?.isCompleted) {
        setNotification(timerId, habitTitle, completionDate);
      }
      return {
        activeTimers: {
          ...state.activeTimers,
          [habitId]: {
            ...state.activeTimers[habitId],
            [date]: {
              id: timerId,
              lastResumedAt: newLastResumedAt,
            },
          },
        },
      };
    });
    return newLastResumedAt;
  },

  removeTimer: (habitId, date) => {
    set((state) => {
      // Create a copy of the current active timers
      const newActiveTimers = { ...state.activeTimers };
      const habitTimers = newActiveTimers[habitId];

      // Check if the habitId exists in activeTimers
      if (habitTimers) {
        // Create a copy of the date timers for this habit
        const dateTimers = { ...habitTimers };
        const timerToRemove = dateTimers[date];
        cancelNotification(timerToRemove.id); // Cancel the notification for this timer
        const elapsedTime = state.timerElapsedTimeMap[timerToRemove.id] || 0;
        const storedTime = state.habits[habitId]?.completionHistory[date]?.value || 0;
        const combinedTime = elapsedTime + storedTime;

        state.updateCompletion({ id: habitId, date, value: combinedTime });

        // Remove the timer for the specified date
        delete dateTimers[date];

        // If there are no more dates for this habit, remove the habitId
        if (Object.keys(dateTimers).length === 0) {
          delete newActiveTimers[habitId];
        } else {
          // Otherwise, update the timers for this habit
          newActiveTimers[habitId] = dateTimers;
        }
      }

      return { activeTimers: newActiveTimers };
    });
  },
});
