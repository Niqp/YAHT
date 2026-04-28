import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isToday from "dayjs/plugin/isToday";
import duration from "dayjs/plugin/duration";

import { DateStamp, DateTimeStamp } from "@/types/date";
import type { Habit } from "@/types/habit";
import type { SupportedLocale } from "@/i18n/locale";

dayjs.extend(isSameOrAfter);
dayjs.extend(isToday);
dayjs.extend(duration);

const WEEK_START_REFERENCE_DATE = "2026-02-15"; // Sunday

export const getCurrentDateDayjs = () => dayjs().startOf("day");
export const getCurrentDateTimeDayjs = () => dayjs();
export const getMidnightDayjs = (date: dayjs.ConfigType) => dayjs(date).startOf("day");
export const getDayjs = (date: dayjs.ConfigType) => dayjs(date);
export const getDateStamp = (date: dayjs.Dayjs): DateStamp => date.format("YYYY-MM-DD");
export const getDateTimeStamp = (date: dayjs.ConfigType): DateTimeStamp => getDayjs(date).toISOString();
export const getCurrentDateStamp = () => getDateStamp(getCurrentDateDayjs());
export const getCurrentIsoString = () => getDateTimeStamp(getCurrentDateTimeDayjs());
export const getIsoString = (date: dayjs.ConfigType) => getDateTimeStamp(date);

export const isHabitDueOnDate = (habit: Habit, date: string): boolean => {
  if (!habit || !date) return false;

  try {
    const selectedDate = getMidnightDayjs(date);
    const createdAtDate = getMidnightDayjs(habit.createdAt);

    if (selectedDate.isBefore(createdAtDate)) {
      return false;
    }

    const dayOfWeek = selectedDate.day();

    switch (habit.repetition.type) {
      case "daily":
        return true;
      case "weekdays":
        return Array.isArray(habit.repetition.days) && habit.repetition.days.includes(dayOfWeek);
      case "interval": {
        if (selectedDate.isSame(createdAtDate)) {
          return true;
        }

        if (typeof habit.repetition.days !== "number" || habit.repetition.days <= 0) {
          return false;
        }

        const lastCompletedDate = Object.keys(habit.completionHistory)
          .filter((historyDate) => {
            if (!habit.completionHistory[historyDate]?.isCompleted) {
              return false;
            }

            return !getMidnightDayjs(historyDate).isAfter(selectedDate);
          })
          .sort()
          .at(-1);

        const anchorDate = lastCompletedDate ? getMidnightDayjs(lastCompletedDate) : createdAtDate;
        const nextDueDate = anchorDate.add(habit.repetition.days, "day");

        return selectedDate.isSameOrAfter(nextDueDate);
      }
      default:
        return false;
    }
  } catch (error) {
    console.error("Error in isHabitDueOnDate:", error, "habit:", habit, "date:", date);
    return false;
  }
};

/**
 * Determine if a habit should be shown on a specific date
 */
export const shouldShowHabitOnDate = (habit: Habit, date: string): boolean => {
  // Safety check for null/undefined inputs
  if (!habit || !date) return false;

  try {
    if (habit.completionHistory[date]?.isCompleted) {
      // If the habit is already completed on this date, show it
      return true;
    }

    return isHabitDueOnDate(habit, date);
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
  return new Intl.DateTimeFormat("en", { month: "short" }).format(toIntlDate(date));
};

const toIntlDate = (date: dayjs.ConfigType) => getDayjs(date).toDate();

export const getLocalizedMonthYear = (date: dayjs.ConfigType, locale: SupportedLocale): string => {
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" })
    .format(toIntlDate(date))
    .replace(/\sг\.$/, "");
};

export const getShortDayName = (date: dayjs.ConfigType): string => {
  return getLocalizedShortDayName(date, "en");
};

export const getLocalizedShortDayName = (date: dayjs.ConfigType, locale: SupportedLocale): string => {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(toIntlDate(date)).replace(/\.$/, "");
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
    ...Array.from({ length: 7 }, (_, dayIndex) => ({
      dayIndex,
      name: new Intl.DateTimeFormat("en", { weekday: "long" }).format(
        toIntlDate(addDays(WEEK_START_REFERENCE_DATE, dayIndex))
      ),
    })),
  ];

  const orderedWeekDays = weekDaysMap.slice(startDay).concat(weekDaysMap.slice(0, startDay));
  return orderedWeekDays;
};
