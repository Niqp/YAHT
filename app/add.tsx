import {
	BasicInfoSection,
	CompletionTypeSection,
	RepetitionPatternSection,
} from "@/components/habitForm";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import type { CompletionType, RepetitionType } from "@/types/habit";
import { Button } from "@rneui/themed";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddEditHabitScreen() {
	const { colors, weekStartDay } = useTheme();
	const params = useLocalSearchParams();
	const habitId = params.habitId as string | undefined;
	const { addHabit, updateHabit, deleteHabit, getHabitById } = useHabitStore();

	const [title, setTitle] = useState("");
	const [icon, setIcon] = useState("🌟");
	const [repetitionType, setRepetitionType] = useState<RepetitionType>("daily");
	const [selectedDays, setSelectedDays] = useState<number[]>([]);
	const [customDays, setCustomDays] = useState<number>(1);
	const [completionType, setCompletionType] =
		useState<CompletionType>("simple");
	const [completionGoal, setCompletionGoal] = useState<number>(5);
	const [isEditMode, setIsEditMode] = useState(false);

	useEffect(() => {
		if (habitId) {
			const habit = getHabitById(habitId);
			if (habit) {
				setTitle(habit.title);
				setIcon(habit.icon);
				setRepetitionType(habit.repetitionType);

				if (
					habit.repetitionType === "weekly" &&
					Array.isArray(habit.repetitionValue)
				) {
					setSelectedDays(habit.repetitionValue);
				} else if (
					habit.repetitionType === "custom" &&
					typeof habit.repetitionValue === "number"
				) {
					setCustomDays(habit.repetitionValue);
				}

				setCompletionType(habit.completionType);
				if (habit.completionGoal) {
					setCompletionGoal(habit.completionGoal);
				}

				setIsEditMode(true);
			}
		}
	}, [habitId, getHabitById]);

	const handleSave = () => {
		if (!title.trim()) {
			Alert.alert("Error", "Please enter a title for your habit");
			return;
		}

		let repetitionValue: number[] | number | null;
		if (repetitionType === "weekly") {
			if (selectedDays.length === 0) {
				Alert.alert("Error", "Please select at least one day of the week");
				return;
			}
			repetitionValue = selectedDays;
		} else if (repetitionType === "custom") {
			repetitionValue = customDays;
		} else {
			repetitionValue = null;
		}

		const habitData = {
			title,
			icon,
			repetitionType,
			repetitionValue,
			completionType,
			completionGoal: completionType !== "simple" ? completionGoal : undefined,
		};

		if (isEditMode && habitId) {
			updateHabit(habitId, habitData);
		} else {
			addHabit(habitData);
		}

		router.push("/today");
	};

	const handleDelete = () => {
		if (isEditMode && habitId) {
			Alert.alert(
				"Delete Habit",
				"Are you sure you want to delete this habit? This action cannot be undone.",
				[
					{
						text: "Cancel",
						style: "cancel",
					},
					{
						text: "Delete",
						style: "destructive",
						onPress: () => {
							deleteHabit(habitId);
							router.push("/today");
						},
					},
				],
			);
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<Stack.Screen
				options={{
					title: isEditMode ? "Edit Habit" : "Add New Habit",
					headerStyle: {
						backgroundColor: colors.cardBackground,
					},
					headerTitleStyle: {
						fontWeight: "bold",
						fontSize: 18,
						color: colors.text,
					},
					headerTintColor: colors.text,
				}}
			/>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={{ flex: 1 }}
			>
				<ScrollView style={styles.scrollContainer}>
					<BasicInfoSection
						title={title}
						setTitle={setTitle}
						icon={icon}
						setIcon={setIcon}
					/>

					<RepetitionPatternSection
						repetitionType={repetitionType}
						setRepetitionType={setRepetitionType}
						selectedDays={selectedDays}
						setSelectedDays={setSelectedDays}
						customDays={customDays}
						setCustomDays={setCustomDays}
						weekStartDay={weekStartDay}
					/>

					<CompletionTypeSection
						completionType={completionType}
						setCompletionType={setCompletionType}
						completionGoal={completionGoal}
						setCompletionGoal={setCompletionGoal}
						isEditMode={isEditMode}
					/>

					<View style={styles.buttonsContainer}>
						<Button
							title={isEditMode ? "Update Habit" : "Add Habit"}
							buttonStyle={[
								styles.saveButton,
								{ backgroundColor: colors.primary },
							]}
							titleStyle={[styles.buttonText, { color: colors.textInverse }]}
							onPress={handleSave}
						/>
						{isEditMode && (
							<Button
								title="Delete"
								buttonStyle={[
									styles.deleteButton,
									{ backgroundColor: colors.error },
								]}
								titleStyle={styles.buttonText}
								onPress={handleDelete}
							/>
						)}
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContainer: {
		flex: 1,
		padding: 20,
	},
	buttonsContainer: {
		marginBottom: 30,
	},
	saveButton: {
		borderRadius: 8,
		paddingVertical: 15,
		marginBottom: 15,
	},
	deleteButton: {
		borderRadius: 8,
		paddingVertical: 15,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "bold",
	},
});
