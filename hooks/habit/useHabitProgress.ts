import { useMemo } from "react";

export function useHabitProgress({
	habit,
	isCompleted,
	completionValue,
	completionGoal,
	timerActive,
	getTotalElapsedTime,
}) {
	// Progress calculation for visual indicator
	const progress = useMemo(() => {
		if (!habit) return 0;

		if (habit.completionType === "simple") {
			return isCompleted ? 1 : 0;
		}
		if (habit.completionType === "timed" && timerActive) {
			// For active timers, use the real-time elapsed time
			const currentValue = getTotalElapsedTime();
			const goal = completionGoal || 1; // Prevent division by zero
			return Math.min(1, currentValue / goal);
		}
		// For paused timers or repetition habits, use the stored value
		const value = completionValue || 0;
		const goal = completionGoal || 1; // Prevent division by zero
		return Math.min(1, value / goal);
	}, [
		habit,
		isCompleted,
		completionValue,
		completionGoal,
		timerActive,
		getTotalElapsedTime,
	]);

	// Calculate the width of the progress bar
	const currentProgress =
		habit?.completionType === "timed" && timerActive
			? Math.min(1, getTotalElapsedTime() / (completionGoal || 1))
			: progress;

	const progressBarWidth = `${Math.round(currentProgress * 100)}%`;

	return { progress, progressBarWidth };
}
