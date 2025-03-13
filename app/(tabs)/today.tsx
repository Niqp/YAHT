import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { CheckCircle, Circle, Plus } from "lucide-react-native";
import React, { useState, useCallback, useMemo } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import DateSlider from "../../components/DateSlider";
import HabitItem from "../../components/HabitItem";
import HabitBottomSheet from "../../components/habit/HabitBottomSheet/HabitBottomSheet";
import { useTheme } from "../../hooks/useTheme";
import { useHabitStore } from "../../store/habitStore";
import type { Habit } from "../../types/habit";
import { shouldCompleteHabitOnDate } from "../../utils/date";

// Custom separator component for task groups
const TaskGroupSeparator = React.memo(
	({
		title,
		completed,
		count,
		colors,
	}: {
		title: string;
		completed: boolean;
		count: number;
		colors: {
			background: string;
			text: string;
			textSecondary: string;
			divider: string;
			success: string;
		};
	}) => {
		return (
			<View
				style={[styles.sectionHeader, { backgroundColor: colors.background }]}
			>
				<View
					style={[
						styles.sectionIconContainer,
						{ backgroundColor: completed ? colors.success : colors.divider },
					]}
				>
					{completed ? (
						<CheckCircle size={16} color="#fff" />
					) : (
						<Circle size={16} color={colors.textSecondary} />
					)}
				</View>
				<Text style={[styles.sectionTitle, { color: colors.text }]}>
					{title} • {count}
				</Text>
			</View>
		);
	},
);

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

	// Get all valid habits for the selected date
	const filteredHabits = useMemo(() => {
		if (!habits || !selectedDate) return [];

		try {
			return habits.filter((habit) =>
				shouldCompleteHabitOnDate(habit, selectedDate),
			);
		} catch (error) {
			console.error("Error filtering habits:", error);
			return [];
		}
	}, [habits, selectedDate]);

	// Group habits by completion status - swapped To Do and Completed order
	const groupedHabits = useMemo(() => {
		// Safely handle potentially undefined or empty filteredHabits
		if (!filteredHabits || filteredHabits.length === 0) return [];

		try {
			// Get incomplete habits
			const incompleteHabits = filteredHabits.filter(
				(habit) => !habit.completionHistory?.[selectedDate]?.completed,
			);

			// Get completed habits
			const completedHabits = filteredHabits.filter(
				(habit) => habit.completionHistory?.[selectedDate]?.completed,
			);

			// Create sections for SectionList - To Do first, then Completed
			const sections = [];

			// Add incomplete section if there are incomplete habits
			if (incompleteHabits.length > 0) {
				sections.push({
					title: "To Do",
					data: incompleteHabits,
					completed: false,
				});
			}

			// Add completed section if there are completed habits
			if (completedHabits.length > 0) {
				sections.push({
					title: "Completed",
					data: completedHabits,
					completed: true,
				});
			}

			return sections;
		} catch (error) {
			console.error("Error grouping habits:", error);
			return [];
		}
	}, [filteredHabits, selectedDate]);

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

	const handleHabitAction = useCallback((habit: Habit) => {
		setSelectedHabit(habit);
		setIsBottomSheetOpen(true);
	}, []);

	const closeBottomSheet = useCallback(() => {
		setIsBottomSheetOpen(false);
		setSelectedHabit(null);
	}, []);

	const navigateToAddHabit = useCallback(() => {
		router.push("/add");
	}, []);

	// Memoized render functions
	const renderHabitItem = useCallback(
		({ item }: { item: Habit }) => {
			// Safety check for null items
			if (!item) return null;

			return <HabitItem habit={item} onLongPress={handleHabitAction} />;
		},
		[handleHabitAction],
	);

	const renderSectionHeader = useCallback(
		({
			section,
		}: { section: { title: string; completed: boolean; data: Habit[] } }) => (
			<TaskGroupSeparator
				title={section.title}
				completed={section.completed}
				count={section.data.length}
				colors={colors}
			/>
		),
		[colors],
	);

	const keyExtractor = useCallback(
		(item: Habit) => item?.id || Math.random().toString(),
		[],
	);

	// Create UI elements
	const loadingView = (
		<View
			style={[styles.loadingContainer, { backgroundColor: colors.background }]}
		>
			<ActivityIndicator size="large" color={colors.primary} />
		</View>
	);

	const emptyView = (
		<View style={styles.emptyContainer}>
			<Text style={[styles.emptyText, { color: colors.textTertiary }]}>
				No habits for this day
			</Text>
			<TouchableOpacity
				style={[styles.addHabitButton, { backgroundColor: colors.primary }]}
				onPress={navigateToAddHabit}
			>
				<Text
					style={[styles.addHabitButtonText, { color: colors.textInverse }]}
				>
					Add a habit
				</Text>
			</TouchableOpacity>
		</View>
	);

	const habitListView = (
		<View style={styles.listWrapper}>
			<SectionList
				sections={groupedHabits}
				keyExtractor={keyExtractor}
				renderItem={renderHabitItem}
				renderSectionHeader={renderSectionHeader}
				stickySectionHeadersEnabled={false}
				ItemSeparatorComponent={() => <View style={{ height: 7 }} />}
				contentContainerStyle={styles.habitList}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={colors.primary}
					/>
				}
				SectionSeparatorComponent={() => <View style={{ height: 20 }} />}
				ListHeaderComponent={() => <View style={{ height: 10 }} />}
				ListFooterComponent={() => <View style={{ height: 80 }} />}
				showsVerticalScrollIndicator={false}
				initialNumToRender={20}
				maxToRenderPerBatch={10}
				windowSize={10}
			/>
		</View>
	);

	const floatingButton = (
		<TouchableOpacity
			style={[styles.floatingButton, { backgroundColor: colors.primary }]}
			onPress={navigateToAddHabit}
			activeOpacity={0.8}
		>
			<Plus size={24} color={colors.textInverse} />
		</TouchableOpacity>
	);

	const bottomSheet = (
		<HabitBottomSheet
			habit={selectedHabit}
			onClose={closeBottomSheet}
			isOpen={isBottomSheetOpen}
		/>
	);

	// Main render - avoid conditional returns that change the hook call order
	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<DateSlider />

			{isLoading ? (
				loadingView
			) : (
				<>
					{!filteredHabits || filteredHabits.length === 0
						? emptyView
						: habitListView}
					{floatingButton}
					{bottomSheet}
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
	listWrapper: {
		flex: 1,
	},
	habitList: {
		padding: 0,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 30,
	},
	emptyText: {
		fontSize: 16,
		marginBottom: 20,
	},
	addHabitButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	addHabitButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	floatingButton: {
		position: "absolute",
		bottom: 20,
		right: 20,
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
		elevation: 5,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		zIndex: 999,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 16,
		marginBottom: 7,
	},
	sectionIconContainer: {
		width: 26,
		height: 26,
		borderRadius: 13,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: "600",
	},
});
