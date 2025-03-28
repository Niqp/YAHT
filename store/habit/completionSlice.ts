import type { StateCreator } from "zustand";
import type { HabitState } from "../habitStore";
import { insertSortedIntoMap } from "@/utils/map";

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

      const currentCompletion = habit.completionHistory.get(date) || { isCompleted: false, value: 0 };
      let newCompleted = currentCompletion.isCompleted;

      // Determine new completion state
      if (habit.completion.type === "simple") {
        newCompleted = !newCompleted;
      }
      if (["repetitions", "timed"].includes(habit.completion.type)) {
        newCompleted = value !== undefined && value >= (habit.completion.goal || 0);
      }

      // Determine new value
      let newValue = value || 0;
      if (habit.completion.type === "timed" && newValue === undefined) {
        newValue = currentCompletion?.value || 0;
      }

      let newCompletionHistory = new Map(habit.completionHistory);
      const isTimerRunning = !!activeTimers[id]?.[date];
      if (!currentCompletion.isCompleted || isTimerRunning) {
        // If the habit was not completed, update the completion history
        newCompletionHistory = insertSortedIntoMap(newCompletionHistory, date, {
          isCompleted: newCompleted,
          value: newValue || 0,
        });
      } else {
        // If the habit was completed, reset the completion in history
        newCompletionHistory.delete(date);
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
    } catch (error) {
      console.error("Error completing habit:", error);
      set({ error: "Failed to complete habit" });
    }
  },

  updateCompletionMultiple: async (updates) => {
    for (const update of updates) {
      await get().updateCompletion(update);
    }
  },
});
