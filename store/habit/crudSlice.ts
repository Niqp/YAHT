import * as Crypto from "expo-crypto";
import type { StateCreator } from "zustand";
import type { Habit, HabitMap } from "../../types/habit";
import type { HabitState } from "../habitStore";
import { getCurrentDateStamp } from "@/utils/date";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { translate } from "@/i18n";

export interface CRUDSlice {
  habits: HabitMap;

  addHabit: (habit: Omit<Habit, "id">) => Promise<void>;
  updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  getHabitById: (id: string) => Habit | undefined;
  resetStore: () => void;
}

export const createCRUDSlice: StateCreator<HabitState, [], [], CRUDSlice> = (set, get) => ({
  habits: {},

  addHabit: async (habitData) => {
    try {
      const newHabit: Habit = {
        ...habitData,
        id: Crypto.randomUUID(),
      };

      set((state) => {
        const existingHabit = state.habits[newHabit.id];
        if (existingHabit) return state;

        const updatedHabits = { ...state.habits, [newHabit.id]: newHabit };

        return {
          habits: updatedHabits,
          error: null,
        };
      });
      logEvent("habit.created", {
        habitId: newHabit.id,
        completionType: newHabit.completion.type,
        repetitionType: newHabit.repetition.type,
        reminderEnabled: !!newHabit.reminder?.enabled,
      });
    } catch (error) {
      console.error("Error adding habit:", error);
      logError("habit.create.failed", { operation: "addHabit", error });
      set({ error: translate("errors.addHabit") });
    }
  },

  updateHabit: async (id, habitData) => {
    try {
      set((state) => {
        const existingHabit = state.habits[id];
        if (!existingHabit) return state;

        const updatedHabit = { ...existingHabit, ...habitData };

        const updatedHabits = { ...state.habits, [id]: updatedHabit };

        return {
          habits: updatedHabits,
          error: null,
        };
      });
      logEvent("habit.updated", {
        habitId: id,
        completionType: get().habits[id]?.completion.type,
        repetitionType: get().habits[id]?.repetition.type,
        reminderEnabled: !!get().habits[id]?.reminder?.enabled,
      });
    } catch (error) {
      console.error("Error updating habit:", error);
      logError("habit.update.failed", { operation: "updateHabit", habitId: id, error });
      set({ error: translate("errors.updateHabit") });
    }
  },

  deleteHabit: async (id) => {
    try {
      set((state) => {
        const updatedMap = { ...state.habits };
        const updatedTimers = { ...state.activeTimers };
        delete updatedMap[id];
        delete updatedTimers[id];

        return {
          habits: updatedMap,
          activeTimers: updatedTimers,
          error: null,
        };
      });
      logEvent("habit.deleted", { habitId: id });
    } catch (error) {
      console.error("Error deleting habit:", error);
      logError("habit.delete.failed", { operation: "deleteHabit", habitId: id, error });
      set({ error: translate("errors.deleteHabit") });
    }
  },

  getHabitById: (id) => {
    return get().habits[id];
  },

  resetStore: () => {
    set({
      habits: {},
      activeTimers: {},
      timerRenderTickMs: Date.now(),
      selectedDate: getCurrentDateStamp(),
      error: null,
    });
    logEvent("habit.reset", { operation: "resetStore" });
  },
});
