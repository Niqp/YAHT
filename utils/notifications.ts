import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { canScheduleExactAlarms, openSettings } from "react-native-permissions";

const TIMER_CHANNEL_ID = "timers";
const TIMER_CHANNEL_NAME = "Timers";

const REMINDER_CHANNEL_ID = "reminders";
const REMINDER_CHANNEL_NAME = "Reminders";

const getTimerNotificationId = (timerId: string) => `timer-${timerId}`;

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

export const scheduleReminderNotification = async (habitId: string, habitTitle: string, timestamp: number) => {
  try {
    const canSchedule = await prepareReminderNotifications({ openAlarmSettings: false });
    if (!canSchedule) {
      return undefined;
    }

    const notificationId = `reminder-${habitId}-${timestamp}`;
    const content: Notifications.NotificationContentInput = {
      title: "Friendly Reminder",
      body: `It's time for: ${habitTitle}`,
      sound: "default",
      color: "#023c69",
      priority: Notifications.AndroidNotificationPriority.HIGH,
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
    console.error("Error scheduling reminder notification:", error);
    return undefined;
  }
};
