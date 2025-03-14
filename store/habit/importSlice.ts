import type { StateCreator } from "zustand";
import type { Habit } from "../../types/habit";
import { clearHabitCache } from "../../utils/date";
import { saveHabits } from "../../utils/storage";
import type { HabitState } from "../habitStore";
import { habitsArrayToMap } from "./crudSlice";

export interface ImportSlice {
	importHabits: (importedHabits: Habit[]) => Promise<number>;
}

export const createImportSlice: StateCreator<
	HabitState,
	[],
	[],
	ImportSlice
> = (set) => ({
	importHabits: async (importedHabits: Habit[]) => {
		try {
			if (!Array.isArray(importedHabits)) {
				throw new Error("Invalid habits data: not an array");
			}

			const validHabits = importedHabits.filter(
				(habit) =>
					habit && typeof habit === "object" && habit.id && habit.title,
			);

			const habitsMap = habitsArrayToMap(validHabits);
			await saveHabits(validHabits);

			set({
				habits: validHabits,
				habitsMap,
				isLoading: false,
				error: null,
			});

			for (const habit of validHabits) {
				clearHabitCache(habit.id);
			}

			return validHabits.length;
		} catch (error) {
			console.error("Error importing habits:", error);
			set({ error: "Failed to import habits" });
			throw error;
		}
	},
});
