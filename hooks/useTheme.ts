import { type ColorTheme, Colors } from "../constants/Colors";
import { useTheme as useThemeFromContext } from "../context/ThemeContext";

/**
 * Hook to access the current theme colors and control theme settings
 *
 * @returns {object} Theme object containing colors and theme control functions
 */
export const useTheme = () => useThemeFromContext();
