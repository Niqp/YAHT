import { v4 as uuidv4 } from "uuid";
import type { StateCreator } from "zustand";
import type { Habit } from "../../types/habit";
import { clearHabitCache } from "../../utils/date";
import { saveHabits, updateSingleHabit, loadHabits } from "../../utils/storage";
import type { HabitState, HabitsMap } from "../habitStore";

// Helper to convert habit array to map
export const habitsArrayToMap = (habits: Habit[]): HabitsMap => {
	if (!Array.isArray(habits)) return {};

	return habits.reduce((map, habit) => {
		if (habit?.id) {
			map[habit.id] = habit;
		}
		return map;
	}, {} as HabitsMap);
};

export interface CRUDSlice {
	habits: Habit[];
	habitsMap: HabitsMap;

	addHabit: (
		habit: Omit<Habit, "id" | "createdAt" | "completionHistory">,
	) => Promise<void>;
	updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
	deleteHabit: (id: string) => Promise<void>;
	getHabitById: (id: string) => Habit | undefined;
	loadHabitsFromStorage: () => Promise<void>;
}

export const createCRUDSlice: StateCreator<HabitState, [], [], CRUDSlice> = (
	set,
	get,
) => ({
	habits: [],
	habitsMap: {},

	addHabit: async (habitData) => {
		try {
			const newHabit: Habit = {
				...habitData,
				id: uuidv4(),
				createdAt: new Date().toISOString(),
				completionHistory: {},
			};

			set((state) => {
				const updatedHabits = [...state.habits, newHabit];
				const updatedMap = { ...state.habitsMap, [newHabit.id]: newHabit };

				saveHabits(updatedHabits).catch((error) => {
					console.error("Error saving habits:", error);
				});

				return {
					habits: updatedHabits,
					habitsMap: updatedMap,
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
				const existingHabit = state.habitsMap[id];
				if (!existingHabit) return state;

				const updatedHabit = { ...existingHabit, ...habitData };
				clearHabitCache(id);

				const updatedHabits = state.habits.map((h) =>
					h.id === id ? updatedHabit : h,
				);
				const updatedMap = { ...state.habitsMap, [id]: updatedHabit };

				saveHabits(updatedHabits).catch((error) => {
					console.error("Error saving habits:", error);
				});

				return {
					habits: updatedHabits,
					habitsMap: updatedMap,
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
				const updatedHabits = state.habits.filter((h) => h.id !== id);
				const updatedMap = { ...state.habitsMap };
				delete updatedMap[id];

				clearHabitCache(id);

				saveHabits(updatedHabits).catch((error) => {
					console.error("Error saving habits after delete:", error);
				});

				return {
					habits: updatedHabits,
					habitsMap: updatedMap,
					error: null,
				};
			});
		} catch (error) {
			console.error("Error deleting habit:", error);
			set({ error: "Failed to delete habit" });
		}
	},

	getHabitById: (id) => {
		return get().habitsMap[id];
	},

	loadHabitsFromStorage: async () => {
		set({ isLoading: true, error: null });
		try {
			const habits = await loadHabits();
			if (!Array.isArray(habits)) {
				throw new Error("Loaded habits is not an array");
			}

			const validHabits = habits.filter(
				(habit) =>
					habit && typeof habit === "object" && habit.id && habit.title,
			);

			const habitsMap = habitsArrayToMap(validHabits);
			set({ habits: validHabits, habitsMap, isLoading: false });
		} catch (error) {
			console.error("Error loading habits:", error);
			set({
				habits: [],
				habitsMap: {},
				isLoading: false,
				error: "Failed to load habits",
			});
		}
	},
});
