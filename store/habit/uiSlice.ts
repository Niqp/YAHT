import type { StateCreator } from "zustand";
import type { HabitState } from "../habitStore";

export interface UiSlice {
	selectedDate: string;
	isLoading: boolean;
	error: string | null;
	setSelectedDate: (date: string) => void;
}

export const createUiSlice: StateCreator<HabitState, [], [], UiSlice> = (
	set,
) => ({
	selectedDate: new Date().toISOString().split("T")[0],
	isLoading: true,
	error: null,

	setSelectedDate: (date) => {
		set({ selectedDate: date });
	},
});
