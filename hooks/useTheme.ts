import { useThemeStore } from "../store/themeStore";

export const useTheme = () => {
  const {
    mode,
    colors,
    colorScheme,
    colorTheme,
    weekStartDay,
    setMode,
    setColorTheme,
    setWeekStartDay,
    setupSystemThemeListener,
    updateSystemTheme,
  } = useThemeStore();

  const isDarkMode = colorScheme === "dark";

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
    setupSystemThemeListener,
    updateSystemTheme,
  };
};
