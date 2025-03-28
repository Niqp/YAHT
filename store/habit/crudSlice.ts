import * as Crypto from "expo-crypto";
import type { StateCreator } from "zustand";
import type { Habit, HabitMap } from "../../types/habit";
import type { HabitState } from "../habitStore";
import { getCurrentDateStamp } from "@/utils/date";

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
    } catch (error) {
      console.error("Error adding habit:", error);
      set({ error: "Failed to add habit" });
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
    } catch (error) {
      console.error("Error updating habit:", error);
      set({ error: "Failed to update habit" });
    }
  },

  deleteHabit: async (id) => {
    try {
      set((state) => {
        const updatedMap = { ...state.habits };
        delete updatedMap[id];

        return {
          habits: updatedMap,
          error: null,
        };
      });
    } catch (error) {
      console.error("Error deleting habit:", error);
      set({ error: "Failed to delete habit" });
    }
  },

  getHabitById: (id) => {
    return get().habits[id];
  },

  resetStore: () => {
    set({
      habits: {},
      activeTimers: {},
      timerElapsedTimeMap: {},
      selectedDate: getCurrentDateStamp(),
      error: null,
    });
  },
});
