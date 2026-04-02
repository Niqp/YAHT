import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { canScheduleExactAlarms, openSettings } from "react-native-permissions";

const TIMER_CHANNEL_ID = "timers";
const TIMER_CHANNEL_NAME = "Timers";

const REMINDER_CHANNEL_ID = "reminders";
const REMINDER_CHANNEL_NAME = "Reminders";
const REMINDER_NOTIFICATION_CATEGORY_ID = "habitReminderActions";
const REMINDER_NOTIFICATION_PREFIX = "reminder-";
const REMINDER_KIND = "habitReminder";

export const DEFAULT_REMINDER_SNOOZE_MS = 15 * 60 * 1000;
export const MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE = 3;

export const REMINDER_ACTION_DONE_IDENTIFIER = "habitReminderDone";
export const REMINDER_ACTION_SNOOZE_IDENTIFIER = "habitReminderSnooze";
export const REMINDER_ACTION_OPEN_IDENTIFIER = "habitReminderOpen";

export type ReminderNotificationData = {
  kind: typeof REMINDER_KIND;
  habitId: string;
  habitTitle: string;
  reminderDate: string;
  reminderSeriesId: string;
  scheduledFor: number;
  attemptNumber: number;
  maxAttempts: number;
  repeatIntervalMs?: number;
};

export type ReminderScheduleParams = {
  habitId: string;
  habitTitle: string;
  timestamp: number;
  reminderDate: string;
  reminderSeriesId?: string;
  attemptNumber?: number;
  maxAttempts?: number;
  repeatIntervalMs?: number;
};

const getTimerNotificationId = (timerId: string) => `timer-${timerId}`;
const getReminderNotificationId = (reminderSeriesId: string, timestamp: number) =>
  `${REMINDER_NOTIFICATION_PREFIX}${reminderSeriesId}-${timestamp}`;

const ensureNotificationPermission = async (): Promise<boolean> => {
  try {
    const existingPermissions = await Notifications.getPermissionsAsync();
    if (existingPermissions.granted) {
      return true;
    }

    const requestedPermissions = await Notifications.requestPermissionsAsync();
    return requestedPermissions.granted;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

const ensureChannel = async (
  channelId: string,
  channelConfig: Notifications.NotificationChannelInput,
  logContext = ""
) => {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(channelId, channelConfig);
  } catch (error) {
    console.error(`Error creating ${logContext} notification channel:`, error);
  }
};

const ensureReminderCategory = async () => {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await Notifications.setNotificationCategoryAsync(REMINDER_NOTIFICATION_CATEGORY_ID, [
      {
        identifier: REMINDER_ACTION_DONE_IDENTIFIER,
        buttonTitle: "Done",
        options: { opensAppToForeground: true },
      },
      {
        identifier: REMINDER_ACTION_SNOOZE_IDENTIFIER,
        buttonTitle: "Snooze",
        options: { opensAppToForeground: true },
      },
      {
        identifier: REMINDER_ACTION_OPEN_IDENTIFIER,
        buttonTitle: "Open",
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (error) {
    console.error("Error creating reminder notification category:", error);
  }
};

const prepareNotificationsBase = async (
  channelId: string,
  channelConfig: Notifications.NotificationChannelInput,
  openAlarmSettings: boolean,
  logContext: string
): Promise<boolean> => {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  await ensureChannel(channelId, channelConfig, logContext);

  if (channelId === REMINDER_CHANNEL_ID) {
    await ensureReminderCategory();
  }

  if (Platform.OS !== "android") {
    return true;
  }

  try {
    const exactAlarmsEnabled = await canScheduleExactAlarms();
    if (exactAlarmsEnabled) {
      return true;
    }

    if (openAlarmSettings) {
      await openSettings("alarms");
    }
  } catch (error) {
    console.error(`Error checking exact alarm access for ${logContext}:`, error);
  }

  return false;
};

const cancelNotificationIdentifiers = async (identifiers: string[]) => {
  if (identifiers.length === 0) {
    return;
  }

  const cancelResults = await Promise.allSettled(
    identifiers.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier))
  );
  cancelResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Failed to cancel scheduled reminder notification:", result.reason);
    }
  });
};

const dismissNotificationIdentifiers = async (identifiers: string[]) => {
  if (identifiers.length === 0 || Platform.OS === "web") {
    return;
  }

  const dismissResults = await Promise.allSettled(
    identifiers.map((identifier) => Notifications.dismissNotificationAsync(identifier))
  );
  dismissResults.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Failed to dismiss delivered reminder notification:", result.reason);
    }
  });
};

export const getReminderNotificationSeriesId = (habitId: string, reminderDate: string) =>
  `series-${habitId}-${reminderDate}`;

export const isReminderNotificationData = (data: unknown): data is ReminderNotificationData => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<ReminderNotificationData>;
  return (
    candidate.kind === REMINDER_KIND &&
    typeof candidate.habitId === "string" &&
    typeof candidate.habitTitle === "string" &&
    typeof candidate.reminderDate === "string" &&
    typeof candidate.reminderSeriesId === "string" &&
    typeof candidate.scheduledFor === "number" &&
    typeof candidate.attemptNumber === "number" &&
    typeof candidate.maxAttempts === "number"
  );
};

export const getReminderNotificationData = (
  response: Pick<Notifications.NotificationResponse, "notification">
): ReminderNotificationData | undefined => {
  const data = response.notification.request.content.data;
  return isReminderNotificationData(data) ? data : undefined;
};

export const clearReminderNotifications = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const reminderIdentifiers = scheduled
      .filter((notification) => notification.identifier.startsWith(REMINDER_NOTIFICATION_PREFIX))
      .map((notification) => notification.identifier);

    await cancelNotificationIdentifiers(reminderIdentifiers);

    if (Platform.OS !== "web") {
      const delivered = await Notifications.getPresentedNotificationsAsync();
      const deliveredReminderIdentifiers = delivered
        .filter((notification) => notification.request.identifier.startsWith(REMINDER_NOTIFICATION_PREFIX))
        .map((notification) => notification.request.identifier);

      await dismissNotificationIdentifiers(deliveredReminderIdentifiers);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error clearing reminder notifications: ${error.message}`, error);
    }
  }
};

export const cancelReminderNotificationSeries = async (reminderSeriesId: string) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIdentifiers = scheduled
      .filter((notification) => {
        const data = notification.content.data;
        return isReminderNotificationData(data) && data.reminderSeriesId === reminderSeriesId;
      })
      .map((notification) => notification.identifier);

    await cancelNotificationIdentifiers(scheduledIdentifiers);

    if (Platform.OS !== "web") {
      const delivered = await Notifications.getPresentedNotificationsAsync();
      const deliveredIdentifiers = delivered
        .filter((notification) => {
          const data = notification.request.content.data;
          return isReminderNotificationData(data) && data.reminderSeriesId === reminderSeriesId;
        })
        .map((notification) => notification.request.identifier);

      await dismissNotificationIdentifiers(deliveredIdentifiers);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error cancelling reminder notification series: ${error.message}`, error);
    }
  }
};

export const prepareTimerNotifications = async ({
  openAlarmSettings = true,
}: { openAlarmSettings?: boolean } = {}): Promise<boolean> => {
  return prepareNotificationsBase(
    TIMER_CHANNEL_ID,
    {
      name: TIMER_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    },
    openAlarmSettings,
    "timers"
  );
};

export const scheduleTimerNotification = async (timerId: string, habitTitle: string, remainingMs: number) => {
  try {
    const canSchedule = await prepareTimerNotifications({ openAlarmSettings: false });
    if (!canSchedule) {
      return undefined;
    }

    const notificationId = getTimerNotificationId(timerId);
    const content: Notifications.NotificationContentInput = {
      title: "Timer Reached its goal!",
      body: `${habitTitle} timer has reached its goal, but is still running.`,
      sound: "default",
      color: "#023c69",
      priority: Notifications.AndroidNotificationPriority.MAX,
    };

    if (remainingMs <= 0) {
      return Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content,
        trigger: null,
      });
    }

    return Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + remainingMs),
        channelId: TIMER_CHANNEL_ID,
      },
    });
  } catch (error) {
    console.error("Error scheduling timer notification:", error);
    return undefined;
  }
};

export const cancelTimerNotification = async (timerId: string) => {
  try {
    const notificationId = getTimerNotificationId(timerId);
    await Promise.allSettled([
      Notifications.cancelScheduledNotificationAsync(notificationId),
      Notifications.dismissNotificationAsync(notificationId),
    ]);
  } catch (error) {
    console.error("Error cancelling timer notification:", error);
  }
};

export const cancelAllTimerNotifications = async () => {
  try {
    await Promise.allSettled([
      Notifications.cancelAllScheduledNotificationsAsync(),
      Notifications.dismissAllNotificationsAsync(),
    ]);
  } catch (error) {
    console.error("Error cancelling all timer notifications:", error);
  }
};

export const prepareReminderNotifications = async ({
  openAlarmSettings = true,
}: { openAlarmSettings?: boolean } = {}): Promise<boolean> => {
  return prepareNotificationsBase(
    REMINDER_CHANNEL_ID,
    {
      name: REMINDER_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    },
    openAlarmSettings,
    "reminders"
  );
};

export const scheduleReminderNotification = async ({
  habitId,
  habitTitle,
  timestamp,
  reminderDate,
  reminderSeriesId,
  attemptNumber,
  maxAttempts,
  repeatIntervalMs,
}: ReminderScheduleParams) => {
  try {
    const canSchedule = await prepareReminderNotifications({ openAlarmSettings: false });
    if (!canSchedule) {
      return undefined;
    }

    return schedulePreparedReminderNotification({
      habitId,
      habitTitle,
      timestamp,
      reminderDate,
      reminderSeriesId,
      attemptNumber,
      maxAttempts,
      repeatIntervalMs,
    });
  } catch (error) {
    console.error("Error scheduling reminder notification:", error);
    return undefined;
  }
};

export const schedulePreparedReminderNotification = async ({
  habitId,
  habitTitle,
  timestamp,
  reminderDate,
  reminderSeriesId = getReminderNotificationSeriesId(habitId, reminderDate),
  attemptNumber = 0,
  maxAttempts = 1,
  repeatIntervalMs,
}: ReminderScheduleParams) => {
  try {
    const notificationId = getReminderNotificationId(reminderSeriesId, timestamp);
    const reminderData: ReminderNotificationData = {
      kind: REMINDER_KIND,
      habitId,
      habitTitle,
      reminderDate,
      reminderSeriesId,
      scheduledFor: timestamp,
      attemptNumber,
      maxAttempts,
      repeatIntervalMs,
    };

    const content: Notifications.NotificationContentInput = {
      title: attemptNumber > 0 ? "Still waiting" : "Friendly Reminder",
      body: attemptNumber > 0 ? `${habitTitle} still needs attention.` : `It's time for: ${habitTitle}`,
      sound: "default",
      color: "#023c69",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY_ID,
      data: reminderData as unknown as Record<string, unknown>,
    };

    return Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(timestamp),
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch (error) {
    console.error("Error scheduling prepared reminder notification:", error);
    return undefined;
  }
};
