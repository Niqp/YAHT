import { useThemeStore } from "../store/themeStore";

export const useTheme = () => {
	const {
		mode,
		colors,
		colorScheme,
		weekStartDay,
		setMode,
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
		setMode,
		weekStartDay,
		setWeekStartDay,
		setupSystemThemeListener,
		updateSystemTheme,
	};
};
