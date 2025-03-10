import * as Notifications from 'expo-notifications';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';
import { formatDate } from '../utils/date';

// Storage keys
const ACTIVE_TIMERS_STORAGE_KEY = 'active_timers';
const APP_BACKGROUND_TIME_KEY = 'app_background_timestamp';

// Type definitions
export interface ActiveTimer {
  habitId: string;
  startTimestamp: number;
  baseTime: number;
  date: string;
  goalSeconds: number;
  habitTitle: string;
  notificationId?: string;
}

export interface ActiveTimersMap {
  [habitId: string]: ActiveTimer;
}

/**
 * Configure notifications for the app
 * Should be called during app initialization
 */
export async function configureNotifications() {
  // Request permissions if needed
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }
  
  // Configure how notifications appear when the app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  
  return true;
}

/**
 * Save active timers to persistent storage
 */
export function saveActiveTimers(timers: ActiveTimersMap): void {
  try {
    const data = JSON.stringify(timers);
    storage.set(ACTIVE_TIMERS_STORAGE_KEY, data);
  } catch (error) {
    console.error('Error saving active timers:', error);
  }
}

/**
 * Load active timers from persistent storage
 */
export function loadActiveTimers(): ActiveTimersMap {
  try {
    const data = storage.getString(ACTIVE_TIMERS_STORAGE_KEY);
    if (!data) return {};
    
    return JSON.parse(data) as ActiveTimersMap;
  } catch (error) {
    console.error('Error loading active timers:', error);
    return {};
  }
}

/**
 * Save app background timestamp
 */
export function saveBackgroundTimestamp(timestamp: number): void {
  storage.set(APP_BACKGROUND_TIME_KEY, timestamp.toString());
}

/**
 * Load app background timestamp
 */
export function loadBackgroundTimestamp(): number | null {
  const timestamp = storage.getString(APP_BACKGROUND_TIME_KEY);
  return timestamp ? parseInt(timestamp, 10) : null;
}

/**
 * Clear app background timestamp
 */
export function clearBackgroundTimestamp(): void {
  storage.delete(APP_BACKGROUND_TIME_KEY);
}

/**
 * Schedule a notification for when the timer is supposed to end
 */
export async function scheduleTimerNotification(
  habitId: string,
  title: string,
  goalSeconds: number, 
  baseTime: number,
  startTimestamp: number
): Promise<string> {
  // Calculate when the timer will reach the goal
  const secondsRemaining = goalSeconds - baseTime;
  
  // Don't schedule if already at goal or if less than 1 second remains
  if (secondsRemaining <= 0) {
    return '';
  }
  
  // Convert to milliseconds and add to current time
  const triggerTime = startTimestamp + (secondsRemaining * 1000);
  const now = Date.now();
  
  // Ensure the trigger time is in the future
  if (triggerTime <= now) {
    console.log('Skipping notification: trigger time already passed');
    return '';
  }
  
  // Calculate time until notification in minutes for logging
  const minutesUntilNotification = Math.round((triggerTime - now) / 60000);
  
  try {
    // Cancel any existing notification for this habit
    await cancelTimerNotification(habitId);
    
    // Schedule the new notification for when the timer completes
    console.log(`Scheduling notification for habit "${title}" in ${minutesUntilNotification} minutes`);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Complete!',
        body: `Your "${title}" habit timer has reached its goal.`,
        data: { habitId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTime),
      }
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling timer notification:', error);
    return '';
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelTimerNotification(habitId: string): Promise<void> {
  try {
    // Load existing timers to get the notification ID
    const timers = loadActiveTimers();
    const timer = timers[habitId];
    
    if (timer?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(timer.notificationId);
    }
  } catch (error) {
    console.error('Error canceling timer notification:', error);
  }
}

/**
 * Start a timer and schedule a notification
 */
export async function startTimer(
  habitId: string,
  title: string,
  goalSeconds: number,
  baseTime: number,
  date: string
): Promise<ActiveTimer> {
  const now = Date.now();
  
  // Schedule notification
  const notificationId = await scheduleTimerNotification(
    habitId,
    title,
    goalSeconds,
    baseTime,
    now
  );
  
  // Create timer object
  const timer: ActiveTimer = {
    habitId,
    startTimestamp: now,
    baseTime,
    date,
    goalSeconds,
    habitTitle: title,
    notificationId
  };
  
  // Save to storage
  const timers = loadActiveTimers();
  timers[habitId] = timer;
  saveActiveTimers(timers);
  
  return timer;
}

/**
 * Stop a timer and cancel its notification
 */
export async function stopTimer(habitId: string): Promise<void> {
  // Cancel notification
  await cancelTimerNotification(habitId);
  
  // Remove from active timers
  const timers = loadActiveTimers();
  if (timers[habitId]) {
    delete timers[habitId];
    saveActiveTimers(timers);
  }
}

/**
 * Sync timers that were running when app was in background
 * Returns the updated timers
 */
export function syncBackgroundTimers(): ActiveTimersMap {
  const backgroundTimestamp = loadBackgroundTimestamp();
  if (!backgroundTimestamp) {
    return loadActiveTimers();
  }
  
  const now = Date.now();
  const timers = loadActiveTimers();
  const today = formatDate(new Date());
  
  // Update each timer with elapsed time since going to background
  Object.keys(timers).forEach(habitId => {
    const timer = timers[habitId];
    
    // If the timer is for a different day, don't sync it
    if (timer.date !== today) {
      return;
    }
    
    // Calculate elapsed time since app went to background
    const elapsedSeconds = Math.floor((now - backgroundTimestamp) / 1000);
    
    // Update the timer's base time and start timestamp
    timer.baseTime += elapsedSeconds;
    timer.startTimestamp = now;
    
    // Update notification if needed
    if (timer.baseTime < timer.goalSeconds) {
      scheduleTimerNotification(
        habitId,
        timer.habitTitle,
        timer.goalSeconds,
        timer.baseTime,
        now
      ).then(notificationId => {
        if (notificationId) {
          timer.notificationId = notificationId;
        }
      });
    }
  });
  
  // Clear background timestamp since we've handled it
  clearBackgroundTimestamp();
  
  // Save updated timers
  saveActiveTimers(timers);
  
  return timers;
}