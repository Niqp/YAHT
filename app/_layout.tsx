// Import BottomSheetModalProvider from @gorhom/bottom-sheet
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useHabitStore } from "../store/habitStore";
import * as timerService from "../store/timerStore";

export default function RootLayout() {
	const { loadHabitsFromStorage } = useHabitStore();
	const { colors, updateSystemTheme, setupSystemThemeListener } = useTheme();
	const appState = useRef(AppState.currentState);

	useEffect(() => {
		updateSystemTheme();
		const unsubscribe = setupSystemThemeListener();
		return () => {
			unsubscribe(); // Cleanup the listener on unmount
		};
	}, [setupSystemThemeListener, updateSystemTheme]);

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
		};

		initializeApp();
	}, [loadHabitsFromStorage]);

	return (
		<GestureHandlerRootView
			style={{ flex: 1, backgroundColor: colors.background }}
		>
			{/* Add BottomSheetModalProvider to ensure proper rendering of bottom sheets */}
			<BottomSheetModalProvider>
				<StatusBar backgroundColor="transparent" translucent />
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
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}
