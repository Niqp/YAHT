import { useEffect, useState } from "react";
import { useHabitStore } from "../store/habitStore";
import type { Habit } from "../types/habit";
import {
	calculateHabitStats,
	calculateOverallStats,
	generateChartData,
} from "../utils/statsUtils";

export function useStats() {
	const habits = useHabitStore((state) => state.habits) || {};
	const isHydrated = useHabitStore((state) => state._hasHydrated);

	const habitArray = Object.values(habits) || [];

	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
	const [overallStats, setOverallStats] = useState({
		totalHabits: 0,
		completedToday: 0,
		completionRate: 0,
		currentStreak: 0,
		bestStreak: 0,
	});

	// Chart data state
	const [lineChartData, setLineChartData] = useState({
		labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
		datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
	});

	const [progressData, setProgressData] = useState({
		data: [0],
	});

	// Habit-specific stats state
	interface HabitStats {
		completionRate: number;
		currentStreak: number;
		bestStreak: number;
		totalCompletions: number;
		lastCompletionDate: string;
		averageRepetitions: number;
		bestRepetitions: number;
		goalAchievementRate: number;
		totalRepetitions: number;
		totalTimeSpent: number;
		averageTimePerSession: number;
		longestSession: number;
		completionSinceCreation: number;
	}

	const [habitStats, setHabitStats] = useState<HabitStats>({
		completionRate: 0,
		currentStreak: 0,
		bestStreak: 0,
		totalCompletions: 0,
		lastCompletionDate: "",
		averageRepetitions: 0,
		bestRepetitions: 0,
		goalAchievementRate: 0,
		totalRepetitions: 0,
		totalTimeSpent: 0,
		averageTimePerSession: 0,
		longestSession: 0,
		completionSinceCreation: 0,
	});

	// Initialize habits and calculate overall stats
	useEffect(() => {
		if (Object.keys(habits).length === 0) {
			return;
		}

		const stats = calculateOverallStats(habits);
		setOverallStats(stats);

		// Ensure selectedHabit is always valid
		setSelectedHabit((selectedHabit) => {
			const validHabit =
			selectedHabit && habits[selectedHabit.id];
			return validHabit || Object.values(habits)[0]; // Select first habit if previous is invalid
		});
	}, [habits]);

	// Update charts and stats when selected habit changes
	useEffect(() => {
		if (!selectedHabit) {
			// Reset chart and stats when no habit is selected
			setLineChartData({
				labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
				datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
			});
			setHabitStats({
				completionRate: 0,
				currentStreak: 0,
				bestStreak: 0,
				totalCompletions: 0,
				lastCompletionDate: "",
				averageRepetitions: 0,
				bestRepetitions: 0,
				goalAchievementRate: 0,
				totalRepetitions: 0,
				totalTimeSpent: 0,
				averageTimePerSession: 0,
				longestSession: 0,
				completionSinceCreation: 0,
			});
			setProgressData({ data: [0] });
			return;
		}

		const chartData = generateChartData(selectedHabit);
		setLineChartData(chartData);

		const stats = calculateHabitStats(selectedHabit);
		setHabitStats(stats);

		// Set progress data for the progress chart
		const progressValue = stats.completionSinceCreation / 100;

		setProgressData({
			data: [Math.min(1, Math.max(0, progressValue))],
		});
	}, [selectedHabit]);

	// Handle the selected habit change
	const handleSelectHabit = (habit: Habit) => {
		setSelectedHabit(habit);
	};

	return {
		habits,
		habitArray,
		isHydrated,
		selectedHabit,
		overallStats,
		lineChartData,
		progressData,
		habitStats,
		handleSelectHabit,
	};
}
