import * as Notifications from "expo-notifications";
import { BackgroundNotificationResult } from "expo-notifications/build/BackgroundNotificationTasksModule.types";
import { mapNotificationResponse } from "expo-notifications/build/utils/mapNotificationResponse";
import * as TaskManager from "expo-task-manager";

import {
  handleReminderNotificationResponse,
  isReminderQuickActionResponse,
} from "@/utils/reminderNotificationResponse";
import { waitForHabitStoreHydration } from "@/utils/habitStoreHydration";

export const REMINDER_NOTIFICATION_TASK = "YAHTReminderNotificationTask";

const isNotificationResponsePayload = (
  data: Notifications.NotificationTaskPayload
): data is Notifications.NotificationResponse =>
  !!data && typeof data === "object" && "actionIdentifier" in data && "notification" in data;

TaskManager.defineTask<Notifications.NotificationTaskPayload>(REMINDER_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Error running reminder notification task:", error);
    return BackgroundNotificationResult.Failed;
  }

  if (!isNotificationResponsePayload(data)) {
    return BackgroundNotificationResult.NoData;
  }

  const response = mapNotificationResponse(data);
  if (!isReminderQuickActionResponse(response)) {
    return BackgroundNotificationResult.NoData;
  }

  try {
    const isHydrated = await waitForHabitStoreHydration();
    if (!isHydrated) {
      return BackgroundNotificationResult.NoData;
    }

    const result = await handleReminderNotificationResponse(response, { allowNavigation: false });
    return result.handled ? BackgroundNotificationResult.NewData : BackgroundNotificationResult.NoData;
  } catch (taskError) {
    if (taskError instanceof Error) {
      console.error(`Error handling reminder notification task: ${taskError.message}`, taskError);
    }
    return BackgroundNotificationResult.Failed;
  }
});
