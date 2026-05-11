import type { StateCreator } from "zustand";
import type { HabitMap } from "@/types/habit";
import type { HabitState } from "../habitStore";
import { logError, logEvent, logWarn } from "@/utils/diagnostics/diagnosticLogger";
import { translate } from "@/i18n";

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
          console.warn("Skipping invalid habit during import.");
          logWarn("habit.import.skippedInvalid", { operation: "importHabits" });
        } else {
          validHabits[habit.id] = habit;
        }
      }

      set({
        habits: validHabits,
        error: null,
      });

      logEvent("habit.import.completed", { count: Object.keys(validHabits).length });
      return Object.keys(validHabits).length;
    } catch (error) {
      console.error("Error importing habits.");
      logError("habit.import.failed", { operation: "importHabits", error });
      set({ error: translate("errors.importHabits") });
      throw error;
    }
  },
});
