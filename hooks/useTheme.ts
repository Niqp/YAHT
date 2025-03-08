import { useThemeStore } from '../store/themeStore';
import { Colors, ColorTheme } from '../constants/Colors';

/**
 * Hook to access the current theme colors and control theme settings
 */
export const useTheme = () => {
  const { 
    mode, 
    isDarkMode, 
    setMode,
    systemColorScheme,
    weekStartDay,
    setWeekStartDay
  } = useThemeStore();

  // Get the current theme colors based on isDarkMode state
  const colors: ColorTheme = isDarkMode ? Colors.dark : Colors.light;

  return {
    colors,
    isDarkMode,
    mode,
    setMode,
    systemColorScheme,
    weekStartDay,
    setWeekStartDay
  };
};