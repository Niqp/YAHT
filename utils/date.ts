import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import type { Habit } from "../types/habit";

// Cached day names to avoid repeated calculations
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Fast date formatting (YYYY-MM-DD) without using toISOString
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  // Months are 0-indexed in JS Date
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Efficient date addition without creating multiple date objects
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Use cached day names rather than locale formatting each time
export const getDayName = (date: Date): string => {
  return DAY_NAMES[date.getDay()];
};

export const getShortDayName = (date: Date): string => {
  return DAY_NAMES[date.getDay()].substring(0, 3); // Get short form (3 letters)
};

// Use cached month names rather than locale formatting each time
export const getMonthName = (date: Date): string => {
  return MONTH_NAMES[date.getMonth()];
};

export const formatTime = (ms: number): string => {
  // Safety check for non-number values
  const safeMilliseconds = typeof ms !== "number" || Number.isNaN(ms) ? 0 : ms;
  const hours = Math.floor(safeMilliseconds / 3600000);
  const minutes = Math.floor((safeMilliseconds % 3600000) / 60000);
  const remainingSeconds = Math.floor((safeMilliseconds % 60000) / 1000);

  return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const getCurrentDateText = (midnight: boolean = true): string => {
  const date = midnight ? getMidnightDate(new Date()) : new Date();
  return formatDate(date);
};

export const getMidnightDate = (date: string | Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0); // Set time to midnight
  return newDate;
};

export const getCurrentDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Determine if a habit should be shown on a specific date
 */
export const shouldShowHabitOnDate = (habit: Habit, date: string): boolean => {
  // Safety check for null/undefined inputs
  if (!habit || !date) return false;

  try {
    const selectedDate = getMidnightDate(date);
    const createdAtDate = getMidnightDate(habit.createdAt);

    if (habit.completionHistory.get(date)?.isCompleted) {
      // If the habit is already completed on this date, show it
      return true;
    }

    if (getMidnightDate(selectedDate).getTime() < getMidnightDate(createdAtDate).getTime()) {
      // If the selected date is before the habit was created, return false
      return false;
    }

    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday

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
          const completionHistoryDates = Array.from(habit.completionHistory.keys());
          console.log("Completion history dates:", completionHistoryDates);
          const prevCompletedDateString =
            completionHistoryDates.length > 0 ? completionHistoryDates[completionHistoryDates.length - 1] : habit.createdAt;
          const nextDueDate = getMidnightDate(prevCompletedDateString);
          console.log("prevCompletedDateString:", prevCompletedDateString);
          // For interval based habits, check if the supplied date is on or after the next due date
          const selectedDateMs = selectedDate.getTime();
          const nextDueDateMs = nextDueDate.getTime() + habit.repetition.days * 24 * 60 * 60 * 1000; // Add interval in milliseconds
          console.log("nextDueDateMs:", nextDueDateMs, "selectedDateMs:", selectedDateMs);

          // Habit is due if today is the next due date or past it
          if (selectedDateMs >= nextDueDateMs) {
            return true;
          }
        }
        return false;
      default:
        return false;
    }

    return false;
  } catch (error) {
    console.error("Error in shouldCompleteHabitOnDate:", error, "habit:", habit, "date:", date);
    // Fail safe by returning false instead of crashing
    return false;
  }
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

export const calculateGoalCompletionDate = (goalTimeMs: number, storeValue: number): Date => {
  const currentDate = new Date();
  const remainingTime = goalTimeMs - storeValue;
  console.log("Calculating goal completion date. Goal Time:", goalTimeMs, "Store Value:", storeValue, "Remaining Time:", remainingTime);
  return new Date(currentDate.getTime() + remainingTime);
};
