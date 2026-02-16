import { create } from "zustand";
import { persist } from "zustand/middleware";
import { mmkvStorage } from "@/utils/storage";
import type { TimerMap } from "../types/timer";
import type { DateStamp } from "../types/date";
import type { Habit, HabitMap } from "../types/habit";

import { createCompletionSlice, type CompletionData } from "./habit/completionSlice";
import { createCRUDSlice } from "./habit/crudSlice";
import { createImportSlice } from "./habit/importSlice";
import { createTimerSlice } from "./habit/timerSlice";
import { getCurrentDateStamp } from "@/utils/date";

export interface HabitState {
  _hasHydrated: boolean;
  habits: HabitMap;
  selectedDate: string;
  activeTimers: TimerMap;
  timerRenderTickMs: number;
  error: string | null;

  // Methods will be implemented in slices
  setHydrationState: (state: boolean) => void;
  addHabit: (habit: Omit<Habit, "id">) => Promise<void>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  updateCompletion: (update: CompletionData) => Promise<void>;
  updateCompletionMultiple: (updates: CompletionData[]) => Promise<void>;
  setSelectedDate: (date: string) => void;
  getHabitById: (id: string) => Habit | undefined;
  importHabits: (importedHabits: HabitMap) => Promise<number>;
  resetStore: () => void;
  tickForeground: (nowMs?: number) => void;
  reconcileActiveTimers: (nowIso?: string) => Promise<void>;
  activateTimer: (habitId: string, date: DateStamp) => void;
  removeTimer: (habitId: string, date: DateStamp, nowIso?: string) => Promise<void>;
}

// Create custom storage adapter using our MMKV instance

// Apply persist middleware to the store
export const useHabitStore = create<HabitState>()(
  persist(
    (...args) => ({
      selectedDate: getCurrentDateStamp(),
      error: null,
      _hasHydrated: false,
      timerRenderTickMs: Date.now(),

      setHydrationState: (state) => {
        const set = args[0];
        set({ _hasHydrated: state });
      },

      setSelectedDate: (date) => {
        const set = args[0];
        set({ selectedDate: date });
      },

      ...createCRUDSlice(...args),
      ...createCompletionSlice(...args),
      ...createImportSlice(...args),
      ...createTimerSlice(...args),
    }),
    {
      name: "habits-storage",
      storage: mmkvStorage,
      partialize: (state) => ({
        habits: state.habits,
        activeTimers: state.activeTimers,
      }),
      onRehydrateStorage: (state) => {
        return () => state.setHydrationState(true);
      },
    }
  )
);
