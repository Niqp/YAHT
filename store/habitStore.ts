import { create } from "zustand";
import type { Habit } from "../types/habit";

import { createCompletionSlice } from "./habit/completionSlice";
import { createCRUDSlice } from "./habit/crudSlice";
import { createImportSlice } from "./habit/importSlice";
import { createUiSlice } from "./habit/uiSlice";

export interface HabitsMap {
	[id: string]: Habit;
}

export interface HabitState {
	habits: Habit[];
	habitsMap: HabitsMap;
	selectedDate: string;
	isLoading: boolean;
	error: string | null;

	// Methods will be implemented in slices
	addHabit: (
		habit: Omit<Habit, "id" | "createdAt" | "completionHistory">,
	) => Promise<void>;
	updateHabit: (id: string, habit: Partial<Habit>) => Promise<void>;
	deleteHabit: (id: string) => Promise<void>;
	completeHabit: (
		id: string,
		value?: number,
		forcedState?: boolean,
	) => Promise<void>;
	setSelectedDate: (date: string) => void;
	loadHabitsFromStorage: () => Promise<void>;
	getHabitById: (id: string) => Habit | undefined;
	importHabits: (importedHabits: Habit[]) => Promise<number>;
	resetStore: () => void;
}

// Combine all slices into one store
export const useHabitStore = create<HabitState>((...args) => ({
	activeTimers: {}, // Initialize empty active timers map

	...createCRUDSlice(...args),
	...createCompletionSlice(...args),
	...createUiSlice(...args),
	...createImportSlice(...args),
}));
