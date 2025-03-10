import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "../context/ThemeContext";
import { useTheme } from "../hooks/useTheme";
import { useHabitStore } from "../store/habitStore";

export default function RootLayout() {
	const { loadHabitsFromStorage, syncActiveTimers } = useHabitStore();
	const { colors } = useTheme();

	// Load habits from storage when the app starts
	useEffect(() => {
		loadHabitsFromStorage();
	}, []);

	return (
		<GestureHandlerRootView
			style={{ flex: 1, backgroundColor: colors.background }}
		>
			<ThemeProvider onThemeSync={syncActiveTimers}>
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
		</GestureHandlerRootView>
	);
}
