import type { ColorSchemeName } from "react-native";
import { AppState, type AppStateStatus } from "react-native";
import { Appearance } from "react-native";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ColorTheme, type ColorThemeName, Colors } from "../constants/Colors";
import { mmkvStorage } from "../utils/storage";

export type ThemeMode = "light" | "dark" | "system";
export type WeekStartDay = 0 | 1;

interface ThemeState {
  mode: ThemeMode;
  colorScheme: ColorSchemeName;
  colorTheme: ColorThemeName;
  setMode: (mode: ThemeMode) => void;
  setColorTheme: (theme: ColorThemeName) => void;
  colors: ColorTheme;
  setupSystemThemeListener: (onThemeSync?: () => void) => () => void;
  weekStartDay: WeekStartDay;
  setWeekStartDay: (day: WeekStartDay) => void;
  updateSystemTheme: () => void;
}

// Helper function to determine dark mode state
const isDarkModeActive = (mode: ThemeMode, colorScheme: ColorSchemeName): boolean =>
  mode === "dark" || (mode === "system" && colorScheme === "dark");

// Helper to resolve the full color palette from the two dimensions
const resolveColors = (colorTheme: ColorThemeName, lightness: "light" | "dark"): ColorTheme =>
  Colors[colorTheme][lightness];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // State
      mode: "system",
      colorScheme: "light",
      colorTheme: "sepia",
      weekStartDay: 1,
      colors: Colors.sepia.light,

      // Actions
      setMode: (newMode: ThemeMode) => {
        const { mode, colorTheme } = get();
        if (newMode === mode) return;

        const systemColorScheme = Appearance.getColorScheme();
        const darkActive = isDarkModeActive(newMode, systemColorScheme);
        set({
          mode: newMode,
          colors: resolveColors(colorTheme, darkActive ? "dark" : "light"),
          colorScheme: newMode === "system" ? systemColorScheme : newMode,
        });
      },
      setColorTheme: (theme: ColorThemeName) => {
        const { colorTheme, mode, colorScheme } = get();
        if (theme === colorTheme) return;

        const darkActive = isDarkModeActive(mode, colorScheme);
        set({
          colorTheme: theme,
          colors: resolveColors(theme, darkActive ? "dark" : "light"),
        });
      },
      setWeekStartDay: (day: WeekStartDay) => {
        set({ weekStartDay: day });
      },
      updateSystemTheme: () => {
        const { mode, colorScheme, colorTheme } = get();
        if (mode !== "system") return;
        const currentSystemTheme = Appearance.getColorScheme();

        if (currentSystemTheme && currentSystemTheme !== colorScheme) {
          set({
            colorScheme: currentSystemTheme,
            colors: resolveColors(colorTheme, isDarkModeActive(mode, currentSystemTheme) ? "dark" : "light"),
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
        colorTheme: state.colorTheme,
        weekStartDay: state.weekStartDay,
      }),
    }
  )
);
