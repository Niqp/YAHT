import notifee, {
  TriggerType,
  TimestampTrigger,
  RepeatFrequency,
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import type { Dayjs } from "dayjs";
import { Platform } from "react-native";
export const setNotification = async (timerId: string, habitTitle: string, date: Dayjs) => {
  try {
    // First check current notification settings without requesting
    const currentSettings = await notifee.getNotificationSettings();

    // Only request permission if not already granted
    if (currentSettings.authorizationStatus !== AuthorizationStatus.AUTHORIZED) {
      await notifee.requestPermission();
    }

    // Check alarm settings only if needed (Android)
    if (Platform.OS === "android") {
      if (currentSettings.android.alarm !== AndroidNotificationSetting.ENABLED) {
        await notifee.openAlarmPermissionSettings();
      }
    }

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.valueOf(), // Use the date's timestamp
      repeatFrequency: RepeatFrequency.WEEKLY, // repeat once a week
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    const notificationId = await notifee.createTriggerNotification(
      {
        id: timerId,
        title: "Timer Reached its goal!",
        body: `${habitTitle} timer has reached its goal, but is still running.`,
        android: {
          channelId,
        },
      },
      trigger
    );

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
};

export const cancelNotification = async (notificationId: string) => {
  try {
    await notifee.cancelNotification(notificationId);
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
};

export const cancelAllNotifications = async () => {
  try {
    await notifee.cancelAllNotifications();
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
};
