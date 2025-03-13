import { Stack } from "expo-router";
import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../context/ThemeContext";
import { useTheme } from "../hooks/useTheme";
import { useHabitStore } from "../store/habitStore";
import * as timerService from "../store/timerStore";
// Import BottomSheetModalProvider from @gorhom/bottom-sheet
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function RootLayout() {
	const { loadHabitsFromStorage, syncActiveTimers, restoreActiveTimers } =
		useHabitStore();
	const { colors } = useTheme();
	const appState = useRef(AppState.currentState);

	// Configure notifications when app starts
	useEffect(() => {
		timerService.configureNotifications().then((success) => {
			if (success) {
				console.log("Notifications configured successfully");
			} else {
				console.log("Notification permissions not granted");
			}
		});
	}, []);

	// Load habits and restore active timers when app starts
	useEffect(() => {
		const initializeApp = async () => {
			// First load habits from storage
			await loadHabitsFromStorage();

			// Then restore any active timers
			await restoreActiveTimers();
		};

		initializeApp();
	}, [loadHabitsFromStorage, restoreActiveTimers]);

	// Handle app state changes (foreground, background)
	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (
				appState.current === "active" &&
				nextAppState.match(/inactive|background/)
			) {
				// App is going to background
				console.log("App going to background, saving timestamp");
				timerService.saveBackgroundTimestamp(Date.now());
			} else if (
				appState.current.match(/inactive|background/) &&
				nextAppState === "active"
			) {
				// App coming to foreground
				console.log("App coming to foreground, syncing timers");
				syncActiveTimers();
			}

			appState.current = nextAppState;
		};

		// Subscribe to app state changes
		const subscription = AppState.addEventListener(
			"change",
			handleAppStateChange,
		);

		return () => {
			subscription.remove();
		};
	}, [syncActiveTimers]);

	return (
		<GestureHandlerRootView
			style={{ flex: 1, backgroundColor: colors.background }}
		>
			{/* Add BottomSheetModalProvider to ensure proper rendering of bottom sheets */}
			<BottomSheetModalProvider>
				<ThemeProvider>
					<SafeAreaProvider>
						<Stack
							screenOptions={{
								headerStyle: {
									backgroundColor: colors.cardBackground,
								},
								headerTintColor: colors.text,
								headerTitleStyle: {
									color: colors.text,
								},
								contentStyle: {
									backgroundColor: colors.background,
								},
							}}
						>
							<Stack.Screen name="index" redirect={true} />
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen
								name="add"
								options={{
									presentation: "modal",
									headerShown: false,
								}}
							/>
						</Stack>
					</SafeAreaProvider>
				</ThemeProvider>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}
