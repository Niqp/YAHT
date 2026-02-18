import type { ColorSchemeName } from "react-native";
import { AppState, type AppStateStatus } from "react-native";
import { Appearance } from "react-native";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ColorTheme, Colors } from "../constants/Colors";
import { mmkvStorage } from "../utils/storage";

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

// Helper function to determine dark mode state
const isDarkModeActive = (mode: ThemeMode, colorScheme: ColorSchemeName): boolean =>
  mode === "dark" || (mode === "system" && colorScheme === "dark");

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
            colors: isDarkModeActive(mode, currentSystemTheme) ? Colors.dark : Colors.light,
          });
        }
      },
      // Setup listeners for system theme changes
      setupSystemThemeListener: (onThemeSync?: () => void) => {
        // Handle app state changes
        const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
          if (nextAppState === "active") {
            get().updateSystemTheme();

            // Call optional onThemeSync callback
            onThemeSync?.();
          }
        });

        // Return cleanup function
        return () => {
          subscription.remove();
        };
      },
    }),
    {
      name: "theme-storage",
      storage: mmkvStorage,
      partialize: (state) => ({
        mode: state.mode,
        weekStartDay: state.weekStartDay,
      }),
    }
  )
);
