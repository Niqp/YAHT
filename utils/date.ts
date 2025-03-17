import type { Habit } from "../types/habit";

// Cached day names to avoid repeated calculations
const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const DAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

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

export const formatTime = (seconds: number): string => {
	// Safety check for non-number values
	const safeSeconds =
		typeof seconds !== "number" || Number.isNaN(seconds) ? 0 : seconds;
	const minutes = Math.floor(safeSeconds / 60);
	const remainingSeconds = safeSeconds % 60;
	return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// OPTIMIZATION: Cache results with a Map for improved performance
// This significantly speeds up repeated calls with the same habit+date
const completionCache = new Map<string, boolean>();

// Timer to occasionally clean the cache to prevent memory leaks
let cacheCleanupTimer: NodeJS.Timeout | null = null;
const CACHE_CLEANUP_INTERVAL = 60000; // 1 minute

/**
 * Set up cache cleanup to run periodically
 * This prevents memory leaks from accumulating cached values
 */
const setupCacheCleanup = () => {
	if (cacheCleanupTimer) return;

	cacheCleanupTimer = setInterval(() => {
		if (completionCache.size > 500) {
			// Only clean if cache is large
			clearCompletionCache();
		}
	}, CACHE_CLEANUP_INTERVAL);
};

/**
 * Determine if a habit should be completed on a specific date
 * Optimized with caching for performance
 */
export const shouldCompleteHabitOnDate = (
	habit: Habit,
	date: string,
): boolean => {
	// Safety check for null/undefined inputs
	if (!habit || !date) return false;

	try {
		// Create a cache key using habit ID and date
		const cacheKey = `${habit.id}:${date}`;

		// Check if result is already cached
		if (completionCache.has(cacheKey)) {
			return completionCache.get(cacheKey) === true;
		}

		const habitDate = new Date(date);
		const dayOfWeek = habitDate.getDay(); // 0 = Sunday, 6 = Saturday
		let result = false;

		switch (habit.repetition.type) {
			case "daily":
				result = true;
				break;
			case "weekdays":
				// Type safety check - ensure repetitionValue is an array before using includes
				result =
					Array.isArray(habit.repetition.days) &&
					habit.repetition.days.includes(dayOfWeek);
				break;
			case "interval":
				// For custom "Every X days" pattern
				if (
					typeof habit.repetition.days === "number" &&
					habit.repetition.days > 0
				) {
					const nextDueDate = new Date(habit.repetition.nextDueDate);
					const currentDate = new Date()
					// For interval based habits, check if the supplied date is on or after the next due date
					const habitDateMs = habitDate.getTime();
					const nextDueDateMs = nextDueDate.getTime();

					// Habit is due if today is the next due date or past it
					if (habitDateMs >= nextDueDateMs) {
						result = true;
					}
				}
				break;
			default:
				result = false;
		}

		// Cache the result
		completionCache.set(cacheKey, result);

		// Setup cache cleanup if not already running
		setupCacheCleanup();

		return result;
	} catch (error) {
		console.error(
			"Error in shouldCompleteHabitOnDate:",
			error,
			"habit:",
			habit,
			"date:",
			date,
		);
		// Fail safe by returning false instead of crashing
		return false;
	}
};

/**
 * Clear completion cache when needed
 * This is now more selective - we have automatic cleanup,
 * so this should only be called when habit definitions change
 */
export const clearCompletionCache = (): void => {
	completionCache.clear();
};

/**
 * Clear cache for a specific habit
 * More efficient than clearing the entire cache
 */
export const clearHabitCache = (habitId: string): void => {
	// Remove all cache entries for this habit
	for (const key of completionCache.keys()) {
		if (key.startsWith(`${habitId}:`)) {
			completionCache.delete(key);
		}
	}
};

/**
 * Clean up resources when the app is unmounted
 */
export const cleanupDateUtils = (): void => {
	if (cacheCleanupTimer) {
		clearInterval(cacheCleanupTimer);
		cacheCleanupTimer = null;
	}
	completionCache.clear();
};

export const getOrderedWeekDays = (startDay: number): {
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
	
	const orderedWeekDays = weekDaysMap.slice(startDay).concat(
		weekDaysMap.slice(0, startDay),
	);
	return orderedWeekDays
};
