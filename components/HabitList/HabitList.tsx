import { useCallback, useMemo } from "react";
import {
	RefreshControl,
	SectionList,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { Habit } from "../../types/habit";
import { shouldCompleteHabitOnDate } from "../../utils/date";
import HabitItem from "../habit/HabitItem";
import styles from "./HabitList.styles";
import TaskGroupSeparator from "./TaskGroupSeparator/TaskGroupSeparator";

interface HabitListProps {
	habits: Habit[];
	selectedDate: string;
	refreshing: boolean;
	onRefresh: () => void;
	handleHabitAction: (habit: Habit) => void;
	navigateToAddHabit: () => void;
}

export default function HabitList(props: HabitListProps) {
	const {
		habits,
		selectedDate,
		refreshing,
		onRefresh,
		handleHabitAction,
		navigateToAddHabit,
	} = props;
	const { colors } = useTheme();

	// Get all valid habits for the selected date
	const filteredHabits = useMemo(() => {
		if (!habits || !selectedDate) return [];

		try {
			return habits.filter((habit: Habit) =>
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
				(habit: Habit) => !habit.completionHistory?.[selectedDate]?.completed,
			);

			// Get completed habits
			const completedHabits = filteredHabits.filter(
				(habit: Habit) => habit.completionHistory?.[selectedDate]?.completed,
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

	// Memoized render functions
	const renderHabitItem = useCallback(
		({ item }: { item: Habit }) => {
			// Safety check for null items
			if (!item) return null;

			return <HabitItem habit={item} onLongPress={handleHabitAction} />;
		},
		[handleHabitAction],
	);

	const isEmpty = useMemo(() => {
		// Check if the grouped habits array is empty
		return groupedHabits.length === 0;
	}, [groupedHabits]);

	return isEmpty ? (
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
	) : (
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
}
