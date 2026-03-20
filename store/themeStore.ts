import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type ColorThemeName } from "../constants/Colors";
import { mmkvStorage } from "../utils/storage";

export type ThemeMode = "light" | "dark" | "system";
export type WeekStartDay = 0 | 1;

interface ThemeState {
  mode: ThemeMode;
  colorTheme: ColorThemeName;
  weekStartDay: WeekStartDay;
  setMode: (mode: ThemeMode) => void;
  setColorTheme: (theme: ColorThemeName) => void;
  setWeekStartDay: (day: WeekStartDay) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // State
      mode: "system",
      colorTheme: "sepia",
      weekStartDay: 1,

      // Actions
      setMode: (mode: ThemeMode) => {
        if (mode === get().mode) return;
        set({ mode });
      },
      setColorTheme: (colorTheme: ColorThemeName) => {
        if (colorTheme === get().colorTheme) return;
        set({ colorTheme });
      },
      setWeekStartDay: (day: WeekStartDay) => {
        set({ weekStartDay: day });
      },
    }),
    {
      name: "theme-storage",
      storage: mmkvStorage,
    }
  )
);
