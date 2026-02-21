import { useMemo } from "react";
import { useHabitStore } from "@/store/habitStore";
import { shouldShowHabitOnDate, getCurrentDateDayjs, getDateStamp } from "@/utils/date";

/**
 * Calculates the current "all-habits" streak: consecutive days (ending yesterday)
 * where every scheduled habit was completed.
 *
 * Today is excluded because it may still be in progress.
 * Only habits that were scheduled for a given date (via their repetition config)
 * are considered for that date.
 *
 * Returns 0 when there are no habits or no perfect days.
 */
export function useAllHabitsStreak(): number {
    const habits = useHabitStore((state) => state.habits);

    return useMemo(() => {
        const habitList = Object.values(habits);
        if (habitList.length === 0) return 0;

        let streak = 0;
        const now = getCurrentDateDayjs();

        // Walk backward from yesterday
        for (let i = 1; i <= 365; i++) {
            const date = now.subtract(i, "day");
            const dateStamp = getDateStamp(date);

            // Find habits that were scheduled for this date
            const scheduledHabits = habitList.filter((habit) => {
                // Skip habits created after this date
                if (habit.createdAt > dateStamp) return false;
                return shouldShowHabitOnDate(habit, dateStamp);
            });

            // If no habits were scheduled, skip this day (don't break the streak)
            if (scheduledHabits.length === 0) continue;

            // Check if ALL scheduled habits were completed
            const allCompleted = scheduledHabits.every(
                (habit) => habit.completionHistory[dateStamp]?.isCompleted
            );

            if (allCompleted) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }, [habits]);
}
