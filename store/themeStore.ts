import type { ColorSchemeName } from "react-native";
import { AppState, type AppStateStatus } from "react-native";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type ColorTheme, Colors } from "../constants/Colors";
import { storage } from "../utils/storage";

export type ThemeMode = "light" | "dark" | "system";
export type WeekStartDay = 0 | 1;

interface ThemeState {
	mode: ThemeMode;
	colorScheme: ColorSchemeName;
	setMode: (mode: ThemeMode) => void;
	colors: ColorTheme;
	setupSystemThemeListener: (onThemeSync?: () => void) => () => void;
	weekStartDay: WeekStartDay;
	setWeekStartDay: (day: WeekStartDay) => void;
	updateSystemTheme: () => void;
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
	colorScheme: ColorSchemeName,
): boolean => mode === "dark" || (mode === "system" && colorScheme === "dark");

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			// State
			mode: "system",
			colorScheme: "light",
			weekStartDay: 1,
			colors: Colors.light,

			// Actions
			setMode: (newMode: ThemeMode) => {
				const { mode } = get();
				if (newMode === mode) return;

				const systemColorScheme = Appearance.getColorScheme();
				const newIsDarkMode = isDarkModeActive(newMode, systemColorScheme);
				set({
					mode: newMode,
					colors: newIsDarkMode ? Colors.dark : Colors.light,
					colorScheme: newMode === "system" ? systemColorScheme : newMode,
				});
			},
			setWeekStartDay: (day: WeekStartDay) => {
				set({ weekStartDay: day });
			},
			updateSystemTheme: () => {
				const { mode, colorScheme } = get();
				if (mode !== "system") return;
				const currentSystemTheme = Appearance.getColorScheme();

				if (currentSystemTheme && currentSystemTheme !== colorScheme) {
					set({
						colorScheme: currentSystemTheme,
						colors: isDarkModeActive(mode, currentSystemTheme)
							? Colors.dark
							: Colors.light,
					});
				}
			},
			// Setup listeners for system theme changes
			setupSystemThemeListener: (onThemeSync?: () => void) => {
				// Handle app state changes
				const subscription = AppState.addEventListener(
					"change",
					(nextAppState: AppStateStatus) => {
						if (nextAppState === "active") {
							get().updateSystemTheme();

							// Call optional onThemeSync callback
							onThemeSync?.();
						}
					},
				);

				// Return cleanup function
				return () => {
					subscription.remove();
				};
			},
		}),
		{
			name: "theme-storage",
			storage: createJSONStorage(() => mmkvStorage),
			partialize: (state) => ({
				mode: state.mode,
				weekStartDay: state.weekStartDay,
			}),
		},
	),
);
