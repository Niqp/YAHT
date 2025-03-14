import type { StateCreator } from "zustand";
import { updateSingleHabit } from "../../utils/storage";
import type { HabitState } from "../habitStore";

export interface CompletionSlice {
	completeHabit: (
		id: string,
		value?: number,
		forcedState?: boolean,
	) => Promise<void>;
}

export const createCompletionSlice: StateCreator<
	HabitState,
	[],
	[],
	CompletionSlice
> = (set, get) => ({
	completeHabit: async (id, value, forcedState) => {
		try {
			const { selectedDate, habitsMap } = get();
			const habit = habitsMap[id];
			if (!habit) return;

			const currentCompletion = habit.completionHistory[selectedDate] || {
				completed: false,
			};
			let newCompleted = currentCompletion.completed;

			// Determine new completion state
			if (forcedState !== undefined) {
				newCompleted = forcedState;
			} else if (habit.completionType === "simple") {
				newCompleted = !currentCompletion.completed;
			} else if (["repetitions", "timed"].includes(habit.completionType)) {
				newCompleted =
					value !== undefined && value >= (habit.completionGoal || 0);
			}

			// Determine new value
			let newValue = value;
			if (habit.completionType === "timed" && newValue === undefined) {
				newValue = currentCompletion.value;
			}

			const updatedHabit = {
				...habit,
				completionHistory: {
					...habit.completionHistory,
					[selectedDate]: {
						completed: newCompleted,
						value: newValue,
					},
				},
			};

			set((state) => {
				const updatedHabits = state.habits.map((h) =>
					h.id === id ? updatedHabit : h,
				);

				const updatedMap = {
					...state.habitsMap,
					[id]: updatedHabit,
				};

				updateSingleHabit(updatedHabit).catch((error) => {
					console.error("Error updating single habit:", error);
				});

				return {
					habits: updatedHabits,
					habitsMap: updatedMap,
					error: null,
				};
			});
		} catch (error) {
			console.error("Error completing habit:", error);
			set({ error: "Failed to complete habit" });
		}
	},
});
