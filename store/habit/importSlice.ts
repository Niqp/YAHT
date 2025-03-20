import type { StateCreator } from "zustand";
import type { HabitMap } from "@/types/habit";
import type { HabitState } from "../habitStore";

export interface ImportSlice {
  importHabits: (importedHabits: HabitMap) => Promise<number>;
}

export const createImportSlice: StateCreator<HabitState, [], [], ImportSlice> = (set) => ({
  importHabits: async (importedHabits: HabitMap) => {
    try {
      if (typeof importedHabits !== "object" || importedHabits === null) {
        throw new Error("Invalid habits data: not an object");
      }
      const validHabits: HabitMap = {};

      for (const habit of Object.values(importedHabits)) {
        if (!habit.id || !habit.title) {
          console.warn("Skipping invalid habit:", habit);
        } else {
          validHabits[habit.id] = habit;
        }
      }

      set({
        habits: validHabits,
        error: null,
      });

      return Object.keys(validHabits).length;
    } catch (error) {
      console.error("Error importing habits:", error);
      set({ error: "Failed to import habits" });
      throw error;
    }
  },
});
