import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { canScheduleExactAlarms, openSettings } from "react-native-permissions";
import { translate } from "@/i18n";
import { logError, logEvent, logWarn } from "@/utils/diagnostics/diagnosticLogger";
import { YAHT_RUNTIME_STORAGE_ID } from "@/utils/storageIds";

const TIMER_CHANNEL_ID = "timers";
const getTimerChannelName = () => translate("notifications.channels.timers");

const REMINDER_CHANNEL_ID = "reminders";
const getReminderChannelName = () => translate("notifications.channels.reminders");
const REMINDER_NOTIFICATION_CATEGORY_ID = "habitReminderActions";
export const REMINDER_NOTIFICATION_PREFIX = "reminder-";
const REMINDER_KIND = "habitReminder";
const REMINDER_QUEUE_STOP_KIND = "reminderQueueStop";

export const DEFAULT_REMINDER_SNOOZE_MS = 15 * 60 * 1000;
export const MAX_FOLLOW_UP_REMINDERS_PER_SCHEDULE = 3;

// Keep these constants in sync with plugins/*-native-reminder-actions.
// Native notification handlers read these payload/action IDs and MMKV keys
// before React Native is running.
export const REMINDER_ACTION_DONE_IDENTIFIER = "habitReminderDone";
export const REMINDER_ACTION_SNOOZE_IDENTIFIER = "habitReminderSnooze";
export const REMINDER_ACTION_OPEN_IDENTIFIER = "habitReminderOpen";
export const IOS_NATIVE_REMINDER_ACTION_STORAGE_ID = YAHT_RUNTIME_STORAGE_ID;
export const IOS_NATIVE_REMINDER_ACTION_STORAGE_KEY = "ios-native-reminder-actions";
export const ANDROID_NATIVE_REMINDER_ACTION_STORAGE_ID = YAHT_RUNTIME_STORAGE_ID;
export const ANDROID_NATIVE_REMINDER_ACTION_STORAGE_KEY = "android-native-reminder-actions";

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

export type ReminderQueueStopNotificationData = {
  kind: typeof REMINDER_QUEUE_STOP_KIND;
  scheduledFor: number;
  overflowTimestamp: number;
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
export const getReminderNotificationIdentifier = (reminderSeriesId: string, timestamp: number) =>
  `${REMINDER_NOTIFICATION_PREFIX}${reminderSeriesId}-${timestamp}`;

const getReminderTrigger = (timestamp: number, channelId: string): Notifications.NotificationTriggerInput => {
  if (Platform.OS === "ios") {
    const triggerDate = new Date(timestamp);
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: false,
      year: triggerDate.getFullYear(),
      month: triggerDate.getMonth() + 1,
      day: triggerDate.getDate(),
      hour: triggerDate.getHours(),
      minute: triggerDate.getMinutes(),
      second: triggerDate.getSeconds(),
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(timestamp),
    channelId,
  };
};

const ensureNotificationPermission = async (): Promise<boolean> => {
  try {
    const existingPermissions = await Notifications.getPermissionsAsync();
    if (existingPermissions.granted) {
      logEvent("notifications.permission.ready", { status: "granted" });
      return true;
    }

    const requestedPermissions = await Notifications.requestPermissionsAsync();
    logEvent("notifications.permission.requested", { status: requestedPermissions.granted ? "granted" : "denied" });
    return requestedPermissions.granted;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    logError("notifications.permission.failed", { operation: "ensureNotificationPermission", error });
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
    logEvent("notifications.channel.ready", { operation: "ensureChannel", category: logContext });
  } catch (error) {
    console.error(`Error creating ${logContext} notification channel:`, error);
    logError("notifications.channel.failed", { operation: "ensureChannel", category: logContext, error });
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
        buttonTitle: translate("notifications.actions.done"),
        options: { opensAppToForeground: false },
      },
      {
        identifier: REMINDER_ACTION_SNOOZE_IDENTIFIER,
        buttonTitle: translate("notifications.actions.snooze"),
        options: { opensAppToForeground: false },
      },
      {
        identifier: REMINDER_ACTION_OPEN_IDENTIFIER,
        buttonTitle: translate("notifications.actions.open"),
        options: { opensAppToForeground: true },
      },
    ]);
    logEvent("reminder.category.ready", { operation: "ensureReminderCategory" });
  } catch (error) {
    console.error("Error creating reminder notification category:", error);
    logError("reminder.category.failed", { operation: "ensureReminderCategory", error });
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
    logWarn("notifications.prepare.denied", { category: logContext });
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
      logEvent("notifications.exactAlarm.ready", { category: logContext });
      return true;
    }

    if (openAlarmSettings) {
      await openSettings("alarms");
    }
  } catch (error) {
    console.error(`Error checking exact alarm access for ${logContext}:`, error);
    logError("notifications.exactAlarm.failed", { operation: "canScheduleExactAlarms", category: logContext, error });
  }

  logWarn("notifications.prepare.failed", { category: logContext });
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
      logError("notifications.cancel.failed", { operation: "cancelScheduledNotificationAsync", error: result.reason });
    }
  });
  logEvent("notifications.cancelled", { count: identifiers.length });
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
      logError("notifications.dismiss.failed", { operation: "dismissNotificationAsync", error: result.reason });
    }
  });
  logEvent("notifications.dismissed", { count: identifiers.length });
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

export const isReminderQueueStopNotificationData = (data: unknown): data is ReminderQueueStopNotificationData => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Partial<ReminderQueueStopNotificationData>;
  return (
    candidate.kind === REMINDER_QUEUE_STOP_KIND &&
    typeof candidate.scheduledFor === "number" &&
    typeof candidate.overflowTimestamp === "number"
  );
};

export const getReminderNotificationData = (
  response: Pick<Notifications.NotificationResponse, "notification">
): ReminderNotificationData | undefined => {
  const data = response.notification.request.content.data;
  return isReminderNotificationData(data) ? data : undefined;
};

export const getReminderQueueStopNotificationData = (
  response: Pick<Notifications.NotificationResponse, "notification">
): ReminderQueueStopNotificationData | undefined => {
  const data = response.notification.request.content.data;
  return isReminderQueueStopNotificationData(data) ? data : undefined;
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
    logEvent("reminder.notifications.cleared", { count: reminderIdentifiers.length });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error clearing reminder notifications: ${error.message}`, error);
    }
    logError("reminder.notifications.clearFailed", { operation: "clearReminderNotifications", error });
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
    logEvent("reminder.series.cancelled", { reminderSeriesId, count: scheduledIdentifiers.length });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error cancelling reminder notification series: ${error.message}`, error);
    }
    logError("reminder.series.cancelFailed", {
      operation: "cancelReminderNotificationSeries",
      reminderSeriesId,
      error,
    });
  }
};

export const prepareTimerNotifications = async ({
  openAlarmSettings = true,
}: { openAlarmSettings?: boolean } = {}): Promise<boolean> => {
  return prepareNotificationsBase(
    TIMER_CHANNEL_ID,
    {
      name: getTimerChannelName(),
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
      logWarn("timer.notification.notScheduled", { timerId, reason: "prepare-failed" });
      return undefined;
    }

    const notificationId = getTimerNotificationId(timerId);
    const content: Notifications.NotificationContentInput = {
      title: translate("notifications.timerTitle"),
      body: translate("notifications.timerBody", { habitTitle }),
      sound: "default",
      color: "#023c69",
      priority: Notifications.AndroidNotificationPriority.MAX,
    };

    if (remainingMs <= 0) {
      logEvent("timer.notification.scheduled", { timerId, durationMs: remainingMs });
      return Notifications.scheduleNotificationAsync({
        identifier: notificationId,
        content,
        trigger: null,
      });
    }

    logEvent("timer.notification.scheduled", { timerId, durationMs: remainingMs });
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
    logError("timer.notification.scheduleFailed", { operation: "scheduleTimerNotification", timerId, error });
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
    logEvent("timer.notification.cancelled", { timerId });
  } catch (error) {
    console.error("Error cancelling timer notification:", error);
    logError("timer.notification.cancelFailed", { operation: "cancelTimerNotification", timerId, error });
  }
};

export const cancelAllTimerNotifications = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledTimerIdentifiers = scheduled
      .filter((notification) => notification.identifier.startsWith("timer-"))
      .map((notification) => notification.identifier);

    await cancelNotificationIdentifiers(scheduledTimerIdentifiers);

    if (Platform.OS !== "web") {
      const delivered = await Notifications.getPresentedNotificationsAsync();
      const deliveredTimerIdentifiers = delivered
        .filter((notification) => notification.request.identifier.startsWith("timer-"))
        .map((notification) => notification.request.identifier);

      await dismissNotificationIdentifiers(deliveredTimerIdentifiers);
    }
    logEvent("timer.notifications.cancelled", { count: scheduledTimerIdentifiers.length });
  } catch (error) {
    console.error("Error cancelling all timer notifications:", error);
    logError("timer.notifications.cancelFailed", { operation: "cancelAllTimerNotifications", error });
  }
};

export const prepareReminderNotifications = async ({
  openAlarmSettings = true,
}: { openAlarmSettings?: boolean } = {}): Promise<boolean> => {
  return prepareNotificationsBase(
    REMINDER_CHANNEL_ID,
    {
      name: getReminderChannelName(),
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
      logWarn("reminder.notification.notScheduled", { habitId, reminderDate, reason: "prepare-failed" });
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
    logError("reminder.notification.scheduleFailed", {
      operation: "scheduleReminderNotification",
      habitId,
      reminderDate,
      error,
    });
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
    const notificationId = getReminderNotificationIdentifier(reminderSeriesId, timestamp);
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
      title: habitTitle,
      body: attemptNumber > 0 ? translate("notifications.followUpBody") : translate("notifications.reminderBody"),
      sound: "default",
      color: "#023c69",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: REMINDER_NOTIFICATION_CATEGORY_ID,
      data: reminderData as unknown as Record<string, unknown>,
    };

    const scheduledId = await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content,
      trigger: getReminderTrigger(timestamp, REMINDER_CHANNEL_ID),
    });
    logEvent("reminder.notification.scheduled", {
      habitId,
      reminderDate,
      reminderSeriesId,
      notificationId,
      attemptNumber,
      maxAttempts,
      scheduledFor: timestamp,
    });
    return scheduledId;
  } catch (error) {
    console.error("Error scheduling prepared reminder notification:", error);
    logError("reminder.notification.prepareScheduleFailed", {
      operation: "schedulePreparedReminderNotification",
      habitId,
      reminderDate,
      reminderSeriesId,
      error,
    });
    return undefined;
  }
};

export const scheduleReminderQueueStopNotification = async ({
  timestamp,
  overflowTimestamp,
}: {
  timestamp: number;
  overflowTimestamp: number;
}) => {
  try {
    const stopData: ReminderQueueStopNotificationData = {
      kind: REMINDER_QUEUE_STOP_KIND,
      scheduledFor: timestamp,
      overflowTimestamp,
    };

    const scheduledId = await Notifications.scheduleNotificationAsync({
      identifier: "reminder-stop",
      content: {
        title: translate("notifications.stopTitle"),
        body: translate("notifications.stopBody"),
        sound: "default",
        color: "#023c69",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: stopData as unknown as Record<string, unknown>,
      },
      trigger: getReminderTrigger(timestamp, REMINDER_CHANNEL_ID),
    });
    logEvent("reminder.queueStop.scheduled", { scheduledFor: timestamp, timestamp, overflowTimestamp });
    return scheduledId;
  } catch (error) {
    console.error("Error scheduling reminder queue stop notification:", error);
    logError("reminder.queueStop.scheduleFailed", { operation: "scheduleReminderQueueStopNotification", error });
    return undefined;
  }
};
