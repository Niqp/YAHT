import { WeekStartDay } from '../store/themeStore';

// Define the days of the week
export const ALL_WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

/**
 * Returns an array of weekdays ordered by the specified first day
 */
export const getOrderedWeekdays = (startDay: WeekStartDay) => {
  if (startDay === 'monday') {
    // Create a new array starting with Monday (index 1)
    const mondayFirst = [...ALL_WEEKDAYS];
    const sunday = mondayFirst.shift(); // Remove Sunday from the beginning
    mondayFirst.push(sunday!); // Add Sunday to the end
    return mondayFirst;
  }
  // Return the original array (Sunday first)
  return [...ALL_WEEKDAYS];
};

/**
 * Returns the default selected weekdays (Mon-Fri) adjusted for the week start day
 */
export const getDefaultSelectedDays = (startDay: WeekStartDay): number[] => {
  // Default workweek (Mon-Fri)
  if (startDay === 'monday') {
    // Monday is index 0 in Monday-first week
    return [0, 1, 2, 3, 4]; // Mon, Tue, Wed, Thu, Fri
  } else {
    // Monday is index 1 in Sunday-first week
    return [1, 2, 3, 4, 5]; // Mon, Tue, Wed, Thu, Fri
  }
};