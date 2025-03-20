import type { HabitState } from "./habitStore";
import type { Habit } from "@/types/habit";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mmkvStorage } from "../utils/storage";

export type TimerDate = string; // Type alias for timer date (ISO string format)

// Timer interface
export interface Timer {
  lastResumedAt: string | null; // Timestamp when timer was last resumed (ISO string format)
  elapsedTime?: number; // elapsed time in milliseconds
}

export type TimerMap = Record<Habit["id"], Record<TimerDate, Timer>>;

export interface TimerState {
  activeTimers: TimerMap;
  incrementAllTimers: (elapsedTime: number) => void;
  activateTimer: (habitId: string, date: TimerDate) => void;
  removeTimer: (habitId: string, date: TimerDate) => void;
  mergeTimerUpdates: (updatedTimers: Record<Habit["id"], Record<TimerDate, Timer>>) => void;
}

export const timerStore = create<TimerState>()(
  persist(
    (set) => ({
      activeTimers: {},

      incrementAllTimers: (elapsedTime) => {
        set((state) => {
          const allTimers = state.activeTimers;
          for (const habitId in allTimers) {
            const dateTimers = allTimers[habitId];
            for (const date in dateTimers) {
              const timer = dateTimers[date];
              if (timer.lastResumedAt) {
                // Update the elapsed time for the timer
                timer.elapsedTime = (timer.elapsedTime || 0) + elapsedTime;
              }
            }
          }

          return { activeTimers: { ...allTimers } };
        });
      },

      mergeTimerUpdates: (updatedTimers) => {
        set((state) => {
          return {
            activeTimers: {
              ...state.activeTimers,
              ...updatedTimers,
            },
          };
        });
      },

      activateTimer: (habitId, date) => {
        const newLastResumedAt = new Date().toISOString();
        set((state) => ({
          activeTimers: {
            ...state.activeTimers,
            [habitId]: {
              ...state.activeTimers[habitId],
              [date]: {
                lastResumedAt: newLastResumedAt,
                elapsedTime: 0,
              },
            },
          },
        }));
        return newLastResumedAt;
      },

      removeTimer: (habitId, date) => {
        set((state) => {
          const { [date]: removed, ...rest } = state.activeTimers[habitId] || {};
          return {
            activeTimers: {
              ...state.activeTimers,
              [habitId]: rest,
            },
          };
        });
      },
    }),
    {
      name: "timer-storage", // Unique name for the storage key
      storage: mmkvStorage, // Use MMKV storage for persistence
    }
  )
);
