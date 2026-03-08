import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { canScheduleExactAlarms, openSettings } from "react-native-permissions";

const TIMER_CHANNEL_ID = "timers";
const TIMER_CHANNEL_NAME = "Timers";

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

const ensureTimerChannel = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL_ID, {
      name: TIMER_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  } catch (error) {
    console.error("Error creating timer notification channel:", error);
  }
};

export const prepareTimerNotifications = async ({
  openAlarmSettings = true,
}: { openAlarmSettings?: boolean } = {}): Promise<boolean> => {
  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  await ensureTimerChannel();

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
    console.error("Error checking exact alarm access:", error);
  }

  return false;
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
