import * as Notifications from "expo-notifications";
import { BackgroundNotificationResult } from "expo-notifications/build/BackgroundNotificationTasksModule.types";
import { mapNotificationResponse } from "expo-notifications/build/utils/mapNotificationResponse";
import * as TaskManager from "expo-task-manager";

import {
  handleReminderNotificationResponse,
  isReminderQuickActionResponse,
} from "@/utils/reminderNotificationResponse";
import { waitForHabitStoreHydration } from "@/utils/habitStoreHydration";
import { appendReminderActionDebugRecord } from "@/utils/reminderActionDebugLog";

export const REMINDER_NOTIFICATION_TASK = "YAHTReminderNotificationTask";

const isNotificationResponsePayload = (
  data: Notifications.NotificationTaskPayload
): data is Notifications.NotificationResponse =>
  !!data && typeof data === "object" && "actionIdentifier" in data && "notification" in data;

TaskManager.defineTask<Notifications.NotificationTaskPayload>(REMINDER_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Error running reminder notification task:", error);
    appendReminderActionDebugRecord({
      event: "js-task-error",
      detail: error instanceof Error ? error.message : "unknown task error",
    });
    return BackgroundNotificationResult.Failed;
  }

  if (!isNotificationResponsePayload(data)) {
    appendReminderActionDebugRecord({
      event: "js-task-no-data",
      detail: "payload is not a notification response",
    });
    return BackgroundNotificationResult.NoData;
  }

  const response = mapNotificationResponse(data);
  if (!isReminderQuickActionResponse(response)) {
    appendReminderActionDebugRecord({
      event: "js-task-ignored",
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      detail: "not a quick action",
    });
    return BackgroundNotificationResult.NoData;
  }

  try {
    const isHydrated = await waitForHabitStoreHydration();
    appendReminderActionDebugRecord({
      event: "js-task-hydration",
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      detail: `hydrated=${isHydrated}`,
    });
    if (!isHydrated) {
      return BackgroundNotificationResult.NoData;
    }

    const result = await handleReminderNotificationResponse(response, {
      allowNavigation: false,
      completionMode: "targeted-background",
    });
    appendReminderActionDebugRecord({
      event: "js-task-result",
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      detail: `handled=${result.handled}`,
    });
    return result.handled ? BackgroundNotificationResult.NewData : BackgroundNotificationResult.NoData;
  } catch (taskError) {
    if (taskError instanceof Error) {
      console.error(`Error handling reminder notification task: ${taskError.message}`, taskError);
    }
    appendReminderActionDebugRecord({
      event: "js-task-error",
      actionId: response.actionIdentifier,
      notificationId: response.notification.request.identifier,
      detail: taskError instanceof Error ? taskError.message : "unknown task error",
    });
    return BackgroundNotificationResult.Failed;
  }
});
