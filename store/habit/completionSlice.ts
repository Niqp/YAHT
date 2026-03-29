import type { StateCreator } from "zustand";
import type { HabitState } from "../habitStore";

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

      let newCompletionHistory = { ...habit.completionHistory };
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
