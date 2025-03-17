import { useHabitProgress } from "@/hooks/habit/useHabitProgress";
import { useHabitTimer } from "@/hooks/habit/useHabitTimer";
import { useHabitDisplay } from "@/hooks/habit/useHabitDisplay";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import type { Habit } from "@/types/habit";
import { formatTime } from "@/utils/date";
import { MoreVertical } from "lucide-react-native";
import React, { useCallback, useMemo, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import styles from "./HabitItem.styles";
import {
	HabitStatusIndicator,
	HabitSubtitle,
	RepetitionControls,
} from "./habitViewSubComponents/HabitViewSubComponents";

interface HabitItemProps {
	habit: Habit;
	onLongPress: (habit: Habit) => void;
}

export default function HabitItem({ habit, onLongPress }: HabitItemProps) {
	// Fail early if habit is undefined
	if (!habit) return null;

	const { colors } = useTheme();
	const { completeHabit, selectedDate } = useHabitStore();
	const scaleAnim = useRef(new Animated.Value(1)).current;

	// Get completion status data
	const isCompleted =
		habit?.completionHistory?.[selectedDate]?.completed || false;
	const completionValue = habit?.completionHistory?.[selectedDate]?.value || 0;
	const completionGoal = habit?.completion?.goal || 0;

	// // Use extracted hooks
	// const {
	// 	timerActive,
	// 	getTotalElapsedTime,
	// 	startTimer,
	// 	pauseTimer,
	// 	resetTimer,
	// } = habit?.completion?.type === "timed"
	// 	? useHabitTimer(habit.id, completionGoal, selectedDate)
	// 	: {}
	const {
		timerActive,
		getTotalElapsedTime,
		startTimer,
		pauseTimer,
		resetTimer,
	} = useHabitTimer(habit.id, completionGoal, selectedDate)

	const progress = useHabitProgress({
		habit,
		isCompleted,
		completionValue,
		completionGoal,
		timerActive,
		getTotalElapsedTime,
	});

	const progressBarWidth = `${progress}%`;

	const { getSubtitleText } = useHabitDisplay({
		habit,
		isCompleted,
		completionValue,
		completionGoal,
		timerActive,
		getTotalElapsedTime,
	});

	// Handle main press action with animation
	const handlePress = () => {
		// Animate the press
		Animated.sequence([
			Animated.timing(scaleAnim, {
				toValue: 0.97,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();

		if (habit?.completion?.type === "simple") {
			// For simple habits, toggle completion
			completeHabit(habit.id, undefined, !isCompleted);
		} else if (habit?.completion?.type === "timed") {
			if (isCompleted) {
				resetTimer();
			} else if (!timerActive) {
				startTimer();
			} else {
				pauseTimer();
			}
		} else if (habit?.completion?.type === "repetitions") {
			handleIncrement();
		}
	};

	// Handle increment for repetition habits
	const handleIncrement = () => {
		const newValue = (completionValue || 0) + 1;
		const shouldComplete = newValue >= completionGoal;
		completeHabit(habit.id, newValue, shouldComplete);
	};

	// Handle decrement for repetition habits
	const handleDecrement = () => {
		if (completionValue <= 0) return;
		const newValue = Math.max(0, (completionValue || 0) - 1);
		const shouldComplete = newValue >= completionGoal;
		completeHabit(habit.id, newValue, shouldComplete);
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					backgroundColor: colors.habitBackground,
					borderColor: colors.border,
					transform: [{ scale: scaleAnim }],
				},
				isCompleted && { backgroundColor: colors.habitCompleted },
			]}
		>
			{/* Progress indicator */}
			<View
				style={[
					styles.progressBar,
					{
						width: Number(progressBarWidth),
						backgroundColor: isCompleted ? colors.success : colors.primary,
						opacity: 0.15,
					},
				]}
			/>

			<TouchableOpacity
				style={styles.mainContent}
				onPress={
					habit?.completion?.type !== "repetitions" ? handlePress : undefined
				}
				onLongPress={() => onLongPress(habit)}
				activeOpacity={0.7}
				disabled={habit?.completion?.type === "repetitions"}
			>
				{/* Left section - Icon */}
				<View style={[styles.iconContainer, { backgroundColor: colors.input }]}>
					<Text style={styles.iconText}>{habit.icon}</Text>
				</View>

				{/* Middle section - Title and Subtitle */}
				<View style={styles.infoContainer}>
					<Text
						style={[styles.title, { color: colors.text }]}
						numberOfLines={1}
						ellipsizeMode="tail"
					>
						{habit.title}
					</Text>
					{habit?.completion?.type !== "simple" && (
						<HabitSubtitle
							habit={habit}
							isCompleted={isCompleted}
							timerActive={timerActive}
							getSubtitleText={getSubtitleText}
							colors={colors}
						/>
					)}
				</View>

				{/* Right section - Action buttons or completion indicator */}
				<View style={styles.actionButtons}>
					{habit?.completion?.type === "repetitions" ? (
						<RepetitionControls
							completionValue={completionValue}
							handleIncrement={handleIncrement}
							handleDecrement={handleDecrement}
							colors={colors}
						/>
					) : (
						<HabitStatusIndicator
							isCompleted={isCompleted}
							timerActive={timerActive}
							completionType={habit?.completion?.type}
							colors={colors}
						/>
					)}
				</View>
			</TouchableOpacity>

			{/* More options button */}
			<TouchableOpacity
				style={styles.moreButton}
				onPress={() => onLongPress(habit)}
			>
				<MoreVertical size={20} color={colors.textSecondary} />
			</TouchableOpacity>
		</Animated.View>
	);
}
