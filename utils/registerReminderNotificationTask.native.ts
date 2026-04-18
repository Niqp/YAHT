import * as Notifications from "expo-notifications";

import { REMINDER_NOTIFICATION_TASK } from "@/utils/reminderNotificationTask";
import {
  handleReminderNotificationResponse,
  isReminderQuickActionResponse,
} from "@/utils/reminderNotificationResponse";

let hasRegisteredTask = false;
let hasRegisteredEarlyListener = false;

export const registerReminderNotificationTask = (): void => {
  if (!hasRegisteredTask) {
    hasRegisteredTask = true;
    Notifications.registerTaskAsync(REMINDER_NOTIFICATION_TASK).catch((error) => {
      console.error("Error registering reminder notification task:", error);
    });
  }

  if (!hasRegisteredEarlyListener) {
    hasRegisteredEarlyListener = true;
    Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isReminderQuickActionResponse(response)) {
        return;
      }

      void handleReminderNotificationResponse(response, { allowNavigation: false });
    });
  }
};
