import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isToday from "dayjs/plugin/isToday";
import duration from "dayjs/plugin/duration";

import { DateStamp, DateTimeStamp } from "@/types/date";
import type { Habit } from "@/types/habit";
import { timeMs } from "@/types/timer";

dayjs.extend(isSameOrAfter);
dayjs.extend(isToday);
dayjs.extend(duration);

// Cached day names to avoid repeated calculations
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const getCurrentDateDayjs = () => dayjs().startOf("day");
export const getCurrentDateTimeDayjs = () => dayjs();
export const getMidnightDayjs = (date: dayjs.ConfigType) => dayjs(date).startOf("day");
export const getDayjs = (date: dayjs.ConfigType) => dayjs(date);
export const getDateStamp = (date: dayjs.Dayjs): DateStamp => date.format("YYYY-MM-DD");
export const getDateTimeStamp = (date: dayjs.ConfigType): DateTimeStamp => getDayjs(date).toISOString();
export const getCurrentDateStamp = () => getDateStamp(getCurrentDateDayjs());
export const getCurrentIsoString = () => getDateTimeStamp(getCurrentDateTimeDayjs());
export const getIsoString = (date: dayjs.ConfigType) => getDateTimeStamp(date);

export const calculateGoalCompletionDate = (habitGoal: timeMs, storedValue: timeMs) => {
  const now = getCurrentDateTimeDayjs();
  return now.add(habitGoal - storedValue, "milliseconds");
};

/**
 * Determine if a habit should be shown on a specific date
 */
export const shouldShowHabitOnDate = (habit: Habit, date: string): boolean => {
  // Safety check for null/undefined inputs
  if (!habit || !date) return false;

  try {
    const selectedDate = getMidnightDayjs(date);
    const createdAtDate = getMidnightDayjs(habit.createdAt);

    if (habit.completionHistory[date]?.isCompleted) {
      // If the habit is already completed on this date, show it
      return true;
    }

    if (selectedDate.isBefore(createdAtDate)) {
      // If the selected date is before the habit was created, return false
      return false;
    }

    const dayOfWeek = selectedDate.day(); // 0 = Sunday, 6 = Saturday

    switch (habit.repetition.type) {
      case "daily":
        return true;
      case "weekdays":
        // Type safety check - ensure repetitionValue is an array before using includes
        return Array.isArray(habit.repetition.days) && habit.repetition.days.includes(dayOfWeek);
      case "interval":
        // For custom "Every X days" pattern
        if (date === habit.createdAt) return true;
        if (typeof habit.repetition.days === "number" && habit.repetition.days > 0) {
          // Fallback to createdAt date if no completion history
          let nextDueDate = createdAtDate;
          const completionHistoryDates = Object.keys(habit.completionHistory).sort();
          if (completionHistoryDates.length > 0) {
            // Get the last completed date (sorted ascending, so last is newest)
            const prevCompletedDateString = completionHistoryDates[completionHistoryDates.length - 1];
            const prevDueDate = getMidnightDayjs(prevCompletedDateString);
            nextDueDate = prevDueDate.add(habit.repetition.days, "day");
          }

          // Habit is due if today is the nextDueDate or past it
          if (selectedDate.isSameOrAfter(nextDueDate)) {
            return true;
          }
        }
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.error("Error in shouldCompleteHabitOnDate:", error, "habit:", habit, "date:", date);
    // Fail safe by returning false instead of crashing
    return false;
  }
};

// New utility functions for DateSlider component
export const addDays = (date: dayjs.ConfigType, days: number): dayjs.Dayjs => {
  return getDayjs(date).add(days, "day");
};

export const formatDate = (date: dayjs.ConfigType): DateStamp => {
  return getDateStamp(getDayjs(date));
};

export const getMonthName = (date: dayjs.ConfigType): string => {
  const month = getDayjs(date).month(); // 0-11
  return MONTH_NAMES[month];
};

export const getShortDayName = (date: dayjs.ConfigType): string => {
  const dayIndex = getDayjs(date).day(); // 0-6
  return DAY_NAMES[dayIndex].substring(0, 3); // First 3 characters
};

export const getDay = (date: dayjs.ConfigType): number => {
  return getDayjs(date).date(); // Gets the day of month (1-31)
};

export const getYear = (date: dayjs.ConfigType): number => {
  return getDayjs(date).year();
};

export const getEpochMilliseconds = (date: dayjs.ConfigType): number => {
  return getDayjs(date).valueOf(); // Similar to Date.getTime()
};

export const formatTime = (time: number): string => {
  const durationMs = dayjs.duration(time, "milliseconds");
  return durationMs.format("HH:mm:ss");
};

export const getOrderedWeekDays = (
  startDay: number
): {
  dayIndex: number;
  name: string;
}[] => {
  const weekDaysMap = [
    { dayIndex: 0, name: "Sunday" },
    { dayIndex: 1, name: "Monday" },
    { dayIndex: 2, name: "Tuesday" },
    { dayIndex: 3, name: "Wednesday" },
    { dayIndex: 4, name: "Thursday" },
    { dayIndex: 5, name: "Friday" },
    { dayIndex: 6, name: "Saturday" },
  ];

  const orderedWeekDays = weekDaysMap.slice(startDay).concat(weekDaysMap.slice(0, startDay));
  return orderedWeekDays;
};
