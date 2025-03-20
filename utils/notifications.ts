import notifee, { TriggerType, TimestampTrigger, RepeatFrequency, AndroidNotificationSetting } from "@notifee/react-native";

export const setNotification = async (notificationId: string, habitTitle: string, date: Date) => {
  try {
    console.log("Scheduling notification for date:", date.toLocaleTimeString(), "with ID:", notificationId);
    // Request permissions (required for iOS)
    await notifee.requestPermission();

    const settings = await notifee.getNotificationSettings();
    if (settings.android.alarm == AndroidNotificationSetting.ENABLED) {
      //Create timestamp trigger
    } else {
      // Show some user information to educate them on what exact alarm permission is,
      // and why it is necessary for your app functionality, then send them to system preferences:
      await notifee.openAlarmPermissionSettings();
    }

    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: "default",
      name: "Default Channel",
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(), // Use the date's timestamp
      repeatFrequency: RepeatFrequency.WEEKLY, // repeat once a week
      alarmManager: {
        allowWhileIdle: true,
      },
    };

    await notifee.createTriggerNotification(
      {
        title: "Timer Reached its goal!",
        body: `${habitTitle} timer has reached its goal, but is still running.`,
        android: {
          channelId,
        },
      },
      trigger
    );
  } catch (error) {
    console.error("Error scheduling notification:", error);
  }
};

export const cancelNotification = async (notificationId: string) => {
  try {
    await notifee.cancelNotification(notificationId);
    console.log("Canceled notification with ID:", notificationId);
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
};
