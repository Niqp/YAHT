import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { createJSONStorage, persist } from 'zustand/middleware';

// Timer interface
export interface Timer {
  currentProgressTimeMs: number; // Current elapsed time in milliseconds
  goalTimeMs: number;            // Target time in milliseconds
  isActive: boolean;             // Whether timer is currently running
  lastResumedAt: string | null;    // Timestamp when timer was last resumed (ISO string format)
}

// Timer state interface
interface TimerState {
  timers: Record<string, Timer>;
  
  // Core timer functions
  createTimer: (habitId: string, goalTimeMs: number) => void;
  startTimer: (habitId: string) => void;
  pauseTimer: (habitId: string) => void;
  resetTimer: (habitId: string) => void;
  getTimer: (habitId: string) => Timer | undefined;
  getAllActiveTimers: () => Record<string, Timer>;
  removeTimer: (habitId: string) => void;
  updateCurrentProgressTime: (habitId: string, timeMs: number) => void;
  incrementActiveTimers: (addTimeMs: number) => void; 
}

// MMKV storage implementation for Zustand
const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? value : null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

// Create the store with persistence
export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      timers: {},

      // Create a new timer for a habit
      createTimer: (habitId: string, goalTimeMs: number) => {
        set((state) => ({
          timers: {
            ...state.timers,
            [habitId]: {
              currentProgressTimeMs: 0,
              goalTimeMs,
              isActive: false,
              lastResumedAt: null,
            },
          },
        }));
      },

      // Start or resume a timer
      startTimer: (habitId: string) => {
        set((state) => {
          const timer = state.timers[habitId];
          if (!timer) return state;

          const now = new Date().toISOString();
          return {
            timers: {
              ...state.timers,
              [habitId]: {
                ...timer,
                isActive: true,
                lastResumedAt: now,
              },
            },
          };
        });
      },

      // Pause a timer
      pauseTimer: (habitId: string) => {
        set((state) => {
          const timer = state.timers[habitId];
          if (!timer || !timer.isActive) {
            console.warn(`Timer for habit ${habitId} is not active or does not exist.`);
            return state;
          }

          return {
            timers: {
              ...state.timers,
              [habitId]: {
                ...timer,
                isActive: false,
              },
            },
          };
        });
      },

      // Reset a timer to initial state
      resetTimer: (habitId: string) => {
        set((state) => {
          const timer = state.timers[habitId];
          if (!timer) return state;

          return {
            timers: {
              ...state.timers,
              [habitId]: {
                ...timer,
                currentProgressTimeMs: 0,
                isActive: false,
                lastResumedAt: null,
              },
            },
          };
        });
      },

      // Get a specific timer
      getTimer: (habitId: string) => {
        return get().timers[habitId];
      },

      // Get all currently active timers
      getAllActiveTimers: () => {
        const { timers } = get();
        const activeTimers: Record<string, Timer> = {};
        
        Object.entries(timers).forEach(([habitId, timer]) => {
          if (timer.isActive) {
            activeTimers[habitId] = timer;
          }
        });
        
        return activeTimers;
      },

      // Remove a timer (for deleted habits)
      removeTimer: (habitId: string) => {
        set((state) => {
          const newTimers = { ...state.timers };
          delete newTimers[habitId];
          return { timers: newTimers };
        });
      },

      updateCurrentProgressTime: (habitId: string, timeMs: number) => {
        set((state) => {
          const timer = state.timers[habitId];
          if (!timer) return state;

          return {
            timers: {
              ...state.timers,
              [habitId]: {
                ...timer,
                currentProgressTimeMs: timeMs,
              },
            },
          };
        });
      },

      // Update all active timers at once (called from outside)
      incrementActiveTimers: (addTimeMs) => {
        set((state) => {
          const now = new Date().toISOString();
          const updatedTimers = { ...state.timers };
          let hasChanges = false;

          Object.entries(updatedTimers).forEach(([habitId, timer]) => {
            if (timer.isActive && timer.lastResumedAt) {
              updatedTimers[habitId] = {
                ...timer,
                currentProgressTimeMs: timer.currentProgressTimeMs + addTimeMs,
                lastResumedAt: now,
              };
              hasChanges = true;
            }
          });

          return hasChanges ? { timers: updatedTimers } : state;
        });
      },

    }),
    {
      name: 'habit-timers',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ timers: state.timers }),
    }
  )
);

