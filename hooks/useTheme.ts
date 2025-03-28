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

	return {
		colors,
		mode,
		colorScheme,
		setMode,
		weekStartDay,
		setWeekStartDay,
		setupSystemThemeListener,
		updateSystemTheme,
	};
};
