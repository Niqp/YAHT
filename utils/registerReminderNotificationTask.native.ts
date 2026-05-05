import * as Notifications from "expo-notifications";

import { REMINDER_NOTIFICATION_TASK } from "@/utils/reminderNotificationTask";
import {
  handleReminderNotificationResponse,
  isReminderQuickActionResponse,
} from "@/utils/reminderNotificationResponse";
import { waitForHabitStoreHydration } from "@/utils/habitStoreHydration";

let hasRegisteredTask = false;
let hasRegisteredEarlyListener = false;
let earlyReminderTaskQueue: Promise<unknown> = Promise.resolve();

const enqueueEarlyReminderTask = <T>(task: () => Promise<T>) => {
  const nextTask = earlyReminderTaskQueue.then(task, task);
  earlyReminderTaskQueue = nextTask.then(
    () => undefined,
    () => undefined
  );
  return nextTask;
};

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

      void enqueueEarlyReminderTask(async () => {
        const isHydrated = await waitForHabitStoreHydration();
        if (!isHydrated) {
          return;
        }

        await handleReminderNotificationResponse(response, {
          allowNavigation: false,
          completionMode: "targeted-background",
        });
      });
    });
  }
};
