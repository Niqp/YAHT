import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { useThemeStore } from "../store/themeStore";

// Helper function to determine dark mode state
const isDarkModeActive = (
  mode: "light" | "dark" | "system",
  systemColorScheme: "light" | "dark" | null | undefined
): boolean => mode === "dark" || (mode === "system" && systemColorScheme === "dark");

export const useTheme = () => {
  const { mode, colorTheme, weekStartDay, setMode, setColorTheme, setWeekStartDay } = useThemeStore();

  const systemColorScheme = useColorScheme();
  const isDarkMode = isDarkModeActive(mode, systemColorScheme);

  const colorScheme = isDarkMode ? "dark" : "light";
  const colors = Colors[colorTheme][colorScheme];

  return {
    colors,
    isDarkMode,
    mode,
    colorScheme,
    colorTheme,
    setMode,
    setColorTheme,
    weekStartDay,
    setWeekStartDay,
  };
};
