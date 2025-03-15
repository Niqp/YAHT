import React, { useCallback } from "react";
import { useTheme } from "@/hooks/useTheme";
import { formatTime } from "@/utils/date";

export function useHabitDisplay({
    habit,
    isCompleted,
    completionValue,
    completionGoal,
    timerActive,
    getTotalElapsedTime,
}) {
    const { colors } = useTheme();

    // Format the time for display
    const getDisplayTime = useCallback(() => {
        return formatTime(getTotalElapsedTime());
    }, [getTotalElapsedTime]);

    // Generate subtitle text based on habit type
    const getSubtitleText = useCallback(() => {
        if (!habit) return "";

        switch (habit.completionType) {
            case "simple":
                return isCompleted ? "Completed" : "";
            case "repetitions":
                return `${completionValue} / ${completionGoal}`;
            case "timed":
                return `${getDisplayTime()} / ${formatTime(completionGoal)}`;
            default:
                return "";
        }
    }, [habit, isCompleted, completionValue, completionGoal, getDisplayTime]);

    return { getSubtitleText };
}