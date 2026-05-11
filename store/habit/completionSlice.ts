import type { StateCreator } from "zustand";
import type { HabitState } from "../habitStore";
import { logError, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { translate } from "@/i18n";

export type CompletionData = {
  id: string;
  date?: string;
  value?: number;
};

export interface CompletionSlice {
  updateCompletion: (update: CompletionData) => Promise<void>;
  updateCompletionMultiple: (updates: CompletionData[]) => Promise<void>;
}

export const createCompletionSlice: StateCreator<HabitState, [], [], CompletionSlice> = (set, get) => ({
  updateCompletion: async ({ id, date, value }) => {
    try {
      const { habits, selectedDate, activeTimers } = get();
      date = date || selectedDate;
      const habit = habits[id];
      if (!habit) return;

      const currentCompletion = habit.completionHistory[date] || { isCompleted: false, value: 0 };
      const currentValue = currentCompletion.value ?? 0;
      let newCompleted = currentCompletion.isCompleted;
      let newValue = currentValue;

      // Determine new completion state
      if (habit.completion.type === "simple") {
        newCompleted = !newCompleted;
        newValue = 0;
      } else if (["repetitions", "timed"].includes(habit.completion.type)) {
        newValue = value ?? currentValue;
        newCompleted = newValue >= (habit.completion.goal || 0);
      }

      const newCompletionHistory = { ...habit.completionHistory };
      const isTimerRunning = !!activeTimers[id]?.[date];
      const shouldDeleteEntry =
        habit.completion.type === "simple"
          ? currentCompletion.isCompleted && !newCompleted && !isTimerRunning
          : newValue <= 0 && !newCompleted && !isTimerRunning;

      if (shouldDeleteEntry) {
        delete newCompletionHistory[date];
      } else {
        newCompletionHistory[date] = {
          isCompleted: newCompleted,
          value: newValue,
        };
      }

      const updatedHabit = {
        ...habit,
        completionHistory: newCompletionHistory,
      };

      set((state) => {
        const updatedMap = {
          ...state.habits,
          [id]: updatedHabit,
        };

        return {
          habits: updatedMap,
          error: null,
        };
      });
      logEvent("habit.completion.updated", {
        habitId: id,
        date,
        completionType: habit.completion.type,
        isCompleted: newCompleted,
        value: newValue,
      });
    } catch (error) {
      console.error("Error completing habit:", error);
      logError("habit.completion.failed", { operation: "updateCompletion", habitId: id, date, error });
      set({ error: translate("errors.completeHabit") });
    }
  },

  updateCompletionMultiple: async (updates) => {
    for (const update of updates) {
      await get().updateCompletion(update);
    }
    logEvent("habit.completion.bulkUpdated", { count: updates.length });
  },
});
