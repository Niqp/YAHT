import type { ColorSchemeName } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { storage } from "../utils/storage";

export type ThemeMode = "light" | "dark" | "system";
export type WeekStartDay = "sunday" | "monday";

interface ThemeState {
	mode: ThemeMode;
	systemColorScheme: ColorSchemeName;
	isDarkMode: boolean;
	weekStartDay: WeekStartDay;
	setMode: (mode: ThemeMode) => void;
	setSystemColorScheme: (colorScheme: ColorSchemeName) => void;
	setWeekStartDay: (day: WeekStartDay) => void;
	toggleTheme: () => void;
}

// Create MMKV storage adapter for Zustand
const mmkvStorage = {
	getItem: (name: string) => {
		const value = storage.getString(name);
		return Promise.resolve(value || null);
	},
	setItem: (name: string, value: string) => {
		storage.set(name, value);
		return Promise.resolve(true);
	},
	removeItem: (name: string) => {
		storage.delete(name);
		return Promise.resolve();
	},
};

// Helper function to determine dark mode state
const isDarkModeActive = (
	mode: ThemeMode,
	systemColorScheme: ColorSchemeName,
): boolean =>
	mode === "dark" || (mode === "system" && systemColorScheme === "dark");

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			// State
			mode: "system",
			systemColorScheme: null,
			isDarkMode: false,
			weekStartDay: "monday",

			// Actions
			setMode: (mode: ThemeMode) => {
				const { systemColorScheme } = get();
				set({
					mode,
					isDarkMode: isDarkModeActive(mode, systemColorScheme),
				});
			},

			setSystemColorScheme: (colorScheme: ColorSchemeName) => {
				const { mode, systemColorScheme: currentScheme } = get();
				// Skip if it's the same value to avoid unnecessary renders
				if (colorScheme === currentScheme) return;

				set({
					systemColorScheme: colorScheme,
					isDarkMode: isDarkModeActive(mode, colorScheme),
				});
			},

			setWeekStartDay: (day: WeekStartDay) => {
				set({ weekStartDay: day });
			},

			// Toggle between light/dark mode
			toggleTheme: () => {
				const { mode } = get();
				const newMode: ThemeMode =
					mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
				get().setMode(newMode);
			},
		}),
		{
			name: "theme-storage",
			storage: createJSONStorage(() => mmkvStorage),
			partialize: (state) => ({
				mode: state.mode,
				weekStartDay: state.weekStartDay,
			}),
			onRehydrateStorage: () => (state) => {
				if (state) {
					// After rehydration, update isDarkMode based on current system theme
					const { setSystemColorScheme } = useThemeStore.getState();
					// Get the device's current color scheme
					try {
						// Default to 'light' if we can't determine the system color scheme
						const currentColorScheme = state.systemColorScheme || "light";
						setSystemColorScheme(currentColorScheme);
					} catch (e) {
						console.error("Error restoring theme state:", e);
					}
				}
			},
		},
	),
);
