import type { ChartDay, Habit, HabitChartData, HabitMap, HabitStats, OverallStats } from "../types/habit";
import { getCurrentDateDayjs, getDateStamp, getDayjs, getLocalizedShortDayName, isHabitDueOnDate } from "./date";
import { getDeviceLocale } from "@/i18n/locale";

const EMPTY_HABIT_STATS: HabitStats = {
  dueDaysSinceCreation: 0,
  completedDueDays: 0,
  adherenceSinceCreation: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalCompletions: 0,
  lastCompletedDate: "",
  goalHitRate: 0,
  totalRepetitions: 0,
  totalTimeSpent: 0,
  bestDayValue: 0,
};

const asPercent = (numerator: number, denominator: number) => {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
};

const buildDateRange = (startDate: string, endDate: string) => {
  const start = getDayjs(startDate).startOf("day");
  const end = getDayjs(endDate).startOf("day");

  if (end.isBefore(start)) {
    return [] as string[];
  }

  const dates: string[] = [];
  let cursor = start;

  while (cursor.isSame(end) || cursor.isBefore(end)) {
    dates.push(getDateStamp(cursor));
    cursor = cursor.add(1, "day");
  }

  return dates;
};

const getHabitGoal = (habit: Habit) => {
  if (habit.completion.type === "simple") {
    return null;
  }

  return habit.completion.goal;
};

const getLastSevenDates = () => {
  const dates: string[] = [];

  for (let i = 6; i >= 0; i--) {
    dates.push(getDateStamp(getCurrentDateDayjs().subtract(i, "day")));
  }

  return dates;
};

const getDueDates = (habit: Habit, startDate: string, endDate: string) =>
  buildDateRange(startDate, endDate).filter((date) => isHabitDueOnDate(habit, date));

/**
 * Calculate overall statistics across all habits
 */
export const calculateOverallStats = (habitsMap: HabitMap): OverallStats => {
  const habits = Object.values(habitsMap);
  const today = getDateStamp(getCurrentDateDayjs());
  const lastSevenDates = getLastSevenDates();

  const dueToday = habits.filter((habit) => isHabitDueOnDate(habit, today)).length;
  const completedToday = habits.filter(
    (habit) => isHabitDueOnDate(habit, today) && habit.completionHistory[today]?.isCompleted
  ).length;

  let dueInLastSevenDays = 0;
  let completedInLastSevenDays = 0;
  let dueAllTime = 0;
  let completedAllTime = 0;

  habits.forEach((habit) => {
    lastSevenDates.forEach((date) => {
      if (!isHabitDueOnDate(habit, date)) {
        return;
      }

      dueInLastSevenDays += 1;

      if (habit.completionHistory[date]?.isCompleted) {
        completedInLastSevenDays += 1;
      }
    });

    getDueDates(habit, habit.createdAt, today).forEach((date) => {
      dueAllTime += 1;

      if (habit.completionHistory[date]?.isCompleted) {
        completedAllTime += 1;
      }
    });
  });

  return {
    activeHabits: habits.length,
    dueToday,
    completedToday,
    todayAdherence: asPercent(completedToday, dueToday),
    dueLast7Days: dueInLastSevenDays,
    completedLast7Days: completedInLastSevenDays,
    last7DayAdherence: asPercent(completedInLastSevenDays, dueInLastSevenDays),
    dueAllTime,
    completedAllTime,
    allTimeAdherence: asPercent(completedAllTime, dueAllTime),
  };
};

/**
 * Calculate habit-specific stats based on schedule-aware due days.
 */
export const calculateHabitStats = (habit: Habit): HabitStats => {
  const today = getDateStamp(getCurrentDateDayjs());
  const dueDates = getDueDates(habit, habit.createdAt, today);
  const completionEntries = Object.entries(habit.completionHistory);
  const completedDates = completionEntries
    .filter(([, entry]) => entry.isCompleted)
    .map(([date]) => date)
    .sort();
  const values = completionEntries
    .map(([, entry]) => entry.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (dueDates.length === 0 && completedDates.length === 0 && values.length === 0) {
    return EMPTY_HABIT_STATS;
  }

  const dueDaysSinceCreation = dueDates.length;
  const completedDueDays = dueDates.filter((date) => habit.completionHistory[date]?.isCompleted).length;
  const totalCompletions = completedDates.length;

  let bestStreak = 0;
  let runningStreak = 0;
  for (const date of dueDates) {
    if (habit.completionHistory[date]?.isCompleted) {
      runningStreak += 1;
      bestStreak = Math.max(bestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  let currentStreak = 0;
  for (let i = dueDates.length - 1; i >= 0; i--) {
    if (!habit.completionHistory[dueDates[i]]?.isCompleted) {
      break;
    }

    currentStreak += 1;
  }

  const result: HabitStats = {
    ...EMPTY_HABIT_STATS,
    dueDaysSinceCreation,
    completedDueDays,
    adherenceSinceCreation: asPercent(completedDueDays, dueDaysSinceCreation),
    currentStreak,
    bestStreak,
    totalCompletions,
    lastCompletedDate: completedDates.at(-1) ?? "",
    bestDayValue: values.length > 0 ? Math.max(...values) : 0,
  };

  if (habit.completion.type === "repetitions") {
    const goal = habit.completion.goal;
    result.totalRepetitions = values.reduce((sum, value) => sum + value, 0);
    result.goalHitRate = asPercent(
      dueDates.filter((date) => (habit.completionHistory[date]?.value ?? 0) >= goal).length,
      dueDaysSinceCreation
    );
  }

  if (habit.completion.type === "timed") {
    const goal = habit.completion.goal;
    result.totalTimeSpent = values.reduce((sum, value) => sum + value, 0);
    result.goalHitRate = asPercent(
      dueDates.filter((date) => (habit.completionHistory[date]?.value ?? 0) >= goal).length,
      dueDaysSinceCreation
    );
  }

  return result;
};

/**
 * Generate schedule-aware chart data for the last seven days.
 */
export const generateChartData = (habit: Habit): HabitChartData => {
  const goal = getHabitGoal(habit);
  const locale = getDeviceLocale();

  const days: ChartDay[] = getLastSevenDates().map((date) => {
    const historyEntry = habit.completionHistory[date];
    const isFutureDate = getDayjs(date).startOf("day").isAfter(getCurrentDateDayjs());

    return {
      date,
      label: getLocalizedShortDayName(date, locale),
      isDue: !isFutureDate && isHabitDueOnDate(habit, date),
      isCompleted: Boolean(historyEntry?.isCompleted),
      value: historyEntry?.value ?? (historyEntry?.isCompleted ? 1 : 0),
      goal,
    };
  });

  return { days };
};
