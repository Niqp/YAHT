import { Habit, HabitMap } from "../types/habit";
import { getCurrentDateStamp, getDayjs, getDateStamp, getCurrentDateDayjs, shouldShowHabitOnDate } from "./date";

/**
 * Calculate overall statistics across all habits
 */
export const calculateOverallStats = (habitsMap: HabitMap) => {
  const habits = Object.values(habitsMap);
  const today = getCurrentDateStamp();

  // Count habits completed today
  const completedToday = habits.filter((habit) => habit.completionHistory[today]?.isCompleted).length;

  // Calculate completion rate for the last 7 days
  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = getCurrentDateDayjs().subtract(i, "day");
    last7Days.push(getDateStamp(date));
  }

  let totalPossible = 0;
  let totalCompleted = 0;

  habits.forEach((habit) => {
    last7Days.forEach((date) => {
      if (shouldShowHabitOnDate(habit, date)) {
        totalPossible++;
        if (habit.completionHistory[date]?.isCompleted) {
          totalCompleted++;
        }
      }
    });
  });

  const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Calculate current streak and best streak
  let currentStreak = 0;
  let bestStreak = 0;
  let streakCount = 0;

  if (habits.length > 0) {
    // Sort dates in descending order (newest first)
    const allDates = Object.keys(habits[0]?.completionHistory ?? {}).sort((a, b) =>
      getDayjs(b).isAfter(getDayjs(a)) ? 1 : -1
    );

    for (const date of allDates) {
      // Check if any habit was completed on this date
      const anyCompleted = habits.some((habit) => habit.completionHistory[date]?.isCompleted);

      if (anyCompleted) {
        streakCount++;
        if (streakCount > bestStreak) {
          bestStreak = streakCount;
        }
      } else {
        if (streakCount > 0 && currentStreak === 0) {
          currentStreak = streakCount;
        }
        streakCount = 0;
      }
    }

    // If we never broke the streak, set current streak
    if (currentStreak === 0 && streakCount > 0) {
      currentStreak = streakCount;
    }
  }

  return {
    totalHabits: habits.length,
    completedToday,
    completionRate,
    currentStreak,
    bestStreak,
  };
};

/**
 * Calculate habit-specific stats based on habit type
 */
export const calculateHabitStats = (habit: Habit) => {
  const completionHistory = habit.completionHistory;
  const completionDates = Object.keys(completionHistory);

  if (completionDates.length === 0) {
    // Default stats when no data is available
    return {
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
    };
  }

  // Sort dates from newest to oldest
  const sortedDates = completionDates.sort((a, b) => (getDayjs(b).isAfter(getDayjs(a)) ? 1 : -1));

  // Stats for all habit types
  const totalCompletions = completionDates.filter((date) => completionHistory[date]?.isCompleted).length;

  const lastCompletionDate =
    completionDates
      .filter((date) => completionHistory[date]?.isCompleted)
      .sort((a, b) => (getDayjs(b).isAfter(getDayjs(a)) ? 1 : -1))[0] || "";

  // Calculate streaks for this specific habit
  let currentStreak = 0;
  let bestStreak = 0;
  let streakCount = 0;

  for (const date of sortedDates) {
    if (completionHistory[date]?.isCompleted) {
      streakCount++;
      if (streakCount > bestStreak) {
        bestStreak = streakCount;
      }
    } else {
      if (streakCount > 0 && currentStreak === 0) {
        currentStreak = streakCount;
      }
      streakCount = 0;
    }
  }

  // If streak is ongoing, set current streak
  if (currentStreak === 0 && streakCount > 0) {
    currentStreak = streakCount;
  }

  // Completion rate for all dates with history
  const completionRate = Math.round((totalCompletions / completionDates.length) * 100);

  // Calculate completion since creation
  const creationDate = getDayjs(habit.createdAt);
  const today = getCurrentDateDayjs();
  // Calculate total days since creation (including today)
  const totalDays = Math.max(1, Math.floor(today.diff(creationDate, "day")) + 1);
  // Count completed days
  const completedDays = Object.values(completionHistory).filter((entry) => entry.isCompleted).length;
  // Calculate percentage - ensure value is between 0-100
  const completionSinceCreation = Math.min(100, Math.max(0, Math.round((completedDays / totalDays) * 100)));

  const result = {
    // Simple habit stats (defaults)
    completionRate,
    currentStreak,
    bestStreak,
    totalCompletions,
    lastCompletionDate,
    completionSinceCreation,

    // Repetition habit stats (defaults)
    averageRepetitions: 0,
    bestRepetitions: 0,
    goalAchievementRate: 0,
    totalRepetitions: 0,

    // Timed habit stats (defaults)
    totalTimeSpent: 0,
    averageTimePerSession: 0,
    longestSession: 0,
  };

  // Additional stats for repetition habits
  if (habit.completion.type === "repetitions") {
    const values = completionDates
      .filter((date) => completionHistory[date]?.value !== undefined)
      .map((date) => completionHistory[date]?.value as number);

    if (values.length > 0) {
      const totalRepetitions = values.reduce((sum, val) => sum + val, 0);
      const averageRepetitions = Math.round((totalRepetitions / values.length) * 10) / 10;
      const bestRepetitions = Math.max(...values);

      // Calculate how often the goal was reached
      const goalReachedCount = completionDates.filter(
        (date) => (completionHistory[date]?.value || 0) >= (habit.completion.goal || 0)
      ).length;

      const goalAchievementRate = Math.round((goalReachedCount / completionDates.length) * 100);

      Object.assign(result, {
        averageRepetitions,
        bestRepetitions,
        goalAchievementRate,
        totalRepetitions,
      });
    }
  }

  // Additional stats for timed habits
  if (habit.completion.type === "timed") {
    const values = completionDates
      .filter((date) => completionHistory[date]?.value !== undefined)
      .map((date) => completionHistory[date]?.value as number);

    if (values.length > 0) {
      const totalTimeSpent = values.reduce((sum, val) => sum + val, 0);
      const averageTimePerSession = Math.round(totalTimeSpent / values.length);
      const longestSession = Math.max(...values);

      // Calculate how often the goal was reached
      const goalReachedCount = completionDates.filter(
        (date) => (completionHistory[date]?.value || 0) >= (habit.completion.goal || 0)
      ).length;

      const goalAchievementRate = Math.round((goalReachedCount / completionDates.length) * 100);

      Object.assign(result, {
        totalTimeSpent,
        averageTimePerSession,
        longestSession,
        goalAchievementRate,
      });
    }
  }

  return result;
};

/**
 * Generate chart data based on habit type
 */
export const generateChartData = (habit: Habit) => {
  // Get the last 7 days for all habit types
  const last7Days = [];

  for (let i = 6; i >= 0; i--) {
    const date = getCurrentDateDayjs().subtract(i, "day");
    last7Days.push(getDateStamp(date));
  }

  const last7DaysLabels = last7Days.map((date) => {
    return getDayjs(date).format("ddd"); // Short weekday name
  });

  if (habit.completion.type === "simple") {
    // For simple habits, we'll create a binary completion data
    const completionData = last7Days.map((date) => {
      const historyEntry = habit.completionHistory[date];
      return historyEntry?.isCompleted ? 1 : 0;
    });

    return {
      labels: last7DaysLabels,
      datasets: [{ data: completionData }],
    };
  } else {
    // For repetition and timed habits, prepare data for the line chart
    const values = last7Days.map((date) => {
      const historyEntry = habit.completionHistory[date];
      return historyEntry ? historyEntry.value || 0 : 0;
    });

    return {
      labels: last7DaysLabels,
      datasets: [{ data: values }],
    };
  }
};
