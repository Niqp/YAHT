import React, { createContext, useContext, useEffect, useRef } from "react";
import {
	AppState,
	type AppStateStatus,
	StatusBar,
	useColorScheme,
} from "react-native";
import { type ColorTheme, Colors } from "../constants/Colors";
import { useThemeStore } from "../store/themeStore";

// Import or define the WeekStartDay type to match what's used in useThemeStore
import type { WeekStartDay } from "../store/themeStore"; // Add this import if WeekStartDay is exported from themeStore

type ThemeContextType = {
	colors: ColorTheme;
	isDarkMode: boolean;
	mode: "light" | "dark" | "system";
	setMode: (mode: "light" | "dark" | "system") => void;
	weekStartDay: WeekStartDay; // Use the WeekStartDay type from the store
	setWeekStartDay: (day: WeekStartDay) => void;
};

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
	colors: Colors.light,
	isDarkMode: false,
	mode: "system",
	setMode: () => {},
	weekStartDay: 1,
	setWeekStartDay: () => {},
});

export const ThemeProvider: React.FC<{
	children: React.ReactNode;
	onThemeSync?: () => void;
}> = ({ children, onThemeSync }) => {
	const systemColorScheme = useColorScheme();
	const {
		mode,
		isDarkMode,
		setMode,
		setSystemColorScheme,
		systemColorScheme: storeSystemTheme,
		weekStartDay,
		setWeekStartDay,
	} = useThemeStore();

	// Use ref to track if we've initialized
	const initializedRef = useRef(false);

	// Get the current theme colors based on isDarkMode state
	const colors: ColorTheme = isDarkMode ? Colors.dark : Colors.light;

	// Initialize with system theme ONLY ONCE on first render
	useEffect(() => {
		if (!initializedRef.current && systemColorScheme) {
			console.log("ThemeProvider: Initial system theme:", systemColorScheme);
			setSystemColorScheme(systemColorScheme);
			initializedRef.current = true;
		}
	}, [systemColorScheme, setSystemColorScheme]);

	// Listen for system theme changes, but only update if it actually changed
	useEffect(() => {
		if (
			initializedRef.current &&
			systemColorScheme &&
			systemColorScheme !== storeSystemTheme
		) {
			console.log("ThemeProvider: System theme changed to:", systemColorScheme);
			setSystemColorScheme(systemColorScheme);
		}
	}, [systemColorScheme, setSystemColorScheme, storeSystemTheme]);

	// Listen for app state changes to catch theme changes when app comes to foreground
	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === "active") {
				// App became active (returned to foreground)

				// Handle theme changes
				if (systemColorScheme && systemColorScheme !== storeSystemTheme) {
					console.log(
						"App became active, updating system theme:",
						systemColorScheme,
					);
					setSystemColorScheme(systemColorScheme);
				}

				// Call optional onThemeSync callback
				onThemeSync?.();
			}
		};

		const subscription = AppState.addEventListener(
			"change",
			handleAppStateChange,
		);

		return () => {
			subscription.remove();
		};
	}, [systemColorScheme, setSystemColorScheme, storeSystemTheme, onThemeSync]);

	// Memoize context value to prevent unnecessary re-renders
	const contextValue = React.useMemo(
		() => ({
			colors,
			isDarkMode,
			mode,
			setMode,
			weekStartDay,
			setWeekStartDay,
		}),
		[colors, isDarkMode, mode, setMode, weekStartDay, setWeekStartDay],
	);

	return (
		<ThemeContext.Provider value={contextValue}>
			<StatusBar
				barStyle={isDarkMode ? "light-content" : "dark-content"}
				backgroundColor="transparent"
				translucent
			/>
			{children}
		</ThemeContext.Provider>
	);
};

// Custom hook for consuming the theme context
export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
