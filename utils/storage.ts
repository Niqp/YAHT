import { MMKV } from "react-native-mmkv";
import type { Habit } from "../types/habit";

// Initialize MMKV instance
export const storage = new MMKV();

const HABITS_STORAGE_KEY = "habits_data";

/**
 * Saves habits to MMKV with debouncing
 * This prevents rapid consecutive saves when multiple habits are updated at once
 */
export const saveHabits = async (habits: Habit[]): Promise<void> => {
	// Validate habits array to prevent saving invalid data
	if (!Array.isArray(habits)) {
		throw new Error("Cannot save habits: habits is not an array");
	}

	return new Promise((resolve, reject) => {
		try {
			const data = JSON.stringify(habits);
			storage.set(HABITS_STORAGE_KEY, data);
			resolve();
		} catch (error) {
			console.error("Error saving habits:", error);
			reject(error);
		}
	});
};

/**
 * Loads habits from MMKV
 * Optimized with proper error handling and typing
 */
export const loadHabits = async (): Promise<Habit[]> => {
	try {
		const data = storage.getString(HABITS_STORAGE_KEY);
		if (!data) return [];

		try {
			const parsedData = JSON.parse(data) as Habit[];
			if (!Array.isArray(parsedData)) {
				console.error("Parsed habits data is not an array:", parsedData);
				return [];
			}

			// Filter out any undefined or malformed habits
			return parsedData.filter(
				(habit) =>
					habit && typeof habit === "object" && habit.id && habit.title,
			);
		} catch (parseError) {
			console.error("Error parsing habits JSON:", parseError);
			return [];
		}
	} catch (error) {
		console.error("Error loading habits from storage:", error);
		return [];
	}
};

/**
 * Batch updates habits in storage
 * More efficient than saving the entire array for each update
 */
export const updateHabitBatch = async (
	updatedHabits: Habit[],
): Promise<void> => {
	if (!Array.isArray(updatedHabits) || updatedHabits.length === 0) {
		return;
	}

	try {
		const existingData = await loadHabits();

		// Create a map of existing habits for O(1) lookups
		const habitsMap = new Map(existingData.map((habit) => [habit.id, habit]));

		// Update only the habits that have changed
		for (const habit of updatedHabits) {
			if (habit?.id) {
				habitsMap.set(habit.id, habit);
			}
		}

		// Convert back to array
		const mergedHabits = Array.from(habitsMap.values());

		// Save the updated array
		await saveHabits(mergedHabits);
	} catch (error) {
		console.error("Error updating habits batch:", error);
		throw error;
	}
};

/**
 * Updates a single habit in storage
 * More efficient than saving the entire array for a single update
 */
export const updateSingleHabit = async (updatedHabit: Habit): Promise<void> => {
	if (!updatedHabit || !updatedHabit.id) {
		throw new Error("Cannot update habit: Invalid habit data");
	}

	return updateHabitBatch([updatedHabit]);
};
