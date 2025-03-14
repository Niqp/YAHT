import HabitList from "@/components/HabitList/HabitList";
import { FloatingButton } from "@/components/buttons/FloatingButton";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import DateSlider from "../../components/DateSlider";
import HabitBottomSheet from "../../components/habit/HabitBottomSheet/HabitBottomSheet";
import { useTheme } from "../../hooks/useTheme";
import { useHabitStore } from "../../store/habitStore";
import type { Habit } from "../../types/habit";

export default function TodayScreen() {
	// Always call these hooks at the top level, before any early returns
	const { colors } = useTheme();

	// Get habit store data
	const habits = useHabitStore((state) => state.habits);
	const selectedDate = useHabitStore((state) => state.selectedDate);
	const isLoading = useHabitStore((state) => state.isLoading);
	const loadHabitsFromStorage = useHabitStore(
		(state) => state.loadHabitsFromStorage,
	);

	// Local state always initialized at top-level
	const [refreshing, setRefreshing] = useState(false);
	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
	const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

	// Define callbacks
	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		try {
			await loadHabitsFromStorage();
		} catch (error) {
			console.error("Error refreshing habits:", error);
		} finally {
			// Ensure refreshing is set to false even if an error occurs
			setRefreshing(false);
		}
	}, [loadHabitsFromStorage]);

	const navigateToAddHabit = useCallback(() => {
		router.push("/add");
	}, []);

	const handleHabitAction = useCallback((habit: Habit) => {
		setSelectedHabit(habit);
		setIsBottomSheetOpen(true);
	}, []);

	const closeBottomSheet = useCallback(() => {
		setIsBottomSheetOpen(false);
		setSelectedHabit(null);
	}, []);

	// Create UI elements
	const loadingView = (
		<View
			style={[styles.loadingContainer, { backgroundColor: colors.background }]}
		>
			<ActivityIndicator size="large" color={colors.primary} />
		</View>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<DateSlider />

			{isLoading ? (
				loadingView
			) : (
				<>
					<HabitList
						habits={habits}
						selectedDate={selectedDate}
						onRefresh={onRefresh}
						refreshing={refreshing}
						handleHabitAction={handleHabitAction}
						navigateToAddHabit={navigateToAddHabit}
					/>
					<FloatingButton navigateToAddHabit={navigateToAddHabit} />
					<HabitBottomSheet
						habit={selectedHabit}
						onClose={closeBottomSheet}
						isOpen={isBottomSheetOpen}
					/>
				</>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
});
